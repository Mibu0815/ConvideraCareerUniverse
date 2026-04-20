import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@prisma/client'

export async function requireUser(): Promise<User> {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser?.id) throw new Error('Nicht authentifiziert')

  const user = await prisma.user.findUnique({ where: { id: authUser.id } })
  if (!user) throw new Error('User nicht gefunden')
  return user
}
