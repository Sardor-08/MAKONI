import { get } from '@vercel/blob'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { paymentSubmissions } from '@/lib/db/schema'
import { getAdminUser } from '@/lib/admin'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const admin = await getAdminUser()
  if (!admin) return NextResponse.json({ error: 'Ruxsat yo‘q.' }, { status: 404 })

  const pathname = request.nextUrl.searchParams.get('path')
  if (!pathname || pathname.length > 512 || !/^receipts\/[a-zA-Z0-9_-]+\/[a-f0-9-]+\.(jpg|png|webp)$/i.test(pathname)) {
    return NextResponse.json({ error: 'Fayl topilmadi.' }, { status: 404 })
  }

  const [submission] = await db.select({ id: paymentSubmissions.id })
    .from(paymentSubmissions)
    .where(eq(paymentSubmissions.receiptPath, pathname))
    .limit(1)
  if (!submission) return NextResponse.json({ error: 'Fayl topilmadi.' }, { status: 404 })

  try {
    const result = await get(pathname, {
      access: 'private',
      ifNoneMatch: request.headers.get('if-none-match') ?? undefined,
    })
    if (!result) return new NextResponse('Not found', { status: 404 })
    if (result.statusCode === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: result.blob.etag, 'Cache-Control': 'private, no-cache' },
      })
    }

    return new NextResponse(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType,
        'Content-Length': String(result.blob.size),
        ETag: result.blob.etag,
        'Cache-Control': 'private, no-cache',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': 'inline; filename="payment-receipt"',
      },
    })
  } catch (error) {
    console.error('[makoni] Payment receipt read failed:', error)
    return NextResponse.json({ error: 'Faylni yuklab bo‘lmadi.' }, { status: 503 })
  }
}
