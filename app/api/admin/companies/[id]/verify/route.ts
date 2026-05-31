import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSessionFromCookies } from '@/lib/admin/session'

const allowedStates = new Set(['approved', 'rejected'])

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSessionFromCookies()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const payload = await request.json()
  const state = String(payload?.state || '')
  const notes = payload?.notes ? String(payload.notes) : null

  if (!allowedStates.has(state)) {
    return NextResponse.json({ error: 'Invalid verification state' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const updates = {
    verification_state: state,
    verification_status: state === 'approved',
    verification_reviewed_at: new Date().toISOString(),
    verification_reviewed_by: session.username,
    verification_notes: notes,
  }

  const { error } = await supabase
    .from('recruiter_profiles')
    .update(updates as never)
    .eq('id', id)
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
