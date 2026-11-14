import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthPageLayout } from '@/components/auth-page-layout'
import { PasswordRecoveryForm } from '@/components/password-recovery-form'

export const metadata: Metadata = {
  title: 'Parolni tiklash — MAKONI',
  description: 'MAKONI akkauntingiz parolini xavfsiz tiklang.',
}

export default function ForgotPasswordPage() {
  return (
    <AuthPageLayout mode="sign-in">
      <section className="auth-card" aria-labelledby="auth-title">
        <Link className="auth-brand" href="/makoni.html">MAKONI</Link>
        <p className="auth-eyebrow">Akkaunt xavfsizligi</p>
        <h1 id="auth-title">Parolni tiklash</h1>
        <p className="auth-intro">Email manzilingizni kiriting. Tiklash havolasini yuboramiz.</p>
        <PasswordRecoveryForm mode="request" />
        <Link className="auth-back" href="/makoni.html">← E’lonlarga qaytish</Link>
      </section>
    </AuthPageLayout>
  )
}
