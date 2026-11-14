'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { signIn, signUp } from '@/lib/auth-client'

type AuthFormProps = {
  mode: 'sign-in' | 'sign-up'
  returnTo: string
}

export function AuthForm({ mode, returnTo }: AuthFormProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const isSignUp = mode === 'sign-up'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setPending(true)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')
    const name = String(formData.get('name') ?? '').trim()

    try {
      const result = isSignUp
        ? await signUp.email({ email, password, name, callbackURL: returnTo })
        : await signIn.email({ email, password, callbackURL: returnTo })

      if (result.error) {
        setError('Kiritilgan ma’lumotlarni tekshirib, qayta urinib ko‘ring.')
        return
      }

      router.push(returnTo)
      router.refresh()
    } catch {
      setError('Hozir tizimga ulanib bo‘lmadi. Birozdan so‘ng qayta urinib ko‘ring.')
    } finally {
      setPending(false)
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
      {error && <p className="auth-error" role="alert">{error}</p>}
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
