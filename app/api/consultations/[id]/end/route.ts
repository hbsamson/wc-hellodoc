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
    const body = await request.json().catch(() => ({}))
    const { notes } = body

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

    // Only doctor can end
    if (consultation[0].doctorId !== session.user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
      })
    }

    // Update to completed
    const updated = await db
      .update(consultations)
      .set({
        status: 'completed',
        endedAt: new Date(),
        notes: notes || null,
        updatedAt: new Date(),
      })
      .where(eq(consultations.id, id))
      .returning()

    return new Response(JSON.stringify(updated[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error ending consultation:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    })
  }
}
