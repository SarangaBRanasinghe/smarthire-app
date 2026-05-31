'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  FileText,
  Briefcase,
  Clock,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  Loader2,
  Building2,
  MapPin,
  Sparkles,
  Calendar,
  Star,
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface RecentApp {
  id: string
  jobTitle: string
  company: string
  companyLogo: string | null
  appliedAt: string
  status: string
}

interface RecommendedJob {
  id: string
  title: string
  company: string
  location: string
  jobType: string
  matchScore: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

function getStatusColor(status: string) {
  switch (status) {
    case 'reviewing': return 'bg-blue-100 text-blue-700'
    case 'interview': return 'bg-purple-100 text-purple-700'
    case 'offer':     return 'bg-green-100 text-green-700'
    case 'rejected':  return 'bg-red-100 text-red-700'
    default:          return 'bg-yellow-100 text-yellow-700'
  }
}

const statusLabels: Record<string, string> = {
  pending: 'Pending', reviewing: 'Reviewing',
  interview: 'Interview', offer: 'Offer', rejected: 'Rejected',
}

const jobTypeLabels: Record<string, string> = {
  full_time: 'Full-time', part_time: 'Part-time',
  contract: 'Contract', remote: 'Remote', internship: 'Internship',
}

function computeMatch(seekerSkills: string[], jobSkills: string[]): number {
  if (jobSkills.length === 0) return 50
  const lowerSeeker = seekerSkills.map((s) => s.toLowerCase())
  const matched = jobSkills.filter((js) => lowerSeeker.includes(js.toLowerCase()))
  return Math.round((matched.length / jobSkills.length) * 100)
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function SeekerOverviewPage() {
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(true)
  const [firstName, setFirstName] = useState('')
  const [stats, setStats] = useState({ total: 0, pending: 0, interviewing: 0, offers: 0 })
  const [recentApps, setRecentApps] = useState<RecentApp[]>([])
  const [recommendedJobs, setRecommendedJobs] = useState<RecommendedJob[]>([])

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        // ── Auth ────────────────────────────────────────────────────────────
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // ── Profile name ────────────────────────────────────────────────────
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        const fullName: string = (profile as { full_name: string | null } | null)?.full_name ?? ''
        setFirstName(fullName.split(' ')[0] || 'there')

        // ── All applications for this seeker ────────────────────────────────
        const { data: appRows } = await supabase
          .from('applications')
          .select('id, job_id, status, applied_at')
          .eq('seeker_id', user.id)
          .order('applied_at', { ascending: false })

        const apps = (appRows ?? []) as { id: string; job_id: string; status: string; applied_at: string }[]

        // Stats
        setStats({
          total:       apps.length,
          pending:     apps.filter((a) => a.status === 'pending').length,
          interviewing: apps.filter((a) => a.status === 'interview').length,
          offers:      apps.filter((a) => a.status === 'offer').length,
        })

        // ── Recent applications (last 3) ────────────────────────────────────
        const recent3 = apps.slice(0, 3)
        const appliedJobIds = apps.map((a) => a.job_id)

        if (recent3.length > 0) {
          const recentJobIds = recent3.map((a) => a.job_id)

          // Job details
          const { data: jobRows } = await supabase
            .from('jobs')
            .select('id, title, recruiter_id')
            .in('id', recentJobIds)

          const jobMap: Record<string, { title: string; recruiter_id: string }> = {}
          ;(jobRows ?? []).forEach((j: { id: string; title: string; recruiter_id: string }) => {
            jobMap[j.id] = j
          })

          // Company names and logos
          const recruiterIds = [...new Set((jobRows ?? []).map((j: { recruiter_id: string }) => j.recruiter_id))]
          const { data: recruiterRows } = await supabase
            .from('recruiter_profiles')
            .select('id, company_name, company_logo')
            .in('id', recruiterIds)

          const companyMap: Record<string, { name: string; logo: string | null }> = {}
          ;(recruiterRows ?? []).forEach((r: { id: string; company_name: string | null; company_logo: string | null }) => {
            companyMap[r.id] = { name: r.company_name || 'Unknown Company', logo: r.company_logo ?? null }
          })

          setRecentApps(recent3.map((a) => {
            const job = jobMap[a.job_id]
            const recruiter = job ? companyMap[job.recruiter_id] : null
            return {
              id: a.id,
              jobTitle: job?.title ?? 'Unknown Job',
              company: recruiter?.name ?? 'Unknown Company',
              companyLogo: recruiter?.logo ?? null,
              appliedAt: timeAgo(a.applied_at),
              status: a.status,
            }
          }))
        }

        // ── Seeker skills ────────────────────────────────────────────────────
        const { data: skillRows } = await supabase
          .from('seeker_skills')
          .select('skills(name)')
          .eq('seeker_id', user.id)

        const seekerSkills: string[] = (skillRows ?? [])
          .map((r: { skills: { name: string } | null }) => r.skills?.name)
          .filter(Boolean) as string[]

        // ── AI Recommended jobs (active, not already applied) ────────────────
        const { data: activeJobs } = await supabase
          .from('jobs')
          .select('id, title, location, type, recruiter_id')
          .eq('status', 'active')
          .not('id', 'in', `(${appliedJobIds.length > 0 ? appliedJobIds.join(',') : 'null'})`)
          .limit(20)

        if (activeJobs && activeJobs.length > 0) {
          // Fetch job skills for scoring
          const activeJobIds = activeJobs.map((j: { id: string }) => j.id)
          const { data: jobSkillRows } = await supabase
            .from('job_skills')
            .select('job_id, skills(name)')
            .in('job_id', activeJobIds)

          const jobSkillsMap: Record<string, string[]> = {}
          ;(jobSkillRows ?? []).forEach((js: { job_id: string; skills: { name: string } | null }) => {
            if (!jobSkillsMap[js.job_id]) jobSkillsMap[js.job_id] = []
            if (js.skills?.name) jobSkillsMap[js.job_id].push(js.skills.name)
          })

          // Fetch company names for active jobs
          const activeRecruiterIds = [...new Set(activeJobs.map((j: { recruiter_id: string }) => j.recruiter_id))]
          const { data: activeRecruiterRows } = await supabase
            .from('recruiter_profiles')
            .select('id, company_name')
            .in('id', activeRecruiterIds)

          const activeCompanyMap: Record<string, string> = {}
          ;(activeRecruiterRows ?? []).forEach((r: { id: string; company_name: string | null }) => {
            activeCompanyMap[r.id] = r.company_name || 'Unknown Company'
          })

          // Score, sort, take top 3
          const scored = (activeJobs as { id: string; title: string; location: string | null; type: string; recruiter_id: string }[])
            .map((j) => ({
              id: j.id,
              title: j.title,
              company: activeCompanyMap[j.recruiter_id] || 'Unknown Company',
              location: j.location || 'Not specified',
              jobType: j.type,
              matchScore: computeMatch(seekerSkills, jobSkillsMap[j.id] ?? []),
            }))
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 3)

          setRecommendedJobs(scored)
        }
      } catch (err) {
        console.error('Overview load error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Welcome Banner */}
      <div className="rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 text-white">
        <h2 className="text-2xl font-bold">Welcome back, {firstName}! 👋</h2>
        <p className="mt-1 text-emerald-100">
          {stats.total === 0
            ? "You haven't applied to any jobs yet. Browse jobs to get started."
            : `You have ${stats.pending} pending application${stats.pending !== 1 ? 's' : ''}${
                stats.interviewing > 0 ? ` and ${stats.interviewing} interview${stats.interviewing !== 1 ? 's' : ''} scheduled` : ''
              }.`}
        </p>
        <div className="mt-4 flex gap-3">
          <Link href="/seeker/jobs">
            <Button className="bg-white text-emerald-700 hover:bg-emerald-50">
              Browse Jobs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/seeker/profile">
            <Button variant="outline" className="border-white text-emerald-700 hover:bg-emerald-500">
              Update Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Applications</p>
            </div>
          </CardContent>
        </Card>

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
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.interviewing}</p>
              <p className="text-sm text-gray-500">Interviewing</p>
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

      <div className="grid gap-6 lg:grid-cols-2">

        {/* Recent Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Applications</CardTitle>
            <Link href="/seeker/applications">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentApps.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Briefcase className="mb-2 h-8 w-8 text-gray-200" />
                <p className="text-sm text-gray-400">No applications yet.</p>
                <Link href="/seeker/jobs" className="mt-2 text-sm text-emerald-600 hover:underline">
                  Browse Jobs →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentApps.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                        {app.companyLogo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={app.companyLogo}
                            alt={app.company}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Building2 className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate font-medium text-gray-900">{app.jobTitle}</h4>
                        <p className="text-sm text-gray-500">{app.company}</p>
                        <p className="mt-0.5 text-xs text-gray-400">Applied {app.appliedAt}</p>
                      </div>
                    </div>
                    <span className={`ml-3 shrink-0 rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(app.status)}`}>
                      {statusLabels[app.status] ?? app.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Recommended Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">AI Picks for You</CardTitle>
              <Sparkles className="h-4 w-4 text-emerald-600" />
            </div>
            <Link href="/seeker/jobs">
              <Button variant="ghost" size="sm">
                Browse All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recommendedJobs.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Star className="mb-2 h-8 w-8 text-gray-200" />
                <p className="text-sm text-gray-400">
                  {stats.total === 0
                    ? 'Complete your profile with skills to get AI job recommendations.'
                    : 'No new jobs to recommend right now. Check back soon!'}
                </p>
                <Link href="/seeker/profile" className="mt-2 text-sm text-emerald-600 hover:underline">
                  Add Skills →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recommendedJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/50 p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-medium text-gray-900">{job.title}</h4>
                      <p className="text-sm text-gray-500">{job.company}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {job.location && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin className="h-3 w-3" />{job.location}
                          </span>
                        )}
                        {job.jobType && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Briefcase className="h-3 w-3" />
                            {jobTypeLabels[job.jobType] ?? job.jobType}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-3 flex shrink-0 flex-col items-end gap-2">
                      <Badge className={`text-xs font-semibold ${
                        job.matchScore >= 70
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        <TrendingUp className="mr-1 h-3 w-3" />
                        {job.matchScore}% Match
                      </Badge>
                      <Link href={`/seeker/jobs`}>
                        <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600 border-emerald-300">
                          View Job
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
