import type { Metadata } from 'next'
import Link from 'next/link'
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { ListingSubmission } from '@/components/listing-submission'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { listingPlans, paymentSettings, paymentSubmissions, properties } from '@/lib/db/schema'

export const metadata: Metadata = {
  title: 'E’lon joylash — MAKONI',
  description: 'Tarifni tanlang, ko‘chmas mulkingiz rasmlarini yuklang va e’lonni xavfsiz joylashtiring.',
}

export const dynamic = 'force-dynamic'

type PageProps = { searchParams: Promise<{ property?: string }> }

export default async function ListPropertyPage({ searchParams }: PageProps) {
  const [params, session, plans, settings] = await Promise.all([
    searchParams,
    auth.api.getSession({ headers: await headers() }),
    db.select().from(listingPlans).orderBy(listingPlans.displayOrder),
    db.select({ bankName: paymentSettings.bankName, cardNumber: paymentSettings.cardNumber, cardHolder: paymentSettings.cardHolder, instructions: paymentSettings.instructions })
      .from(paymentSettings).where(eq(paymentSettings.id, 1)).limit(1),
  ])

  const parsedPropertyId = Number(params.property)
  let resumeListing: { id: number; title: string; planId: string; paymentStatus: string | null; reviewNote: string | null } | null = null
  if (session?.user && Number.isSafeInteger(parsedPropertyId) && parsedPropertyId > 0) {
    const [listing] = await db.select({ id: properties.id, title: properties.title, planId: properties.planId })
      .from(properties)
      .where(and(eq(properties.id, parsedPropertyId), eq(properties.userId, session.user.id), eq(properties.isPublished, false)))
      .limit(1)
    if (listing?.planId) {
      const [latestSubmission] = await db.select({ status: paymentSubmissions.status, reviewNote: paymentSubmissions.reviewNote })
        .from(paymentSubmissions)
        .where(and(eq(paymentSubmissions.propertyId, listing.id), eq(paymentSubmissions.userId, session.user.id)))
        .orderBy(desc(paymentSubmissions.createdAt))
        .limit(1)
      resumeListing = {
        id: listing.id,
        title: listing.title,
        planId: listing.planId,
        paymentStatus: latestSubmission?.status ?? null,
        reviewNote: latestSubmission?.reviewNote ?? null,
      }
    }
  }

  return (
    <main className="listing-page">
      <header className="listing-page-header">
        <Link className="listing-page-brand" href="/makoni.html">MAKONI</Link>
        <Link className="listing-page-back" href="/makoni.html#listings">← E’lonlarga qaytish</Link>
      </header>

      <section className="listing-page-content" aria-labelledby="listing-page-title">
        <div className="listing-page-heading">
          <div>
            <p className="listing-kicker">MAKONI’da e’lon</p>
            <h1 id="listing-page-title">Mulkingizni yangi egasiga toping</h1>
            <p>E’lon tafsilotlari, xavfsiz surat yuklash va qo‘lda to‘lov tekshiruvi bir qulay jarayonda.</p>
          </div>
          <span className="listing-step">01 <span>/</span> 02</span>
        </div>

        <ListingSubmission
          plans={plans}
          paymentSettings={settings[0] ?? { bankName: '', cardNumber: '', cardHolder: '', instructions: '' }}
          resumeListing={resumeListing}
          userId={session?.user.id ?? null}
        />
      </section>
    </main>
  )
}
