-- ============================================================================
-- MIGRATION: Financial Integrity Repair — 2026-07-22 (revised)
-- ============================================================================
--
-- Replaces process_partner_payout with a production-safe version that:
--
--   1. Makes UTR/transaction_reference OPTIONAL (admin may not have UTR at
--      payment time). The KIA Payout ID is MANDATORY and persisted in
--      admin_notes by the caller.
--
--   2. Settles commissions atomically inside the RPC: selects the oldest
--      approved commissions (FIFO) up to the gross payout amount, locks them
--      with FOR UPDATE, and marks them status='paid' with payout_id set.
--      This replaces the separate JS markApprovedCommissionsPaid call.
--
--   3. Debits wallet_balance by exactly gross_debit (the gross settled
--      amount). If the partner's wallet is less than gross_debit, the RPC
--      RAISES an error instead of silently clamping to zero.
--
--   4. Increments paid_earnings by the NET payout amount only.
--
--   5. Is fully idempotent: if the payout is already 'paid', it returns
--      immediately without double-debiting, double-settling, or duplicating
--      wallet_transactions.
--
--   6. Accepts admin_id_input explicitly (UUID) instead of relying on
--      auth.uid(), which is NULL when called via service_role.
--
--   7. Is CREATE OR REPLACE only. Does not ALTER any tables, drop columns,
--      or modify existing data. Does not touch historical records.
--
-- Tables/columns READ by this RPC:
--   payouts:      id, partner_id, status, gross_amount, available_balance,
--                 amount (=net), net_amount, transaction_reference,
--                 transaction_note, approved_at, rejected_at, paid_at,
--                 processed_at
--   partners:     id, wallet_balance, paid_earnings
--   commissions:  id, partner_id, amount, status, reversed, deleted_at,
--                 payout_id, created_at
--
-- Tables/columns WRITTEN by this RPC:
--   payouts:      status, transaction_reference, transaction_note,
--                 approved_at, rejected_at, paid_at, processed_at, updated_at
--   partners:     wallet_balance (decremented by gross_debit),
--                 paid_earnings (incremented by net_paid), updated_at
--   commissions:  status → 'paid', payout_id → this payout's id,
--                 paid_at → NOW(), updated_at → NOW()
--   wallet_transactions: one payout_debit row (INSERTed)
--   activity_logs:       one payout_status_changed row (INSERTed)
--
-- Commission → Payout linkage:
--   commissions.payout_id (UUID, nullable) → payouts.id
--   Index: idx_commissions_payout ON commissions(payout_id)
--          WHERE payout_id IS NOT NULL AND deleted_at IS NULL
-- ============================================================================

