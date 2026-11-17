'use client'

import Link from 'next/link'
import { upload } from '@vercel/blob/client'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, Clock3, CreditCard, ImagePlus, ShieldCheck, UploadCloud } from 'lucide-react'

type ListingPlan = {
  id: string
  isActive: boolean
  name: string
  description: string
  price: number
  durationDays: number
  maxPhotos: number
  premium: boolean
  featured: boolean
}
type PaymentSettings = { bankName: string; cardNumber: string; cardHolder: string; instructions: string }
type ResumeListing = { id: number; title: string; planId: string; paymentStatus: string | null; reviewNote: string | null }
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
  planId: string
}
type Props = { plans: ListingPlan[]; paymentSettings: PaymentSettings; resumeListing: ResumeListing | null; userId: string | null }
type ListingFormProps = Omit<Props, 'userId'> & { userId: string }

const money = new Intl.NumberFormat('uz-UZ')

function ListingForm({ plans, paymentSettings, resumeListing, userId }: ListingFormProps) {
  const router = useRouter()
  const [planId, setPlanId] = useState(resumeListing?.planId ?? plans[0]?.id ?? '')
  const [files, setFiles] = useState<File[]>([])
  const [propertyId, setPropertyId] = useState<number | null>(resumeListing?.id ?? null)
  const [step, setStep] = useState<'details' | 'payment' | 'sent'>(
    resumeListing?.paymentStatus === 'pending' ? 'sent' : resumeListing ? 'payment' : 'details',
  )
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const selectedPlan = plans.find((plan) => plan.id === planId)
  const availablePlans = plans.filter((plan) => plan.isActive)

  async function cleanupUploads(paths: string[]) {
    if (paths.length === 0) return
    await fetch('/api/private-uploads', {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths }),
    }).catch(() => undefined)
  }

  async function handleCreateListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!selectedPlan || files.length < 1 || files.length > selectedPlan.maxPhotos) {
      setError(`Tanlangan tarif uchun 1–${selectedPlan?.maxPhotos ?? 0} ta rasm tanlang.`)
      return
    }
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
      planId,
    }
    const uploadedPaths: string[] = []
    let listingCreated = false

    try {
      const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
      for (const file of files) {
        const extension = extensions[file.type]
        if (!extension || file.size === 0 || file.size > 5 * 1024 * 1024) throw new Error('Faqat 5 MB gacha JPG, PNG yoki WebP rasm yuklang.')
        const blob = await upload(`listings/${userId}/${crypto.randomUUID()}.${extension}`, file, {
          access: 'private',
          handleUploadUrl: '/api/private-uploads',
        })
        uploadedPaths.push(blob.pathname)
      }

      const response = await fetch('/api/properties', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, imageUrls: uploadedPaths }),
      })
      if (response.status === 401) {
        await cleanupUploads(uploadedPaths)
        router.replace('/sign-up?returnTo=%2Flist-property')
        return
      }
      const result = await response.json()
      if (!response.ok || !result.listing?.id) throw new Error(result.error || 'E’lonni saqlab bo‘lmadi.')
      listingCreated = true
      setPropertyId(result.listing.id)
      setStep('payment')
      router.replace(`/list-property?property=${encodeURIComponent(String(result.listing.id))}`, { scroll: false })
    } catch (failure) {
      if (!listingCreated) await cleanupUploads(uploadedPaths)
      setError(failure instanceof Error ? failure.message : 'Server bilan bog‘lanib bo‘lmadi. Qayta urinib ko‘ring.')
    } finally {
      setPending(false)
    }
  }

  async function handlePaymentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!propertyId) {
      setError('Avval e’lon ma’lumotlarini saqlang.')
      return
    }
    setPending(true)
    const fields = new FormData(event.currentTarget)
    const receipt = fields.get('receipt')
    if (!(receipt instanceof File)) {
      setError('To‘lov chekini tanlang.')
      setPending(false)
      return
    }
    const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
    const extension = extensions[receipt.type]
    if (!extension || receipt.size === 0 || receipt.size > 5 * 1024 * 1024) {
      setError('Chek faqat 5 MB gacha JPG, PNG yoki WebP bo‘lishi kerak.')
      setPending(false)
      return
    }

    let receiptPath: string | null = null
    try {
      const blob = await upload(`receipts/${userId}/${crypto.randomUUID()}.${extension}`, receipt, {
        access: 'private',
        handleUploadUrl: '/api/private-uploads',
      })
      receiptPath = blob.pathname
      const response = await fetch('/api/payment-submissions', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          payerName: String(fields.get('payerName') ?? '').trim(),
          payerPhone: String(fields.get('payerPhone') ?? '').trim(),
          reference: String(fields.get('reference') ?? '').trim(),
          receiptPath,
        }),
      })
      if (response.status === 401) {
        await cleanupUploads([receiptPath])
        receiptPath = null
        router.replace(`/sign-in?returnTo=${encodeURIComponent(`/list-property?property=${propertyId}`)}`)
        return
      }
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'To‘lov arizasini yuborib bo‘lmadi.')
      receiptPath = null
      setStep('sent')
      router.refresh()
    } catch (failure) {
      if (receiptPath) await cleanupUploads([receiptPath])
      setError(failure instanceof Error ? failure.message : 'Server bilan bog‘lanib bo‘lmadi. Qayta urinib ko‘ring.')
    } finally {
      setPending(false)
    }
  }

  if (step === 'sent') {
    return (
      <section className="listing-success-card" aria-labelledby="listing-sent-title">
        <span className="listing-success-icon"><Clock3 aria-hidden="true" /></span>
        <p className="listing-kicker">TO‘LOV ARIZASI YUBORILDI</p>
        <h2 id="listing-sent-title">E’lon tekshiruvdan so‘ng faollashadi</h2>
        <p>Admin chekni ko‘rib chiqadi. Tasdiqlangach, e’lon tanlangan tarif muddati davomida MAKONI’da ko‘rinadi.</p>
        <div className="listing-success-actions">
          <Link className="listing-primary" href="/account">Shaxsiy kabinetga o‘tish</Link>
          <Link className="listing-secondary" href="/makoni.html">E’lonlarni ko‘rish</Link>
        </div>
      </section>
    )
  }

  if (resumeListing?.paymentStatus === 'pending') {
    return (
      <section className="listing-success-card" aria-labelledby="listing-pending-title">
        <span className="listing-success-icon"><Clock3 aria-hidden="true" /></span>
        <p className="listing-kicker">ARIZA TEKSHIRILMOQDA</p>
        <h2 id="listing-pending-title">“{resumeListing.title}” uchun to‘lov qabul qilindi</h2>
        <p>Takroriy ariza yuborish shart emas. Tekshiruv yakunlangach e’lon avtomatik faollashtiriladi.</p>
        <Link className="listing-primary" href="/account">Shaxsiy kabinetga qaytish</Link>
      </section>
    )
  }

  return (
    <div className="listing-submit-layout listing-submit-layout-wide">
      {step === 'details' ? (
        <form className="listing-form-card" onSubmit={handleCreateListing}>
          <div className="listing-form-heading">
            <div><p className="listing-kicker">1-QADAM · E’LON</p><h2>Mulkingiz haqida</h2></div>
            <span className="listing-owner">Rasmlar Blob’da himoyalangan saqlanadi</span>
          </div>

          {availablePlans.length === 0 ? (
            <p className="listing-error" role="alert">Hozircha faol tarif yo‘q. Keyinroq qayta urinib ko‘ring.</p>
          ) : (
            <fieldset className="listing-plan-fieldset">
              <legend>30 kunlik joylashtirish tarifi</legend>
              <div className="listing-plan-options">
                {availablePlans.map((plan) => (
                  <label className={planId === plan.id ? 'listing-plan-option is-selected' : 'listing-plan-option'} key={plan.id}>
                    <input type="radio" name="planId" value={plan.id} checked={planId === plan.id} onChange={() => setPlanId(plan.id)} />
                    <span className="listing-plan-name">{plan.name}</span>
                    <strong>{money.format(plan.price)} <small>so‘m</small></strong>
                    <span>{plan.description}</span>
                    <span className="listing-plan-foot"><Clock3 aria-hidden="true" /> {plan.durationDays} kun · {plan.maxPhotos} tagacha rasm</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div className="listing-form-grid">
            <label className="listing-field listing-field-wide" htmlFor="listing-title">E’lon sarlavhasi<input id="listing-title" name="title" required minLength={8} maxLength={140} placeholder="Masalan, yorug‘ 3 xonali kvartira" /></label>
            <label className="listing-field" htmlFor="listing-deal">Bitim turi<select id="listing-deal" name="deal" defaultValue="Sotuv" required><option value="Sotuv">Sotuv</option><option value="Ijara">Ijara</option></select></label>
            <label className="listing-field" htmlFor="listing-type">Mulk turi<select id="listing-type" name="propertyType" defaultValue="Kvartira" required><option value="Kvartira">Kvartira</option><option value="Hovli uy">Hovli uy</option><option value="Villa">Villa</option><option value="Tijorat">Tijorat</option><option value="Yer uchastkasi">Yer uchastkasi</option></select></label>
            <label className="listing-field" htmlFor="listing-price">Narxi (so‘m)<input id="listing-price" name="price" type="number" min={1} max={100000000000000} step={1} inputMode="numeric" required placeholder="850000000" /></label>
            <label className="listing-field" htmlFor="listing-area">Maydon (m²)<input id="listing-area" name="areaM2" type="number" min={1} max={100000} step={1} inputMode="numeric" required placeholder="96" /></label>
            <label className="listing-field" htmlFor="listing-rooms">Xonalar soni<input id="listing-rooms" name="rooms" type="number" min={0} max={50} step={1} inputMode="numeric" defaultValue={3} required /></label>
            <label className="listing-field" htmlFor="listing-baths">Hammomlar soni<input id="listing-baths" name="baths" type="number" min={0} max={30} step={1} inputMode="numeric" defaultValue={1} required /></label>
            <label className="listing-field" htmlFor="listing-region">Viloyat / shahar<input id="listing-region" name="region" required minLength={2} maxLength={100} placeholder="Toshkent shahri" /></label>
            <label className="listing-field" htmlFor="listing-district">Tuman / shahar<input id="listing-district" name="district" required minLength={2} maxLength={100} placeholder="Yunusobod tumani" /></label>
            <label className="listing-field listing-field-wide" htmlFor="listing-images">
              Mulk suratlari
              <input id="listing-images" type="file" accept="image/jpeg,image/png,image/webp" multiple required onChange={(event) => setFiles(Array.from(event.target.files ?? []))} />
              <span className="listing-field-hint">Har biri 5 MB gacha JPG, PNG yoki WebP. Tanlangan tarif: {selectedPlan?.maxPhotos ?? 0} tagacha.</span>
              {files.length > 0 && <span className="listing-file-count"><ImagePlus aria-hidden="true" /> {files.length} ta rasm tanlandi</span>}
            </label>
          </div>
          <p className="listing-security-note"><ShieldCheck aria-hidden="true" /> E’lon to‘lov tasdiqlanguncha yashirin turadi. Faqat admin tasdiqlagach ommaga chiqadi.</p>
          {error && <p className="listing-error" role="alert">{error}</p>}
          <div className="listing-form-footer"><p>Davom etish orqali e’lon ma’lumotlarining to‘g‘riligini tasdiqlaysiz.</p><button className="listing-primary listing-submit" disabled={pending || availablePlans.length === 0} type="submit">{pending ? 'Saqlanmoqda…' : 'To‘lovga o‘tish'} <ArrowRight aria-hidden="true" /></button></div>
        </form>
      ) : (
        <form className="listing-form-card listing-payment-card" onSubmit={handlePaymentSubmit}>
          <div className="listing-form-heading"><div><p className="listing-kicker">2-QADAM · TO‘LOV</p><h2>To‘lov chekini yuboring</h2></div><button className="listing-back-button" type="button" onClick={() => setStep('details')}><ArrowLeft aria-hidden="true" /> E’lonni tahrirlash</button></div>
          {resumeListing?.paymentStatus === 'rejected' && <div className="listing-review-note"><strong>Oldingi ariza rad etilgan.</strong> {resumeListing.reviewNote || 'Chek ma’lumotlarini tekshirib qayta yuboring.'}</div>}
          <div className="listing-payment-summary"><span className="listing-payment-icon"><CreditCard aria-hidden="true" /></span><div><small>Tarif: {selectedPlan?.name ?? 'Tanlangan tarif'}</small><strong>{money.format(selectedPlan?.price ?? 0)} <small>so‘m</small></strong><span>{selectedPlan?.durationDays ?? 30} kunlik joylashtirish</span></div></div>
          <section className="listing-payment-details" aria-labelledby="payment-details-title">
            <div><p className="listing-kicker">KARTA ORQALI O‘TKAZMA</p><h3 id="payment-details-title">To‘lov ma’lumotlari</h3></div>
            {paymentSettings.bankName && <p><span>Bank</span><strong>{paymentSettings.bankName}</strong></p>}
            {paymentSettings.cardNumber && <p><span>Karta raqami</span><strong className="listing-card-number">{paymentSettings.cardNumber.replace(/\s+/g, '').replace(/(.{4})/g, '$1 ').trim()}</strong></p>}
            {paymentSettings.cardHolder && <p><span>Karta egasi</span><strong>{paymentSettings.cardHolder}</strong></p>}
            {paymentSettings.instructions && <p className="listing-payment-instructions">{paymentSettings.instructions}</p>}
            {!paymentSettings.cardNumber && <p className="listing-error">To‘lov ma’lumotlari hali kiritilmagan. Admin bilan bog‘laning.</p>}
          </section>
          <div className="listing-form-grid">
            <label className="listing-field" htmlFor="payer-name">To‘lovchi ism-familiyasi<input id="payer-name" name="payerName" required minLength={2} maxLength={120} autoComplete="name" /></label>
            <label className="listing-field" htmlFor="payer-phone">Telefon raqami<input id="payer-phone" name="payerPhone" type="tel" required minLength={7} maxLength={30} autoComplete="tel" placeholder="+998 90 123 45 67" /></label>
            <label className="listing-field listing-field-wide" htmlFor="payment-reference">To‘lov izohi / tranzaksiya ID <span>(ixtiyoriy)</span><input id="payment-reference" name="reference" maxLength={120} placeholder="Ilovadagi chek raqami" /></label>
            <label className="listing-field listing-field-wide" htmlFor="payment-receipt">To‘lov cheki surati<input id="payment-receipt" name="receipt" type="file" accept="image/jpeg,image/png,image/webp" required /><span className="listing-field-hint">Chek faqat admin uchun ko‘rinadi. JPG, PNG yoki WebP · 5 MB gacha.</span></label>
          </div>
          {error && <p className="listing-error" role="alert">{error}</p>}
          <div className="listing-form-footer"><p>To‘lov admin tomonidan tekshirilgach e’lon avtomatik faollashadi.</p><button className="listing-primary listing-submit" disabled={pending || !paymentSettings.cardNumber} type="submit">{pending ? 'Yuborilmoqda…' : 'Chekni xavfsiz yuborish'} <UploadCloud aria-hidden="true" /></button></div>
        </form>
      )}

      <aside className="listing-preview-card listing-process-card" aria-label="Joylashtirish jarayoni">
        <div className="listing-process-step"><span className={step === 'details' ? 'is-current' : 'is-done'}>{step === 'details' ? '01' : <Check aria-hidden="true" />}</span><div><strong>E’lon tafsilotlari</strong><small>Ma’lumot va suratlarni xavfsiz yuboring</small></div></div>
        <div className="listing-process-line" />
        <div className="listing-process-step"><span className={step === 'payment' ? 'is-current' : ''}>02</span><div><strong>To‘lovni tasdiqlash</strong><small>Chek admin tekshiruviga yuboriladi</small></div></div>
        <div className="listing-process-note"><ShieldCheck aria-hidden="true" /><p>Suratlar va to‘lov cheki private Blob’da saqlanadi. Chek faqat yagona admin akkauntiga ochiladi.</p></div>
      </aside>
    </div>
  )
}

export function ListingSubmission(props: Props) {
  if (!props.userId) {
    return <section className="listing-access" aria-labelledby="listing-access-title"><p className="listing-kicker">A’zolar uchun</p><h2 id="listing-access-title">E’lon joylash uchun akkaunt kerak</h2><p>Avval ro‘yxatdan o‘ting yoki mavjud akkauntingizga kiring. E’lon tasdiqlanmaguncha yashirin turadi.</p><div className="listing-access-actions"><Link className="listing-primary" href="/sign-up?returnTo=%2Flist-property">Ro‘yxatdan o‘tish</Link><Link className="listing-secondary" href="/sign-in?returnTo=%2Flist-property">Akkauntim bor — kirish</Link></div></section>
  }
  return <ListingForm {...props} userId={props.userId} />
}
