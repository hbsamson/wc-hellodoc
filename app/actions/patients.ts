'use server'

import { db } from '@/lib/db'
import { patientProfileImages, user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { getUserId } from './helpers'

export type PatientProfileData = {
  name: string
  birthday?: string
  weightKg?: string
  heightCm?: string
  image?: string
  phoneNumber?: string
  address?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  medicalHistory?: string
}

export async function getPatientProfile(userId: string) {
  const profile = await db
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)

  return profile[0] || null
}

export async function updatePatientProfile(data: PatientProfileData) {
  const userId = await getUserId()

  const updated = await db
    .update(user)
    .set({
      name: data.name,
      birthday: data.birthday,
      weightKg: data.weightKg,
      heightCm: data.heightCm,
      image: data.image,
      phoneNumber: data.phoneNumber,
      address: data.address,
      emergencyContactName: data.emergencyContactName,
      emergencyContactPhone: data.emergencyContactPhone,
      medicalHistory: data.medicalHistory,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId))
    .returning()

  revalidatePath('/dashboard')
  revalidatePath('/patient-profile')

  return updated[0] || null
}

export async function savePatientProfileImage(file: File) {
  const userId = await getUserId()
  const id = nanoid()
  const buffer = Buffer.from(await file.arrayBuffer())

  await db.insert(patientProfileImages).values({
    id,
    userId,
    data: buffer,
    mimeType: file.type,
    filename: file.name,
    size: file.size,
  })

  return `/api/patient-profile/image/${id}`
}

export async function isPatientProfileComplete(profile: {
  name: string | null
  birthday: string | null
  weightKg: string | null
  heightCm: string | null
  phoneNumber: string | null
  medicalHistory: string | null
}) {
  return Boolean(
    profile.name &&
      profile.birthday &&
      profile.weightKg &&
      profile.heightCm &&
      profile.phoneNumber &&
      profile.medicalHistory,
  )
}
