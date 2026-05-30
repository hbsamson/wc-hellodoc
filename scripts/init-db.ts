import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const createTablesSQL = `
-- Better Auth tables (required)
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  "emailVerified" BOOLEAN DEFAULT FALSE,
  image TEXT,
  specialty TEXT,
  bio TEXT,
  "license_number" TEXT,
  "experience_years" INTEGER,
  "hourly_rate" DECIMAL(10, 2),
  "isAvailable" BOOLEAN DEFAULT FALSE,
  "availableFrom" TIME,
  "availableUntil" TIME,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "session" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  token TEXT NOT NULL UNIQUE,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "account" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP,
  "refreshTokenExpiresAt" TIMESTAMP,
  scope TEXT,
  password TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "verification" (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- HelloDoc app tables
CREATE TABLE IF NOT EXISTS "consultations" (
  id TEXT PRIMARY KEY,
  "patientId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled',
  "scheduledAt" TIMESTAMP NOT NULL,
  "startedAt" TIMESTAMP,
  "endedAt" TIMESTAMP,
  notes TEXT,
  "prescription_id" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "prescriptions" (
  id TEXT PRIMARY KEY,
  "consultationId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  medications TEXT NOT NULL,
  instructions TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "reviews" (
  id TEXT PRIMARY KEY,
  "doctorId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS idx_session_user_id ON "session"("userId");
CREATE INDEX IF NOT EXISTS idx_account_user_id ON "account"("userId");
CREATE INDEX IF NOT EXISTS idx_user_doctors_available ON "user"("isAvailable", specialty);
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON "consultations"("patientId");
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON "consultations"("doctorId");
CREATE INDEX IF NOT EXISTS idx_consultations_scheduled_at ON "consultations"("scheduledAt");
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON "prescriptions"("patientId");
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON "prescriptions"("doctorId");
CREATE INDEX IF NOT EXISTS idx_reviews_doctor_id ON "reviews"("doctorId");
`

async function initDB() {
  const client = await pool.connect()
  try {
    console.log('Initializing database...')
    await client.query(createTablesSQL)
    console.log('Database initialized successfully!')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

initDB()
