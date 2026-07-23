-- ============================================================================
-- KIA Skin Care - Partner Password Reset + Downline Privacy Patch
-- Date: 2026-07-23
--
-- Safety:
--   * No production rows are deleted.
--   * No partner IDs, membership IDs, wallets, commissions, payouts or KYC rows
--     are regenerated or modified.
--   * No Auth users or passwords are changed by this SQL.
--   * RLS remains enabled on sensitive tables.
--   * Safe to run repeatedly.
-- ============================================================================

BEGIN;

-- Server-side rate-limit/audit table for partner password reset requests.
-- Stores only hashes, never raw email, phone, Partner ID or IP address.
CREATE TABLE IF NOT EXISTS public.partner_password_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier_hash text NOT NULL,
  account_hash text,
  ip_hash text NOT NULL,
  user_agent text,
  result text NOT NULL DEFAULT 'accepted',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_password_reset_requests_created
  ON public.partner_password_reset_requests (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_partner_password_reset_requests_account_window
  ON public.partner_password_reset_requests (account_hash, created_at DESC)
  WHERE account_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_partner_password_reset_requests_ip_window
  ON public.partner_password_reset_requests (ip_hash, created_at DESC);

ALTER TABLE public.partner_password_reset_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner_password_reset_requests_no_public_read" ON public.partner_password_reset_requests;
CREATE POLICY "partner_password_reset_requests_no_public_read"
ON public.partner_password_reset_requests
FOR SELECT
TO authenticated
USING (public.kia_is_admin(auth.uid()));

DROP POLICY IF EXISTS "partner_password_reset_requests_admin_write" ON public.partner_password_reset_requests;
CREATE POLICY "partner_password_reset_requests_admin_write"
ON public.partner_password_reset_requests
FOR ALL
TO authenticated
USING (public.kia_is_admin(auth.uid()))
WITH CHECK (public.kia_is_admin(auth.uid()));

REVOKE ALL ON public.partner_password_reset_requests FROM anon;
REVOKE ALL ON public.partner_password_reset_requests FROM authenticated;
GRANT SELECT ON public.partner_password_reset_requests TO authenticated;
GRANT ALL ON public.partner_password_reset_requests TO service_role;

-- Partner-safe downline reader.
-- Returns only permitted fields. It intentionally excludes email, phone, city,
-- address, auth ids, bank/UPI, KYC documents, wallet, payout and private notes.
CREATE OR REPLACE FUNCTION public.kia_get_partner_downline_safe(root_partner_id uuid DEFAULT auth.uid())
RETURNS TABLE (
  level integer,
  partner_name text,
  partner_code text,
  joined_at timestamptz,
  status text,
  kyc_status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    rt.level,
    COALESCE(pf.full_name, 'KIA Partner') AS partner_name,
    p.partner_code,
    p.created_at AS joined_at,
    p.status::text AS status,
    COALESCE(p.kyc_status::text, 'not_submitted') AS kyc_status
  FROM public.referral_tree rt
  JOIN public.partners p ON p.id = rt.descendant_id
  LEFT JOIN public.profiles pf ON pf.id = p.id
  WHERE rt.ancestor_id = root_partner_id
    AND rt.level >= 1
    AND (
      auth.uid() = root_partner_id
      OR public.kia_is_admin(auth.uid())
    )
  ORDER BY rt.level ASC, p.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.kia_get_partner_downline_safe(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kia_get_partner_downline_safe(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kia_get_partner_downline_safe(uuid) TO service_role;

COMMIT;

-- Verification after running:
-- SELECT to_regclass('public.partner_password_reset_requests') AS reset_table;
-- SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'kia_get_partner_downline_safe';
-- SELECT COUNT(*) FROM public.partner_password_reset_requests;
