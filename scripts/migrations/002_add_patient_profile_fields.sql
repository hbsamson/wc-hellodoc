BEGIN;

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "weight_kg" DECIMAL(5, 2);
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "height_cm" DECIMAL(5, 2);
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "phone_number" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "emergency_contact_name" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "emergency_contact_phone" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "medical_history" TEXT;

CREATE TABLE IF NOT EXISTS "patient_profile_images" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  data BYTEA NOT NULL,
  "mime_type" TEXT NOT NULL,
  filename TEXT,
  size INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patient_profile_images_user_id
  ON "patient_profile_images"("userId");

COMMIT;
