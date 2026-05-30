'use server'

import { db } from '@/lib/db'
import { consultations, user } from '@/lib/db/schema'
import {
  CONSULTATION_BLOCK_MINUTES,
  isThirtyMinuteBlock,
  isWithinDoctorAvailability,
} from '@/lib/consultation-scheduling'
import { eq, and, gte, inArray, isNotNull, lt, or } from 'drizzle-orm'
import { getUserId } from './helpers'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'

export async function bookConsultation(data: {
  doctorId: string
  scheduledAt: string
}) {
  const userId = await getUserId()
  const scheduledDate = new Date(data.scheduledAt)

  if (Number.isNaN(scheduledDate.getTime())) {
    throw new Error('Invalid scheduled time')
  }

  if (scheduledDate <= new Date()) {
    throw new Error('Cannot book consultation in the past')
  }

  if (!isThirtyMinuteBlock(scheduledDate)) {
    throw new Error('Consultations must start on a 30-minute block')
  }

  const doctor = await db
    .select({
      id: user.id,
      isAvailable: user.isAvailable,
      availableFrom: user.availableFrom,
      availableUntil: user.availableUntil,
    })
    .from(user)
    .where(and(eq(user.id, data.doctorId), isNotNull(user.specialty)))
    .limit(1)

  if (!doctor[0]) {
    throw new Error('Doctor not found')
  }

  if (!doctor[0].isAvailable) {
    throw new Error('Doctor is not available for booking')
  }

  if (
    !isWithinDoctorAvailability(
      scheduledDate,
      doctor[0].availableFrom,
      doctor[0].availableUntil,
    )
  ) {
    throw new Error('Selected time is outside doctor availability')
  }

  const slotEnd = new Date(
    scheduledDate.getTime() + CONSULTATION_BLOCK_MINUTES * 60 * 1000,
  )
  const conflictWindowStart = new Date(
    scheduledDate.getTime() - (CONSULTATION_BLOCK_MINUTES - 1) * 60 * 1000,
  )

  const existingConsultation = await db
    .select({ id: consultations.id })
    .from(consultations)
    .where(
      and(
        eq(consultations.doctorId, data.doctorId),
        inArray(consultations.status, ['scheduled', 'in-progress']),
        gte(consultations.scheduledAt, conflictWindowStart),
        lt(consultations.scheduledAt, slotEnd),
      ),
    )
    .limit(1)

  if (existingConsultation[0]) {
    throw new Error('Doctor already has a consultation at that time')
  }

  const consultation = await db
    .insert(consultations)
    .values({
      id: nanoid(),
      patientId: userId,
      doctorId: data.doctorId,
      scheduledAt: scheduledDate,
      status: 'scheduled',
    })
    .returning()

  revalidatePath('/consultations')
  revalidatePath('/dashboard')
  return consultation[0]
}

export async function getPatientConsultations() {
  const userId = await getUserId()

  const patientConsultations = await db
    .select()
    .from(consultations)
    .where(eq(consultations.patientId, userId))

  return patientConsultations
}

export async function getDoctorConsultations() {
  const userId = await getUserId()

  const doctorConsultations = await db
    .select()
    .from(consultations)
    .where(eq(consultations.doctorId, userId))

  return doctorConsultations
}

export async function getConsultation(consultationId: string) {
  const userId = await getUserId()

  const consultation = await db
    .select()
    .from(consultations)
    .where(
      and(
        eq(consultations.id, consultationId),
        or(eq(consultations.patientId, userId), eq(consultations.doctorId, userId)),
      ),
    )
    .limit(1)

  if (!consultation[0]) {
    throw new Error('Consultation not found')
  }

  // Verify user is participant
  if (
    consultation[0].patientId !== userId &&
    consultation[0].doctorId !== userId
  ) {
    throw new Error('Unauthorized')
  }

  return consultation[0]
}

export async function startConsultation(consultationId: string) {
  const userId = await getUserId()
  const consultation = await getConsultation(consultationId)

  if (consultation.doctorId !== userId) {
    throw new Error('Only doctor can start consultation')
  }

  const updated = await db
    .update(consultations)
    .set({
      status: 'in-progress',
      startedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(consultations.id, consultationId))
    .returning()

  revalidatePath('/consultations')
  return updated[0]
}

export async function endConsultation(consultationId: string, notes?: string) {
  const userId = await getUserId()
  const consultation = await getConsultation(consultationId)

  if (consultation.doctorId !== userId) {
    throw new Error('Only doctor can end consultation')
  }

  const updated = await db
    .update(consultations)
    .set({
      status: 'completed',
      endedAt: new Date(),
      notes: notes,
      updatedAt: new Date(),
    })
    .where(eq(consultations.id, consultationId))
    .returning()

  revalidatePath('/consultations')
  return updated[0]
}

export async function cancelConsultation(consultationId: string) {
  const consultation = await getConsultation(consultationId)

  // Allow cancellation by patient or doctor
  const updated = await db
    .update(consultations)
    .set({
      status: 'cancelled',
      updatedAt: new Date(),
    })
    .where(eq(consultations.id, consultationId))
    .returning()

  revalidatePath('/consultations')
  return updated[0]
}

export async function getUpcomingConsultations() {
  const userId = await getUserId()
  const now = new Date()

  const upcoming = await db
    .select()
    .from(consultations)
    .where(
      and(
        gte(consultations.scheduledAt, now),
        eq(consultations.status, 'scheduled'),
        or(eq(consultations.patientId, userId), eq(consultations.doctorId, userId)),
      ),
    )

  return upcoming
}
