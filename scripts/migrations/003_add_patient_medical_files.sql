BEGIN;

CREATE TABLE IF NOT EXISTS "patient_medical_files" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  data BYTEA NOT NULL,
  "mime_type" TEXT NOT NULL,
  filename TEXT NOT NULL,
  size INTEGER NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patient_medical_files_user_id
  ON "patient_medical_files"("userId");

COMMIT;
