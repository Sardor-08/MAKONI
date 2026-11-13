'use client'

import { useState } from 'react'
import { signOut } from '@/lib/auth-client'

export function SignOutButton() {
  const [pending, setPending] = useState(false)

  async function handleSignOut() {
    setPending(true)
    await signOut()
    window.location.assign('/sign-in')
  }

  return (
    <button className="auth-secondary" disabled={pending} onClick={handleSignOut} type="button">
      {pending ? 'Chiqilmoqda…' : 'Chiqish'}
    </button>
  )
}