CREATE OR REPLACE FUNCTION public.process_partner_payout(
  payout_id_input        UUID,
  new_status_input       TEXT,
  transaction_reference_input TEXT DEFAULT NULL,
  transaction_note_input TEXT DEFAULT NULL,
  admin_id_input         UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payout_row   public.payouts%ROWTYPE;
  partner_row  public.partners%ROWTYPE;
  prev_status  public.payout_status;
  gross_debit  NUMERIC(15,2);
  net_paid     NUMERIC(15,2);
  bal_before   NUMERIC(15,2);
  bal_after    NUMERIC(15,2);
  settled_sum  NUMERIC(15,2) := 0;
  settled_ids  UUID[];
  c_row        RECORD;
  actor        UUID;
BEGIN
  -- ── Validate status value ────────────────────────────────────────
  IF new_status_input NOT IN ('requested','approved','processing','paid','rejected') THEN
    RAISE EXCEPTION 'Unsupported payout status: %', new_status_input;
  END IF;

  -- ── Lock the payout row ──────────────────────────────────────────
  SELECT * INTO payout_row
    FROM public.payouts
   WHERE id = payout_id_input
     FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payout % not found', payout_id_input;
  END IF;
  prev_status := payout_row.status;

  -- ── Idempotency: already paid → return without side effects ──────
  IF payout_row.status = 'paid' AND new_status_input = 'paid' THEN
    RETURN to_jsonb(payout_row);
  END IF;

  -- ── Guard: paid is final ─────────────────────────────────────────
  IF payout_row.status = 'paid' THEN
    RAISE EXCEPTION 'Payout is already paid and final';
  END IF;

  -- ── Guard: rejected is final ─────────────────────────────────────
  IF payout_row.status = 'rejected' AND new_status_input <> 'rejected' THEN
    RAISE EXCEPTION 'A rejected payout cannot be reopened';
  END IF;

  -- ════════════════════════════════════════════════════════════════
  -- PAID SETTLEMENT (only when transitioning TO 'paid')
  -- ════════════════════════════════════════════════════════════════
  IF new_status_input = 'paid' THEN

    -- Guard: must come from approved or processing
    IF payout_row.status NOT IN ('approved','processing') THEN
      RAISE EXCEPTION 'Payout must be approved or processing before paid settlement';
    END IF;

    -- ── Lock the partner row ─────────────────────────────────────
    SELECT * INTO partner_row
      FROM public.partners
     WHERE id = payout_row.partner_id
       FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Partner % not found', payout_row.partner_id;
    END IF;

    -- ── Determine gross and net amounts ──────────────────────────
    -- payouts.amount is the NET amount (confirmed from JS insert code).
    -- payouts.gross_amount is the pre-deduction gross.
    -- Fallback chain: gross_amount → available_balance (wallet snapshot
    -- at request time). Never fall back to amount because that is NET.
    gross_debit := COALESCE(payout_row.gross_amount, payout_row.available_balance);
    IF gross_debit IS NULL OR gross_debit <= 0 THEN
      RAISE EXCEPTION 'Invalid payout gross amount (gross_amount and available_balance are both null or zero)';
    END IF;

    net_paid := COALESCE(payout_row.net_amount, payout_row.amount, 0);
    IF net_paid <= 0 THEN
      RAISE EXCEPTION 'Invalid payout net amount';
    END IF;

    -- ── Wallet balance check — HARD FAIL, no silent clamp ────────
    bal_before := COALESCE(partner_row.wallet_balance, 0);
    IF bal_before < gross_debit - 0.009 THEN
      RAISE EXCEPTION 'Insufficient wallet balance: partner has Rs. % but payout requires Rs. % gross debit',
        ROUND(bal_before, 2), ROUND(gross_debit, 2);
    END IF;
    bal_after := ROUND(bal_before - gross_debit, 2);

    -- ── FIFO commission settlement ───────────────────────────────
    -- Select the oldest approved, un-settled commissions for this
    -- partner and lock them. Accumulate until we reach gross_debit.
    settled_ids := ARRAY[]::UUID[];
    FOR c_row IN
      SELECT id, COALESCE(amount, 0) AS amt
        FROM public.commissions
       WHERE partner_id = payout_row.partner_id
         AND status = 'approved'
         AND reversed = FALSE
         AND deleted_at IS NULL
         AND payout_id IS NULL
       ORDER BY created_at ASC
         FOR UPDATE
    LOOP
      EXIT WHEN settled_sum >= gross_debit - 0.009;
      IF c_row.amt <= 0 THEN CONTINUE; END IF;
      IF c_row.amt > (gross_debit - settled_sum + 0.009) THEN CONTINUE; END IF;
      settled_ids := settled_ids || c_row.id;
      settled_sum := settled_sum + c_row.amt;
    END LOOP;

    -- Mark matched commissions as paid, linking to this payout
    IF array_length(settled_ids, 1) > 0 THEN
      UPDATE public.commissions
         SET status     = 'paid',
             payout_id  = payout_row.id,
             paid_at    = NOW(),
             updated_at = NOW()
       WHERE id = ANY(settled_ids)
         AND status = 'approved'
         AND reversed = FALSE
         AND deleted_at IS NULL
         AND payout_id IS NULL;
    END IF;

    -- ── Debit wallet, credit paid_earnings ───────────────────────
    UPDATE public.partners
       SET wallet_balance = bal_after,
           paid_earnings  = COALESCE(paid_earnings, 0) + net_paid,
           updated_at     = NOW()
     WHERE id = payout_row.partner_id;

    -- ── Wallet transaction audit row ─────────────────────────────
    INSERT INTO public.wallet_transactions (
      partner_id, transaction_type, amount,
      balance_before, balance_after,
      reference_type, reference_id, notes
    ) VALUES (
      payout_row.partner_id,
      'payout_debit',
      gross_debit,
      bal_before,
      bal_after,
      'payout',
      payout_row.id,
      COALESCE(
        transaction_note_input,
        'Payout settled — gross ' || gross_debit || ', net ' || net_paid ||
        ', ' || array_length(settled_ids, 1) || ' commissions settled'
      )
    );

  END IF; -- end paid settlement block

  -- ════════════════════════════════════════════════════════════════
  -- Update the payout row itself
  -- ════════════════════════════════════════════════════════════════
  UPDATE public.payouts
     SET status               = new_status_input::public.payout_status,
         transaction_reference = CASE
           WHEN transaction_reference_input IS NOT NULL
           THEN transaction_reference_input
           ELSE transaction_reference
         END,
         transaction_note      = COALESCE(transaction_note_input, transaction_note),
         approved_at           = CASE WHEN new_status_input IN ('approved','processing') THEN NOW() ELSE approved_at END,
         rejected_at           = CASE WHEN new_status_input = 'rejected'               THEN NOW() ELSE rejected_at  END,
         paid_at               = CASE WHEN new_status_input = 'paid'                   THEN NOW() ELSE paid_at      END,
         processed_at          = CASE WHEN new_status_input = 'paid'                   THEN NOW() ELSE processed_at END,
         updated_at            = NOW()
   WHERE id = payout_id_input
  RETURNING * INTO payout_row;

  -- ════════════════════════════════════════════════════════════════
  -- Activity log — use explicit admin_id_input, not auth.uid()
  -- ════════════════════════════════════════════════════════════════
  actor := COALESCE(admin_id_input, auth.uid());
  INSERT INTO public.activity_logs (
    actor_id, actor_role, action, entity_type, entity_id,
    old_value, new_value
  ) VALUES (
    actor,
    'admin',
    'payout_status_changed',
    'payout',
    payout_row.id,
    jsonb_build_object('status', prev_status),
    jsonb_build_object(
      'status',                new_status_input,
      'transaction_reference', transaction_reference_input,
      'gross_debit',           gross_debit,
      'net_paid',              net_paid,
      'commissions_settled',   COALESCE(array_length(settled_ids, 1), 0)
    )
  );

  RETURN to_jsonb(payout_row);
END;
$$;

-- The new signature has 5 params (added admin_id_input). Revoke/grant on both
-- old (4-param) and new (5-param) signatures so the migration is safe
-- regardless of which version currently exists.
REVOKE ALL ON FUNCTION public.process_partner_payout(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_partner_payout(UUID, TEXT, TEXT, TEXT) TO service_role;

DO $$
BEGIN
  -- The 5-param overload may not exist yet on a fresh install; guard the grant.
  EXECUTE 'REVOKE ALL ON FUNCTION public.process_partner_payout(UUID,TEXT,TEXT,TEXT,UUID) FROM PUBLIC';
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.process_partner_payout(UUID,TEXT,TEXT,TEXT,UUID) TO service_role';
EXCEPTION WHEN undefined_function THEN
  NULL; -- 4-param signature was replaced in-place; 5-param grant already applied above
END $$;

SELECT 'migration_financial_integrity_repair_2026_07_22_v2_ready' AS status;
