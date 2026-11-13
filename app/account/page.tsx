import type { Metadata } from 'next'
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { SignOutButton } from '@/components/sign-out-button'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { properties } from '@/lib/db/schema'

export const metadata: Metadata = {
  title: 'Mening e’lonlarim — MAKONI',
  description: 'MAKONI akkauntingizdagi ko‘chmas mulk e’lonlari.',
}

const money = new Intl.NumberFormat('uz-UZ')

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in?returnTo=%2Faccount')

  const listings = await db
    .select()
    .from(properties)
    .where(and(eq(properties.userId, session.user.id), eq(properties.isPublished, true)))
    .orderBy(desc(properties.createdAt))
    .limit(50)

  return (
    <main className="account-page">
      <header className="account-header">
        <a className="auth-brand" href="/makoni.html">MAKONI</a>
        <SignOutButton />
      </header>
      <section className="account-content" aria-labelledby="account-title">
        <p className="auth-eyebrow">Shaxsiy kabinet</p>
        <h1 id="account-title">Salom, {session.user.name}</h1>
        <p className="auth-intro">{session.user.email}</p>
        <div className="account-listings-heading">
          <h2>Mening e’lonlarim</h2>
          <a className="auth-submit account-add" href="/makoni.html?createListing=1">+ E’lon joylash</a>
        </div>
        {listings.length === 0 ? (
          <div className="account-empty">
            <h3>Hozircha e’lon yo‘q</h3>
            <p>Birinchi e’loningizni joylashtiring — u katalogda paydo bo‘ladi.</p>
          </div>
        ) : (
          <div className="account-listings">
            {listings.map((listing) => (
              <article className="account-listing" key={listing.id}>
                <img src={listing.imageUrl} alt="" />
                <div>
                  <h3>{listing.title}</h3>
                  <p>{listing.district}, {listing.region} · {listing.deal}</p>
                </div>
                <strong>{money.format(listing.price)} so‘m</strong>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
