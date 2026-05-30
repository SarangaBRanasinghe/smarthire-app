'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Clock,
  Eye,
  MessageSquare,
  Calendar,
  Building2,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Video,
  Loader2,
  TrendingUp,
  Briefcase,
} from 'lucide-react'
import type { ApplicationStatus } from '@/types/database'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Application {
  id: string
  jobId: string
  jobTitle: string
  company: string
  companyLogo: string | null
  location: string
  jobType: string
  status: ApplicationStatus
  appliedAt: string
  matchScore: number | null
  coverLetter: string | null
  interview: {
    scheduledAt: string
    type: string
    meetingLink: string | null
    locationAddress: string | null
  } | null
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const statusConfig: Record<ApplicationStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-700',
    icon: <Clock className="h-4 w-4" />,
  },
  reviewing: {
    label: 'Reviewing',
    color: 'bg-blue-100 text-blue-700',
    icon: <Eye className="h-4 w-4" />,
  },
  interview: {
    label: 'Interview',
    color: 'bg-purple-100 text-purple-700',
    icon: <MessageSquare className="h-4 w-4" />,
  },
  offer: {
    label: 'Offer Received',
    color: 'bg-green-100 text-green-700',
    icon: <CheckCircle className="h-4 w-4" />,
  },
  rejected: {
    label: 'Not Selected',
    color: 'bg-red-100 text-red-700',
    icon: <XCircle className="h-4 w-4" />,
  },
}

const jobTypeLabels: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  remote: 'Remote',
  internship: 'Internship',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

// ─── Application Card Component ───────────────────────────────────────────────

