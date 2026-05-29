'use server'

import { auth } from '@/lib/auth'
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
  // Store user role in metadata or custom field
  // For now, check if they have a doctor_profile
  return 'patient'
}
