'use server'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function getUserId() {
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

  const currentUser = await db
    .select({ userType: user.userType })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  return currentUser[0]?.userType === 'doctor' ? 'doctor' : 'patient'
}