function ApplicationCard({
  application,
  onClick,
}: {
  application: Application
  onClick: () => void
}) {
  const status = statusConfig[application.status]

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4">
            {/* Company Logo */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
              {application.companyLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={application.companyLogo}
                  alt={application.company}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{application.jobTitle}</h3>
              <p className="text-sm text-gray-500">{application.company}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                {application.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {application.location}
                  </span>
                )}
                {application.jobType && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {jobTypeLabels[application.jobType] ?? application.jobType}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Applied {timeAgo(application.appliedAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Badge className={`${status.color} flex items-center gap-1`}>
              {status.icon}
              {status.label}
            </Badge>
            {application.matchScore !== null && application.matchScore > 0 && (
              <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                <TrendingUp className="h-3 w-3" />
                {application.matchScore}% Match
              </span>
            )}
          </div>
        </div>

        {/* Interview banner */}
        {application.interview && (
          <div className="mt-4 rounded-lg bg-purple-50 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-purple-700">
              <Video className="h-4 w-4" />
              Interview Scheduled
            </div>
            <p className="mt-1 text-sm text-purple-600">
              {formatDateTime(application.interview.scheduledAt)}
              {' · '}
              {application.interview.type === 'video'
                ? 'Video Call'
                : application.interview.type === 'phone'
                ? 'Phone Call'
                : 'In Person'}
            </p>
          </div>
        )}

        {/* Offer banner */}
        {application.status === 'offer' && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              🎉 You received an offer for this position!
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SeekerApplicationsPage() {
  const supabase = createClient()

  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // ── Fetch data ────────────────────────────────────────────────────────────

  useEffect(() => {
    async function loadApplications() {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Step 1: Fetch applications for this seeker
        const { data: appRows, error } = await supabase
          .from('applications')
          .select('id, job_id, status, applied_at, ai_match_score, cover_letter')
          .eq('seeker_id', user.id)
          .order('applied_at', { ascending: false })

        if (error) {
          console.error('Applications fetch error:', error)
          return
        }

        if (!appRows || appRows.length === 0) {
          setApplications([])
          return
        }

        const jobIds: string[] = appRows.map((a: { job_id: string }) => a.job_id)

        // Step 2: Fetch job details for those jobs (flat query)
        const { data: jobRows } = await supabase
          .from('jobs')
          .select('id, title, location, type, recruiter_id')
          .in('id', jobIds)

        const jobMap: Record<string, { title: string; location: string | null; type: string; recruiter_id: string }> = {}
        ;(jobRows ?? []).forEach((j: { id: string; title: string; location: string | null; type: string; recruiter_id: string }) => {
          jobMap[j.id] = j
        })

        // Step 3: Fetch recruiter profiles for company names and logos
        const recruiterIds = [...new Set((jobRows ?? []).map((j: { recruiter_id: string }) => j.recruiter_id))]
        const { data: recruiterRows } = await supabase
          .from('recruiter_profiles')
          .select('id, company_name, company_logo')
          .in('id', recruiterIds)

        const recruiterMap: Record<string, { name: string; logo: string | null }> = {}
        ;(recruiterRows ?? []).forEach((r: { id: string; company_name: string | null; company_logo: string | null }) => {
          recruiterMap[r.id] = { name: r.company_name || 'Unknown Company', logo: r.company_logo ?? null }
        })

        // Step 4: Fetch interviews for these applications
        const appIds: string[] = appRows.map((a: { id: string }) => a.id)
        const { data: interviewRows } = await supabase
          .from('interviews')
          .select('application_id, scheduled_at, type, meeting_link, location_address')
          .in('application_id', appIds)

        const interviewMap: Record<string, {
          scheduledAt: string
          type: string
          meetingLink: string | null
          locationAddress: string | null
        }> = {}
        ;(interviewRows ?? []).forEach((iv: {
          application_id: string
          scheduled_at: string
          type: string
          meeting_link: string | null
          location_address: string | null
        }) => {
          interviewMap[iv.application_id] = {
            scheduledAt: iv.scheduled_at,
            type: iv.type,
            meetingLink: iv.meeting_link,
            locationAddress: iv.location_address,
          }
        })

        // Step 5: Build final application objects
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const built: Application[] = (appRows ?? []).map((app: any) => {
          const job = jobMap[app.job_id]
          const recruiter = job ? recruiterMap[job.recruiter_id] : null
          return {
            id: app.id,
            jobId: app.job_id,
            jobTitle: job?.title ?? 'Unknown Job',
            company: recruiter?.name ?? 'Unknown Company',
            companyLogo: recruiter?.logo ?? null,
            location: job?.location ?? '',
            jobType: job?.type ?? '',
            status: app.status as ApplicationStatus,
            appliedAt: app.applied_at,
            matchScore: app.ai_match_score ?? null,
            coverLetter: app.cover_letter ?? null,
            interview: interviewMap[app.id] ?? null,
          }
        })

        setApplications(built)
      } catch (err) {
        console.error('Load error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadApplications()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Derived stats ─────────────────────────────────────────────────────────

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    reviewing: applications.filter((a) => a.status === 'reviewing').length,
    interview: applications.filter((a) => a.status === 'interview').length,
    offers: applications.filter((a) => a.status === 'offer').length,
  }

  const filterByStatus = (status?: ApplicationStatus) =>
    status ? applications.filter((a) => a.status === status) : applications

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-gray-500">Loading your applications...</p>
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.reviewing}</p>
              <p className="text-sm text-gray-500">Reviewing</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <MessageSquare className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.interview}</p>
              <p className="text-sm text-gray-500">Interview</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.offers}</p>
              <p className="text-sm text-gray-500">Offers</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>My Applications ({stats.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Briefcase className="mb-3 h-10 w-10 text-gray-300" />
              <h3 className="font-medium text-gray-700">No applications yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start applying to jobs to track your applications here.
              </p>
              <a
                href="/seeker/jobs"
                className="mt-3 text-sm font-medium text-emerald-600 hover:underline"
              >
                Browse Jobs →
              </a>
            </div>
          ) : (
            <Tabs defaultValue="all">
              <TabsList className="flex-wrap">
                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
                <TabsTrigger value="reviewing">Reviewing ({stats.reviewing})</TabsTrigger>
                <TabsTrigger value="interview">Interview ({stats.interview})</TabsTrigger>
                <TabsTrigger value="offer">Offers ({stats.offers})</TabsTrigger>
              </TabsList>

              {(['all', 'pending', 'reviewing', 'interview', 'offer'] as const).map((tab) => (
                <TabsContent key={tab} value={tab} className="mt-4 space-y-4">
                  {filterByStatus(tab === 'all' ? undefined : tab as ApplicationStatus).length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-400">
                      No {tab === 'all' ? '' : tab} applications.
                    </p>
                  ) : (
                    filterByStatus(tab === 'all' ? undefined : tab as ApplicationStatus).map((app) => (
                      <ApplicationCard
                        key={app.id}
                        application={app}
                        onClick={() => {
                          setSelectedApplication(app)
                          setIsDialogOpen(true)
                        }}
                      />
                    ))
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* ── Application Details Dialog ──────────────────────────────────────── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{selectedApplication?.jobTitle}</DialogTitle>
            <DialogDescription>
              {selectedApplication?.company}
              {selectedApplication?.location ? ` · ${selectedApplication.location}` : ''}
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="py-2">
              <div className="space-y-4 max-h-[calc(80vh-6rem)] overflow-y-auto pr-2">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <Badge className={`${statusConfig[selectedApplication.status].color} flex items-center gap-1`}>
                  {statusConfig[selectedApplication.status].icon}
                  {statusConfig[selectedApplication.status].label}
                </Badge>
              </div>

              {/* Applied date */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Applied On</span>
                <span className="text-sm font-medium">
                  {formatDate(selectedApplication.appliedAt)}
                </span>
              </div>

              {/* Job type */}
              {selectedApplication.jobType && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Job Type</span>
                  <span className="text-sm font-medium">
                    {jobTypeLabels[selectedApplication.jobType] ?? selectedApplication.jobType}
                  </span>
                </div>
              )}

              {/* Match score */}
              {selectedApplication.matchScore !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">AI Match Score</span>
                  <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                    <TrendingUp className="h-4 w-4" />
                    {selectedApplication.matchScore}%
                  </span>
                </div>
              )}

              {/* Cover letter preview */}
              {selectedApplication.coverLetter && (
                <div>
                  <p className="mb-1 text-sm text-gray-500">Cover Letter</p>
                  <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600 whitespace-pre-wrap">
                    {selectedApplication.coverLetter}
                  </p>
                </div>
              )}

              {/* Interview details */}
              {selectedApplication.interview && (
                <div className="rounded-lg bg-purple-50 p-4">
                  <h4 className="flex items-center gap-2 font-medium text-purple-700">
                    <Video className="h-4 w-4" />
                    Interview Details
                  </h4>
                  <p className="mt-2 text-sm text-purple-600">
                    <strong>Date:</strong> {formatDateTime(selectedApplication.interview.scheduledAt)}
                  </p>
                  <p className="text-sm text-purple-600">
                    <strong>Type:</strong>{' '}
                    {selectedApplication.interview.type === 'video'
                      ? 'Video Call'
                      : selectedApplication.interview.type === 'phone'
                      ? 'Phone Call'
                      : 'In Person'}
                  </p>
                  {selectedApplication.interview.locationAddress && (
                    <p className="text-sm text-purple-600">
                      <strong>Address:</strong> {selectedApplication.interview.locationAddress}
                    </p>
                  )}
                  {selectedApplication.interview.meetingLink && (
                    <Button
                      className="mt-3 bg-purple-600 hover:bg-purple-700"
                      onClick={() => window.open(selectedApplication.interview!.meetingLink!, '_blank')}
                    >
                      Join Meeting
                    </Button>
                  )}
                </div>
              )}

              {/* Offer */}
              {selectedApplication.status === 'offer' && (
                <div className="rounded-lg bg-green-50 p-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Congratulations! 🎉</span>
                  </div>
                  <p className="mt-1 text-sm text-green-600">
                    You have received an offer for this position. Contact the recruiter for next steps.
                  </p>
                </div>
              )}

              {/* Rejected */}
              {selectedApplication.status === 'rejected' && (
                <div className="rounded-lg bg-red-50 p-4">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Application Not Selected</span>
                  </div>
                  <p className="mt-1 text-sm text-red-600">
                    Unfortunately, your application was not selected for this position.
                    Keep applying — the right opportunity is out there!
                  </p>
                </div>
              )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
