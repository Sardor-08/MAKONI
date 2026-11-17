import { del } from '@vercel/blob'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { eq, sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { paymentSubmissions, properties, user } from '@/lib/db/schema'
import { MAX_IMAGE_BYTES, isSameOrigin } from '@/lib/uploads'

export const runtime = 'nodejs'

function isOwnedUploadPath(pathname: string, userId: string) {
  const match = /^(listings|receipts|profiles)\/([^/]{1,128})\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(jpg|png|webp)$/i.exec(pathname)
  return Boolean(match && match[2] === userId)
}

export async function POST(request: Request) {
  let body: HandleUploadBody
  try {
    body = await request.json() as HandleUploadBody
  } catch {
    return NextResponse.json({ error: 'Yuklash so‘rovi noto‘g‘ri.' }, { status: 400 })
  }

  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!isSameOrigin(request)) throw new Error('Upload origin is not allowed')
        const session = await auth.api.getSession({ headers: request.headers })
        if (!session?.user || !isOwnedUploadPath(pathname, session.user.id)) throw new Error('Upload is not authorized')

        return {
          access: 'private',
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
          maximumSizeInBytes: MAX_IMAGE_BYTES,
          addRandomSuffix: false,
          tokenPayload: session.user.id,
        }
      },
    })
    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ error: 'Faylni yuklashga ruxsat berilmadi.' }, { status: 403 })
  }
}

const cleanupSchema = z.object({ paths: z.array(z.string().min(1).max(512)).min(1).max(10) })

export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'So‘rov manbasi tasdiqlanmadi.' }, { status: 403 })
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) return NextResponse.json({ error: 'Tizimga kiring.' }, { status: 401 })

  const parsed = cleanupSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success || parsed.data.paths.some((path) => !isOwnedUploadPath(path, session.user.id))) {
    return NextResponse.json({ error: 'Fayl yo‘li noto‘g‘ri.' }, { status: 400 })
  }

  try {
    for (const path of parsed.data.paths) {
      const [listingImage] = await db.select({ id: properties.id })
        .from(properties)
        .where(sql`${properties.imageUrls} @> ${JSON.stringify([path])}::jsonb`)
        .limit(1)
      const [receipt] = await db.select({ id: paymentSubmissions.id })
        .from(paymentSubmissions)
        .where(eq(paymentSubmissions.receiptPath, path))
        .limit(1)
      const [profileImage] = await db.select({ id: user.id })
        .from(user)
        .where(eq(user.image, path))
        .limit(1)
      if (listingImage || receipt || profileImage) return NextResponse.json({ error: 'Fayl allaqachon e’lon, profil yoki to‘lovga biriktirilgan.' }, { status: 409 })
    }

    await Promise.all(parsed.data.paths.map((path) => del(path)))
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[makoni] Blob cleanup failed:', error)
    return NextResponse.json({ error: 'Yuklangan fayllarni tozalab bo‘lmadi.' }, { status: 500 })
  }
}
