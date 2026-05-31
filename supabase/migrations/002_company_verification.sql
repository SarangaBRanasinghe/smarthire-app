-- Add structured verification tracking for recruiter profiles
ALTER TABLE recruiter_profiles
  ADD COLUMN IF NOT EXISTS verification_state TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS verification_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_reviewed_by TEXT,
  ADD COLUMN IF NOT EXISTS verification_notes TEXT;

ALTER TABLE recruiter_profiles
  ADD CONSTRAINT recruiter_profiles_verification_state_check
  CHECK (verification_state IN ('pending', 'approved', 'rejected'));

UPDATE recruiter_profiles
SET verification_state = CASE
  WHEN verification_status THEN 'approved'
  ELSE 'pending'
END
WHERE verification_state IS NULL OR verification_state = '';

UPDATE recruiter_profiles
SET verification_requested_at = created_at
WHERE verification_requested_at IS NULL;

-- Prevent recruiters from mutating verification fields directly
REVOKE UPDATE (verification_status, verification_state, verification_requested_at, verification_reviewed_at, verification_reviewed_by, verification_notes)
  ON recruiter_profiles FROM authenticated;

GRANT UPDATE (company_name, company_logo, company_website)
  ON recruiter_profiles TO authenticated;
