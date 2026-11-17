'use client'

import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import Link from 'next/link'
import { upload } from '@vercel/blob/client'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Camera, Check, ChevronRight, CircleUserRound, Eye, EyeOff, House, LayoutDashboard, ListChecks, Plus, Search, Trash2, UserRound, Wallet } from 'lucide-react'
import { deleteListing, saveProfile, setListingPublished } from '@/app/actions/account'
import { SignOutButton } from '@/components/sign-out-button'

type Listing = {
  id: number
  title: string
  deal: string
  propertyType: string
  price: number
  rooms: number
  baths: number
  areaM2: number
  region: string
  district: string
  imageUrl: string
  isPublished: boolean
  planId: string | null
  expiresAt: Date | null
  isExpired: boolean
  paymentStatus: string | null
  reviewNote: string | null
  createdAt: Date
}

type Account = { id: string; name: string; email: string; image: string | null }
type StatusFilter = 'all' | 'published' | 'hidden'

const money = new Intl.NumberFormat('uz-UZ')
const dateFormat = new Intl.DateTimeFormat('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' })

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase('uz-UZ')).join('') || 'M'
}

function avatarSource(image: string | null, userId: string) {
  if (image?.startsWith(`profiles/${userId}/`)) return `/api/profile-image?path=${encodeURIComponent(image)}`
  return image?.startsWith('https://') ? image : null
}

function DashboardWelcome({ firstName }: { firstName: string }) {
  return (
    <section className="crm-welcome" id="overview" aria-labelledby="crm-title">
      <div className="crm-welcome-copy">
        <p className="crm-eyebrow">SOTUV VA MULK BOSHQARUVI</p>
        <span className="crm-welcome-kicker"><i aria-hidden="true" /> Shaxsiy kabinetingizga xush kelibsiz</span>
        <h1 id="crm-title">Xush kelibsiz, <em>{firstName}</em></h1>
        <p>MAKONI’dagi e’lonlaringiz, mulklaringiz va profilingizni bir joyda boshqaring.</p>
        <div className="crm-welcome-actions">
          <Link className="crm-primary-link" href="/list-property"><Plus aria-hidden="true" /> Yangi e’lon joylash</Link>
          <Link className="crm-quiet-link" href="#listings"><ListChecks aria-hidden="true" /> E’lonlarimga o‘tish</Link>
        </div>
      </div>
      <div className="crm-welcome-art" aria-hidden="true">
        <img src="/images/makoni-hero-courtyard.png" alt="" />
        <div className="crm-welcome-art-shade" />
        <div className="crm-welcome-art-label"><span>MAKONI</span><strong>O‘z makoningiz.</strong></div>
        <span className="crm-welcome-art-seal"><House /> O‘zbekistonda uy topish</span>
      </div>
    </section>
  )
}

