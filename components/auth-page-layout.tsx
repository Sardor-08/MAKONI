import Image from 'next/image'
import type { ReactNode } from 'react'
import Link from 'next/link'

type AuthPageLayoutProps = {
  children: ReactNode
  mode: 'sign-in' | 'sign-up'
}

const copy = {
  'sign-in': {
    eyebrow: 'MAKONI hamjamiyatiga qayting',
    title: 'Sizga mos manzilga yana bir qadam.',
    description: 'Saqlangan qidiruvlaringiz va e’lonlaringiz endi bir joyda.',
  },
  'sign-up': {
    eyebrow: 'Yangi boshlanish',
    title: 'Yangi manzilingiz shu yerdan boshlanadi.',
    description: 'Akkaunt yarating va o‘zingiz izlagan makonni topishga yaqinlashing.',
  },
} satisfies Record<AuthPageLayoutProps['mode'], { eyebrow: string; title: string; description: string }>

export function AuthPageLayout({ children, mode }: AuthPageLayoutProps) {
  const message = copy[mode]

  return (
    <main className="auth-page">
      <div className="auth-layout">
        <section className="auth-form-panel" aria-label="Akkauntga kirish yoki ro‘yxatdan o‘tish">
          {children}
        </section>
        <aside className="auth-visual" aria-labelledby="auth-visual-title">
          <Image
            alt="Zamonaviy uy-joy me’morchiligi va yashil hovli"
            className="auth-visual-image"
            fill
            priority
            sizes="(max-width: 640px) 100vw, 50vw"
            src="/images/makoni-auth-architecture.png"
          />
          <div className="auth-visual-brand">
            <Link href="/makoni.html">MAKONI</Link>
            <span>UY-JOY TANLOVI</span>
          </div>
          <div className="auth-visual-copy">
            <p className="auth-visual-eyebrow">{message.eyebrow}</p>
            <h2 id="auth-visual-title">{message.title}</h2>
            <p>{message.description}</p>
          </div>
          <p className="auth-visual-note">Sotuv <span aria-hidden="true">·</span> Ijara <span aria-hidden="true">·</span> Yangi imkoniyatlar</p>
        </aside>
      </div>
    </main>
  )
}
