'use server'

import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { properties, user } from '@/lib/db/schema'

async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function setListingPublished(id: number, isPublished: boolean) {
  const userId = await requireUserId()
  const parsedId = z.number().int().positive().safeParse(id)
  if (!parsedId.success || typeof isPublished !== 'boolean') return { ok: false, error: 'Noto‘g‘ri so‘rov.' }

  const [updated] = await db.update(properties)
    .set({ isPublished })
    .where(and(eq(properties.id, parsedId.data), eq(properties.userId, userId)))
    .returning({ id: properties.id })

  if (!updated) return { ok: false, error: 'E’lon topilmadi.' }
  revalidatePath('/account')
  revalidatePath('/makoni.html')
  revalidatePath('/api/properties')
  return { ok: true }
}

export async function deleteListing(id: number) {
  const userId = await requireUserId()
  const parsedId = z.number().int().positive().safeParse(id)
  if (!parsedId.success) return { ok: false, error: 'Noto‘g‘ri so‘rov.' }

  const [deleted] = await db.delete(properties)
    .where(and(eq(properties.id, parsedId.data), eq(properties.userId, userId)))
    .returning({ id: properties.id })

  if (!deleted) return { ok: false, error: 'E’lon topilmadi.' }
  revalidatePath('/account')
  revalidatePath('/makoni.html')
  revalidatePath('/api/properties')
  return { ok: true }
}

export async function saveProfile(name: string, image: string | null) {
  const userId = await requireUserId()
  const parsedName = z.string().trim().min(2).max(80).safeParse(name)
  const parsedImage = z.string().max(512).nullable().refine((value) =>
    value === null || value.startsWith(`profiles/${userId}/`) || /^https:\/\/[^\s]+$/i.test(value),
  ).safeParse(image)
  if (!parsedName.success || !parsedImage.success) return { ok: false, error: 'Profil ma’lumotlarini tekshiring.' }

  const [updated] = await db.update(user)
    .set({ name: parsedName.data, image: parsedImage.data, updatedAt: new Date() })
    .where(eq(user.id, userId))
    .returning({ id: user.id })

  if (!updated) return { ok: false, error: 'Akkaunt topilmadi.' }
  revalidatePath('/account')
  return { ok: true }
}
