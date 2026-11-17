'use client'

import { useState, useTransition, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Activity, ArrowDownRight, ArrowUpRight, BadgeCheck, Building2, Check, ChevronRight, Clock3, CreditCard, Eye, EyeOff, FileCheck2, FileText, Home, LayoutDashboard, ListChecks, Save, Settings2, ShieldCheck, Wallet, X } from 'lucide-react'
import { reviewPaymentSubmission, setAdminListingVisibility, setUserBalance, updateListingPlan, updatePaymentSettings } from '@/app/actions/admin'
import { SignOutButton } from '@/components/sign-out-button'

type Plan = { id: string; name: string; description: string; price: number; durationDays: number; maxPhotos: number; premium: boolean; featured: boolean; isActive: boolean; displayOrder: number }
type Settings = { id: number; bankName: string; cardNumber: string; cardHolder: string; telegramUsername: string; instructions: string; updatedBy: string | null; updatedAt: Date }
type Payment = { id: string; userId: string; propertyId: number; planId: string; amount: number; payerName: string; payerPhone: string; reference: string | null; receiptPath: string; status: string; reviewNote: string | null; createdAt: Date; propertyTitle: string; region: string; district: string; ownerName: string | null; ownerEmail: string | null }
type Listing = { id: number; title: string; region: string; district: string; price: number; planId: string | null; isPublished: boolean; expiresAt: Date | null; createdAt: Date; ownerName: string | null; ownerEmail: string | null }
type Audit = { id: string; actorUserId: string | null; action: string; subjectType: string; subjectId: string | null; metadata: Record<string, unknown>; createdAt: Date; actorEmail: string | null }
type BalanceChange = { id: string; userId: string; amountDelta: number; balanceAfter: number; note: string; createdAt: Date; userName: string | null; userEmail: string | null }
type Props = { admin: { name: string; email: string }; plans: Plan[]; settings: Settings; payments: Payment[]; listings: Listing[]; audits: Audit[]; balanceChanges: BalanceChange[]; stats: { pendingPayments: number; activeListings: number; totalListings: number } }
type Tab = 'overview' | 'payments' | 'listings' | 'plans' | 'settings' | 'balance' | 'audit'

const money = new Intl.NumberFormat('uz-UZ')
const dateFormat = new Intl.DateTimeFormat('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const nav: { id: Tab; title: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', title: 'Umumiy', icon: LayoutDashboard },
  { id: 'payments', title: 'To‘lov arizalari', icon: FileCheck2 },
  { id: 'listings', title: 'E’lonlar', icon: Building2 },
  { id: 'plans', title: 'Tariflar', icon: ListChecks },
  { id: 'settings', title: 'To‘lov sozlamalari', icon: CreditCard },
  { id: 'balance', title: 'Foydalanuvchi balansi', icon: Wallet },
  { id: 'audit', title: 'Xavfsizlik jurnali', icon: Activity },
]

function StatusPill({ status }: { status: string }) {
  const label = status === 'pending' ? 'Tekshirilmoqda' : status === 'approved' ? 'Tasdiqlangan' : 'Rad etilgan'
  return <span className={`admin-status admin-status-${status}`}><i aria-hidden="true" />{label}</span>
}

function ListingStatus({ listing }: { listing: Listing }) {
  const expired = Boolean(listing.expiresAt && new Date(listing.expiresAt).getTime() <= Date.now())
  const active = listing.isPublished && !expired
  return <span className={active ? 'admin-status admin-status-approved' : expired ? 'admin-status admin-status-rejected' : 'admin-status admin-status-pending'}><i aria-hidden="true" />{active ? 'Faol' : expired ? 'Muddati tugagan' : 'Yashirin'}</span>
}

function StatCard({ label, value, caption, icon: Icon, tone }: { label: string; value: string; caption: string; icon: typeof LayoutDashboard; tone: string }) {
  return <article className="admin-stat-card"><span className={`admin-stat-icon ${tone}`}><Icon aria-hidden="true" /></span><div><p>{label}</p><strong>{value}</strong><small>{caption}</small></div></article>
}

