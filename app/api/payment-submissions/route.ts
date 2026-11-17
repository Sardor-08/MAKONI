import { get } from '@vercel/blob'
import { randomUUID } from 'node:crypto'
import { and, eq, inArray } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { auditLogs, listingPlans, paymentSubmissions, properties } from '@/lib/db/schema'
import { isSameOrigin, MAX_IMAGE_BYTES } from '@/lib/uploads'

export const runtime = 'nodejs'

const paymentSchema = z.object({
  propertyId: z.number().int().positive(),
  payerName: z.string().trim().min(2).max(120),
  payerPhone: z.string().trim().min(7).max(30).regex(/^[+\d ()-]+$/),
  reference: z.string().trim().max(120).optional().default(''),
  receiptPath: z.string().min(1).max(512),
})

class PaymentConflict extends Error {}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'So‘rov manbasi tasdiqlanmadi.' }, { status: 403 })

  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) return NextResponse.json({ error: 'Tizimga kiring.' }, { status: 401 })

  const input: unknown = await request.json().catch(() => null)
  const parsed = paymentSchema.safeParse(input)
  if (!parsed.success) return NextResponse.json({ error: 'To‘lov ma’lumotlarini tekshiring.' }, { status: 400 })

  const receiptPrefix = `receipts/${session.user.id}/`
  if (!parsed.data.receiptPath.startsWith(receiptPrefix) || !/^receipts\/[^/]+\/[0-9a-f-]+\.(jpg|png|webp)$/i.test(parsed.data.receiptPath)) {
    return NextResponse.json({ error: 'Chek fayli akkauntingizga tegishli emas.' }, { status: 400 })
  }

  const [listing] = await db.select({ id: properties.id, userId: properties.userId, planId: properties.planId, isPublished: properties.isPublished })
    .from(properties)
    .where(and(eq(properties.id, parsed.data.propertyId), eq(properties.userId, session.user.id)))
    .limit(1)
  if (!listing || !listing.planId || listing.isPublished) {
    return NextResponse.json({ error: 'To‘lov uchun e’lon topilmadi.' }, { status: 404 })
  }

  const [plan] = await db.select({ id: listingPlans.id, price: listingPlans.price })
    .from(listingPlans)
    .where(eq(listingPlans.id, listing.planId))
    .limit(1)
  if (!plan) return NextResponse.json({ error: 'E’lon tarifi topilmadi.' }, { status: 409 })

  try {
    const receipt = await get(parsed.data.receiptPath, { access: 'private' })
    if (!receipt || receipt.statusCode !== 200 || !['image/jpeg', 'image/png', 'image/webp'].includes(receipt.blob.contentType) || (receipt.blob.size === 0 || receipt.blob.size > MAX_IMAGE_BYTES)) {
      return NextResponse.json({ error: 'Chek topilmadi yoki ruxsat etilmagan formatda.' }, { status: 400 })
    }

    const submission = await db.transaction(async (tx) => {
      const [lockedListing] = await tx.select({ id: properties.id, planId: properties.planId, isPublished: properties.isPublished })
        .from(properties)
        .where(and(eq(properties.id, parsed.data.propertyId), eq(properties.userId, session.user.id)))
        .for('update')
        .limit(1)
      if (!lockedListing || lockedListing.isPublished || lockedListing.planId !== plan.id) throw new PaymentConflict('Listing unavailable')

      const [existing] = await tx.select({ id: paymentSubmissions.id })
        .from(paymentSubmissions)
        .where(and(
          eq(paymentSubmissions.propertyId, parsed.data.propertyId),
          eq(paymentSubmissions.userId, session.user.id),
          inArray(paymentSubmissions.status, ['pending', 'approved']),
        ))
        .limit(1)
      if (existing) throw new PaymentConflict('Payment already submitted')

      const [created] = await tx.insert(paymentSubmissions).values({
        id: randomUUID(),
        userId: session.user.id,
        propertyId: parsed.data.propertyId,
        planId: plan.id,
        amount: plan.price,
        payerName: parsed.data.payerName,
        payerPhone: parsed.data.payerPhone,
        reference: parsed.data.reference || null,
        receiptPath: parsed.data.receiptPath,
      }).returning({ id: paymentSubmissions.id, status: paymentSubmissions.status })

      await tx.insert(auditLogs).values({
        id: randomUUID(),
        actorUserId: session.user.id,
        action: 'payment.submitted',
        subjectType: 'payment_submission',
        subjectId: created.id,
        metadata: { propertyId: parsed.data.propertyId, planId: plan.id, amount: plan.price },
      })
      return created
    })

    return NextResponse.json({ submission }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof PaymentConflict) {
      return NextResponse.json({ error: 'Bu e’lon uchun to‘lov arizasi allaqachon yuborilgan yoki e’lon faollashtirilgan.' }, { status: 409 })
    }
    console.error('[makoni] Payment submission failed:', error)
    return NextResponse.json({ error: 'To‘lov arizasini yuborib bo‘lmadi. Qayta urinib ko‘ring.' }, { status: 500 })
  }
}
