'use server'

import { db } from '@/lib/db'
import { doctorLicenseFiles, reviews, user } from '@/lib/db/schema'
import { and, desc, eq, isNotNull } from 'drizzle-orm'
import { cloudinary } from '@/lib/cloudinary'
import { getUserId } from './helpers'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'

export type DoctorProfileData = {
  name?: string
  givenName?: string
  lastName?: string
  specialty: string
  bio?: string
  licenseNumber?: string
  experienceYears?: number
  hourlyRate?: string
  image?: string
  isAvailable?: boolean
  availableFrom?: string
  availableUntil?: string
}

export async function createDoctorProfile(data: DoctorProfileData) {
  const userId = await getUserId()

  const profile = await db
    .update(user)
    .set({
      name: data.name,
      givenName: data.givenName,
      lastName: data.lastName,
      userType: 'doctor',
      specialty: data.specialty,
      bio: data.bio,
      licenseNumber: data.licenseNumber,
      experienceYears: data.experienceYears,
      hourlyRate: data.hourlyRate,
      image: data.image,
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

export async function toggleDoctorAvailability() {
  const userId = await getUserId()

  const current = await db
    .select({ isAvailable: user.isAvailable })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)

  const newValue = !current[0]?.isAvailable

  await db
    .update(user)
    .set({ isAvailable: newValue, updatedAt: new Date() })
    .where(eq(user.id, userId))

  revalidatePath('/dashboard')
  return newValue
}

export async function updateDoctorProfile(data: DoctorProfileData) {
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

export async function saveDoctorProfileImage(file: File) {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const result = await new Promise<{ secure_url: string }>(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'doctor-profile-images',
            resource_type: 'image',
          },
          (error, result) => {
            if (error || !result) reject(error)
            else resolve(result as { secure_url: string })
          },
        )
        .end(buffer)
    },
  )

  return result.secure_url
}

export async function saveDoctorLicenseId(file: File) {
  const userId = await getUserId()
  const id = nanoid()
  const buffer = Buffer.from(await file.arrayBuffer())

  // Upload file to Cloudinary
  const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'doctor-licenses',
            resource_type: 'auto',
          },
          (error, result) => {
            if (error || !result) {
              reject(error)
              return
            }
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
            })
          },
        )
        .end(buffer)
    },
  )

  // Store the Cloudinary reference
  await db.insert(doctorLicenseFiles).values({
    id,
    userId,
    data: buffer,
    mimeType: file.type,
    filename: file.name,
    size: file.size,
    url: uploadResult.secure_url,
    publicId: uploadResult.public_id,
  })

  return id
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
