BEGIN;

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "license_number" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "experience_years" INTEGER;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "hourly_rate" DECIMAL(10, 2);
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "isAvailable" BOOLEAN DEFAULT FALSE;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "availableFrom" TIME;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "availableUntil" TIME;

DO $$
BEGIN
  IF to_regclass('public.doctor_profiles') IS NOT NULL THEN
    UPDATE "user"
    SET
      specialty = doctor_profiles.specialty,
      bio = doctor_profiles.bio,
      "license_number" = doctor_profiles."license_number",
      "experience_years" = doctor_profiles."experience_years",
      "hourly_rate" = doctor_profiles."hourly_rate",
      "isAvailable" = COALESCE(doctor_profiles."isAvailable", TRUE),
      "availableFrom" = doctor_profiles."availableFrom",
      "availableUntil" = doctor_profiles."availableUntil",
      "updatedAt" = CURRENT_TIMESTAMP
    FROM doctor_profiles
    WHERE "user".id = doctor_profiles."userId";

    UPDATE consultations
    SET "doctorId" = doctor_profiles."userId"
    FROM doctor_profiles
    WHERE consultations."doctorId" = doctor_profiles.id;

    UPDATE prescriptions
    SET "doctorId" = doctor_profiles."userId"
    FROM doctor_profiles
    WHERE prescriptions."doctorId" = doctor_profiles.id;

    UPDATE reviews
    SET "doctorId" = doctor_profiles."userId"
    FROM doctor_profiles
    WHERE reviews."doctorId" = doctor_profiles.id;
  END IF;
END $$;

UPDATE "user" SET "isAvailable" = FALSE WHERE "isAvailable" IS NULL;
ALTER TABLE "user" ALTER COLUMN "isAvailable" SET DEFAULT FALSE;
ALTER TABLE "user" ALTER COLUMN "isAvailable" SET NOT NULL;

DROP INDEX IF EXISTS idx_doctor_profiles_user_id;
DROP TABLE IF EXISTS "doctor_profiles";

CREATE INDEX IF NOT EXISTS idx_user_doctors_available ON "user"("isAvailable", specialty);

COMMIT;
