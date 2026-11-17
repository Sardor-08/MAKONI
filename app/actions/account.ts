'use server'

import { randomUUID } from 'node:crypto'
import { del } from '@vercel/blob'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { auditLogs, paymentSubmissions, properties, user } from '@/lib/db/schema'

async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function setListingPublished(id: number, isPublished: boolean) {
  const userId = await requireUserId()
  const parsedId = z.number().int().positive().safeParse(id)
  if (!parsedId.success || typeof isPublished !== 'boolean') return { ok: false, error: 'Noto‘g‘ri so‘rov.' }

  const result = await db.transaction(async (tx) => {
    const [listing] = await tx.select({ id: properties.id, planId: properties.planId, expiresAt: properties.expiresAt })
      .from(properties)
      .where(and(eq(properties.id, parsedId.data), eq(properties.userId, userId)))
      .for('update')
      .limit(1)
    if (!listing) return 'missing' as const

    if (isPublished && listing.planId) {
      if (listing.expiresAt && listing.expiresAt.getTime() <= Date.now()) return 'expired' as const
      const [approved] = await tx.select({ id: paymentSubmissions.id })
        .from(paymentSubmissions)
        .where(and(
          eq(paymentSubmissions.propertyId, listing.id),
          eq(paymentSubmissions.userId, userId),
          eq(paymentSubmissions.status, 'approved'),
        ))
        .limit(1)
      if (!approved) return 'unpaid' as const
    }

    await tx.update(properties).set({ isPublished }).where(eq(properties.id, listing.id))
    await tx.insert(auditLogs).values({
      id: randomUUID(),
      actorUserId: userId,
      action: isPublished ? 'listing.published' : 'listing.hidden',
      subjectType: 'property',
      subjectId: String(listing.id),
      metadata: {},
    })
    return 'updated' as const
  })

  if (result === 'missing') return { ok: false, error: 'E’lon topilmadi.' }
  if (result === 'expired') return { ok: false, error: 'Tarif muddati tugagan. Yangi e’lon joylang.' }
  if (result === 'unpaid') return { ok: false, error: 'E’lon faqat to‘lov tasdiqlangandan keyin faollashadi.' }
  revalidatePath('/account')
  revalidatePath('/makoni.html')
  revalidatePath('/api/properties')
  return { ok: true }
}

export async function deleteListing(id: number) {
  const userId = await requireUserId()
  const parsedId = z.number().int().positive().safeParse(id)
  if (!parsedId.success) return { ok: false, error: 'Noto‘g‘ri so‘rov.' }

  const deleted = await db.transaction(async (tx) => {
    const [listing] = await tx.select({ id: properties.id, imageUrls: properties.imageUrls })
      .from(properties)
      .where(and(eq(properties.id, parsedId.data), eq(properties.userId, userId)))
      .for('update')
      .limit(1)
    if (!listing) return null

    const receipts = await tx.select({ receiptPath: paymentSubmissions.receiptPath })
      .from(paymentSubmissions)
      .where(and(eq(paymentSubmissions.propertyId, listing.id), eq(paymentSubmissions.userId, userId)))
    await tx.delete(paymentSubmissions)
      .where(and(eq(paymentSubmissions.propertyId, listing.id), eq(paymentSubmissions.userId, userId)))
    await tx.delete(properties).where(and(eq(properties.id, listing.id), eq(properties.userId, userId)))
    await tx.insert(auditLogs).values({
      id: randomUUID(),
      actorUserId: userId,
      action: 'listing.deleted',
      subjectType: 'property',
      subjectId: String(listing.id),
      metadata: { imageCount: listing.imageUrls.length, paymentReceiptCount: receipts.length },
    })
    return [...listing.imageUrls, ...receipts.map((receipt) => receipt.receiptPath)]
  })

  if (!deleted) return { ok: false, error: 'E’lon topilmadi.' }
  const ownedPaths = deleted.filter((path) => path.startsWith(`listings/${userId}/`) || path.startsWith(`receipts/${userId}/`))
  await Promise.allSettled(ownedPaths.map((path) => del(path)))
  revalidatePath('/account')
  revalidatePath('/makoni.html')
  revalidatePath('/api/properties')
  return { ok: true }
}

export async function saveProfile(name: string, image: string | null) {
  const userId = await requireUserId()
  const parsedName = z.string().trim().min(2).max(80).safeParse(name)
  const parsedImage = z.string().max(512).nullable().refine((value) =>
    value === null || value.startsWith(`profiles/${userId}/`) || /^https:\/\/[^\s]+$/i.test(value),
  ).safeParse(image)
  if (!parsedName.success || !parsedImage.success) return { ok: false, error: 'Profil ma’lumotlarini tekshiring.' }

  const [updated] = await db.update(user)
    .set({ name: parsedName.data, image: parsedImage.data, updatedAt: new Date() })
    .where(eq(user.id, userId))
    .returning({ id: user.id })

  if (!updated) return { ok: false, error: 'Akkaunt topilmadi.' }
  revalidatePath('/account')
  return { ok: true }
}
