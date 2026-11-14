'use client'

import Link from 'next/link'
import { FormEvent, useRef, useState } from 'react'
import { sendVerificationEmail, signIn, signUp } from '@/lib/auth-client'

type AuthFormProps = {
  mode: 'sign-in' | 'sign-up'
  returnTo: string
}

export function AuthForm({ mode, returnTo }: AuthFormProps) {
  const emailRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pending, setPending] = useState(false)
  const [verificationPending, setVerificationPending] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const isSignUp = mode === 'sign-up'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setNeedsVerification(false)
    setPending(true)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')
    const name = String(formData.get('name') ?? '').trim()

    try {
      const result = isSignUp
        ? await signUp.email({
            email,
            password,
            name,
            callbackURL: `${window.location.origin}${returnTo}`,
          })
        : await signIn.email({ email, password })

      if (result.error) {
        const code = result.error.code?.toLowerCase() ?? ''
        const message = result.error.message?.toLowerCase() ?? ''
        const isDuplicate = code.includes('already') || message.includes('already')
        const isInvalidCredentials =
          code.includes('invalid') || message.includes('invalid') || message.includes('credential')

        const isUnverified = code.includes('email_not_verified') || message.includes('not verified')
        setNeedsVerification(!isSignUp && isUnverified)
        setError(
          isSignUp && isDuplicate
            ? 'Bu email bilan akkaunt mavjud. Kirish bo‘limiga o‘ting yoki boshqa emaildan foydalaning.'
            : !isSignUp && isUnverified
              ? 'Email manzilingiz hali tasdiqlanmagan. Tasdiqlash xatini qayta yuboring.'
              : !isSignUp && isInvalidCredentials
                ? 'Email yoki parol mos kelmadi. Ma’lumotlarni tekshiring yoki avval ro‘yxatdan o‘ting.'
                : 'So‘rov bajarilmadi. Internetni tekshiring va qayta urinib ko‘ring.'
        )
        return
      }

      setSuccess(
        isSignUp
          ? 'Akkaunt yaratildi. Kirishni yakunlash uchun emailingizga yuborilgan tasdiqlash havolasini bosing.'
          : 'Kirish tasdiqlandi. Davom etish tugmasini bosib akkauntingizga o‘ting.'
      )
    } catch {
      setError(
        'Serverga ulanib bo‘lmadi. Internetni tekshirib qayta urinib ko‘ring; muammo davom etsa, ro‘yxatdan o‘tish yoki kirish bo‘limiga qayting.'
      )
    } finally {
      setPending(false)
    }
  }

  async function handleResendVerification() {
    const email = emailRef.current?.value.trim()
    if (!email) {
      setError('Avval email manzilingizni kiriting.')
      emailRef.current?.focus()
      return
    }

    setVerificationPending(true)
    setError('')
    try {
      const result = await sendVerificationEmail({
        email,
        callbackURL: `${window.location.origin}${returnTo}`,
      })
      if (result.error) throw new Error('verification-email-failed')
      setSuccess('Tasdiqlash xati yuborildi. Emailingizdagi havolani oching.')
      setNeedsVerification(false)
    } catch {
      setError('Xat yuborilmadi. Emailni tekshirib, birozdan keyin qayta urinib ko‘ring.')
    } finally {
      setVerificationPending(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {isSignUp && (
        <label className="auth-field">
          Ism va familiya
          <input
            autoComplete="name"
            minLength={2}
            maxLength={80}
            name="name"
            placeholder="Ism Familiya"
            required
          />
        </label>
      )}
      <label className="auth-field">
        Email
        <input
          autoComplete="email"
          maxLength={254}
          name="email"
          ref={emailRef}
          placeholder="you@example.com"
          required
          type="email"
        />
      </label>
      <label className="auth-field">
        Parol
        <input
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          minLength={8}
          name="password"
          placeholder="Kamida 8 ta belgi"
          required
          type="password"
        />
      </label>
      {!isSignUp && (
        <Link className="auth-recovery-link" href="/forgot-password">
          Parolni unutdingizmi?
        </Link>
      )}
      {error && (
        <div className="auth-feedback auth-error" role="alert">
          <p>{error}</p>
          <p className="auth-feedback-help">
            {isSignUp
              ? 'Yordam: avval ro‘yxatdan o‘tgan bo‘lsangiz, “Kirish” havolasini tanlang.'
              : 'Yordam: yangi akkaunt uchun “Ro‘yxatdan o‘tish” havolasini tanlang.'}
          </p>
          {needsVerification && (
            <button
              className="auth-text-button"
              disabled={verificationPending}
              onClick={handleResendVerification}
              type="button"
            >
              {verificationPending ? 'Yuborilmoqda…' : 'Tasdiqlash xatini qayta yuborish'}
            </button>
          )}
        </div>
      )}
      {success && (
        <div className="auth-feedback auth-success" role="status" aria-live="polite">
          <p>{success}</p>
          {!isSignUp && <Link className="auth-recovery-link" href={returnTo}>Davom etish</Link>}
        </div>
      )}
      <button className="auth-submit" disabled={pending} type="submit">
        {pending ? 'Tekshirilmoqda…' : isSignUp ? 'Akkaunt yaratish' : 'Kirish'}
      </button>
      <p className="auth-switch">
        {isSignUp ? 'Akkauntingiz bormi?' : 'Yangi foydalanuvchimisiz?'}{' '}
        <Link
          href={`${isSignUp ? '/sign-in' : '/sign-up'}?returnTo=${encodeURIComponent(returnTo)}`}
        >
          {isSignUp ? 'Kirish' : 'Ro‘yxatdan o‘tish'}
        </Link>
      </p>
    </form>
  )
}
