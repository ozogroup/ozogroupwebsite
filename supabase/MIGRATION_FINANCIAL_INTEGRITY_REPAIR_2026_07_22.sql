-- MIGRATION: Financial Integrity Repair — 2026-07-22
-- Fixes the critical wallet_balance = 0 bug in process_partner_payout.
-- Previously the RPC zeroed wallet_balance on every payout regardless of
-- the actual payout amount. Now it debits only the gross payout amount,
-- preserving any remaining balance the partner earned after requesting
-- the payout.

CREATE OR REPLACE FUNCTION public.process_partner_payout(
  payout_id_input UUID,
  new_status_input TEXT,
  transaction_reference_input TEXT DEFAULT NULL,
  transaction_note_input TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payout_row public.payouts%ROWTYPE;
  partner_row public.partners%ROWTYPE;
  previous_status public.payout_status;
  gross_debit NUMERIC(15,2);
  net_paid NUMERIC(15,2);
  balance_before NUMERIC(15,2);
  new_balance NUMERIC(15,2);
BEGIN
  IF new_status_input NOT IN ('requested', 'approved', 'processing', 'paid', 'rejected') THEN
    RAISE EXCEPTION 'Unsupported payout status: %', new_status_input;
  END IF;

  SELECT * INTO payout_row FROM public.payouts WHERE id = payout_id_input FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payout not found'; END IF;
  previous_status := payout_row.status;

  IF payout_row.status = 'paid' THEN
    RETURN to_jsonb(payout_row);
  END IF;

  IF new_status_input = 'paid' THEN
    IF COALESCE(transaction_reference_input, '') = '' THEN
      RAISE EXCEPTION 'Transaction reference is required';
    END IF;
    IF payout_row.status NOT IN ('approved', 'processing') THEN
      RAISE EXCEPTION 'Payout must be approved or processing before paid settlement';
    END IF;

    SELECT * INTO partner_row FROM public.partners WHERE id = payout_row.partner_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Partner not found'; END IF;

    gross_debit := COALESCE(payout_row.gross_amount, payout_row.available_balance, payout_row.amount, 0);
    IF gross_debit <= 0 THEN RAISE EXCEPTION 'Invalid payout amount'; END IF;

    net_paid := COALESCE(payout_row.net_amount, payout_row.amount, 0);
    balance_before := COALESCE(partner_row.wallet_balance, 0);
    new_balance := GREATEST(0, balance_before - gross_debit);

    UPDATE public.partners
    SET wallet_balance = new_balance,
        paid_earnings = COALESCE(paid_earnings, 0) + net_paid,
        updated_at = NOW()
    WHERE id = payout_row.partner_id;

    INSERT INTO public.wallet_transactions (
      partner_id, transaction_type, amount, balance_before, balance_after,
      reference_type, reference_id, notes
    ) VALUES (
      payout_row.partner_id, 'payout_debit', gross_debit,
      balance_before, new_balance, 'payout', payout_row.id,
      COALESCE(transaction_note_input, 'Payout marked paid by admin')
    );
  END IF;

  UPDATE public.payouts
  SET status = new_status_input::public.payout_status,
      transaction_reference = COALESCE(transaction_reference_input, transaction_reference),
      transaction_note = COALESCE(transaction_note_input, transaction_note),
      approved_at = CASE WHEN new_status_input IN ('approved','processing') THEN NOW() ELSE approved_at END,
      rejected_at = CASE WHEN new_status_input = 'rejected' THEN NOW() ELSE rejected_at END,
      paid_at = CASE WHEN new_status_input = 'paid' THEN NOW() ELSE paid_at END,
      processed_at = CASE WHEN new_status_input = 'paid' THEN NOW() ELSE processed_at END,
      updated_at = NOW()
  WHERE id = payout_id_input
  RETURNING * INTO payout_row;

  INSERT INTO public.activity_logs (actor_id, actor_role, action, entity_type, entity_id, old_value, new_value)
  VALUES (
    auth.uid(), 'admin', 'payout_status_changed', 'payout', payout_row.id,
    jsonb_build_object('status', previous_status),
    jsonb_build_object('status', new_status_input, 'transaction_reference', transaction_reference_input)
  );

  RETURN to_jsonb(payout_row);
END;
$$;

REVOKE ALL ON FUNCTION public.process_partner_payout(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_partner_payout(UUID, TEXT, TEXT, TEXT) TO service_role;

SELECT 'migration_financial_integrity_repair_2026_07_22_ready' AS status;
