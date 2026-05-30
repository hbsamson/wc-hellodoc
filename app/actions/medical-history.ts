'use server'

import { db } from '@/lib/db'
import { patientMedicalFiles } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { getUserId } from './helpers'

export async function getPatientMedicalFiles() {
  const userId = await getUserId()

  return db
    .select({
      id: patientMedicalFiles.id,
      filename: patientMedicalFiles.filename,
      mimeType: patientMedicalFiles.mimeType,
      size: patientMedicalFiles.size,
      description: patientMedicalFiles.description,
      createdAt: patientMedicalFiles.createdAt,
    })
    .from(patientMedicalFiles)
    .where(eq(patientMedicalFiles.userId, userId))
    .orderBy(desc(patientMedicalFiles.createdAt))
}

export async function savePatientMedicalFile(file: File, description?: string) {
  const userId = await getUserId()
  const id = nanoid()
  const buffer = Buffer.from(await file.arrayBuffer())

  await db.insert(patientMedicalFiles).values({
    id,
    userId,
    data: buffer,
    mimeType: file.type || 'application/octet-stream',
    filename: file.name,
    size: file.size,
    description,
  })

  revalidatePath('/patient-medical-history')

  return `/api/patient-medical-history/file/${id}`
}
