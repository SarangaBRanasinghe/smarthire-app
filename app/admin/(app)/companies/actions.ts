'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSessionFromCookies } from '@/lib/admin/session'

export type CompanyProfile = {
  id: string
  company_name: string | null
  company_logo: string | null
  company_website: string | null
  verification_status: boolean
  created_at: string
  profiles: {
    email: string
    full_name: string | null
  } | null
}

const allowedStatuses = new Set(['all', 'verified', 'unverified'])

export async function getCompanies({
  search,
  status,
}: {
  search?: string
  status?: string
}) {
  const session = await getAdminSessionFromCookies()
  if (!session) {
    return { data: null, error: 'Unauthorized' }
  }

  const resolvedStatus = status?.trim() || 'all'

  const supabase = createAdminClient()

  let query = supabase
    .from('recruiter_profiles')
    .select(
      'id, company_name, company_logo, company_website, verification_status, created_at, profiles ( email, full_name )'
    )
    .order('created_at', { ascending: false })

  if (allowedStatuses.has(resolvedStatus) && resolvedStatus !== 'all') {
    query = query.eq('verification_status', resolvedStatus === 'verified')
  }

  const trimmedSearch = search?.trim()
  if (trimmedSearch) {
    const pattern = `%${trimmedSearch}%`
    query = query.or(
      `company_name.ilike.${pattern},profiles.email.ilike.${pattern},profiles.full_name.ilike.${pattern}`
    )
  }

  const { data, error } = await query

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as CompanyProfile[], error: null }
}

export async function verifyCompany({
  companyId,
  verified,
}: {
  companyId: string
  verified: boolean
}) {
  const session = await getAdminSessionFromCookies()
  if (!session) {
    return { ok: false, error: 'Unauthorized' }
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('recruiter_profiles')
    .update({ verification_status: verified } as never)
    .eq('id', companyId)
    .select('id')
    .single()

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true, error: null }
}
