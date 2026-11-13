import { desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { properties } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

const listingSchema = z.object({
  title: z.string().trim().min(8).max(140),
  deal: z.enum(['Sotuv', 'Ijara']),
  propertyType: z.enum([
    'Kvartira',
    'Villa',
    'Tijorat',
    'Hovli uy',
    'Yer uchastkasi',
  ]),
  price: z.number().int().positive().max(100_000_000_000_000),
  rooms: z.number().int().min(0).max(50),
  baths: z.number().int().min(0).max(30),
  areaM2: z.number().int().positive().max(100_000),
  region: z.string().trim().min(2).max(100),
  district: z.string().trim().min(2).max(100),
  imageUrl: z.string().url().max(2048).refine((value) => value.startsWith('https://')),
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
      .where(eq(properties.isPublished, true))
      .orderBy(desc(properties.createdAt))
      .limit(100)

    return NextResponse.json({ listings: rows }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[makoni] Public listing query failed:', error)
    return NextResponse.json({ error: 'E’lonlarni yuklab bo‘lmadi.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    return NextResponse.json({ error: 'E’lon joylash uchun tizimga kiring.' }, { status: 401 })
  }

  let input: unknown

  try {
    input = await request.json()
  } catch {
    return NextResponse.json({ error: 'So‘rov formati noto‘g‘ri.' }, { status: 400 })
  }

  const parsed = listingSchema.safeParse(input)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Maydonlarni tekshirib, qayta urinib ko‘ring.' }, { status: 400 })
  }

  try {
    const [listing] = await db
      .insert(properties)
      .values({
        ...parsed.data,
        userId: session.user.id,
        agent: session.user.name,
        premium: false,
        recommend: false,
        isPublished: true,
      })
      .returning({
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
      })

    return NextResponse.json({ listing }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[makoni] Listing insert failed:', error)
    return NextResponse.json({ error: 'E’lonni saqlab bo‘lmadi. Qayta urinib ko‘ring.' }, { status: 500 })
  }
}
