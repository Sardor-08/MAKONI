'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { requestPasswordReset, resetPassword } from '@/lib/auth-client'

type RecoveryFormProps = {
  mode: 'request' | 'reset'
  token?: string
}

export function PasswordRecoveryForm({ mode, token }: RecoveryFormProps) {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setPending(true)

    const formData = new FormData(event.currentTarget)
    try {
      if (mode === 'request') {
        const email = String(formData.get('email') ?? '').trim()
        const result = await requestPasswordReset({
          email,
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (result.error) throw new Error('request-failed')
        setSuccess('Agar email akkauntga tegishli bo‘lsa, parolni tiklash havolasini yubordik. Kiruvchi xatlar va spam papkasini tekshiring.')
      } else {
        const password = String(formData.get('password') ?? '')
        const result = await resetPassword({ newPassword: password, token: token ?? '' })
        if (result.error) throw new Error('reset-failed')
        setSuccess('Parolingiz yangilandi. Endi yangi parol bilan tizimga kiring.')
      }
    } catch {
      setError(
        mode === 'request'
          ? 'So‘rov bajarilmadi. Emailni tekshirib, birozdan keyin qayta urinib ko‘ring.'
          : 'Havola eskirgan yoki yaroqsiz. Yangi tiklash havolasini so‘rang.'
      )
    } finally {
      setPending(false)
    }
  }

  if (mode === 'reset' && !token) {
    return (
      <div className="auth-feedback auth-error" role="alert">
        <p>Parolni tiklash havolasi topilmadi yoki yaroqsiz.</p>
        <Link className="auth-recovery-link" href="/forgot-password">Yangi havola olish</Link>
      </div>
    )
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {mode === 'request' ? (
        <label className="auth-field">
          Email
          <input autoComplete="email" maxLength={254} name="email" placeholder="you@example.com" required type="email" />
        </label>
      ) : (
        <label className="auth-field">
          Yangi parol
          <input autoComplete="new-password" minLength={8} name="password" placeholder="Kamida 8 ta belgi" required type="password" />
        </label>
      )}
      {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}
      {success && (
        <div className="auth-feedback auth-success" role="status" aria-live="polite">
          <p>{success}</p>
          {mode === 'reset' && <Link className="auth-recovery-link" href="/sign-in">Kirish sahifasiga o‘tish</Link>}
        </div>
      )}
      {!success && (
        <button className="auth-submit" disabled={pending} type="submit">
          {pending ? 'Bajarilmoqda…' : mode === 'request' ? 'Tiklash havolasini yuborish' : 'Parolni yangilash'}
        </button>
      )}
      <p className="auth-switch"><Link href="/sign-in">Kirish sahifasiga qaytish</Link></p>
    </form>
  )
}
