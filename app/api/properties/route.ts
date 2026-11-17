import { get } from '@vercel/blob'
import { randomUUID } from 'node:crypto'
import { and, desc, eq, gt, isNull, or } from 'drizzle-orm'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { auditLogs, listingPlans, properties } from '@/lib/db/schema'
import { propertyImageSource } from '@/lib/image-path'
import { isSameOrigin, MAX_IMAGE_BYTES } from '@/lib/uploads'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const listingSchema = z.object({
  title: z.string().trim().min(8).max(140),
  deal: z.enum(['Sotuv', 'Ijara']),
  propertyType: z.enum(['Kvartira', 'Villa', 'Tijorat', 'Hovli uy', 'Yer uchastkasi']),
  price: z.number().int().positive().max(100_000_000_000_000),
  rooms: z.number().int().min(0).max(50),
  baths: z.number().int().min(0).max(30),
  areaM2: z.number().int().positive().max(100_000),
  region: z.string().trim().min(2).max(100),
  district: z.string().trim().min(2).max(100),
  planId: z.string().min(1).max(80),
  imageUrls: z.array(z.string().min(1).max(512)).min(1).max(10).refine((paths) => new Set(paths).size === paths.length),
})

export async function GET() {
  try {
    const rows = await db
      .select({
        id: properties.id,
        deal: properties.deal,
        type: properties.propertyType,
        price: properties.price,
        rooms: properties.rooms,
        baths: properties.baths,
        area: properties.areaM2,
        region: properties.region,
        district: properties.district,
        title: properties.title,
        agent: properties.agent,
        premium: properties.premium,
        recommend: properties.recommend,
        img: properties.imageUrl,
        createdAt: properties.createdAt,
      })
      .from(properties)
      .where(and(
        eq(properties.isPublished, true),
        or(isNull(properties.expiresAt), gt(properties.expiresAt, new Date())),
      ))
      .orderBy(desc(properties.createdAt))
      .limit(100)

    return NextResponse.json({
      listings: rows.map((row) => ({ ...row, img: propertyImageSource(row.img) })),
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[makoni] Public listing query failed:', error)
    return NextResponse.json({ error: 'E’lonlarni yuklab bo‘lmadi.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'So‘rov manbasi tasdiqlanmadi.' }, { status: 403 })

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'E’lon joylash uchun tizimga kiring.' }, { status: 401 })

  const input: unknown = await request.json().catch(() => null)
  const parsed = listingSchema.safeParse(input)
  if (!parsed.success) return NextResponse.json({ error: 'Maydonlarni tekshirib, qayta urinib ko‘ring.' }, { status: 400 })

  const imagePrefix = `listings/${session.user.id}/`
  if (parsed.data.imageUrls.some((path) => !path.startsWith(imagePrefix) || !/^listings\/[^/]+\/[0-9a-f-]+\.(jpg|png|webp)$/i.test(path))) {
    return NextResponse.json({ error: 'E’lon rasmlaridan biri akkauntingizga tegishli emas.' }, { status: 400 })
  }

  const [plan] = await db.select().from(listingPlans)
    .where(and(eq(listingPlans.id, parsed.data.planId), eq(listingPlans.isActive, true)))
    .limit(1)
  if (!plan) return NextResponse.json({ error: 'Tanlangan tarif faol emas.' }, { status: 400 })
  if (parsed.data.imageUrls.length > plan.maxPhotos) {
    return NextResponse.json({ error: `Ushbu tarifda ${plan.maxPhotos} tagacha rasm qo‘shish mumkin.` }, { status: 400 })
  }

  try {
    const imageBlobs = await Promise.all(parsed.data.imageUrls.map((path) => get(path, { access: 'private' })))
    if (imageBlobs.some((blob) => !blob || blob.statusCode !== 200 || !['image/jpeg', 'image/png', 'image/webp'].includes(blob.blob.contentType) || (blob.blob.size === 0 || blob.blob.size > MAX_IMAGE_BYTES))) {
      return NextResponse.json({ error: 'Rasmlardan biri topilmadi yoki ruxsat etilmagan formatda.' }, { status: 400 })
    }

    const listing = await db.transaction(async (tx) => {
      const [created] = await tx.insert(properties).values({
        ...parsed.data,
        userId: session.user.id,
        agent: session.user.name,
        premium: false,
        recommend: false,
        imageUrl: parsed.data.imageUrls[0],
        planId: plan.id,
        isPublished: false,
      }).returning({ id: properties.id, title: properties.title, planId: properties.planId })

      await tx.insert(auditLogs).values({
        id: randomUUID(),
        actorUserId: session.user.id,
        action: 'listing.created_pending_payment',
        subjectType: 'property',
        subjectId: String(created.id),
        metadata: { planId: plan.id, imageCount: parsed.data.imageUrls.length },
      })
      return created
    })

    return NextResponse.json({ listing }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[makoni] Listing image verification or insert failed:', error)
    return NextResponse.json({ error: 'E’lonni saqlab bo‘lmadi. Qayta urinib ko‘ring.' }, { status: 500 })
  }
}
