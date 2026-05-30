import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { patientMedicalFiles } from '@/lib/db/schema'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { fileId } = await params
  const file = await db
    .select()
    .from(patientMedicalFiles)
    .where(eq(patientMedicalFiles.id, fileId))
    .limit(1)

  if (!file[0] || file[0].userId !== session.user.id) {
    return new Response('Not found', { status: 404 })
  }

  const filename = encodeURIComponent(file[0].filename)

  return new Response(file[0].data, {
    headers: {
      'Cache-Control': 'private, max-age=3600',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': String(file[0].size),
      'Content-Type': file[0].mimeType,
    },
  })
}
