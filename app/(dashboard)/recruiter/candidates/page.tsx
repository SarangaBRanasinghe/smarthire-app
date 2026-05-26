'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Sparkles,
  TrendingUp,
  Star,
  Calendar,
  Eye,
  MapPin,
  Mail,
  Phone,
  Award,
  Video,
  Building2,
  PhoneCall,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Briefcase,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Job {
  id: string
  title: string
  applicantCount: number
  requiredSkills: string[]
}

interface Candidate {
  applicationId: string
  seekerId: string
  name: string
  email: string
  phone: string
  location: string
  bio: string
  skills: string[]        // seeker's skills
  matchedSkills: string[] // skills that match job requirements
  missingSkills: string[] // job skills the seeker doesn't have
  matchScore: number      // 0-100
  rank: number
  appliedAt: string
  applicationStatus: string
  coverLetter: string | null
  experienceSummary: string
  educationSummary: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeMatchScore(seekerSkills: string[], jobSkills: string[]): number {
  if (jobSkills.length === 0) return 50
  const seekerLower = seekerSkills.map((s) => s.toLowerCase())
  const matched = jobSkills.filter((js) => seekerLower.includes(js.toLowerCase()))
  return Math.round((matched.length / jobSkills.length) * 100)
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

function getStatusColor(status: string) {
  switch (status) {
    case 'pending': return 'bg-gray-100 text-gray-600'
    case 'reviewing': return 'bg-blue-100 text-blue-700'
    case 'interview': return 'bg-purple-100 text-purple-700'
    case 'offer': return 'bg-emerald-100 text-emerald-700'
    case 'rejected': return 'bg-red-100 text-red-600'
    default: return 'bg-gray-100 text-gray-600'
  }
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  reviewing: 'Reviewing',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
}

const APPLICATION_STATUSES = ['pending', 'reviewing', 'interview', 'offer', 'rejected']

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CandidatesPage() {
  const supabase = createClient()

  // Data
  const [jobs, setJobs] = useState<Job[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [isLoadingJobs, setIsLoadingJobs] = useState(true)
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false)
  const [recruiterId, setRecruiterId] = useState<string | null>(null)

  // UI
  const [selectedJobId, setSelectedJobId] = useState<string>('')
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)

  // ── Load recruiter's jobs ──────────────────────────────────────────────────

  useEffect(() => {
    async function loadJobs() {
      setIsLoadingJobs(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setRecruiterId(user.id)

        // Fetch recruiter's active (and draft) jobs with their skill requirements
        const { data: jobRows, error } = await supabase
          .from('jobs')
          .select(`
            id,
            title,
            job_skills(skills(name))
          `)
          .eq('recruiter_id', user.id)
          .in('status', ['active', 'draft'])
          .order('created_at', { ascending: false })

        if (error) {
          toast.error('Failed to load jobs')
          return
        }

        // Count applicants per job
        const { data: appCounts } = await supabase
          .from('applications')
          .select('job_id')
          .in('job_id', (jobRows ?? []).map((j: { id: string }) => j.id))

        const countMap: Record<string, number> = {}
        ;(appCounts ?? []).forEach((a: { job_id: string }) => {
          countMap[a.job_id] = (countMap[a.job_id] || 0) + 1
        })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const builtJobs: Job[] = (jobRows ?? []).map((j: any) => ({
          id: j.id,
          title: j.title,
          applicantCount: countMap[j.id] || 0,
          requiredSkills: (j.job_skills ?? [])
            .map((js: { skills: { name: string } | null }) => js.skills?.name)
            .filter(Boolean) as string[],
        }))

        setJobs(builtJobs)
        if (builtJobs.length > 0) setSelectedJobId(builtJobs[0].id)
      } finally {
        setIsLoadingJobs(false)
      }
    }
    loadJobs()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Load candidates for selected job ──────────────────────────────────────

  const loadCandidates = useCallback(async (jobId: string) => {
    if (!jobId) return
    setIsLoadingCandidates(true)
    try {
      // Get required skills for this job
      const selectedJob = jobs.find((j) => j.id === jobId)
      const jobSkills = selectedJob?.requiredSkills ?? []

      // ── Step 1: Fetch plain applications (no joins) ──────────────────────
      const { data: applications, error } = await supabase
        .from('applications')
        .select('id, seeker_id, status, cover_letter, applied_at, ai_match_score')
        .eq('job_id', jobId)
        .order('applied_at', { ascending: false })

      if (error) {
        console.error('Applications fetch error:', error)
        toast.error('Failed to load candidates')
        return
      }

      if (!applications || applications.length === 0) {
        setCandidates([])
        return
      }

      const seekerIds: string[] = applications.map((a: { seeker_id: string }) => a.seeker_id)

      // ── Step 2: Fetch profiles (name, email) ────────────────────────────
      const { data: profileRows } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', seekerIds)

      const profileMap: Record<string, { full_name: string | null; email: string }> = {}
      ;(profileRows ?? []).forEach((p: { id: string; full_name: string | null; email: string }) => {
        profileMap[p.id] = p
      })

      // ── Step 3: Fetch seeker_profiles (bio, phone, location, summaries) ──
      const { data: seekerProfileRows } = await supabase
        .from('seeker_profiles')
        .select('id, bio, phone, location, experience_summary, education_summary')
        .in('id', seekerIds)

      const seekerProfileMap: Record<string, {
        bio: string | null
        phone: string | null
        location: string | null
        experience_summary: unknown
        education_summary: unknown
      }> = {}
      ;(seekerProfileRows ?? []).forEach((sp: {
        id: string; bio: string | null; phone: string | null; location: string | null;
        experience_summary: unknown; education_summary: unknown
      }) => {
        seekerProfileMap[sp.id] = sp
      })

      // ── Step 4: Fetch seeker skills ──────────────────────────────────────
      let seekerSkillsMap: Record<string, string[]> = {}
      seekerIds.forEach((id) => { seekerSkillsMap[id] = [] })

      const { data: skillRows } = await supabase
        .from('seeker_skills')
        .select('seeker_id, skills(name)')
        .in('seeker_id', seekerIds)

      ;(skillRows ?? []).forEach((row: { seeker_id: string; skills: { name: string } | null }) => {
        if (row.skills?.name) {
          seekerSkillsMap[row.seeker_id] = [...(seekerSkillsMap[row.seeker_id] || []), row.skills.name]
        }
      })

      // ── Step 5: Build candidate objects with match scores ────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const built: Candidate[] = (applications ?? []).map((app: any) => {
        const profile = profileMap[app.seeker_id]
        const sp = seekerProfileMap[app.seeker_id]
        const seekerSkills = seekerSkillsMap[app.seeker_id] ?? []
        const score = computeMatchScore(seekerSkills, jobSkills)
        const jobSkillsLower = jobSkills.map((s) => s.toLowerCase())
        const seekerSkillsLower = seekerSkills.map((s) => s.toLowerCase())
        const matched = seekerSkills.filter((s) => jobSkillsLower.includes(s.toLowerCase()))
        const missing = jobSkills.filter((s) => !seekerSkillsLower.includes(s.toLowerCase()))

        return {
          applicationId: app.id,
          seekerId: app.seeker_id,
          name: profile?.full_name || 'Unknown',
          email: profile?.email || '',
          phone: sp?.phone || '',
          location: sp?.location || 'Not specified',
          bio: sp?.bio || '',
          skills: seekerSkills,
          matchedSkills: matched,
          missingSkills: missing,
          matchScore: score,
          rank: 0,
          appliedAt: app.applied_at,
          applicationStatus: app.status,
          coverLetter: app.cover_letter,
          experienceSummary: typeof sp?.experience_summary === 'string'
            ? sp.experience_summary : '',
          educationSummary: typeof sp?.education_summary === 'string'
            ? sp.education_summary : '',
        }
      })

      // Sort by match score desc and assign ranks
      built.sort((a, b) => b.matchScore - a.matchScore)
      built.forEach((c, i) => { c.rank = i + 1 })

      setCandidates(built)
    } finally {
      setIsLoadingCandidates(false)
    }
  }, [jobs, supabase])

  useEffect(() => {
    if (selectedJobId) loadCandidates(selectedJobId)
  }, [selectedJobId, loadCandidates])

  // ── Update application status ──────────────────────────────────────────────

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    setUpdatingStatusId(applicationId)
    try {
      const { error } = await supabase
        .from('applications')
        // @ts-expect-error - Supabase type inference
        .update({ status: newStatus })
        .eq('id', applicationId)

      if (error) throw error

      setCandidates((prev) =>
        prev.map((c) =>
          c.applicationId === applicationId ? { ...c, applicationStatus: newStatus } : c
        )
      )
      if (selectedCandidate?.applicationId === applicationId) {
        setSelectedCandidate((prev) => prev ? { ...prev, applicationStatus: newStatus } : null)
      }
      toast.success(`Status updated to ${statusLabels[newStatus]}`)
    } catch {
      toast.error('Failed to update status')
    } finally {
      setUpdatingStatusId(null)
    }
  }

