import { CompanyVerificationClient } from '@/components/admin/company-verification-client'
import { getCompanies } from './actions'

export default async function AdminCompaniesPage() {
  const result = await getCompanies({ status: 'unverified' })

  return (
    <CompanyVerificationClient
      initialCompanies={result.data || []}
      initialError={result.error}
    />
  )
}
