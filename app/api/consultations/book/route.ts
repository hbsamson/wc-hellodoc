import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { consultations, user } from '@/lib/db/schema'
import {
  CONSULTATION_BLOCK_MINUTES,
  isThirtyMinuteBlock,
  isWithinDoctorAvailability,
} from '@/lib/consultation-scheduling'
import { and, eq, gte, inArray, isNotNull, lt } from 'drizzle-orm'
import { headers } from 'next/headers'
import { nanoid } from 'nanoid'

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      })
    }

    const body = await request.json()
    const { doctorId, scheduledAt } = body

    if (!doctorId || !scheduledAt) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 },
      )
    }

    const scheduledDate = new Date(scheduledAt)
    if (Number.isNaN(scheduledDate.getTime())) {
      return new Response(JSON.stringify({ error: 'Invalid scheduled time' }), {
        status: 400,
      })
    }

    if (scheduledDate <= new Date()) {
      return new Response(
        JSON.stringify({ error: 'Cannot book consultation in the past' }),
        { status: 400 },
      )
    }

    if (!isThirtyMinuteBlock(scheduledDate)) {
      return new Response(
        JSON.stringify({ error: 'Consultations must start on a 30-minute block' }),
        { status: 400 },
      )
    }

    const doctor = await db
      .select({
        id: user.id,
        isAvailable: user.isAvailable,
        availableFrom: user.availableFrom,
        availableUntil: user.availableUntil,
      })
      .from(user)
      .where(and(eq(user.id, doctorId), isNotNull(user.specialty)))
      .limit(1)

    if (!doctor[0]) {
      return new Response(JSON.stringify({ error: 'Doctor not found' }), {
        status: 404,
      })
    }

    if (!doctor[0].isAvailable) {
      return new Response(
        JSON.stringify({ error: 'Doctor is not available for booking' }),
        { status: 400 },
      )
    }

    if (
      !isWithinDoctorAvailability(
        scheduledDate,
        doctor[0].availableFrom,
        doctor[0].availableUntil,
      )
    ) {
      return new Response(
        JSON.stringify({ error: 'Selected time is outside doctor availability' }),
        { status: 400 },
      )
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
          eq(consultations.doctorId, doctorId),
          inArray(consultations.status, ['scheduled', 'in-progress']),
          gte(consultations.scheduledAt, conflictWindowStart),
          lt(consultations.scheduledAt, slotEnd),
        ),
      )
      .limit(1)

    if (existingConsultation[0]) {
      return new Response(
        JSON.stringify({ error: 'Doctor already has a consultation at that time' }),
        { status: 409 },
      )
    }

    // Create consultation
    const consultation = await db
      .insert(consultations)
      .values({
        id: nanoid(),
        patientId: session.user.id,
        doctorId,
        scheduledAt: scheduledDate,
        status: 'scheduled',
      })
      .returning()

    return new Response(JSON.stringify(consultation[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error booking consultation:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    })
  }
}
