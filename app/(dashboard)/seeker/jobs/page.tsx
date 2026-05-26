'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Search,
  MapPin,
  Building2,
  Clock,
  Sparkles,
  Briefcase,
  DollarSign,
  TrendingUp,
  Filter,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface JobSkill {
  skills: { name: string }
}

interface JobWithScore {
  id: string
  title: string
  company: string
  companyLogo: string | null
  location: string
  type: string
  salary_min: number | null
  salary_max: number | null
  currency: string
  skills: string[]
  description: string
  created_at: string
  matchScore: number
  alreadyApplied: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const jobTypes: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  remote: 'Remote',
  internship: 'Internship',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSalary(min: number | null, max: number | null, currency: string) {
  if (!min && !max) return 'Salary not specified'
  const formatter = new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: currency || 'LKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  if (min && max) return `${formatter.format(min)} - ${formatter.format(max)}`
  if (min) return `From ${formatter.format(min)}`
  if (max) return `Up to ${formatter.format(max)}`
  return 'Salary not specified'
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`
}

/**
 * Calculate a match score between seeker skills and job required skills.
 * Returns 0-100 (percentage of job skills the seeker has).
 */
function computeMatchScore(seekerSkills: string[], jobSkills: string[]): number {
  if (jobSkills.length === 0) return 50 // No required skills = neutral match
  const seekerLower = seekerSkills.map((s) => s.toLowerCase())
  const matched = jobSkills.filter((js) => seekerLower.includes(js.toLowerCase()))
  return Math.round((matched.length / jobSkills.length) * 100)
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function SeekerJobsPage() {
  const supabase = createClient()

  // Data state
  const [jobs, setJobs] = useState<JobWithScore[]>([])
  const [seekerSkills, setSeekerSkills] = useState<string[]>([])
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  // UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selectedJob, setSelectedJob] = useState<JobWithScore | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [isApplying, setIsApplying] = useState(false)

  // Helper to open the detail dialog for a job
  const openDetail = (job: JobWithScore) => {
    setSelectedJob(job)
    setIsDetailDialogOpen(true)
  }

  // ── Load data ────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // 2. Fetch seeker's skills
      const { data: skillRows } = await supabase
        .from('seeker_skills')
        .select('skills(name)')
        .eq('seeker_id', user.id)

      const mySkills: string[] = (skillRows ?? [])
        .map((row: { skills: { name: string } | null }) => row.skills?.name)
        .filter(Boolean) as string[]
      setSeekerSkills(mySkills)

      // 3. Fetch all active jobs with their recruiter info and required skills
      const { data: jobRows, error: jobError } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          description,
          location,
          type,
          salary_min,
          salary_max,
          currency,
          created_at,
          recruiter_profiles!inner(company_name, company_logo),
          job_skills(skills(name))
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (jobError) {
        console.error('Jobs fetch error:', jobError)
        toast.error('Failed to load jobs')
        return
      }

      // 4. Fetch jobs the user has already applied to
      const { data: applications } = await supabase
        .from('applications')
        .select('job_id')
        .eq('seeker_id', user.id)

      const appliedIds = new Set<string>(
        (applications ?? []).map((a: { job_id: string }) => a.job_id)
      )
      setAppliedJobIds(appliedIds)

      // 5. Build JobWithScore array and compute match scores
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scored: JobWithScore[] = (jobRows ?? []).map((job: any) => {
        const jobSkillNames: string[] = (job.job_skills ?? [])
          .map((js: JobSkill) => js.skills?.name)
          .filter(Boolean)

        const recruiter = job.recruiter_profiles
        const companyName = recruiter?.company_name ?? 'Unknown Company'
        const companyLogo = recruiter?.company_logo ?? null

        return {
          id: job.id,
          title: job.title,
          company: companyName,
          companyLogo,
          location: job.location ?? 'Location not specified',
          type: job.type,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          currency: job.currency ?? 'LKR',
          skills: jobSkillNames,
          description: job.description ?? '',
          created_at: job.created_at,
          matchScore: computeMatchScore(mySkills, jobSkillNames),
          alreadyApplied: appliedIds.has(job.id),
        }
      })

      // 6. Sort by match score descending (most relevant first)
      scored.sort((a, b) => b.matchScore - a.matchScore)

      setJobs(scored)
    } catch (err) {
      console.error('Load error:', err)
      toast.error('Failed to load job listings')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ── Derived data ─────────────────────────────────────────────────────────────

  const aiPickedJobs = jobs.filter((j) => j.matchScore >= 70).slice(0, 5)

  const filteredJobs = jobs.filter((job) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      !searchQuery ||
      job.title.toLowerCase().includes(q) ||
      job.company.toLowerCase().includes(q) ||
      job.skills.some((s) => s.toLowerCase().includes(q))
    const matchesLocation =
      !locationFilter ||
      job.location.toLowerCase().includes(locationFilter.toLowerCase())
    const matchesType = !typeFilter || typeFilter === 'all' || job.type === typeFilter
    return matchesSearch && matchesLocation && matchesType
  })

  // ── Apply handler ─────────────────────────────────────────────────────────────

  const handleApply = async () => {
    if (!selectedJob || !userId) return
    setIsApplying(true)
    try {
      const { error } = await supabase
        .from('applications')
        // @ts-expect-error - Supabase type inference
        .insert({
          job_id: selectedJob.id,
          seeker_id: userId,
          cover_letter: coverLetter || null,
          status: 'pending',
          ai_match_score: selectedJob.matchScore,
        })

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already applied to this job.')
        } else {
          throw error
        }
        return
      }

      toast.success(`Application submitted for ${selectedJob.title}!`)
      setAppliedJobIds((prev) => new Set([...prev, selectedJob.id]))
      setJobs((prev) =>
        prev.map((j) =>
          j.id === selectedJob.id ? { ...j, alreadyApplied: true } : j
        )
      )
      setIsApplyDialogOpen(false)
      setCoverLetter('')
      setSelectedJob(null)
    } catch (err) {
      console.error('Apply error:', err)
      toast.error('Failed to submit application. Please try again.')
    } finally {
      setIsApplying(false)
    }
  }

  // ── Loading state ─────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-gray-500">Finding the best jobs for you...</p>
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* AI Picks Sidebar */}
      <aside className="w-full shrink-0 lg:w-80">
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-lg">AI Picks for You</CardTitle>
            </div>
            <p className="text-sm text-gray-500">
              {seekerSkills.length > 0
                ? `Based on your ${seekerSkills.length} skills`
                : 'Complete your profile to get better matches'}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiPickedJobs.length === 0 ? (
              <div className="rounded-lg border border-dashed border-emerald-200 p-4 text-center">
                <AlertCircle className="mx-auto mb-2 h-6 w-6 text-emerald-400" />
                <p className="text-sm text-gray-500">
                  {seekerSkills.length === 0
                    ? 'Add skills to your profile to see AI-matched jobs'
                    : 'No strong matches yet. More jobs coming soon!'}
                </p>
                {seekerSkills.length === 0 && (
                  <a
                    href="/seeker/profile"
                    className="mt-2 inline-block text-xs font-medium text-emerald-600 hover:underline"
                  >
                    Update Profile →
                  </a>
                )}
              </div>
            ) : (
              aiPickedJobs.map((job) => (
                <div key={job.id} className="space-y-2">
                  <button
                    onClick={() => openDetail(job)}
                    className={`w-full rounded-lg border bg-white p-3 text-left transition-all hover:border-emerald-400 hover:shadow-md ${
                      selectedJob?.id === job.id
                        ? 'border-emerald-400 ring-1 ring-emerald-400'
                        : 'border-emerald-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="truncate font-medium text-gray-900">{job.title}</h4>
                        <p className="truncate text-sm text-gray-500">{job.company}</p>
                        <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{job.location}</span>
                        </div>
                      </div>
                      <Badge className="shrink-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        <TrendingUp className="mr-1 h-3 w-3" />
                        {job.matchScore}%
                      </Badge>
                    </div>
                    {job.alreadyApplied && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" />
                        Applied
                      </div>
                    )}
                  </button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                    onClick={() => openDetail(job)}
                  >
                    View Job
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </aside>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search jobs, companies, or skills..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <div className="relative w-40">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Location"
                    className="pl-10"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(jobTypes).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(searchQuery || locationFilter || (typeFilter && typeFilter !== 'all')) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSearchQuery('')
                      setLocationFilter('')
                      setTypeFilter('')
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Listings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-700">{filteredJobs.length}</span> jobs
              {seekerSkills.length > 0 && ' · Sorted by best match'}
            </p>
            {seekerSkills.length === 0 && (
              <a
                href="/seeker/profile"
                className="text-xs font-medium text-emerald-600 hover:underline"
              >
                Add skills for better matches →
              </a>
            )}
          </div>

          {filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center">
                <Briefcase className="mb-3 h-10 w-10 text-gray-300" />
                <h3 className="font-medium text-gray-700">No jobs found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {jobs.length === 0
                    ? 'No active job listings available right now.'
                    : 'Try adjusting your search filters.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredJobs.map((job) => (
              <Card
                key={job.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedJob?.id === job.id
                    ? 'border-emerald-400 ring-1 ring-emerald-400'
                    : ''
                }`}
                onClick={() => setSelectedJob(job)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-4">
                      {/* Company Logo */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                        {job.companyLogo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={job.companyLogo}
                            alt={job.company}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Building2 className="h-6 w-6 text-gray-400" />
                        )}
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900">{job.title}</h3>
                        <p className="text-sm text-gray-500">{job.company}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {jobTypes[job.type] ?? job.type}
                          </span>
                          {(job.salary_min || job.salary_max) && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {formatSalary(job.salary_min, job.salary_max, job.currency)}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {timeAgo(job.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right badges */}
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {job.matchScore >= 70 && (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          {job.matchScore}% Match
                        </Badge>
                      )}
                      {job.alreadyApplied && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          Applied
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Skills */}
                  {job.skills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {job.skills.map((skill) => {
                        const isMatch = seekerSkills
                          .map((s) => s.toLowerCase())
                          .includes(skill.toLowerCase())
                        return (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className={
                              isMatch
                                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300'
                                : ''
                            }
                          >
                            {skill}
                          </Badge>
                        )
                      })}
                    </div>
                  )}

                  {/* Description preview */}
                  {job.description && (
                    <p className="mt-4 line-clamp-2 text-sm text-gray-600">
                      {job.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        openDetail(job)
                      }}
                    >
                      View Details
                    </Button>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700"
                      disabled={job.alreadyApplied}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedJob(job)
                        setIsApplyDialogOpen(true)
                      }}
                    >
                      {job.alreadyApplied ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Applied
                        </>
                      ) : (
                        'Quick Apply'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* ── Job Detail Dialog ─────────────────────────────────────────── */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedJob && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                    {selectedJob.companyLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selectedJob.companyLogo} alt={selectedJob.company} className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="h-7 w-7 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-xl">{selectedJob.title}</DialogTitle>
                    <DialogDescription className="text-base font-medium text-gray-600">
                      {selectedJob.company}
                    </DialogDescription>
                  </div>
                  {selectedJob.matchScore >= 70 && (
                    <Badge className="shrink-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-sm px-3 py-1">
                      <TrendingUp className="mr-1 h-4 w-4" />
                      {selectedJob.matchScore}% Match
                    </Badge>
                  )}
                </div>
              </DialogHeader>

              {/* Meta info */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 border-y py-4 my-2">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {selectedJob.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  {jobTypes[selectedJob.type] ?? selectedJob.type}
                </span>
                {(selectedJob.salary_min || selectedJob.salary_max) && (
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    {formatSalary(selectedJob.salary_min, selectedJob.salary_max, selectedJob.currency)}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-gray-400" />
                  Posted {timeAgo(selectedJob.created_at)}
                </span>
              </div>

              {/* AI Match summary */}
              {seekerSkills.length > 0 && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4">
                  <div className="flex items-center gap-2 font-medium text-emerald-700 mb-2">
                    <Sparkles className="h-4 w-4" />
                    AI Match Analysis
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-emerald-100 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all"
                        style={{ width: `${selectedJob.matchScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-emerald-700 w-12 text-right">
                      {selectedJob.matchScore}%
                    </span>
                  </div>
                  {selectedJob.skills.length > 0 && (
                    <p className="mt-2 text-xs text-emerald-600">
                      You match {selectedJob.skills.filter((s) =>
                        seekerSkills.map((sk) => sk.toLowerCase()).includes(s.toLowerCase())
                      ).length} of {selectedJob.skills.length} required skills
                    </p>
                  )}
                </div>
              )}

              {/* Required skills */}
              {selectedJob.skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.skills.map((skill) => {
                      const isMatch = seekerSkills
                        .map((s) => s.toLowerCase())
                        .includes(skill.toLowerCase())
                      return (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className={isMatch
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300'
                            : 'bg-gray-100 text-gray-600'
                          }
                        >
                          {isMatch && <CheckCircle2 className="mr-1 h-3 w-3" />}
                          {skill}
                        </Badge>
                      )
                    })}
                  </div>
                  {seekerSkills.length > 0 && (
                    <p className="mt-2 text-xs text-gray-400">
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" /> Green
                      </span>{' '}
                      = skills you already have
                    </p>
                  )}
                </div>
              )}

