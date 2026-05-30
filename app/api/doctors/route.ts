import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { and, eq, isNotNull } from 'drizzle-orm'
import { headers } from 'next/headers'

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      })
    }

    // Get all available doctors with their user info
    const doctors = await db
      .select({
        id: user.id,
        userId: user.id,
        specialty: user.specialty,
        bio: user.bio,
        licenseNumber: user.licenseNumber,
        experienceYears: user.experienceYears,
        hourlyRate: user.hourlyRate,
        isAvailable: user.isAvailable,
        availableFrom: user.availableFrom,
        availableUntil: user.availableUntil,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        doctorName: user.name,
        doctorEmail: user.email,
      })
      .from(user)
      .where(and(eq(user.isAvailable, true), isNotNull(user.specialty)))

    return new Response(JSON.stringify(doctors), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error fetching doctors:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    })
  }
}
