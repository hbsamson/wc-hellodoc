'use server'

import { db } from '@/lib/db'
import { reviews, user } from '@/lib/db/schema'
import { and, desc, eq, isNotNull } from 'drizzle-orm'
import { getUserId } from './helpers'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'

export async function createDoctorProfile(data: {
  specialty: string
  bio?: string
  licenseNumber?: string
  experienceYears?: number
  hourlyRate?: string
  isAvailable?: boolean
  availableFrom?: string
  availableUntil?: string
}) {
  const userId = await getUserId()

  const profile = await db
    .update(user)
    .set({
      specialty: data.specialty,
      bio: data.bio,
      licenseNumber: data.licenseNumber,
      experienceYears: data.experienceYears,
      hourlyRate: data.hourlyRate,
      isAvailable: data.isAvailable ?? true,
      availableFrom: data.availableFrom,
      availableUntil: data.availableUntil,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId))
    .returning()

  revalidatePath('/dashboard')
  return profile[0]
}

export async function getDoctorProfile(userId: string) {
  const profile = await db
    .select()
    .from(user)
    .where(and(eq(user.id, userId), isNotNull(user.specialty)))
    .limit(1)

  return profile[0] || null
}

export async function updateDoctorProfile(data: {
  specialty?: string
  bio?: string
  licenseNumber?: string
  experienceYears?: number
  hourlyRate?: string
  isAvailable?: boolean
  availableFrom?: string
  availableUntil?: string
}) {
  const userId = await getUserId()

  const updated = await db
    .update(user)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId))
    .returning()

  revalidatePath('/dashboard')
  return updated[0] || null
}

export async function getAllDoctors() {
  const doctors = await db
    .select()
    .from(user)
    .where(and(eq(user.isAvailable, true), isNotNull(user.specialty)))

  return doctors
}

export async function getDoctorById(doctorId: string) {
  const doctor = await db
    .select()
    .from(user)
    .where(and(eq(user.id, doctorId), isNotNull(user.specialty)))
    .limit(1)

  return doctor[0] || null
}

export async function getDoctorReviews(doctorId: string) {
  const doctorReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.doctorId, doctorId))
    .orderBy(desc(reviews.createdAt))

  return doctorReviews
}

export async function addReview(data: {
  doctorId: string
  rating: number
  comment?: string
}) {
  const userId = await getUserId()

  const review = await db
    .insert(reviews)
    .values({
      id: nanoid(),
      doctorId: data.doctorId,
      patientId: userId,
      rating: data.rating,
      comment: data.comment,
    })
    .returning()

  revalidatePath(`/doctors/${data.doctorId}`)
  return review[0]
}
