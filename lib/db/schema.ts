import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  time,
  date,
  customType,
} from 'drizzle-orm/pg-core'

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return 'bytea'
  },
})

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name'),
  givenName: text('given_name'),
  lastName: text('last_name'),
  userType: text('user_type').notNull().default('patient'),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  birthday: date('birthday'),
  weightKg: decimal('weight_kg', { precision: 5, scale: 2 }),
  heightCm: decimal('height_cm', { precision: 5, scale: 2 }),
  phoneNumber: text('phone_number'),
  address: text('address'),
  emergencyContactName: text('emergency_contact_name'),
  emergencyContactPhone: text('emergency_contact_phone'),
  medicalHistory: text('medical_history'),
  specialty: text('specialty'),
  bio: text('bio'),
  licenseNumber: text('license_number'),
  experienceYears: integer('experience_years'),
  hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2 }),
  isAvailable: boolean('isAvailable').notNull().default(false),
  availableFrom: time('availableFrom'),
  availableUntil: time('availableUntil'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull(),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull(),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- HelloDoc app tables ---------------------------------------------------

export const consultations = pgTable('consultations', {
  id: text('id').primaryKey(),
  patientId: text('patientId').notNull(),
  doctorId: text('doctorId').notNull(),
  status: text('status').notNull().default('scheduled'), // scheduled, in-progress, completed, cancelled
  scheduledAt: timestamp('scheduledAt').notNull(),
  startedAt: timestamp('startedAt'),
  endedAt: timestamp('endedAt'),
  notes: text('notes'),
  prescriptionId: text('prescription_id'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const prescriptions = pgTable('prescriptions', {
  id: text('id').primaryKey(),
  consultationId: text('consultationId').notNull(),
  patientId: text('patientId').notNull(),
  doctorId: text('doctorId').notNull(),
  medications: text('medications').notNull(),
  instructions: text('instructions'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const patientProfileImages = pgTable('patient_profile_images', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  data: bytea('data').notNull(),
  mimeType: text('mime_type').notNull(),
  filename: text('filename'),
  size: integer('size').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const patientMedicalFiles = pgTable('patient_medical_files', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  data: bytea('data').notNull(),
  mimeType: text('mime_type').notNull(),
  filename: text('filename').notNull(),
  size: integer('size').notNull(),
  description: text('description'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const doctorLicenseFiles = pgTable('doctor_license_files', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  data: bytea('data').notNull(),
  mimeType: text('mime_type').notNull(),
  filename: text('filename').notNull(),
  size: integer('size').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const reviews = pgTable('reviews', {
  id: text('id').primaryKey(),
  doctorId: text('doctorId').notNull(),
  patientId: text('patientId').notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})
