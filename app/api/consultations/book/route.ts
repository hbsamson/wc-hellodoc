import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { consultations, user } from '@/lib/db/schema'
import { and, eq, isNotNull } from 'drizzle-orm'
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

    const doctor = await db
      .select({ id: user.id })
      .from(user)
      .where(and(eq(user.id, doctorId), isNotNull(user.specialty)))
      .limit(1)

    if (!doctor[0]) {
      return new Response(JSON.stringify({ error: 'Doctor not found' }), {
        status: 404,
      })
    }

    // Create consultation
    const consultation = await db
      .insert(consultations)
      .values({
        id: nanoid(),
        patientId: session.user.id,
        doctorId,
        scheduledAt: new Date(scheduledAt),
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
