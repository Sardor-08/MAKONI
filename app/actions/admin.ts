'use server'

import { randomUUID } from 'node:crypto'
import { and, desc, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin'
import { db } from '@/lib/db'
import { auditLogs, listingPlans, paymentSettings, paymentSubmissions, properties, user, walletTransactions } from '@/lib/db/schema'

const planSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(4).max(300),
  price: z.number().int().min(0).max(1_000_000_000),
  durationDays: z.number().int().min(1).max(365),
  maxPhotos: z.number().int().min(1).max(12),
  premium: z.boolean(),
  featured: z.boolean(),
  isActive: z.boolean(),
  displayOrder: z.number().int().min(0).max(1000),
})

const settingsSchema = z.object({
  bankName: z.string().trim().max(120),
  cardNumber: z.string().trim().max(40).refine((value) => value === '' || /^\d{4}(?: ?\d{4}){3}$/.test(value)),
  cardHolder: z.string().trim().max(120),
  telegramUsername: z.string().trim().max(33).transform((value) => value.replace(/^@/, '')).refine((value) => value === '' || /^[A-Za-z0-9_]{5,32}$/.test(value)),
  instructions: z.string().trim().max(1000),
})

export async function updateListingPlan(input: unknown) {
  const admin = await requireAdmin()
  const parsed = planSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Tarif ma’lumotlarini tekshiring.' }

  const updated = await db.transaction(async (tx) => {
    const [plan] = await tx.update(listingPlans)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(listingPlans.id, parsed.data.id))
      .returning({ id: listingPlans.id, price: listingPlans.price, isActive: listingPlans.isActive })
    if (!plan) return null

    await tx.insert(auditLogs).values({
      id: randomUUID(),
      actorUserId: admin.id,
      action: 'admin.listing_plan.updated',
      subjectType: 'listing_plan',
      subjectId: plan.id,
      metadata: { price: plan.price, isActive: plan.isActive },
    })
    return plan
  })

  if (!updated) return { ok: false, error: 'Tarif topilmadi.' }
  revalidatePath('/admin')
  revalidatePath('/list-property')
  return { ok: true }
}

export async function updatePaymentSettings(input: unknown) {
  const admin = await requireAdmin()
  const parsed = settingsSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'To‘lov ma’lumotlarini tekshiring.' }

  await db.transaction(async (tx) => {
    await tx.update(paymentSettings)
      .set({ ...parsed.data, updatedBy: admin.id, updatedAt: new Date() })
      .where(eq(paymentSettings.id, 1))
    await tx.insert(auditLogs).values({
      id: randomUUID(),
      actorUserId: admin.id,
      action: 'admin.payment_settings.updated',
      subjectType: 'payment_settings',
      subjectId: '1',
      metadata: { bankNameChanged: Boolean(parsed.data.bankName), cardUpdated: Boolean(parsed.data.cardNumber), telegramConfigured: Boolean(parsed.data.telegramUsername) },
    })
  })

  revalidatePath('/admin')
  revalidatePath('/list-property')
  return { ok: true }
}

const balanceSchema = z.object({
  email: z.string().trim().email().max(254),
  targetBalance: z.number().int().min(0).max(1_000_000_000_000),
  note: z.string().trim().min(3).max(300),
})

export async function setUserBalance(input: unknown) {
  const admin = await requireAdmin()
  const parsed = balanceSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Balans ma’lumotlarini tekshiring.' }

  const result = await db.transaction(async (tx) => {
    const [target] = await tx.select({ id: user.id, email: user.email })
      .from(user)
      .where(sql`lower(${user.email}) = ${parsed.data.email.toLowerCase()}`)
      .for('update')
      .limit(1)
    if (!target) return 'missing' as const

    const [balanceRow] = await tx.select({ total: sql<string>`coalesce(sum(${walletTransactions.amountDelta}), 0)` })
      .from(walletTransactions)
      .where(eq(walletTransactions.userId, target.id))
    const currentBalance = Number(balanceRow?.total ?? 0)
    const delta = parsed.data.targetBalance - currentBalance
    if (!Number.isSafeInteger(currentBalance) || !Number.isSafeInteger(delta)) return 'invalid' as const
    if (delta === 0) return 'unchanged' as const

    await tx.insert(walletTransactions).values({
      id: randomUUID(),
      userId: target.id,
      actorUserId: admin.id,
      amountDelta: delta,
      balanceAfter: parsed.data.targetBalance,
      note: parsed.data.note,
    })
    await tx.insert(auditLogs).values({
      id: randomUUID(),
      actorUserId: admin.id,
      action: 'admin.balance.adjusted',
      subjectType: 'user_balance',
      subjectId: target.id,
      metadata: { email: target.email, previousBalance: currentBalance, balanceAfter: parsed.data.targetBalance, amountDelta: delta },
    })
    return 'updated' as const
  })

  if (result === 'missing') return { ok: false, error: 'Bu email bilan foydalanuvchi topilmadi.' }
  if (result === 'invalid') return { ok: false, error: 'Balans xavfsiz hisoblash chegarasidan oshdi.' }
  if (result === 'unchanged') return { ok: false, error: 'Foydalanuvchi balansi allaqachon shu miqdorda.' }
  revalidatePath('/admin')
  revalidatePath('/account')
  return { ok: true }
}

