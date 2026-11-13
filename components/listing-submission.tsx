'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { useSession } from '@/lib/auth-client'

type ListingDraft = {
  title: string
  deal: 'Sotuv' | 'Ijara'
  propertyType: string
  price: number
  rooms: number
  baths: number
  areaM2: number
  region: string
  district: string
  imageUrl: string
}

function ListingForm({ ownerName }: { ownerName: string }) {
  const router = useRouter()
  const [imageUrl, setImageUrl] = useState('')
  const [previewFailed, setPreviewFailed] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const previewIsSafe = imageUrl.startsWith('https://') && !previewFailed

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setPending(true)

    const fields = new FormData(event.currentTarget)
    const draft: ListingDraft = {
      title: String(fields.get('title') ?? '').trim(),
      deal: String(fields.get('deal') ?? 'Sotuv') as ListingDraft['deal'],
      propertyType: String(fields.get('propertyType') ?? ''),
      price: Number(fields.get('price')),
      rooms: Number(fields.get('rooms')),
      baths: Number(fields.get('baths')),
      areaM2: Number(fields.get('areaM2')),
      region: String(fields.get('region') ?? '').trim(),
      district: String(fields.get('district') ?? '').trim(),
      imageUrl: String(fields.get('imageUrl') ?? '').trim(),
    }

    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })

      if (response.status === 401) {
        router.replace('/sign-up?returnTo=%2Flist-property')
        return
      }

      const result = await response.json()
      if (!response.ok || !result.listing?.id) {
        setError(result.error || 'E’lonni saqlab bo‘lmadi. Maydonlarni tekshirib qayta urinib ko‘ring.')
        return
      }

      window.location.assign(`/makoni.html?listing=${encodeURIComponent(String(result.listing.id))}`)
    } catch {
      setError('Server bilan bog‘lanib bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="listing-submit-layout">
      <form className="listing-form-card" onSubmit={handleSubmit}>
        <div className="listing-form-heading">
          <div>
            <p className="listing-kicker">E’lon tafsilotlari</p>
            <h2>Mulkingiz haqida</h2>
          </div>
          <span className="listing-owner">{ownerName}</span>
        </div>

        <div className="listing-form-grid">
          <label className="listing-field listing-field-wide" htmlFor="listing-title">
            E’lon sarlavhasi
            <input id="listing-title" name="title" required minLength={8} maxLength={140} placeholder="Masalan, yorug‘ 3 xonali kvartira" />
          </label>

          <label className="listing-field" htmlFor="listing-deal">
            Bitim turi
            <select id="listing-deal" name="deal" defaultValue="Sotuv" required>
              <option value="Sotuv">Sotuv</option>
              <option value="Ijara">Ijara</option>
            </select>
          </label>

          <label className="listing-field" htmlFor="listing-type">
            Mulk turi
            <select id="listing-type" name="propertyType" defaultValue="Kvartira" required>
              <option value="Kvartira">Kvartira</option>
              <option value="Hovli uy">Hovli uy</option>
              <option value="Villa">Villa</option>
              <option value="Tijorat">Tijorat</option>
              <option value="Yer uchastkasi">Yer uchastkasi</option>
            </select>
          </label>

          <label className="listing-field" htmlFor="listing-price">
            Narxi (so‘m)
            <input id="listing-price" name="price" type="number" min={1} max={100000000000000} step={1} inputMode="numeric" required placeholder="850000000" />
          </label>

          <label className="listing-field" htmlFor="listing-area">
            Maydon (m²)
            <input id="listing-area" name="areaM2" type="number" min={1} max={100000} step={1} inputMode="numeric" required placeholder="96" />
          </label>

          <label className="listing-field" htmlFor="listing-rooms">
            Xonalar soni
            <input id="listing-rooms" name="rooms" type="number" min={0} max={50} step={1} inputMode="numeric" defaultValue={3} required />
          </label>

          <label className="listing-field" htmlFor="listing-baths">
            Hammomlar soni
            <input id="listing-baths" name="baths" type="number" min={0} max={30} step={1} inputMode="numeric" defaultValue={1} required />
          </label>

          <label className="listing-field" htmlFor="listing-region">
            Viloyat / shahar
            <input id="listing-region" name="region" required minLength={2} maxLength={100} placeholder="Toshkent shahri" />
          </label>

          <label className="listing-field" htmlFor="listing-district">
            Tuman / shahar
            <input id="listing-district" name="district" required minLength={2} maxLength={100} placeholder="Yunusobod tumani" />
          </label>

          <label className="listing-field listing-field-wide" htmlFor="listing-image">
            Mulk rasmi (HTTPS havola)
            <input
              id="listing-image"
              name="imageUrl"
              type="url"
              inputMode="url"
              autoComplete="url"
              required
              maxLength={2048}
              pattern="https://.*"
              placeholder="https://…"
              value={imageUrl}
              onChange={(event) => {
                setImageUrl(event.target.value)
                setPreviewFailed(false)
              }}
            />
            <span className="listing-field-hint">Havola xavfsiz HTTPS manzilidan boshlanishi kerak.</span>
          </label>
        </div>

        {error && <p className="listing-error" role="alert">{error}</p>}

        <div className="listing-form-footer">
          <p>Joylashtirish orqali ma’lumotlar to‘g‘riligini tasdiqlaysiz. E’lon akkauntingizga bog‘lanadi.</p>
          <button className="listing-primary listing-submit" disabled={pending} type="submit">
            {pending ? 'Saqlanmoqda…' : 'E’lonni joylash'}
          </button>
        </div>
      </form>

      <aside className="listing-preview-card" aria-label="Rasm va e’lon bo‘yicha yordam">
        <div className="listing-preview-frame">
          {previewIsSafe ? (
            <img
              src={imageUrl}
              alt="E’lon uchun tanlangan mulk rasmi"
              onError={() => setPreviewFailed(true)}
            />
          ) : (
            <div className="listing-preview-empty">
              <span aria-hidden="true">⌂</span>
              <p>Rasm havolasini kiriting</p>
            </div>
          )}
        </div>
        <div className="listing-preview-copy">
          <p className="listing-kicker">Yaxshi e’lon uchun</p>
          <h3>Tabiiy va aniq surat tanlang</h3>
          <p>Surat karta o‘lchamiga moslab kesiladi, cho‘zilmaydi. Yorug‘ va sifatli rasmlar mulkingizni yaxshiroq ko‘rsatadi.</p>
          <ul>
            <li>Haqiqiy mulk suratidan foydalaning</li>
            <li>Sarlavha va hududni aniq yozing</li>
            <li>Narxni so‘mda kiriting</li>
          </ul>
        </div>
      </aside>
    </div>
  )
}

