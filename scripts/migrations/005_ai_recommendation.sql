-- AI Recommendation Feature Migration
-- Run this in your Neon SQL editor to add the new tables

CREATE TABLE IF NOT EXISTS "recommendation_chats" (
  id TEXT PRIMARY KEY,
  "patientId" TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  "message_count" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "recommendation_messages" (
  id TEXT PRIMARY KEY,
  "chatId" TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "recommended_doctors" (
  id TEXT PRIMARY KEY,
  "chatId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "match_reason" TEXT,
  rank INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_recommendation_chats_patient_id ON "recommendation_chats"("patientId");
CREATE INDEX IF NOT EXISTS idx_recommendation_messages_chat_id ON "recommendation_messages"("chatId");
CREATE INDEX IF NOT EXISTS idx_recommended_doctors_chat_id ON "recommended_doctors"("chatId");
CREATE INDEX IF NOT EXISTS idx_recommended_doctors_doctor_id ON "recommended_doctors"("doctorId");
