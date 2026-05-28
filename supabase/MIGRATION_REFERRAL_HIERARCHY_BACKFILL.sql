-- Backfill permanent referral hierarchy from approved membership records.
-- Safe to run multiple times: each insert checks for an existing tree row.

BEGIN;

-- Keep partner.sponsor_id aligned with the membership sponsor for active partners
-- when the partner row was created/activated without a sponsor.
UPDATE partners p
SET
  sponsor_id = m.sponsor_id,
  updated_at = NOW()
FROM memberships m
WHERE m.partner_id = p.id
  AND m.sponsor_id IS NOT NULL
  AND m.membership_status = 'active'
  AND p.sponsor_id IS NULL;

-- Direct sponsor relationship.
INSERT INTO referral_tree (ancestor_id, descendant_id, level, locked)
SELECT
  m.sponsor_id,
  m.partner_id,
  1,
  TRUE
FROM memberships m
WHERE m.sponsor_id IS NOT NULL
  AND m.partner_id IS NOT NULL
  AND m.membership_status = 'active'
  AND NOT EXISTS (
    SELECT 1
    FROM referral_tree rt
    WHERE rt.ancestor_id = m.sponsor_id
      AND rt.descendant_id = m.partner_id
      AND rt.level = 1
  );

-- Upline relationships inherited from the sponsor's existing tree.
INSERT INTO referral_tree (ancestor_id, descendant_id, level, locked)
SELECT
  sponsor_tree.ancestor_id,
  m.partner_id,
  sponsor_tree.level + 1,
  TRUE
FROM memberships m
JOIN referral_tree sponsor_tree
  ON sponsor_tree.descendant_id = m.sponsor_id
 AND sponsor_tree.level <= 3
WHERE m.sponsor_id IS NOT NULL
  AND m.partner_id IS NOT NULL
  AND m.membership_status = 'active'
  AND sponsor_tree.ancestor_id <> m.partner_id
  AND NOT EXISTS (
    SELECT 1
    FROM referral_tree rt
    WHERE rt.ancestor_id = sponsor_tree.ancestor_id
      AND rt.descendant_id = m.partner_id
      AND rt.level = sponsor_tree.level + 1
  );

COMMIT;
