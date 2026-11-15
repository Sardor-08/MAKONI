export default function AccountLoading() {
  return (
    <main className="account-route-state" aria-busy="true">
      <section className="account-route-card" aria-labelledby="account-loading-title">
        <span className="auth-spinner" aria-hidden="true" />
        <h1 id="account-loading-title">Shaxsiy kabinetingiz ochilmoqda</h1>
        <p role="status" aria-live="polite">Hisobingiz va e’lonlaringiz yuklanmoqda. Iltimos, kuting…</p>
      </section>
    </main>
  )
}
