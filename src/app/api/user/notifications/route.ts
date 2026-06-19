import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { users } from '@/lib/schema'

const VALID = ['instant', 'daily', 'off'] as const

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => null) as { mode?: string } | null
  const mode = body?.mode
  if (!mode || !VALID.includes(mode as typeof VALID[number])) {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  }
  await getDb().update(users)
    .set({ emailNotifyMode: mode })
    .where(eq(users.id, session.user.id))
  return NextResponse.json({ ok: true })
}
