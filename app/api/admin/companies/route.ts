import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSessionFromCookies } from '@/lib/admin/session'

export async function GET(request: Request) {
  const session = await getAdminSessionFromCookies()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')?.trim()
  const status = searchParams.get('status')?.trim() ?? 'all'
  const allowedStatuses = new Set(['all', 'pending', 'approved', 'rejected', 'unverified'])

  const supabase = createAdminClient()

  let query = supabase
    .from('recruiter_profiles')
    .select(
      'id, company_name, company_logo, company_website, verification_status, verification_state, verification_requested_at, verification_reviewed_at, verification_reviewed_by, verification_notes, created_at, profiles ( email, full_name )'
    )
    .order('created_at', { ascending: false })

  if (allowedStatuses.has(status) && status !== 'all') {
    if (status === 'unverified') {
      query = query.eq('verification_status', false)
    } else {
      query = query.eq('verification_state', status)
    }
  }

  if (search) {
    const pattern = `%${search}%`
    query = query.or(
      `company_name.ilike.${pattern},profiles.email.ilike.${pattern},profiles.full_name.ilike.${pattern}`
    )
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
