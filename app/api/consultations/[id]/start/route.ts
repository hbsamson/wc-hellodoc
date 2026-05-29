import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { consultations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      })
    }

    const { id } = await params

    // Get consultation
    const consultation = await db
      .select()
      .from(consultations)
      .where(eq(consultations.id, id))
      .limit(1)

    if (!consultation[0]) {
      return new Response(JSON.stringify({ error: 'Consultation not found' }), {
        status: 404,
      })
    }

    // Only doctor can start
    if (consultation[0].doctorId !== session.user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
      })
    }

    // Update to in-progress
    const updated = await db
      .update(consultations)
      .set({
        status: 'in-progress',
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(consultations.id, id))
      .returning()

    return new Response(JSON.stringify(updated[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error starting consultation:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    })
  }
}
