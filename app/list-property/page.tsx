import type { Metadata } from 'next'
import Link from 'next/link'
import { ListingSubmission } from '@/components/listing-submission'

export const metadata: Metadata = {
  title: 'E’lon joylash — MAKONI',
  description: 'Ko‘chmas mulkingiz haqida ma’lumot kiriting va e’lonni MAKONI’da joylashtiring.',
}

export default function ListPropertyPage() {
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
            <p>Ma’lumotlarni kiriting. Joylashtirilgan e’loningiz ommaviy ro‘yxatda ko‘rinadi va akkauntingiz bilan bog‘lanadi.</p>
          </div>
          <span className="listing-step">01 <span>/</span> 01</span>
        </div>

        <ListingSubmission />
      </section>
    </main>
  )
}
