ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS "last_read_notifications_at" timestamp;