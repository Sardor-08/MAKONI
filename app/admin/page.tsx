import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { and, count, desc, eq, gt, isNull, or } from 'drizzle-orm'
import { headers } from 'next/headers'
import { AdminDashboard } from '@/components/admin-dashboard'
import { ADMIN_EMAIL } from '@/lib/admin'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { auditLogs, listingPlans, paymentSettings, paymentSubmissions, properties, user, walletTransactions } from '@/lib/db/schema'

export const metadata: Metadata = {
  title: 'Boshqaruv paneli — MAKONI',
  description: 'MAKONI tariflari, e’lonlari, to‘lov arizalari va xavfsizlik auditlarini boshqaring.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in?returnTo=%2Fadmin')
  if (session.user.email.trim().toLowerCase() !== ADMIN_EMAIL) notFound()

  const [plans, settings, payments, listings, audits, balanceChanges, [pendingCount], [activeCount], [totalListings]] = await Promise.all([
    db.select().from(listingPlans).orderBy(listingPlans.displayOrder),
    db.select().from(paymentSettings).where(eq(paymentSettings.id, 1)).limit(1),
    db.select({
      id: paymentSubmissions.id,
      userId: paymentSubmissions.userId,
      propertyId: paymentSubmissions.propertyId,
      planId: paymentSubmissions.planId,
      amount: paymentSubmissions.amount,
      payerName: paymentSubmissions.payerName,
      payerPhone: paymentSubmissions.payerPhone,
      reference: paymentSubmissions.reference,
      receiptPath: paymentSubmissions.receiptPath,
      status: paymentSubmissions.status,
      reviewNote: paymentSubmissions.reviewNote,
      createdAt: paymentSubmissions.createdAt,
      propertyTitle: properties.title,
      region: properties.region,
      district: properties.district,
      ownerName: user.name,
      ownerEmail: user.email,
    })
      .from(paymentSubmissions)
      .innerJoin(properties, eq(paymentSubmissions.propertyId, properties.id))
      .leftJoin(user, eq(paymentSubmissions.userId, user.id))
      .orderBy(desc(paymentSubmissions.createdAt))
      .limit(100),
    db.select({
      id: properties.id,
      title: properties.title,
      region: properties.region,
      district: properties.district,
      price: properties.price,
      planId: properties.planId,
      isPublished: properties.isPublished,
      expiresAt: properties.expiresAt,
      createdAt: properties.createdAt,
      ownerName: user.name,
      ownerEmail: user.email,
    })
      .from(properties)
      .leftJoin(user, eq(properties.userId, user.id))
      .orderBy(desc(properties.createdAt))
      .limit(200),
    db.select({ id: auditLogs.id, actorUserId: auditLogs.actorUserId, action: auditLogs.action, subjectType: auditLogs.subjectType, subjectId: auditLogs.subjectId, metadata: auditLogs.metadata, createdAt: auditLogs.createdAt, actorEmail: user.email })
      .from(auditLogs)
      .leftJoin(user, eq(auditLogs.actorUserId, user.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(100),
    db.select({ id: walletTransactions.id, userId: walletTransactions.userId, amountDelta: walletTransactions.amountDelta, balanceAfter: walletTransactions.balanceAfter, note: walletTransactions.note, createdAt: walletTransactions.createdAt, userName: user.name, userEmail: user.email })
      .from(walletTransactions)
      .leftJoin(user, eq(walletTransactions.userId, user.id))
      .orderBy(desc(walletTransactions.createdAt))
      .limit(100),
    db.select({ value: count() }).from(paymentSubmissions).where(eq(paymentSubmissions.status, 'pending')),
    db.select({ value: count() }).from(properties).where(and(eq(properties.isPublished, true), or(isNull(properties.expiresAt), gt(properties.expiresAt, new Date())))),
    db.select({ value: count() }).from(properties),
  ])

  return (
    <AdminDashboard
      admin={{ name: session.user.name, email: session.user.email }}
      plans={plans}
      settings={settings[0] ?? { id: 1, bankName: '', cardNumber: '', cardHolder: '', telegramUsername: '', instructions: '', updatedBy: null, updatedAt: new Date() }}
      payments={payments}
      listings={listings}
      audits={audits}
      balanceChanges={balanceChanges}
      stats={{ pendingPayments: Number(pendingCount?.value ?? 0), activeListings: Number(activeCount?.value ?? 0), totalListings: Number(totalListings?.value ?? 0) }}
    />
  )
}