export async function reviewPaymentSubmission(id: string, decision: 'approved' | 'rejected', reviewNote: string) {
  const admin = await requireAdmin()
  const parsedId = z.string().uuid().safeParse(id)
  const parsedDecision = z.enum(['approved', 'rejected']).safeParse(decision)
  const parsedNote = z.string().trim().max(500).safeParse(reviewNote)
  if (!parsedId.success || !parsedDecision.success || !parsedNote.success) return { ok: false, error: 'Ariza ma’lumotlari noto‘g‘ri.' }

  const result = await db.transaction(async (tx) => {
    const [submission] = await tx.select().from(paymentSubmissions)
      .where(eq(paymentSubmissions.id, parsedId.data))
      .for('update')
      .limit(1)
    if (!submission || submission.status !== 'pending') return 'not-pending' as const

    if (parsedDecision.data === 'approved') {
      const [property] = await tx.select({ id: properties.id, userId: properties.userId, planId: properties.planId })
        .from(properties)
        .where(eq(properties.id, submission.propertyId))
        .for('update')
        .limit(1)
      const [plan] = await tx.select({ id: listingPlans.id, durationDays: listingPlans.durationDays, premium: listingPlans.premium, featured: listingPlans.featured })
        .from(listingPlans)
        .where(eq(listingPlans.id, submission.planId))
        .limit(1)
      if (!property || !plan || property.userId !== submission.userId || property.planId !== submission.planId) return 'inconsistent' as const

      const expiresAt = new Date(Date.now() + plan.durationDays * 86_400_000)
      await tx.update(properties)
        .set({ isPublished: true, premium: plan.premium, recommend: plan.featured, expiresAt })
        .where(eq(properties.id, property.id))
    }

    await tx.update(paymentSubmissions)
      .set({ status: parsedDecision.data, reviewedBy: admin.id, reviewNote: parsedNote.data || null, reviewedAt: new Date() })
      .where(and(eq(paymentSubmissions.id, submission.id), eq(paymentSubmissions.status, 'pending')))

    await tx.insert(auditLogs).values({
      id: randomUUID(),
      actorUserId: admin.id,
      action: `admin.payment.${parsedDecision.data}`,
      subjectType: 'payment_submission',
      subjectId: submission.id,
      metadata: { propertyId: submission.propertyId, planId: submission.planId, amount: submission.amount },
    })
    return 'updated' as const
  })

  if (result === 'not-pending') return { ok: false, error: 'Ariza allaqachon ko‘rib chiqilgan yoki topilmadi.' }
  if (result === 'inconsistent') return { ok: false, error: 'Ariza va e’lon ma’lumotlari mos kelmadi.' }
  revalidatePath('/admin')
  revalidatePath('/account')
  revalidatePath('/makoni.html')
  revalidatePath('/api/properties')
  return { ok: true }
}

export async function setAdminListingVisibility(id: number, isPublished: boolean) {
  const admin = await requireAdmin()
  const parsedId = z.number().int().positive().safeParse(id)
  if (!parsedId.success || typeof isPublished !== 'boolean') return { ok: false, error: 'E’lon ma’lumotlari noto‘g‘ri.' }

  const updated = await db.transaction(async (tx) => {
    const [property] = await tx.update(properties)
      .set({ isPublished })
      .where(eq(properties.id, parsedId.data))
      .returning({ id: properties.id })
    if (!property) return false
    await tx.insert(auditLogs).values({
      id: randomUUID(),
      actorUserId: admin.id,
      action: isPublished ? 'admin.listing.published' : 'admin.listing.hidden',
      subjectType: 'property',
      subjectId: String(property.id),
      metadata: {},
    })
    return true
  })

  if (!updated) return { ok: false, error: 'E’lon topilmadi.' }
  revalidatePath('/admin')
  revalidatePath('/makoni.html')
  revalidatePath('/api/properties')
  return { ok: true }
}
