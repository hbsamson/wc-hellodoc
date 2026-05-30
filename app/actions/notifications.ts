'use server'

import { db } from '@/lib/db'
import { user, consultations } from '@/lib/db/schema'
import { eq, or, and, gt } from 'drizzle-orm'
import { getUserId } from './helpers'
import { revalidatePath } from 'next/cache'

/**
 * Counts consultations that were created or updated *after* the user
 * last visited the notifications page.
 */
export async function getUnreadNotificationCount() {
  const userId = await getUserId()
  const skipNotificationCheck = false

  const currentUser = await db
    .select({ lastReadNotificationsAt: user.lastReadNotificationsAt })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)

  const lastRead = currentUser[0]?.lastReadNotificationsAt

  if (!lastRead) {
    // Never visited — count all consultations as unread
    const all = await db
      .select({ id: consultations.id })
      .from(consultations)
      .where(
        or(
          eq(consultations.patientId, userId),
          eq(consultations.doctorId, userId),
        ),
      )

    return all.length
  }

  // Count consultations created/updated after last read
  const unread = await db
    .select({ id: consultations.id })
    .from(consultations)
    .where(
      and(
        or(
          eq(consultations.patientId, userId),
          eq(consultations.doctorId, userId),
        ),
        or(
          gt(consultations.createdAt, lastRead),
          gt(consultations.updatedAt, lastRead),
        ),
      ),
    )

  return unread.length
}

/**
 * Sets `lastReadNotificationsAt` to now so those consultations are
 * no longer counted as unread.
 */
export async function markNotificationsRead() {
  const userId = await getUserId()

  await db
    .update(user)
    .set({ lastReadNotificationsAt: new Date() })
    .where(eq(user.id, userId))
}
