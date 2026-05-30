'use server'

import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getUserId } from './helpers'

export type UserType = 'patient' | 'doctor'

export async function updateCurrentUserIdentity(data: {
  givenName: string
  lastName: string
  userType: UserType
}) {
  const userId = await getUserId()
  const givenName = data.givenName.trim()
  const lastName = data.lastName.trim()

  if (!givenName || !lastName) {
    throw new Error('Given name and last name are required')
  }

  await db
    .update(user)
    .set({
      givenName,
      lastName,
      name: [givenName, lastName].filter(Boolean).join(' '),
      userType: data.userType,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId))
}