export function AdminDashboard({ admin, plans, settings, payments, listings, audits, balanceChanges, stats }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | number | null>(null)
  const [isPending, startTransition] = useTransition()
  const pendingPayments = payments.filter((payment) => payment.status === 'pending')
  const recentPayments = payments.slice(0, 6)

  function showResult(ok: boolean, text: string) {
    setError(ok ? '' : text)
    setMessage(ok ? text : '')
    if (ok) router.refresh()
  }

  async function handlePlanSave(event: FormEvent<HTMLFormElement>, plan: Plan) {
    event.preventDefault()
    setBusyId(plan.id)
    setMessage('')
    setError('')
    const fields = new FormData(event.currentTarget)
    try {
      const result = await updateListingPlan({
        id: plan.id,
        name: String(fields.get('name') ?? ''),
        description: String(fields.get('description') ?? ''),
        price: Number(fields.get('price')),
        durationDays: Number(fields.get('durationDays')),
        maxPhotos: Number(fields.get('maxPhotos')),
        displayOrder: Number(fields.get('displayOrder')),
        premium: fields.get('premium') === 'on',
        featured: fields.get('featured') === 'on',
        isActive: fields.get('isActive') === 'on',
      })
      showResult(result.ok, result.ok ? 'Tarif saqlandi.' : result.error ?? 'Tarifni saqlab bo‘lmadi.')
    } catch {
      setError('Tarifni saqlab bo‘lmadi. Qayta urinib ko‘ring.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleSettingsSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusyId('settings')
    setMessage('')
    setError('')
    const fields = new FormData(event.currentTarget)
    try {
      const result = await updatePaymentSettings({
        bankName: fields.get('bankName'),
        cardNumber: fields.get('cardNumber'),
        cardHolder: fields.get('cardHolder'),
        telegramUsername: fields.get('telegramUsername'),
        instructions: fields.get('instructions'),
      })
      showResult(result.ok, result.ok ? 'To‘lov ma’lumotlari saqlandi.' : result.error ?? 'To‘lov sozlamalarini saqlab bo‘lmadi.')
    } catch {
      setError('To‘lov sozlamalarini saqlab bo‘lmadi. Qayta urinib ko‘ring.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleBalanceSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusyId('balance')
    setMessage('')
    setError('')
    const fields = new FormData(event.currentTarget)
    try {
      const result = await setUserBalance({
        email: String(fields.get('email') ?? ''),
        targetBalance: Number(fields.get('targetBalance')),
        note: String(fields.get('note') ?? ''),
      })
      showResult(result.ok, result.ok ? 'Foydalanuvchi balansi yangilandi va tarixga yozildi.' : result.error ?? 'Balansni yangilab bo‘lmadi.')
    } catch {
      setError('Balansni yangilab bo‘lmadi. Qayta urinib ko‘ring.')
    } finally {
      setBusyId(null)
    }
  }

  function handleReview(payment: Payment, decision: 'approved' | 'rejected') {
    setBusyId(payment.id)
    setMessage('')
    setError('')
    startTransition(async () => {
      try {
        const result = await reviewPaymentSubmission(payment.id, decision, reviewNotes[payment.id] ?? '')
        showResult(result.ok, result.ok ? (decision === 'approved' ? 'To‘lov tasdiqlandi, e’lon faollashtirildi.' : 'To‘lov rad etildi.') : result.error ?? 'Arizani ko‘rib chiqib bo‘lmadi.')
      } catch {
        setError('Arizani ko‘rib chiqib bo‘lmadi. Qayta urinib ko‘ring.')
      } finally {
        setBusyId(null)
      }
    })
  }

  function handleVisibility(listing: Listing) {
    setBusyId(listing.id)
    setMessage('')
    setError('')
    startTransition(async () => {
      try {
        const result = await setAdminListingVisibility(listing.id, !listing.isPublished)
        showResult(result.ok, result.ok ? 'E’lon holati yangilandi.' : result.error ?? 'E’lon holatini yangilab bo‘lmadi.')
      } catch {
        setError('E’lon holatini yangilab bo‘lmadi.')
      } finally {
        setBusyId(null)
      }
    })
  }

  const visiblePayments = tab === 'overview' ? recentPayments : payments

  return (
    <main className="admin-page">
      <aside className="admin-sidebar" aria-label="Admin navigatsiyasi">
        <Link className="admin-brand" href="/makoni.html"><span className="admin-brand-mark">M</span><span>MAKONI <small>ADMIN</small></span></Link>
        <p className="admin-nav-label">ISH MAYDONI</p>
        <nav className="admin-nav">
          {nav.map(({ id, title, icon: Icon }) => <button className={tab === id ? 'admin-nav-link is-active' : 'admin-nav-link'} key={id} onClick={() => setTab(id)} type="button" aria-current={tab === id ? 'page' : undefined}><Icon aria-hidden="true" />{title}{id === 'payments' && stats.pendingPayments > 0 && <span className="admin-nav-count">{stats.pendingPayments}</span>}</button>)}
        </nav>
        <div className="admin-sidebar-bottom">
          <div className="admin-secure-card"><ShieldCheck aria-hidden="true" /><div><strong>Yagona admin</strong><small>Email bo‘yicha himoyalangan</small></div></div>
          <div className="admin-profile"><span>{admin.name.trim().charAt(0).toLocaleUpperCase('uz-UZ') || 'A'}</span><div><strong>{admin.name}</strong><small>{admin.email}</small></div></div>
          <SignOutButton />
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb"><span>MAKONI</span><ChevronRight aria-hidden="true" /><strong>{nav.find((item) => item.id === tab)?.title}</strong></div>
          <div className="admin-top-actions"><span className="admin-live"><i aria-hidden="true" /> Boshqaruv xavfsiz</span><Link href="/makoni.html" className="admin-view-site"><Home aria-hidden="true" /> Saytni ko‘rish</Link></div>
        </header>

        <div className="admin-content">
          <div className="admin-page-heading"><div><p className="admin-eyebrow">MAKONI · BOSHQARUV</p><h1>{tab === 'overview' ? 'Xush kelibsiz, ' : ''}{tab === 'overview' && <em>{admin.name.split(' ')[0]}</em>}{tab !== 'overview' && nav.find((item) => item.id === tab)?.title}</h1><p>{tab === 'overview' ? 'E’lonlar, tariflar va to‘lov jarayonini yagona xavfsiz paneldan boshqaring.' : 'O‘zgarishlar audit jurnaliga yoziladi va faqat admin akkaunti orqali bajariladi.'}</p></div><span className="admin-date-pill"><ShieldCheck aria-hidden="true" /> Admin rejimi</span></div>

          {(message || error) && <p className={error ? 'admin-feedback is-error' : 'admin-feedback'} role={error ? 'alert' : 'status'}>{error || message}</p>}

          {(tab === 'overview' || tab === 'payments') && (
            <>
              <section className="admin-stats" aria-label="Platforma ko‘rsatkichlari">
                <StatCard label="Ko‘rib chiqish kerak" value={money.format(stats.pendingPayments)} caption="Kutilayotgan to‘lov arizalari" icon={Clock3} tone="tone-gold" />
                <StatCard label="Faol e’lonlar" value={money.format(stats.activeListings)} caption="Hozir MAKONI’da ko‘rinadi" icon={Building2} tone="tone-green" />
                <StatCard label="Jami e’lonlar" value={money.format(stats.totalListings)} caption="Yashirin va faol e’lonlar" icon={FileText} tone="tone-blue" />
                <StatCard label="Tariflar" value={money.format(plans.filter((plan) => plan.isActive).length)} caption="Mijozlar uchun faol" icon={ListChecks} tone="tone-violet" />
              </section>
              <section className="admin-panel">
                <div className="admin-panel-heading"><div><p className="admin-eyebrow">{tab === 'overview' ? 'NAVBATDAGI ISHLAR' : 'TO‘LOV ARIZALARI'}</p><h2>{tab === 'overview' ? 'Yaqinda kelgan arizalar' : 'Barcha to‘lov arizalari'}</h2><p>Cheklar private Blob’da saqlanadi va bu oynani faqat admin ko‘ra oladi.</p></div>{tab === 'overview' && <button className="admin-text-link" onClick={() => setTab('payments')} type="button">Barchasini ko‘rish <ArrowUpRight aria-hidden="true" /></button>}</div>
                {visiblePayments.length === 0 ? <div className="admin-empty"><FileCheck2 aria-hidden="true" /><strong>To‘lov arizalari yo‘q</strong><span>Yangi arizalar shu yerda ko‘rinadi.</span></div> : <div className="admin-payment-list">{visiblePayments.map((payment) => (
                  <article className="admin-payment-row" key={payment.id}>
                    <div className="admin-payment-main"><div className="admin-payment-title"><div><h3>{payment.propertyTitle}</h3><p>{payment.region}, {payment.district} <span>·</span> {payment.ownerName || 'Mijoz'} ({payment.ownerEmail || 'email mavjud emas'})</p></div><StatusPill status={payment.status} /></div><div className="admin-payment-facts"><span><strong>{money.format(payment.amount)} so‘m</strong><small>Tarif: {plans.find((plan) => plan.id === payment.planId)?.name || payment.planId}</small></span><span><strong>{payment.payerName}</strong><small>{payment.payerPhone}</small></span><span><strong>{dateFormat.format(new Date(payment.createdAt))}</strong><small>{payment.reference ? `ID: ${payment.reference}` : 'Tranzaksiya ID berilmagan'}</small></span></div></div>
                    <div className="admin-receipt"><a href={`/api/payment-receipts?path=${encodeURIComponent(payment.receiptPath)}`} target="_blank" rel="noreferrer" aria-label={`${payment.propertyTitle} uchun to‘lov chekini ko‘rish`}><img src={`/api/payment-receipts?path=${encodeURIComponent(payment.receiptPath)}`} alt="To‘lov cheki" loading="lazy" /><span><Eye aria-hidden="true" /> Chekni ko‘rish</span></a></div>
                    {payment.status === 'pending' ? <div className="admin-review-controls"><label className="sr-only" htmlFor={`review-note-${payment.id}`}>Ariza uchun izoh</label><input id={`review-note-${payment.id}`} value={reviewNotes[payment.id] ?? ''} onChange={(event) => setReviewNotes((current) => ({ ...current, [payment.id]: event.target.value }))} maxLength={500} placeholder="Izoh (ixtiyoriy)" /><button className="admin-approve" disabled={isPending || busyId === payment.id} onClick={() => handleReview(payment, 'approved')} type="button"><Check aria-hidden="true" /> Tasdiqlash</button><button className="admin-reject" disabled={isPending || busyId === payment.id} onClick={() => handleReview(payment, 'rejected')} type="button"><X aria-hidden="true" /> Rad etish</button></div> : payment.reviewNote && <p className="admin-review-note">Admin izohi: {payment.reviewNote}</p>}
                  </article>
                ))}</div>}
              </section>
            </>
          )}

          {tab === 'listings' && <section className="admin-panel"><div className="admin-panel-heading"><div><p className="admin-eyebrow">KATALOG NAZORATI</p><h2>E’lonlarni boshqarish</h2><p>Har bir holat o‘zgarishi audit jurnalida qayd etiladi.</p></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>E’lon</th><th>Egasi</th><th>Narx</th><th>Tarif</th><th>Holat</th><th>Amal</th></tr></thead><tbody>{listings.map((listing) => <tr key={listing.id}><td><strong>{listing.title}</strong><small>{listing.region}, {listing.district} · {dateFormat.format(new Date(listing.createdAt))}</small></td><td>{listing.ownerName || '—'}<small>{listing.ownerEmail || ''}</small></td><td>{money.format(listing.price)} so‘m</td><td>{plans.find((plan) => plan.id === listing.planId)?.name || listing.planId || '—'}<small>{listing.expiresAt ? `Gacha ${new Intl.DateTimeFormat('uz-UZ', { dateStyle: 'medium' }).format(new Date(listing.expiresAt))}` : 'Muddat belgilanmagan'}</small></td><td><ListingStatus listing={listing} /></td><td><button className="admin-table-action" disabled={isPending || busyId === listing.id} onClick={() => handleVisibility(listing)} type="button" aria-label={listing.isPublished ? 'E’lonni yashirish' : 'E’lonni faollashtirish'}>{listing.isPublished ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}{listing.isPublished ? 'Yashirish' : 'Faollashtirish'}</button></td></tr>)}</tbody></table>{listings.length === 0 && <div className="admin-empty"><Building2 aria-hidden="true" /><strong>E’lonlar hali yo‘q</strong></div>}</div></section>}

          {tab === 'plans' && <section className="admin-plan-grid" aria-label="Tarif sozlamalari">{plans.map((plan) => <article className="admin-plan-card" key={plan.id}><div className="admin-plan-card-head"><span className={plan.isActive ? 'admin-plan-active' : 'admin-plan-inactive'}><i aria-hidden="true" />{plan.isActive ? 'Faol' : 'O‘chirilgan'}</span><strong>{plan.id}</strong></div><form onSubmit={(event) => void handlePlanSave(event, plan)}><label>Tarif nomi<input name="name" defaultValue={plan.name} required maxLength={80} /></label><label>Tavsif<textarea name="description" defaultValue={plan.description} required maxLength={300} rows={2} /></label><div className="admin-form-row"><label>Narxi (so‘m)<input name="price" type="number" min={0} max={1000000000} step={1000} defaultValue={plan.price} required /></label><label>Muddati (kun)<input name="durationDays" type="number" min={1} max={365} defaultValue={plan.durationDays} required /></label></div><div className="admin-form-row"><label>Rasm limiti<input name="maxPhotos" type="number" min={1} max={12} defaultValue={plan.maxPhotos} required /></label><label>Tartib raqami<input name="displayOrder" type="number" min={0} max={1000} defaultValue={plan.displayOrder} required /></label></div><div className="admin-check-options"><label><input type="checkbox" name="premium" defaultChecked={plan.premium} /> Premium ko‘rinish</label><label><input type="checkbox" name="featured" defaultChecked={plan.featured} /> Tavsiya etilgan</label><label><input type="checkbox" name="isActive" defaultChecked={plan.isActive} /> Sotuvda faol</label></div><button className="admin-save-button" disabled={busyId === plan.id}><Save aria-hidden="true" />{busyId === plan.id ? 'Saqlanmoqda…' : 'Tarifni saqlash'}</button></form></article>)}</section>}

          {tab === 'settings' && <section className="admin-panel admin-settings-panel"><div className="admin-panel-heading"><div><p className="admin-eyebrow">MANUAL TO‘LOV</p><h2>Karta va yo‘riqnoma</h2><p>Bu ma’lumotlar e’lon joylayotgan mijozlarga ko‘rsatiladi. O‘zgarishlar auditda qayd etiladi.</p></div><span className="admin-security-tag"><ShieldCheck aria-hidden="true" /> Faqat admin tahrirlaydi</span></div><form className="admin-settings-form" onSubmit={(event) => void handleSettingsSave(event)}><label>Bank nomi<input name="bankName" defaultValue={settings.bankName} maxLength={120} placeholder="Masalan, Xalq banki" /></label><label>Karta raqami<input name="cardNumber" inputMode="numeric" autoComplete="off" defaultValue={settings.cardNumber} maxLength={23} placeholder="0000 0000 0000 0000" /><small>16 raqam, bo‘sh joy bilan yozish mumkin.</small></label><label>Karta egasi<input name="cardHolder" defaultValue={settings.cardHolder} maxLength={120} placeholder="Ism Familiya" /></label><label>Telegram username<input name="telegramUsername" defaultValue={settings.telegramUsername ? `@${settings.telegramUsername}` : ''} maxLength={33} autoComplete="off" placeholder="@makoni_admin" /><small>To‘lov xabari yuboriladigan admin akkaunti.</small></label><label className="admin-settings-wide">To‘lov bo‘yicha ko‘rsatma<textarea name="instructions" defaultValue={settings.instructions} maxLength={1000} rows={4} placeholder="To‘lov izohida e’lon ID raqamini ko‘rsating…" /></label><div className="admin-settings-footer"><span>Yangilangan: {dateFormat.format(new Date(settings.updatedAt))}</span><button className="admin-save-button" disabled={busyId === 'settings'}><Save aria-hidden="true" />{busyId === 'settings' ? 'Saqlanmoqda…' : 'Sozlamalarni saqlash'}</button></div></form></section>}

          {tab === 'balance' && (
            <>
              <section className="admin-panel admin-balance-panel">
                <div className="admin-panel-heading"><div><p className="admin-eyebrow">QO‘LDA BOSHQARUV</p><h2>Foydalanuvchi balansini belgilash</h2><p>Email orqali topilgan foydalanuvchining yangi umumiy balansini kiriting. Farq alohida, o‘chirilmaydigan jurnalga yoziladi.</p></div><span className="admin-security-tag"><ShieldCheck aria-hidden="true" /> Admin amali</span></div>
                <form className="admin-balance-form" onSubmit={(event) => void handleBalanceSave(event)}>
                  <label>Foydalanuvchi email<input name="email" type="email" required maxLength={254} autoComplete="off" placeholder="foydalanuvchi@example.com" /></label>
                  <label>Yangi balans (so‘m)<input name="targetBalance" type="number" min={0} max={1000000000000} step={1000} defaultValue={0} required /></label>
                  <label className="admin-balance-wide">O‘zgarish sababi<textarea name="note" minLength={3} maxLength={300} rows={3} required placeholder="Masalan, to‘lov tasdiqlandi" /></label>
                  <div className="admin-balance-footer"><span>Balans har doim bazadagi tranzaksiyalar tarixidan hisoblanadi.</span><button className="admin-save-button" disabled={busyId === 'balance'} type="submit"><Save aria-hidden="true" />{busyId === 'balance' ? 'Saqlanmoqda…' : 'Balansni saqlash'}</button></div>
                </form>
              </section>
              <section className="admin-panel admin-balance-history">
                <div className="admin-panel-heading"><div><p className="admin-eyebrow">SAQLANGAN TARIX</p><h2>Oxirgi balans o‘zgarishlari</h2><p>{balanceChanges.length} ta oxirgi yozuv. Har bir o‘zgarish admin audit jurnaliga ham tushadi.</p></div></div>
                {balanceChanges.length ? <div className="admin-balance-list">{balanceChanges.map((change) => <article className="admin-balance-row" key={change.id}><div><strong>{change.userName || 'Foydalanuvchi'}</strong><p>{change.userEmail || change.userId}</p><small>{change.note}</small></div><div className="admin-balance-values"><strong className={change.amountDelta < 0 ? 'is-negative' : 'is-positive'}>{change.amountDelta > 0 ? '+' : '−'}{money.format(Math.abs(change.amountDelta))} so‘m</strong><span>Yangi balans: {money.format(change.balanceAfter)} so‘m</span><time dateTime={new Date(change.createdAt).toISOString()}>{dateFormat.format(new Date(change.createdAt))}</time></div></article>)}</div> : <div className="admin-empty"><Wallet aria-hidden="true" /><strong>Balans o‘zgarishlari hali yo‘q</strong><span>Admin kiritgan barcha o‘zgarishlar shu yerda qoladi.</span></div>}
              </section>
            </>
          )}

          {tab === 'audit' && <section className="admin-panel"><div className="admin-panel-heading"><div><p className="admin-eyebrow">O‘ZGARTIRIB BO‘LMAYDIGAN TARIX</p><h2>Xavfsizlik jurnali</h2><p>Oxirgi 100 ta muhim amal. Parol, karta cheki yoki maxfiy fayl mazmuni jurnalda saqlanmaydi.</p></div><span className="admin-security-tag"><Activity aria-hidden="true" /> {audits.length} yozuv</span></div><div className="admin-audit-list">{audits.map((audit) => <article className="admin-audit-row" key={audit.id}><span className="admin-audit-icon"><Activity aria-hidden="true" /></span><div className="admin-audit-copy"><strong>{audit.action.replaceAll('.', ' · ')}</strong><p>{audit.subjectType}{audit.subjectId ? ` #${audit.subjectId}` : ''} <span>·</span> {audit.actorEmail || 'Tizim'}</p></div><time dateTime={new Date(audit.createdAt).toISOString()}>{dateFormat.format(new Date(audit.createdAt))}</time><details><summary>Meta</summary><pre>{JSON.stringify(audit.metadata, null, 2)}</pre></details></article>)}{audits.length === 0 && <div className="admin-empty"><Activity aria-hidden="true" /><strong>Audit yozuvlari yo‘q</strong></div>}</div></section>}

          <footer className="admin-footer"><span>MAKONI · Xavfsiz boshqaruv</span><span><ShieldCheck aria-hidden="true" /> Audit va admin nazorati faol</span></footer>
        </div>
      </div>
    </main>
  )
}
