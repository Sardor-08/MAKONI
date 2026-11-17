import 'server-only'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export const ADMIN_EMAIL = 'nozimturdiyev78@gmail.com'

export async function getAdminUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.email.trim().toLowerCase() !== ADMIN_EMAIL) return null
  return session.user
}

export async function requireAdmin() {
  const admin = await getAdminUser()
  if (!admin) throw new Error('Forbidden')
  return admin
}
