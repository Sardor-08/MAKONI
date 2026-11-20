import type { ReactNode } from 'react'

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-xl font-semibold tracking-tight text-[#193b32] sm:text-2xl">{title}</h2>
      <div className="space-y-3 text-sm leading-7 text-[#53635a] [&_a]:font-semibold [&_a]:text-[#8a642b] [&_a]:underline [&_a]:underline-offset-4 [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  )
}

export function LegalDocument({
  title,
  description,
  updatedAt,
  children,
}: {
  title: string
  description: string
  updatedAt: string
  children: ReactNode
}) {
  return (
    <main className="min-h-screen bg-[#f4f3ee] text-[#193b32]">
      <header className="border-b border-[#e8e4dc] bg-[#fffdfa]">
        <div className="mx-auto flex min-h-20 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <a className="text-lg font-extrabold tracking-[0.18em] text-[#193b32] no-underline" href="/" aria-label="MAKONI bosh sahifasi">
            MAKONI
          </a>
          <a className="inline-flex min-h-10 items-center rounded-full border border-[#d8dfd7] px-4 text-sm font-semibold text-[#395b4b] transition hover:bg-[#eff3ed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a642b]" href="/">
            Bosh sahifaga qaytish
          </a>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
        <article className="rounded-2xl border border-[#e8e4dc] bg-[#fffdfa] px-6 py-8 shadow-[0_18px_55px_rgba(25,59,50,0.06)] sm:px-12 sm:py-12">
          <div className="mb-8 border-b border-[#e8e4dc] pb-8 sm:mb-10 sm:pb-10">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#9a763d]">MAKONI · Huquqiy ma’lumot</p>
            <h1 className="font-serif text-3xl font-medium tracking-tight text-[#193b32] sm:text-5xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#68766e] sm:text-base">{description}</p>
            <p className="mt-5 text-xs font-medium text-[#78837c]">Oxirgi yangilanish: {updatedAt}</p>
          </div>

          <div className="space-y-9 sm:space-y-10">{children}</div>

          <footer className="mt-10 flex flex-col gap-4 border-t border-[#e8e4dc] pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
            <a className="font-semibold text-[#193b32] underline-offset-4 hover:underline" href="mailto:nozimturdiyev78@gmail.com">Savol yoki murojaat uchun bog‘laning</a>
            <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Huquqiy sahifalar">
              <a className="text-[#68766e] underline-offset-4 hover:text-[#193b32] hover:underline" href="/privacy-policy">Maxfiylik siyosati</a>
              <a className="text-[#68766e] underline-offset-4 hover:text-[#193b32] hover:underline" href="/terms-of-service">Foydalanish shartlari</a>
            </nav>
          </footer>
        </article>
        <p className="mx-auto mt-6 max-w-3xl px-2 text-center text-xs leading-6 text-[#78837c]">Ushbu sahifalardagi ma’lumotlar MAKONI platformasidan foydalanish tartibini tushuntiradi. Huquqiy majburiyatlar bo‘yicha mustaqil maslahat olish tavsiya etiladi.</p>
      </div>
    </main>
  )
}