export function ListingSubmission() {
  const { data: session, isPending, error } = useSession()

  if (isPending) {
    return <div className="listing-status" role="status">Akkaunt tekshirilmoqda…</div>
  }

  if (error) {
    return (
      <section className="listing-access" aria-labelledby="listing-access-title">
        <p className="listing-kicker">Akkauntni tekshirish</p>
        <h2 id="listing-access-title">Tizimga ulanish vaqtincha imkonsiz</h2>
        <p>Qayta urinib ko‘ring yoki akkauntingizga kiring.</p>
        <div className="listing-access-actions">
          <Link className="listing-primary" href="/sign-in?returnTo=%2Flist-property">Kirish</Link>
          <Link className="listing-secondary" href="/sign-up?returnTo=%2Flist-property">Ro‘yxatdan o‘tish</Link>
        </div>
      </section>
    )
  }

  if (!session?.user) {
    return (
      <section className="listing-access" aria-labelledby="listing-access-title">
        <p className="listing-kicker">A’zolar uchun</p>
        <h2 id="listing-access-title">E’lon joylash uchun akkaunt kerak</h2>
        <p>Avval ro‘yxatdan o‘ting yoki mavjud akkauntingizga kiring. E’lon sizning hisobingizga biriktiriladi.</p>
        <div className="listing-access-actions">
          <Link className="listing-primary" href="/sign-up?returnTo=%2Flist-property">Ro‘yxatdan o‘tish</Link>
          <Link className="listing-secondary" href="/sign-in?returnTo=%2Flist-property">Akkauntim bor — kirish</Link>
        </div>
      </section>
    )
  }

  return <ListingForm ownerName={session.user.name} />
}