  // ── Rank helpers ───────────────────────────────────────────────────────────

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-white'
    if (rank === 2) return 'border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-white'
    if (rank === 3) return 'border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-white'
    return ''
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-amber-100 text-amber-700"><Award className="mr-1 h-3 w-3" />Top 1</Badge>
    if (rank === 2) return <Badge className="bg-gray-100 text-gray-700">Top 2</Badge>
    if (rank === 3) return <Badge className="bg-orange-100 text-orange-700">Top 3</Badge>
    return null
  }

  // ── Derived stats ──────────────────────────────────────────────────────────

  const highMatchCount = candidates.filter((c) => c.matchScore >= 70).length
  const avgScore = candidates.length > 0
    ? Math.round(candidates.reduce((s, c) => s + c.matchScore, 0) / candidates.length)
    : 0

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-emerald-600" />
          <h1 className="text-2xl font-bold text-gray-900">AI Candidate Shortlist</h1>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Candidates ranked by skill-match score — highest match shown first
        </p>
      </div>

      {/* Job Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <label className="shrink-0 text-sm font-medium text-gray-700">Select Job:</label>
            {isLoadingJobs ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading jobs...
              </div>
            ) : jobs.length === 0 ? (
              <p className="text-sm text-gray-400">No jobs found. Create a job first.</p>
            ) : (
              <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                <SelectTrigger className="w-96">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title} ({job.applicantCount} applicant{job.applicantCount !== 1 ? 's' : ''})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights Card */}
      <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-white">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg">AI Matching Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-2xl font-bold text-emerald-600">{candidates.length}</p>
              <p className="text-sm text-gray-500">Total Applicants</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-2xl font-bold text-emerald-600">{highMatchCount}</p>
              <p className="text-sm text-gray-500">High Match (70%+)</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-2xl font-bold text-emerald-600">
                {candidates.length > 0 ? `${avgScore}%` : '—'}
              </p>
              <p className="text-sm text-gray-500">Average Match Score</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidates List */}
      {isLoadingCandidates ? (
        <div className="flex min-h-40 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <p className="text-sm text-gray-500">Ranking candidates by match score...</p>
          </div>
        </div>
      ) : candidates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-14 text-center">
            <AlertCircle className="mb-3 h-10 w-10 text-gray-300" />
            <h3 className="font-medium text-gray-700">No applicants yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Candidates who apply to this job will appear here, ranked by how well they match.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {candidates.map((candidate) => {
            const selectedJob = jobs.find((j) => j.id === selectedJobId)
            return (
              <Card
                key={candidate.applicationId}
                className={`transition-all hover:shadow-lg ${getRankStyle(candidate.rank)}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    {/* Rank & Avatar */}
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ${
                          candidate.rank === 1
                            ? 'bg-amber-100 text-amber-700'
                            : candidate.rank <= 3
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {candidate.rank === 1 ? <Star className="h-6 w-6" /> : `#${candidate.rank}`}
                      </div>
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="bg-emerald-100 text-lg text-emerald-700">
                          {candidate.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Candidate Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-semibold text-gray-900">{candidate.name}</h3>
                        {getRankBadge(candidate.rank)}
                        <Badge className={getStatusColor(candidate.applicationStatus)}>
                          {statusLabels[candidate.applicationStatus] || candidate.applicationStatus}
                        </Badge>
                        <span className="text-xs text-gray-400">Applied {timeAgo(candidate.appliedAt)}</span>
                      </div>

                      {candidate.bio && (
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">{candidate.bio}</p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        {candidate.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />{candidate.location}
                          </span>
                        )}
                        {candidate.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />{candidate.email}
                          </span>
                        )}
                      </div>

                      {/* Skills — matched highlighted */}
                      {candidate.skills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {candidate.skills.map((skill) => {
                            const isMatch = (selectedJob?.requiredSkills ?? [])
                              .map((s) => s.toLowerCase())
                              .includes(skill.toLowerCase())
                            return (
                              <Badge
                                key={skill}
                                variant="secondary"
                                className={`text-xs ${isMatch ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300' : ''}`}
                              >
                                {isMatch && <CheckCircle2 className="mr-1 h-3 w-3" />}
                                {skill}
                              </Badge>
                            )
                          })}
                        </div>
                      )}

                      {/* Missing skills */}
                      {candidate.missingSkills.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-amber-600 font-medium">
                            Missing: {candidate.missingSkills.join(', ')}
                          </p>
                        </div>
                      )}

                      {/* Matched skills summary */}
                      <p className="mt-2 text-xs text-gray-400">
                        Matches {candidate.matchedSkills.length} of {selectedJob?.requiredSkills.length ?? 0} required skills
                        {selectedJob?.requiredSkills.length === 0 && ' (no skills specified for this job)'}
                      </p>
                    </div>

                    {/* Match Score & Actions */}
                    <div className="flex shrink-0 flex-col items-end gap-4">
                      {/* Score circle */}
                      <div className="text-center">
                        <div
                          className={`flex h-20 w-20 items-center justify-center rounded-full ${
                            candidate.matchScore >= 70
                              ? 'bg-emerald-100'
                              : candidate.matchScore >= 50
                              ? 'bg-yellow-100'
                              : 'bg-red-50'
                          }`}
                        >
                          <span
                            className={`text-2xl font-bold ${
                              candidate.matchScore >= 70
                                ? 'text-emerald-700'
                                : candidate.matchScore >= 50
                                ? 'text-yellow-700'
                                : 'text-red-600'
                            }`}
                          >
                            {candidate.matchScore}%
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Match Score</p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCandidate(candidate)
                            setIsProfileDialogOpen(true)
                          }}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          View Profile
                        </Button>
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700"
                          size="sm"
                          onClick={() => {
                            setSelectedCandidate(candidate)
                            setIsScheduleDialogOpen(true)
                          }}
                        >
                          <Calendar className="mr-1 h-4 w-4" />
                          Schedule
                        </Button>
                      </div>

                      {/* Status update */}
                      <Select
                        value={candidate.applicationStatus}
                        onValueChange={(val) => handleStatusChange(candidate.applicationId, val)}
                        disabled={updatingStatusId === candidate.applicationId}
                      >
                        <SelectTrigger className="h-8 w-32 text-xs">
                          {updatingStatusId === candidate.applicationId
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <SelectValue />
                          }
                        </SelectTrigger>
                        <SelectContent>
                          {APPLICATION_STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">
                              {statusLabels[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Profile Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Candidate Profile</DialogTitle>
            <DialogDescription>
              Full profile details for {selectedCandidate?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-6 py-2">
              {/* Header */}
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20 shrink-0">
                  <AvatarFallback className="bg-emerald-100 text-2xl text-emerald-700">
                    {selectedCandidate.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold">{selectedCandidate.name}</h3>
                    {getRankBadge(selectedCandidate.rank)}
                  </div>
                  {selectedCandidate.bio && (
                    <p className="mt-1 text-sm text-gray-600">{selectedCandidate.bio}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
                    {selectedCandidate.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />{selectedCandidate.email}
                      </span>
                    )}
                    {selectedCandidate.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />{selectedCandidate.phone}
                      </span>
                    )}
                    {selectedCandidate.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />{selectedCandidate.location}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-center shrink-0">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-full ${
                    selectedCandidate.matchScore >= 70 ? 'bg-emerald-100' : 'bg-yellow-100'
                  }`}>
                    <span className={`text-xl font-bold ${
                      selectedCandidate.matchScore >= 70 ? 'text-emerald-700' : 'text-yellow-700'
                    }`}>
                      {selectedCandidate.matchScore}%
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Match</p>
                </div>
              </div>

              {/* Match breakdown */}
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4">
                <div className="flex items-center gap-2 font-medium text-emerald-700 mb-2">
                  <Sparkles className="h-4 w-4" />
                  Skill Match Breakdown
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 bg-emerald-100 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{ width: `${selectedCandidate.matchScore}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-emerald-700 w-10 text-right">
                    {selectedCandidate.matchScore}%
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-2 mt-3">
                  {selectedCandidate.matchedSkills.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-emerald-700 mb-1">✓ Matched Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedCandidate.matchedSkills.map((s) => (
                          <Badge key={s} className="text-xs bg-emerald-100 text-emerald-700">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedCandidate.missingSkills.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-amber-600 mb-1">✗ Missing Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedCandidate.missingSkills.map((s) => (
                          <Badge key={s} variant="outline" className="text-xs text-amber-600 border-amber-300">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* All skills */}
              {selectedCandidate.skills.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">All Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.skills.map((skill) => (
                      <Badge key={skill} className="bg-emerald-100 text-emerald-700">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience & Education */}
              {(selectedCandidate.experienceSummary || selectedCandidate.educationSummary) && (
                <div className="grid gap-4 md:grid-cols-2">
                  {selectedCandidate.experienceSummary && (
                    <div>
                      <h4 className="flex items-center gap-1 font-medium text-gray-900 mb-1">
                        <Briefcase className="h-4 w-4" /> Experience
                      </h4>
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {selectedCandidate.experienceSummary}
                      </p>
                    </div>
                  )}
                  {selectedCandidate.educationSummary && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Education</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {selectedCandidate.educationSummary}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Cover letter */}
              {selectedCandidate.coverLetter && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Cover Letter</h4>
                  <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600 whitespace-pre-line">
                    {selectedCandidate.coverLetter}
                  </p>
                </div>
              )}

              {/* Status changer */}
              <div className="flex items-center gap-3 border-t pt-4">
                <label className="text-sm font-medium text-gray-700">Update Status:</label>
                <Select
                  value={selectedCandidate.applicationStatus}
                  onValueChange={(val) => handleStatusChange(selectedCandidate.applicationId, val)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APPLICATION_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    setIsProfileDialogOpen(false)
                    setIsScheduleDialogOpen(true)
                  }}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Interview
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Schedule Interview Dialog ──────────────────────────────────────── */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogDescription>
              Schedule an interview with {selectedCandidate?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="flex flex-col gap-2 py-4"
                onClick={() => {
                  handleStatusChange(selectedCandidate?.applicationId ?? '', 'interview')
                  toast.success(`Video interview scheduled with ${selectedCandidate?.name}`)
                  setIsScheduleDialogOpen(false)
                }}
              >
                <Video className="h-5 w-5" />
                <span className="text-xs">Video Call</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col gap-2 py-4"
                onClick={() => {
                  handleStatusChange(selectedCandidate?.applicationId ?? '', 'interview')
                  toast.success(`Phone interview scheduled with ${selectedCandidate?.name}`)
                  setIsScheduleDialogOpen(false)
                }}
              >
                <PhoneCall className="h-5 w-5" />
                <span className="text-xs">Phone Call</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col gap-2 py-4"
                onClick={() => {
                  handleStatusChange(selectedCandidate?.applicationId ?? '', 'interview')
                  toast.success(`In-person interview scheduled with ${selectedCandidate?.name}`)
                  setIsScheduleDialogOpen(false)
                }}
              >
                <Building2 className="h-5 w-5" />
                <span className="text-xs">In Person</span>
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Selecting an interview type will update the application status to{' '}
              <strong>Interview</strong> and notify the candidate.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
