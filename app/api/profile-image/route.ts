import { randomUUID } from 'node:crypto'
import { get, put } from '@vercel/blob'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'

const allowedImageTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
])
const maxImageBytes = 5 * 1024 * 1024

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Tizimga kiring.' }, { status: 401 })

  const formData = await request.formData().catch(() => null)
  const file = formData?.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'Rasm tanlanmadi.' }, { status: 400 })
  const extension = allowedImageTypes.get(file.type)
  if (!extension || file.size === 0 || file.size > maxImageBytes) {
    return NextResponse.json({ error: 'Faqat 5 MB gacha JPG, PNG yoki WebP rasm qabul qilinadi.' }, { status: 400 })
  }

  try {
    const pathname = `profiles/${session.user.id}/${randomUUID()}.${extension}`
    const blob = await put(pathname, file, { access: 'private', addRandomSuffix: false })
    return NextResponse.json({ pathname: blob.pathname }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[makoni] Profile image upload failed:', error)
    return NextResponse.json({ error: 'Rasmni saqlab bo‘lmadi.' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Tizimga kiring.' }, { status: 401 })

  const pathname = request.nextUrl.searchParams.get('path')
  if (!pathname || pathname.length > 512 || !pathname.startsWith(`profiles/${session.user.id}/`)) {
    return NextResponse.json({ error: 'Rasm topilmadi.' }, { status: 404 })
  }

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
      },
    })
  } catch (error) {
    console.error('[makoni] Profile image read failed:', error)
    return NextResponse.json({ error: 'Rasmni yuklab bo‘lmadi.' }, { status: 500 })
  }
}
