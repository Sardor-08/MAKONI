import { get } from '@vercel/blob'
import { and, eq, gt, isNull, or, sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { properties } from '@/lib/db/schema'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get('path')
  if (!pathname || pathname.length > 512 || !/^listings\/[a-zA-Z0-9_-]+\/[a-f0-9-]+\.(jpg|png|webp)$/i.test(pathname)) {
    return new NextResponse('Not found', { status: 404 })
  }

  try {
    const session = await auth.api.getSession({ headers: request.headers })
    const publicListing = and(
      eq(properties.isPublished, true),
      or(isNull(properties.expiresAt), gt(properties.expiresAt, new Date())),
    )
    const accessCondition = session?.user
      ? or(publicListing, eq(properties.userId, session.user.id))
      : publicListing
    const [listing] = await db.select({ id: properties.id, isPublished: properties.isPublished, expiresAt: properties.expiresAt })
      .from(properties)
      .where(and(accessCondition, sql`${properties.imageUrls} @> ${JSON.stringify([pathname])}::jsonb`))
      .limit(1)
    if (!listing) return new NextResponse('Not found', { status: 404 })
    const isPublic = listing.isPublished && (!listing.expiresAt || listing.expiresAt.getTime() > Date.now())
    const cacheControl = isPublic ? 'public, max-age=60, s-maxage=60' : 'private, no-cache'

    const result = await get(pathname, {
      access: 'private',
      ifNoneMatch: request.headers.get('if-none-match') ?? undefined,
    })
    if (!result) return new NextResponse('Not found', { status: 404 })
    if (result.statusCode === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: result.blob.etag, 'Cache-Control': cacheControl },
      })
    }

    return new NextResponse(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType,
        'Content-Length': String(result.blob.size),
        ETag: result.blob.etag,
        'Cache-Control': cacheControl,
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('[makoni] Property image read failed:', error)
    return new NextResponse('Image unavailable', { status: 503 })
  }
}