              {/* Job description */}
              {selectedJob.description && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Job Description</h4>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {selectedJob.description}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={selectedJob.alreadyApplied}
                  onClick={() => {
                    setIsDetailDialogOpen(false)
                    setIsApplyDialogOpen(true)
                  }}
                >
                  {selectedJob.alreadyApplied ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Already Applied
                    </>
                  ) : (
                    'Apply Now'
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Apply Dialog ──────────────────────────────────────────────── */}
      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply to {selectedJob?.title}</DialogTitle>
            <DialogDescription>at {selectedJob?.company}</DialogDescription>
          </DialogHeader>

          {/* Match score summary */}
          {selectedJob && selectedJob.matchScore > 0 && (
            <div className="rounded-lg bg-emerald-50 p-3 text-sm">
              <div className="flex items-center gap-2 font-medium text-emerald-700">
                <TrendingUp className="h-4 w-4" />
                {selectedJob.matchScore}% profile match
              </div>
              {selectedJob.skills.length > 0 && (
                <p className="mt-1 text-xs text-emerald-600">
                  You have{' '}
                  {selectedJob.skills.filter((s) =>
                    seekerSkills.map((sk) => sk.toLowerCase()).includes(s.toLowerCase())
                  ).length}{' '}
                  of {selectedJob.skills.length} required skills
                </p>
              )}
            </div>
          )}

          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Cover Letter <span className="font-normal text-gray-400">(Optional)</span>
              </label>
              <Textarea
                placeholder="Tell the employer why you're a great fit for this role..."
                className="mt-1"
                rows={6}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600">
                Your profile and CV will be shared with the employer. Make sure your profile is
                up to date.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsApplyDialogOpen(false)}
              disabled={isApplying}
            >
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleApply}
              disabled={isApplying}
            >
              {isApplying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
