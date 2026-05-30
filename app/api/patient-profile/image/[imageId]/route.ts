import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { patientProfileImages } from '@/lib/db/schema'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ imageId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { imageId } = await params
  const image = await db
    .select()
    .from(patientProfileImages)
    .where(eq(patientProfileImages.id, imageId))
    .limit(1)

  if (!image[0] || image[0].userId !== session.user.id) {
    return new Response('Not found', { status: 404 })
  }

  return new Response(image[0].data, {
    headers: {
      'Cache-Control': 'private, max-age=3600',
      'Content-Length': String(image[0].size),
      'Content-Type': image[0].mimeType,
    },
  })
}
