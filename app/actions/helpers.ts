'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { and, eq, isNotNull } from 'drizzle-orm'
import { headers } from 'next/headers'

export async function getUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  return session.user.id
}

export async function getUserRole(): Promise<'patient' | 'doctor' | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return null
  }
  const doctor = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.id, session.user.id), isNotNull(user.specialty)))
    .limit(1)

  return doctor[0] ? 'doctor' : 'patient'
}
