import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { AuthForm } from '@/components/auth-form'
import { AuthPageLayout } from '@/components/auth-page-layout'
import { auth } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Kirish — MAKONI',
  description: 'MAKONI akkauntingizga xavfsiz kiring.',
}

function safeReturnTo(value: string | undefined) {
  return value?.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')
    ? value
    : '/account'
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>
}) {
  const { returnTo } = await searchParams
  const destination = safeReturnTo(returnTo)
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect(destination)

  return (
    <AuthPageLayout mode="sign-in">
      <section className="auth-card" aria-labelledby="auth-title">
        <Link className="auth-brand" href="/makoni.html">MAKONI</Link>
        <p className="auth-eyebrow">Xush kelibsiz</p>
        <h1 id="auth-title">Akkauntga kiring</h1>
        <p className="auth-intro">E’lon joylashtirish va boshqarish uchun tizimga kiring.</p>
        <AuthForm mode="sign-in" returnTo={destination} />
        <Link className="auth-back" href="/makoni.html">← E’lonlarga qaytish</Link>
      </section>
    </AuthPageLayout>
  )
}
