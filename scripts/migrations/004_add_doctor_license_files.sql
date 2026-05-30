BEGIN;

ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS "given_name" TEXT,
  ADD COLUMN IF NOT EXISTS "last_name" TEXT,
  ADD COLUMN IF NOT EXISTS "user_type" TEXT NOT NULL DEFAULT 'patient';

UPDATE "user"
SET
  "given_name" = COALESCE(
    NULLIF("given_name", ''),
    NULLIF(split_part(trim(name), ' ', 1), '')
  ),
  "last_name" = COALESCE(
    NULLIF("last_name", ''),
    NULLIF(regexp_replace(trim(name), '^\S+\s*', ''), '')
  )
WHERE name IS NOT NULL
  AND trim(name) <> '';

UPDATE "user"
SET "user_type" = 'doctor'
WHERE specialty IS NOT NULL;

CREATE TABLE IF NOT EXISTS "doctor_license_files" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  data BYTEA NOT NULL,
  "mime_type" TEXT NOT NULL,
  filename TEXT NOT NULL,
  size INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doctor_license_files_user_id
  ON "doctor_license_files"("userId");

CREATE INDEX IF NOT EXISTS idx_user_type
  ON "user"("user_type");

COMMIT;
