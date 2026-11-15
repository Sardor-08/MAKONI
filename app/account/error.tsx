'use client'

import Link from 'next/link'

export default function AccountError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="account-route-state">
      <section className="account-route-card" role="alert" aria-labelledby="account-error-title">
        <p className="auth-eyebrow">MAKONI SHAXSIY KABINETI</p>
        <h1 id="account-error-title">Kabinet yuklanmadi</h1>
        <p>Ma’lumotlarni olishda vaqtinchalik muammo yuz berdi. Kirish ma’lumotlaringiz saqlangan — qayta urinib ko‘ring.</p>
        <div className="account-route-actions">
          <button onClick={reset} type="button">Qayta urinish</button>
          <Link href="/sign-in">Kirish sahifasiga qaytish</Link>
        </div>
      </section>
    </main>
  )
}
