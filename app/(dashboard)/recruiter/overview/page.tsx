'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import {
  Briefcase,
  Users,
  Clock,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  Plus,
  Eye,
  Loader2,
  Star,
  Sparkles,
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface RecentJob {
  id: string
  title: string
  applicants: number
  status: string
  postedAgo: string
}

interface TopCandidate {
  applicationId: string
  jobId: string
  name: string
  email: string
  avatarUrl: string
  appliedFor: string
  matchScore: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

function computeMatch(seekerSkills: string[], jobSkills: string[]): number {
  if (jobSkills.length === 0) return 50
  const lower = seekerSkills.map((s) => s.toLowerCase())
  const matched = jobSkills.filter((js) => lower.includes(js.toLowerCase()))
  return Math.round((matched.length / jobSkills.length) * 100)
}

const jobStatusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'Active',  color: 'bg-green-100 text-green-700' },
  draft:  { label: 'Draft',   color: 'bg-gray-100 text-gray-700' },
  closed: { label: 'Closed',  color: 'bg-red-100 text-red-700' },
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function RecruiterOverviewPage() {
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(true)
  const [firstName, setFirstName] = useState('')
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplicants: 0,
    interviewing: 0,
    offersGiven: 0,
  })
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([])
  const [topCandidates, setTopCandidates] = useState<TopCandidate[]>([])

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

        // ── Recruiter's jobs ────────────────────────────────────────────────
        const { data: jobRows } = await supabase
          .from('jobs')
          .select('id, title, status, created_at')
          .eq('recruiter_id', user.id)
          .order('created_at', { ascending: false })

        const jobs = (jobRows ?? []) as { id: string; title: string; status: string; created_at: string }[]
        const jobIds = jobs.map((j) => j.id)
        const activeJobs = jobs.filter((j) => j.status === 'active')

        // ── All applications for this recruiter's jobs ──────────────────────
        let allApps: { id: string; job_id: string; seeker_id: string; status: string }[] = []
        if (jobIds.length > 0) {
          const { data: appRows } = await supabase
            .from('applications')
            .select('id, job_id, seeker_id, status')
            .in('job_id', jobIds)

          allApps = (appRows ?? []) as typeof allApps
        }

        // Stats
        const appCountByJob: Record<string, number> = {}
        allApps.forEach((a) => {
          appCountByJob[a.job_id] = (appCountByJob[a.job_id] || 0) + 1
        })

        setStats({
          activeJobs: activeJobs.length,
          totalApplicants: allApps.length,
          interviewing: allApps.filter((a) => a.status === 'interview').length,
          offersGiven: allApps.filter((a) => a.status === 'offer').length,
        })

        // ── Recent jobs (up to 3, any status) ──────────────────────────────
        setRecentJobs(
          jobs.slice(0, 3).map((j) => ({
            id: j.id,
            title: j.title,
            applicants: appCountByJob[j.id] || 0,
            status: j.status,
            postedAgo: timeAgo(j.created_at),
          }))
        )

        // ── Top AI-matched candidates ───────────────────────────────────────
        // Only consider active jobs with applicants
        if (allApps.length > 0 && jobIds.length > 0) {
          const seekerIds = [...new Set(allApps.map((a) => a.seeker_id))]

          // Seeker names
          const { data: profileRows } = await supabase
            .from('profiles')
            .select('id, full_name, email, avatar_url')
            .in('id', seekerIds)

          const profileMap: Record<string, { full_name: string | null; email: string; avatar_url: string | null }> = {}
          ;(profileRows ?? []).forEach((p: { id: string; full_name: string | null; email: string; avatar_url: string | null }) => {
            profileMap[p.id] = p
          })

          // Seeker skills
          const { data: seekerSkillRows } = await supabase
            .from('seeker_skills')
            .select('seeker_id, skills(name)')
            .in('seeker_id', seekerIds)

          const seekerSkillsMap: Record<string, string[]> = {}
          seekerIds.forEach((id) => { seekerSkillsMap[id] = [] })
          ;(seekerSkillRows ?? []).forEach((row: { seeker_id: string; skills: { name: string } | null }) => {
            if (row.skills?.name) seekerSkillsMap[row.seeker_id].push(row.skills.name)
          })

          // Job skills
          const { data: jobSkillRows } = await supabase
            .from('job_skills')
            .select('job_id, skills(name)')
            .in('job_id', jobIds)

          const jobSkillsMap: Record<string, string[]> = {}
          ;(jobSkillRows ?? []).forEach((js: { job_id: string; skills: { name: string } | null }) => {
            if (!jobSkillsMap[js.job_id]) jobSkillsMap[js.job_id] = []
            if (js.skills?.name) jobSkillsMap[js.job_id].push(js.skills.name)
          })

          // Job title map
          const jobTitleMap: Record<string, string> = {}
          jobs.forEach((j) => { jobTitleMap[j.id] = j.title })

          // Score all applications
          const scored = allApps.map((app) => ({
            applicationId: app.id,
            jobId: app.job_id,
            seekerId: app.seeker_id,
            name: profileMap[app.seeker_id]?.full_name || 'Unknown',
            email: profileMap[app.seeker_id]?.email || '',
            avatarUrl: profileMap[app.seeker_id]?.avatar_url || '',
            appliedFor: jobTitleMap[app.job_id] || 'Unknown Job',
            matchScore: computeMatch(
              seekerSkillsMap[app.seeker_id] ?? [],
              jobSkillsMap[app.job_id] ?? []
            ),
          }))

          // Sort by match score, take top 3 unique candidates
          const seen = new Set<string>()
          const top3 = scored
            .sort((a, b) => b.matchScore - a.matchScore)
            .filter((c) => {
              if (seen.has(c.seekerId)) return false
              seen.add(c.seekerId)
              return true
            })
            .slice(0, 3)

          setTopCandidates(top3)
        }
      } catch (err) {
        console.error('Recruiter overview load error:', err)
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
      <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 text-white">
        <div>
          <h2 className="text-2xl font-bold">Welcome back, {firstName}! 👋</h2>
          <p className="mt-1 text-emerald-100">
            {stats.activeJobs === 0
              ? "You have no active jobs yet. Post your first job to start finding talent."
              : `You have ${stats.totalApplicants} applicant${stats.totalApplicants !== 1 ? 's' : ''} across ${stats.activeJobs} active job${stats.activeJobs !== 1 ? 's' : ''}.`}
          </p>
        </div>
        <Link href="/recruiter/jobs/create">
          <Button className="bg-white text-emerald-700 hover:bg-emerald-50">
            <Plus className="mr-2 h-4 w-4" />
            Post New Job
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Briefcase className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.activeJobs}</p>
              <p className="text-sm text-gray-500">Active Jobs</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalApplicants}</p>
              <p className="text-sm text-gray-500">Total Applicants</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
              <Clock className="h-6 w-6 text-yellow-600" />
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
              <p className="text-2xl font-bold">{stats.offersGiven}</p>
              <p className="text-sm text-gray-500">Offers Given</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        {/* Recent Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Your Jobs</CardTitle>
            <Link href="/recruiter/jobs">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentJobs.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Briefcase className="mb-2 h-8 w-8 text-gray-200" />
                <p className="text-sm text-gray-400">No jobs posted yet.</p>
                <Link href="/recruiter/jobs/create" className="mt-2 text-sm text-emerald-600 hover:underline">
                  Post your first job →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentJobs.map((job) => {
                  const statusCfg = jobStatusConfig[job.status] ?? jobStatusConfig.draft
                  return (
                    <div
                      key={job.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate font-medium text-gray-900">{job.title}</h4>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {job.applicants} applicant{job.applicants !== 1 ? 's' : ''}
                          </span>
                          <span>Posted {job.postedAgo}</span>
                        </div>
                      </div>
                      <div className="ml-3 flex shrink-0 items-center gap-2">
                        <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
                        <Link href={`/recruiter/jobs/${job.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="mr-1 h-4 w-4" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top AI Matched Candidates */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Top AI Matches</CardTitle>
              <Sparkles className="h-4 w-4 text-emerald-600" />
            </div>
            <Link href="/recruiter/candidates">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {topCandidates.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Star className="mb-2 h-8 w-8 text-gray-200" />
                <p className="text-sm text-gray-400">
                  {stats.activeJobs === 0
                    ? 'Post a job to start receiving candidate matches.'
                    : 'No candidates have applied yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {topCandidates.map((candidate, index) => (
                  <div
                    key={candidate.applicationId}
                    className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/50 p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {/* Rank / Avatar */}
                      <div className="relative shrink-0">
                        <Avatar className="h-10 w-10">
                          {candidate.avatarUrl && (
                            <AvatarImage src={candidate.avatarUrl} alt={`${candidate.name} avatar`} />
                          )}
                          <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-bold">
                            {candidate.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        {index === 0 && (
                          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400">
                            <Star className="h-2.5 w-2.5 text-white fill-white" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate font-medium text-gray-900">{candidate.name}</h4>
                        <p className="truncate text-xs text-gray-400">
                          Applied for: {candidate.appliedFor}
                        </p>
                      </div>
                    </div>
                    <div className="ml-3 flex shrink-0 flex-col items-end gap-1.5">
                      <Badge className={`text-xs font-semibold ${
                        candidate.matchScore >= 70
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        <TrendingUp className="mr-1 h-3 w-3" />
                        {candidate.matchScore}% Match
                      </Badge>
                      <Link href="/recruiter/candidates">
                        <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600 border-emerald-300">
                          View Profile
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
