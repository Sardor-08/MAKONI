import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { AuthForm } from '@/components/auth-form'
import { AuthPageLayout } from '@/components/auth-page-layout'
import { auth } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Ro‘yxatdan o‘tish — MAKONI',
  description: 'MAKONI’da akkaunt yarating va e’lonlaringizni boshqaring.',
}

function safeReturnTo(value: string | undefined) {
  return value?.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')
    ? value
    : '/account'
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>
}) {
  const { returnTo } = await searchParams
  const destination = safeReturnTo(returnTo)
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect(destination)

  return (
    <AuthPageLayout mode="sign-up">
      <section className="auth-card" aria-labelledby="auth-title">
        <Link className="auth-brand" href="/makoni.html">MAKONI</Link>
        <p className="auth-eyebrow">Yangi hisob</p>
        <h1 id="auth-title">Akkaunt yarating</h1>
        <p className="auth-intro">E’lonlarni joylashtirish uchun ro‘yxatdan o‘ting.</p>
        <AuthForm mode="sign-up" returnTo={destination} />
        <Link className="auth-back" href="/makoni.html">← E’lonlarga qaytish</Link>
      </section>
    </AuthPageLayout>
  )
}
