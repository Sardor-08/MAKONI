import type { Metadata } from 'next'
import { desc, eq, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AccountDashboard } from '@/components/account-dashboard'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { paymentSubmissions, properties, user, walletTransactions } from '@/lib/db/schema'
import { propertyImageSource } from '@/lib/image-path'

export const metadata: Metadata = {
  title: 'Shaxsiy kabinet — MAKONI',
  description: 'MAKONI akkauntingiz, profil ma’lumotlari, e’lonlaringiz va to‘lov holatini boshqaring.',
}

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in?returnTo=%2Faccount')

  const [profileRows, listingRows, paymentRows, balanceRows] = await Promise.all([
    db.select({ id: user.id, name: user.name, email: user.email, image: user.image })
      .from(user).where(eq(user.id, session.user.id)).limit(1),
    db.select({
      id: properties.id,
      title: properties.title,
      deal: properties.deal,
      propertyType: properties.propertyType,
      price: properties.price,
      rooms: properties.rooms,
      baths: properties.baths,
      areaM2: properties.areaM2,
      region: properties.region,
      district: properties.district,
      imageUrl: properties.imageUrl,
      isPublished: properties.isPublished,
      planId: properties.planId,
      expiresAt: properties.expiresAt,
      createdAt: properties.createdAt,
    })
      .from(properties).where(eq(properties.userId, session.user.id)).orderBy(desc(properties.createdAt)),
    db.select({ propertyId: paymentSubmissions.propertyId, status: paymentSubmissions.status, reviewNote: paymentSubmissions.reviewNote })
      .from(paymentSubmissions).where(eq(paymentSubmissions.userId, session.user.id)).orderBy(desc(paymentSubmissions.createdAt)),
    db.select({ total: sql<string>`coalesce(sum(${walletTransactions.amountDelta}), 0)` })
      .from(walletTransactions).where(eq(walletTransactions.userId, session.user.id)),
  ])

  const latestPayment = new Map<number, { status: string; reviewNote: string | null }>()
  for (const payment of paymentRows) {
    if (!latestPayment.has(payment.propertyId)) latestPayment.set(payment.propertyId, payment)
  }

  const now = Date.now()
  const listings = listingRows.map((listing) => ({
    ...listing,
    isExpired: Boolean(listing.expiresAt && listing.expiresAt.getTime() <= now),
    imageUrl: propertyImageSource(listing.imageUrl),
    paymentStatus: latestPayment.get(listing.id)?.status ?? null,
    reviewNote: latestPayment.get(listing.id)?.reviewNote ?? null,
  }))

  return (
    <AccountDashboard
      account={profileRows[0] ?? { id: session.user.id, name: session.user.name, email: session.user.email, image: session.user.image ?? null }}
      listings={listings}
      walletBalance={Number(balanceRows[0]?.total ?? 0)}
    />
  )
}