function PortfolioPulse({ total, published }: { total: number; published: number }) {
  const activePercent = total ? Math.round((published / total) * 100) : 0

  return (
    <section className="crm-insight-panel" aria-label="E’lonlar portfeli holati">
      <div className="crm-insight-copy">
        <span className="crm-insight-icon"><Eye aria-hidden="true" /></span>
        <div>
          <p className="crm-eyebrow">PORTFEL HOLATI</p>
          <h2>{total ? 'Portfelingiz nazorat ostida' : 'Birinchi makoningizni joylang'}</h2>
          <p>{total ? `${published} ta e’lon ommaga ko‘rinmoqda, ${total - published} tasi yashirilgan.` : 'E’loningizni joylang va uni shaxsiy kabinetingizdan oson boshqaring.'}</p>
        </div>
      </div>
      <div className="crm-insight-progress">
        <div className="crm-insight-progress-label"><span>Faol e’lonlar</span><strong>{published} / {total}</strong></div>
        <div className="crm-progress-bar" role="progressbar" aria-label="Faol e’lonlar ulushi" aria-valuenow={activePercent} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${activePercent}%` }} />
        </div>
        <span className="crm-insight-caption">{total ? `${activePercent}% portfelingiz ommaga ochiq` : 'Birinchi e’loningizni joylashdan boshlang'}</span>
      </div>
      <Link className="crm-insight-link" href={total ? '#listings' : '/list-property'} aria-label={total ? 'E’lonlarimni boshqarish' : 'Birinchi e’lonni joylash'}><ArrowUpRight aria-hidden="true" /></Link>
    </section>
  )
}

export function AccountDashboard({ account, listings, walletBalance }: { account: Account; listings: Listing[]; walletBalance: number }) {
  const router = useRouter()
  const fileInput = useRef<HTMLInputElement>(null)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [name, setName] = useState(account.name)
  const [image, setImage] = useState(account.image)
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [listingMessage, setListingMessage] = useState('')
  const [busyListing, setBusyListing] = useState<number | null>(null)

  const visibleListings = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('uz-UZ')
    return listings.filter((listing) => {
      const isEffectivelyPublished = listing.isPublished && !listing.isExpired
      const matchesStatus = filter === 'all' || (filter === 'published' ? isEffectivelyPublished : !isEffectivelyPublished)
      const matchesSearch = !query || `${listing.title} ${listing.region} ${listing.district} ${listing.propertyType}`.toLocaleLowerCase('uz-UZ').includes(query)
      return matchesStatus && matchesSearch
    })
  }, [filter, listings, search])

  const publishedCount = listings.filter((listing) => listing.isPublished && !listing.isExpired).length
  const hiddenCount = listings.length - publishedCount
  const listedValue = listings.reduce((total, listing) => total + listing.price, 0)
  const avatar = avatarSource(image, account.id)

  async function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavingProfile(true)
    setProfileMessage('')
    setProfileError('')
    try {
      const result = await saveProfile(name, image)
      if (!result.ok) throw new Error(result.error)
      setProfileMessage('Profil ma’lumotlari saqlandi.')
      router.refresh()
    } catch {
      setProfileError('Profilni saqlab bo‘lmadi. Qayta urinib ko‘ring.')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploading(true)
    setProfileMessage('')
    setProfileError('')
    let uploadedPath: string | null = null
    try {
      const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
      const extension = extensions[file.type]
      if (!extension || file.size > 5 * 1024 * 1024) throw new Error('Invalid image')

      const blob = await upload(`profiles/${account.id}/${crypto.randomUUID()}.${extension}`, file, {
        access: 'private',
        handleUploadUrl: '/api/private-uploads',
      })
      uploadedPath = blob.pathname
      const saved = await saveProfile(name, uploadedPath)
      if (!saved.ok) throw new Error('Profile update failed')

      const previousImage = image
      setImage(uploadedPath)
      setProfileMessage('Profil rasmi yangilandi.')
      router.refresh()
      if (previousImage?.startsWith(`profiles/${account.id}/`)) {
        await fetch('/api/private-uploads', {
          method: 'DELETE',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paths: [previousImage] }),
        }).catch(() => undefined)
      }
      uploadedPath = null
    } catch {
      if (uploadedPath) {
        await fetch('/api/private-uploads', {
          method: 'DELETE',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paths: [uploadedPath] }),
        }).catch(() => undefined)
      }
      setProfileError('Rasm yuklanmadi. JPG, PNG yoki WebP formatida 5 MB gacha rasm tanlang.')
    } finally {
      setUploading(false)
    }
  }

  async function handleVisibility(listing: Listing) {
    setBusyListing(listing.id)
    setListingMessage('')
    try {
      const result = await setListingPublished(listing.id, !listing.isPublished)
      if (!result.ok) throw new Error('Update failed')
      setListingMessage(listing.isPublished ? 'E’lon saytdan yashirildi.' : 'E’lon yana saytda ko‘rinadi.')
      router.refresh()
    } catch {
      setListingMessage('E’lon holatini o‘zgartirib bo‘lmadi. Qayta urinib ko‘ring.')
    } finally {
      setBusyListing(null)
    }
  }

  async function handleDelete(listing: Listing) {
    if (!window.confirm(`“${listing.title}” e’lonini butunlay o‘chirmoqchimisiz?`)) return
    setBusyListing(listing.id)
    setListingMessage('')
    try {
      const result = await deleteListing(listing.id)
      if (!result.ok) throw new Error('Delete failed')
      setListingMessage('E’lon o‘chirildi.')
      router.refresh()
    } catch {
      setListingMessage('E’lonni o‘chirib bo‘lmadi. Qayta urinib ko‘ring.')
    } finally {
      setBusyListing(null)
    }
  }

  return (
    <main className="crm-page">
      <aside className="crm-sidebar" aria-label="Shaxsiy kabinet navigatsiyasi">
        <Link className="crm-brand" href="/makoni.html" aria-label="MAKONI bosh sahifasi"><span className="crm-brand-mark">M</span><span>MAKONI</span></Link>
        <p className="crm-nav-label">Kabinet</p>
        <nav className="crm-nav">
          <a className="crm-nav-link is-active" href="#overview"><LayoutDashboard aria-hidden="true" /> Umumiy ko‘rinish</a>
          <a className="crm-nav-link" href="#listings"><ListChecks aria-hidden="true" /> Mening e’lonlarim <span className="crm-nav-count">{listings.length}</span></a>
          <a className="crm-nav-link" href="#profile"><CircleUserRound aria-hidden="true" /> Profil va akkaunt</a>
        </nav>
        <div className="crm-sidebar-bottom">
          <Link className="crm-side-website" href="/makoni.html"><House aria-hidden="true" /> Saytga qaytish <ArrowUpRight aria-hidden="true" /></Link>
          <div className="crm-side-user">
            <span className="crm-avatar crm-avatar-small">
              {avatar ? <img src={avatar} alt="" /> : <span>{initials(account.name)}</span>}
            </span>
            <span className="crm-side-user-copy"><strong>{account.name}</strong><small>Shaxsiy akkaunt</small></span>
            <UserRound aria-hidden="true" />
          </div>
        </div>
      </aside>

      <div className="crm-main">
        <header className="crm-topbar">
          <div className="crm-breadcrumb"><span>MAKONI</span><ChevronRight aria-hidden="true" /><strong>Shaxsiy kabinet</strong></div>
          <div className="crm-top-actions">
            <Link className="crm-view-site" href="/makoni.html"><Eye aria-hidden="true" /> Saytni ko‘rish</Link>
            <span className="crm-top-avatar" aria-label={`${account.name} akkaunti`}>
              {avatar ? <img src={avatar} alt="" /> : <span>{initials(account.name)}</span>}
            </span>
            <SignOutButton />
          </div>
        </header>

        <div className="crm-content">
          <DashboardWelcome firstName={account.name.split(' ')[0]} />

          <section className="crm-stats" aria-label="E’lonlar hisoboti">
            <article className="crm-stat-card"><span className="crm-stat-icon"><ListChecks aria-hidden="true" /></span><div><p>Jami e’lonlar</p><strong>{listings.length}</strong><small>Akkauntingizdagi barcha e’lonlar</small></div></article>
            <article className="crm-stat-card"><span className="crm-stat-icon crm-stat-icon-green"><Eye aria-hidden="true" /></span><div><p>Saytda faol</p><strong>{publishedCount}</strong><small>Ommaviy ro‘yxatda ko‘rinadi</small></div></article>
            <article className="crm-stat-card"><span className="crm-stat-icon crm-stat-icon-muted"><EyeOff aria-hidden="true" /></span><div><p>Yashirilgan</p><strong>{hiddenCount}</strong><small>Faqat sizga ko‘rinadi</small></div></article>
            <article className="crm-stat-card"><span className="crm-stat-icon crm-stat-icon-gold"><House aria-hidden="true" /></span><div><p>Jami e’lon qiymati</p><strong className="crm-stat-value">{money.format(listedValue)}</strong><small>So‘m, barcha e’lonlar bo‘yicha</small></div></article>
            <article className="crm-stat-card"><span className="crm-stat-icon crm-stat-icon-green"><Wallet aria-hidden="true" /></span><div><p>Hisob balansi</p><strong className="crm-stat-value">{money.format(walletBalance)} so‘m</strong><small>Admin tasdiqlagan joriy balans</small></div></article>
          </section>

          <PortfolioPulse total={listings.length} published={publishedCount} />

          <section className="crm-listings-panel" id="listings" aria-labelledby="listings-title">
            <div className="crm-section-heading">
              <div><p className="crm-eyebrow">MA’LUMOTLAR BAZASI</p><h2 id="listings-title">Mening e’lonlarim</h2><p>Har bir e’lon hisobingiz bilan bog‘langan va shu yerda boshqariladi.</p></div>
              <Link className="crm-outline-link" href="/list-property"><Plus aria-hidden="true" /> E’lon qo‘shish</Link>
            </div>
            <div className="crm-listing-toolbar">
              <label className="crm-search"><Search aria-hidden="true" /><span className="sr-only">E’lonlardan qidirish</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom yoki hudud bo‘yicha qidirish" /></label>
              <div className="crm-filter-group" role="group" aria-label="E’lon holati bo‘yicha saralash">
                {([['all', `Barchasi (${listings.length})`], ['published', `Faol (${publishedCount})`], ['hidden', `Yashirilgan (${hiddenCount})`]] as const).map(([value, label]) => <button className={filter === value ? 'crm-filter is-selected' : 'crm-filter'} key={value} onClick={() => setFilter(value)} type="button">{label}</button>)}
              </div>
            </div>
            {listingMessage && <p className="crm-feedback" role="status">{listingMessage}</p>}
            {visibleListings.length === 0 ? (
              <div className="crm-empty-state">
                <span className="crm-empty-icon"><House aria-hidden="true" /></span>
                <h3>{listings.length === 0 ? 'Hozircha e’lonlaringiz yo‘q' : 'Mos e’lon topilmadi'}</h3>
                <p>{listings.length === 0 ? 'Birinchi e’loningizni joylang — u shu yerda va sayt katalogida ko‘rinadi.' : 'Qidiruv so‘zini yoki holat filtrini o‘zgartirib ko‘ring.'}</p>
                {listings.length === 0 && <Link className="crm-primary-link" href="/list-property"><Plus aria-hidden="true" /> Birinchi e’lonni joylash</Link>}
              </div>
            ) : (
              <div className="crm-listing-list">
                {visibleListings.map((listing) => (
                  <article className="crm-listing-row" key={listing.id}>
                    <img className="crm-listing-image" src={listing.imageUrl} alt={`${listing.title} mulk rasmi`} />
                    <div className="crm-listing-info">
                      <div className="crm-listing-title-line"><h3>{listing.title}</h3><span className={listing.isExpired ? 'crm-status is-rejected' : listing.isPublished ? 'crm-status is-published' : listing.paymentStatus === 'pending' ? 'crm-status is-pending' : listing.paymentStatus === 'rejected' ? 'crm-status is-rejected' : 'crm-status is-hidden'}><i aria-hidden="true" />{listing.isExpired ? 'Muddati tugagan' : listing.isPublished ? 'Saytda faol' : listing.paymentStatus === 'pending' ? 'To‘lov tekshirilmoqda' : listing.paymentStatus === 'rejected' ? 'To‘lov rad etildi' : 'Yashirin'}</span></div>
                      <p>{listing.propertyType} <span aria-hidden="true">·</span> {listing.deal} <span aria-hidden="true">·</span> {listing.region}, {listing.district}</p>
                      <div className="crm-listing-meta"><span>{listing.rooms} xona</span><span>{money.format(listing.areaM2)} m²</span><span>{dateFormat.format(new Date(listing.createdAt))}</span>{listing.expiresAt && <span>Amal qiladi: {dateFormat.format(new Date(listing.expiresAt))}</span>}</div>{listing.paymentStatus === 'rejected' && listing.reviewNote && <p className="crm-payment-note">Admin izohi: {listing.reviewNote}</p>}
                    </div>
                    <strong className="crm-listing-price">{money.format(listing.price)} <small>so‘m</small></strong>
                    <div className="crm-listing-actions">
                      {listing.isExpired ? <Link className="crm-payment-link" href="/list-property">Yangi tarif</Link> : !listing.isPublished && listing.paymentStatus === 'pending' ? <Link className="crm-payment-link" href={`/list-property?property=${listing.id}`}>Telegram xabari</Link> : !listing.isPublished && <Link className="crm-payment-link" href={`/list-property?property=${listing.id}`}>{listing.paymentStatus === 'rejected' ? 'Qayta yuborish' : 'To‘lov'}</Link>}
                      {!listing.isExpired && <button className="crm-icon-action" disabled={busyListing === listing.id} onClick={() => void handleVisibility(listing)} type="button" aria-label={listing.isPublished ? 'E’lonni saytdan yashirish' : 'E’lonni saytga chiqarish'} title={listing.isPublished ? 'Yashirish' : 'Saytga chiqarish'}>
                        {listing.isPublished ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                      </button>}
                      <button className="crm-icon-action is-danger" disabled={busyListing === listing.id} onClick={() => void handleDelete(listing)} type="button" aria-label="E’lonni o‘chirish" title="O‘chirish"><Trash2 aria-hidden="true" /></button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="crm-profile-panel" id="profile" aria-labelledby="profile-title">
            <div className="crm-section-heading crm-profile-heading"><div><p className="crm-eyebrow">SHAXSIY MA’LUMOTLAR</p><h2 id="profile-title">Profil va akkaunt</h2><p>Profilingizni yangilang. Email manzili login uchun ishlatiladi.</p></div><span className="crm-secure-label"><Check aria-hidden="true" /> Himoyalangan akkaunt</span></div>
            <form className="crm-profile-form" onSubmit={handleProfileSave}>
              <div className="crm-profile-photo">
                <span className="crm-avatar crm-avatar-large">{avatar ? <img src={avatar} alt={`${account.name} profil rasmi`} /> : <span>{initials(account.name)}</span>}</span>
                <div><strong>Profil rasmi</strong><p>JPG, PNG yoki WebP · 5 MB gacha</p><button className="crm-photo-button" disabled={uploading} onClick={() => fileInput.current?.click()} type="button"><Camera aria-hidden="true" />{uploading ? 'Yuklanmoqda…' : 'Rasmni almashtirish'}</button><input ref={fileInput} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} aria-label="Profil uchun rasm tanlash" /></div>
              </div>
              <div className="crm-profile-fields">
                <label className="crm-field">Ism va familiya<input autoComplete="name" maxLength={80} minLength={2} required value={name} onChange={(event) => setName(event.target.value)} /></label>
                <label className="crm-field">Email manzili<input type="email" value={account.email} readOnly aria-readonly="true" /></label>
                {profileError && <p className="crm-form-error" role="alert">{profileError}</p>}
                {profileMessage && <p className="crm-form-success" role="status">{profileMessage}</p>}
                <div className="crm-profile-submit"><span>O‘zgarishlar Neon bazasida saqlanadi.</span><button className="crm-primary-button" disabled={savingProfile || uploading} type="submit">{savingProfile ? 'Saqlanmoqda…' : 'O‘zgarishlarni saqlash'}</button></div>
              </div>
            </form>
          </section>
          <footer className="crm-footer"><span>© {new Date().getFullYear()} MAKONI</span><span>Shaxsiy ma’lumotlaringiz xavfsiz saqlanadi</span></footer>
        </div>
      </div>
    </main>
  )
}
