import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthPageLayout } from '@/components/auth-page-layout'
import { PasswordRecoveryForm } from '@/components/password-recovery-form'

export const metadata: Metadata = {
  title: 'Yangi parol — MAKONI',
  description: 'MAKONI akkauntingiz uchun yangi parol o‘rnating.',
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  return (
    <AuthPageLayout mode="sign-in">
      <section className="auth-card" aria-labelledby="auth-title">
        <Link className="auth-brand" href="/makoni.html">MAKONI</Link>
        <p className="auth-eyebrow">Akkaunt xavfsizligi</p>
        <h1 id="auth-title">Yangi parol o‘rnating</h1>
        <p className="auth-intro">Yangi parolingiz kamida 8 ta belgidan iborat bo‘lsin.</p>
        <PasswordRecoveryForm mode="reset" token={token} />
        <Link className="auth-back" href="/makoni.html">← E’lonlarga qaytish</Link>
      </section>
    </AuthPageLayout>
  )
}
