import type { Metadata } from 'next'
import { desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AccountDashboard } from '@/components/account-dashboard'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { properties, user } from '@/lib/db/schema'

export const metadata: Metadata = {
  title: 'Shaxsiy kabinet — MAKONI',
  description: 'MAKONI akkauntingiz, profil ma’lumotlari va ko‘chmas mulk e’lonlarini boshqaring.',
}

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in?returnTo=%2Faccount')

  const [profile] = await db
    .select({ id: user.id, name: user.name, email: user.email, image: user.image })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  const listings = await db
    .select()
    .from(properties)
    .where(eq(properties.userId, session.user.id))
    .orderBy(desc(properties.createdAt))

  return (
    <AccountDashboard
      account={profile ?? { id: session.user.id, name: session.user.name, email: session.user.email, image: session.user.image ?? null }}
      listings={listings}
    />
  )
}
