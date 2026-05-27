'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { CompanyProfile } from '@/app/admin/(app)/companies/actions'
import { getCompanies, verifyCompany } from '@/app/admin/(app)/companies/actions'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, Search, CheckCircle, Eye } from 'lucide-react'

const statusStyles: Record<string, { label: string; className: string }> = {
  verified: { label: 'Verified', className: 'bg-emerald-100 text-emerald-700' },
  unverified: { label: 'Unverified', className: 'bg-amber-100 text-amber-700' },
}

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function CompanyVerificationClient({
  initialCompanies,
  initialError,
}: {
  initialCompanies: CompanyProfile[]
  initialError?: string | null
}) {
  const [companies, setCompanies] = useState<CompanyProfile[]>(initialCompanies)
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('unverified')
  const [error, setError] = useState<string | null>(initialError ?? null)
  const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | null>(null)

  const filteredCount = useMemo(() => companies.length, [companies])

  const refreshCompanies = useCallback(
    async (nextSearch?: string, nextStatus?: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await getCompanies({
          search: nextSearch ?? search,
          status: nextStatus ?? statusFilter,
        })

        if (result.error) {
          throw new Error(result.error)
        }

        setCompanies(result.data || [])
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Something went wrong')
      } finally {
        setIsLoading(false)
      }
    },
    [search, statusFilter]
  )

  useEffect(() => {
    const timeout = setTimeout(() => {
      refreshCompanies()
    }, 300)

    return () => clearTimeout(timeout)
  }, [refreshCompanies])

  const handleVerify = async (companyId: string) => {
    setIsUpdating(companyId)
    try {
      const result = await verifyCompany({ companyId, verified: true })
      if (!result.ok) {
        throw new Error(result.error || 'Verification update failed')
      }

      toast.success('Company verified')
      await refreshCompanies()
    } catch (updateError) {
      toast.error(updateError instanceof Error ? updateError.message : 'Update failed')
    } finally {
      setIsUpdating(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Verification</h1>
          <p className="text-sm text-gray-500">
            Review company profiles and verify recruiter accounts.
          </p>
        </div>
        <Badge className="bg-gray-100 text-gray-700">{filteredCount} companies</Badge>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by company name or contact email"
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verification Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading companies...
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!isLoading && !error && companies.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-500">
              No companies match your filters yet.
            </div>
          )}

          {!isLoading && !error && companies.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => {
                  const resolvedState = company.verification_status ? 'verified' : 'unverified'
                  const status = statusStyles[resolvedState]
                  return (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-gray-900">
                            {company.company_name || 'Unnamed Company'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {company.company_website || 'No website listed'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-900">
                            {company.profiles?.full_name || '—'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {company.profiles?.email || '—'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={status.className}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDateTime(company.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedCompany(company)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            disabled={resolvedState === 'verified' || isUpdating === company.id}
                            onClick={() => handleVerify(company.id)}
                          >
                            {isUpdating === company.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="mr-2 h-4 w-4" />
                            )}
                            Verify
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedCompany} onOpenChange={() => setSelectedCompany(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Company Details</DialogTitle>
            <DialogDescription>
              Review the company profile before making a verification decision.
            </DialogDescription>
          </DialogHeader>
          {selectedCompany && (
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">Company</p>
                <p className="font-medium text-gray-900">
                  {selectedCompany.company_name || 'Unnamed Company'}
                </p>
                <p>{selectedCompany.company_website || 'No website listed'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">Contact</p>
                <p className="font-medium text-gray-900">
                  {selectedCompany.profiles?.full_name || '—'}
                </p>
                <p>{selectedCompany.profiles?.email || '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">Verification</p>
                <p>
                  Status:{' '}
                  {statusStyles[
                    selectedCompany.verification_status ? 'verified' : 'unverified'
                  ]?.label || 'Unverified'}
                </p>
                <p>Created: {formatDateTime(selectedCompany.created_at)}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedCompany(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
