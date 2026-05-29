import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { doctorProfiles, user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
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
        id: doctorProfiles.id,
        userId: doctorProfiles.userId,
        specialty: doctorProfiles.specialty,
        bio: doctorProfiles.bio,
        licenseNumber: doctorProfiles.licenseNumber,
        experienceYears: doctorProfiles.experienceYears,
        hourlyRate: doctorProfiles.hourlyRate,
        isAvailable: doctorProfiles.isAvailable,
        availableFrom: doctorProfiles.availableFrom,
        availableUntil: doctorProfiles.availableUntil,
        createdAt: doctorProfiles.createdAt,
        updatedAt: doctorProfiles.updatedAt,
        doctorName: user.name,
        doctorEmail: user.email,
      })
      .from(doctorProfiles)
      .leftJoin(user, eq(doctorProfiles.userId, user.id))
      .where(eq(doctorProfiles.isAvailable, true))

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
