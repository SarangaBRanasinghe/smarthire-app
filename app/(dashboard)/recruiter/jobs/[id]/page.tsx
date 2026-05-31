'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Users,
  Edit,
  Eye,
  TrendingUp,
  Star,
  Download,
  FileText,
} from 'lucide-react'
import type { ApplicationStatus, JobStatus, JobType } from '@/types/database'

type Job = {
  id: string
  title: string
  location: string | null
  type: JobType
  status: JobStatus
  salary_min: number | null
  salary_max: number | null
  currency: string | null
  description: string | null
  created_at: string
}

type Applicant = {
  id: string           // application id
  seekerId: string     // seeker's user id
  name: string
  email: string
  matchScore: number
  status: ApplicationStatus
  appliedAt: string
  resumeUrl: string | null
}

const statusConfig: Record<ApplicationStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  reviewing: { label: 'Reviewing', color: 'bg-blue-100 text-blue-700' },
  interview: { label: 'Interview', color: 'bg-purple-100 text-purple-700' },
  offer: { label: 'Offer', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
}

const jobTypeLabels: Record<JobType, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  remote: 'Remote',
  internship: 'Internship',
}

const jobStatusConfig: Record<JobStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  closed: { label: 'Closed', color: 'bg-red-100 text-red-700' },
}

function formatSalary(min: number | null, max: number | null, currency: string | null) {
  if (!min || !max || !currency) return 'Not specified'
  const formatter = new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  })
  return `${formatter.format(min)} - ${formatter.format(max)}`
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function JobDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const jobId = params?.id as string

  const [job, setJob] = useState<Job | null>(null)
  const [skills, setSkills] = useState<string[]>([])
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  useEffect(() => {
    async function fetchJobDetails() {
      if (!jobId) return

      try {
        // Fetch job details
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', jobId)
          .single()

        if (jobError) {
          console.error('Error fetching job:', jobError)
          toast.error('Failed to load job details')
          router.push('/recruiter/jobs')
          return
        }

        setJob(jobData as Job)

        // Fetch job skills
        const { data: jobSkills, error: skillsError } = await supabase
          .from('job_skills')
          .select('skill_id, skills(name)')
          .eq('job_id', jobId)

        if (!skillsError && jobSkills) {
          const skillNames = jobSkills
            .map((js: { skills: { name: string } | null }) => js.skills?.name)
            .filter((name): name is string => Boolean(name))
          setSkills(skillNames)
        }

        // ── Fetch applicants (flat queries, no nested joins) ────────────────

        // Step 1: plain applications
        const { data: applicationsData, error: applicationsError } = await supabase
          .from('applications')
          .select('id, seeker_id, status, ai_match_score, applied_at')
          .eq('job_id', jobId)
          .order('ai_match_score', { ascending: false })

        if (!applicationsError && applicationsData && applicationsData.length > 0) {
          const seekerIds: string[] = applicationsData.map((a: { seeker_id: string }) => a.seeker_id)

          // Step 2: profiles (name, email)
          const { data: profileRows } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', seekerIds)

          const profileMap: Record<string, { full_name: string | null; email: string }> = {}
          ;(profileRows ?? []).forEach((p: { id: string; full_name: string | null; email: string }) => {
            profileMap[p.id] = p
          })

          // Step 3: seeker_profiles (resume_url)
          const { data: seekerProfileRows } = await supabase
            .from('seeker_profiles')
            .select('id, resume_url')
            .in('id', seekerIds)

          const resumeMap: Record<string, string | null> = {}
          ;(seekerProfileRows ?? []).forEach((sp: { id: string; resume_url: string | null }) => {
            resumeMap[sp.id] = sp.resume_url
          })

          // Step 4: assemble
          const formattedApplicants: Applicant[] = applicationsData.map((app: {
            id: string
            seeker_id: string
            status: string
            ai_match_score: number | null
            applied_at: string
          }) => ({
            id: app.id,
            seekerId: app.seeker_id,
            name: profileMap[app.seeker_id]?.full_name || 'Unknown',
            email: profileMap[app.seeker_id]?.email || '',
            matchScore: app.ai_match_score || 0,
            status: app.status as ApplicationStatus,
            appliedAt: app.applied_at,
            resumeUrl: resumeMap[app.seeker_id] ?? null,
          }))

          setApplicants(formattedApplicants)
        }
      } catch (error) {
        console.error('Error:', error)
        toast.error('An error occurred while loading job details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchJobDetails()
  }, [jobId, supabase, router])


  const handleDownloadResume = async () => {
    if (!selectedApplicant) return

    const resumeUrl = selectedApplicant.resumeUrl
    if (!resumeUrl) {
      toast.error('No resume uploaded by this candidate.')
      return
    }

    try {
      // resumeUrl is stored as the storage path (e.g. "resumes/user-id/file.pdf")
      // Try to create a signed URL for private buckets, otherwise open directly
      const { data: signedData, error: signedError } = await supabase.storage
        .from('resumes')
        .createSignedUrl(resumeUrl.replace(/^.*resumes\//, ''), 60)

      if (!signedError && signedData?.signedUrl) {
        window.open(signedData.signedUrl, '_blank')
      } else {
        // Fallback: try opening the URL directly (public bucket)
        window.open(resumeUrl, '_blank')
      }
    } catch {
      toast.error('Failed to download resume. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
            <p className="mt-4 text-sm text-gray-500">Loading job details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900">Job not found</p>
            <Link href="/recruiter/jobs">
              <Button className="mt-4">Back to Jobs</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/recruiter/jobs"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Jobs
      </Link>

      {/* Job Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                <Badge className={jobStatusConfig[job.status].color}>
                  {jobStatusConfig[job.status].label}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {job.location || 'Not specified'}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  {jobTypeLabels[job.type]}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {formatSalary(job.salary_min, job.salary_max, job.currency)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Posted {formatDate(job.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {applicants.length} applicants
                </span>
              </div>
            </div>
            <Link href={`/recruiter/jobs/${job.id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit Job
              </Button>
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
            {skills.length === 0 && (
              <span className="text-sm text-gray-500">No skills specified</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="applicants">
        <TabsList>
          <TabsTrigger value="applicants">
            Applicants ({applicants.length})
          </TabsTrigger>
          <TabsTrigger value="description">Job Description</TabsTrigger>
        </TabsList>

        <TabsContent value="applicants" className="mt-6 space-y-4">
          {applicants.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No applicants yet</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Applications will appear here when candidates apply for this job
                </p>
              </CardContent>
            </Card>
          ) : (
            applicants.map((applicant, index) => (
            <Card
              key={applicant.id}
              className={`transition-all hover:shadow-md ${
                index === 0
                  ? 'border-2 border-amber-300 bg-amber-50/30'
                  : index < 3
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Rank Badge */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      index === 0
                        ? 'bg-amber-100 text-amber-700'
                        : index < 3
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {index === 0 && <Star className="h-4 w-4" />}
                    {index !== 0 && `#${index + 1}`}
                  </div>

                  {/* Candidate Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-emerald-100 text-emerald-700">
                          {applicant.name.split(' ').map((n) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-gray-900">{applicant.name}</h4>
                        <p className="text-sm text-gray-500">{applicant.email}</p>
                      </div>
                      <Badge className={statusConfig[applicant.status].color}>
                        {statusConfig[applicant.status].label}
                      </Badge>
                      {index === 0 && applicants.length > 1 && (
                        <Badge className="bg-amber-100 text-amber-700">
                          <Star className="mr-1 h-3 w-3" />
                          Top Match
                        </Badge>
                      )}
                    </div>

                    {/* Match Score & Key Strengths */}
                    <div className="mt-4 flex items-start gap-6">
                      <div className="flex items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                          <span className="text-lg font-bold text-emerald-700">
                            {applicant.matchScore}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-emerald-600">
                          <TrendingUp className="h-4 w-4" />
                          Match
                        </div>
                      </div>

                      <div className="flex-1">
                        <p className="text-sm text-gray-600">
                          Applied on {formatDate(applicant.appliedAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedApplicant(applicant)
                        setIsProfileDialogOpen(true)
                      }}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      View Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
          )}
        </TabsContent>

        <TabsContent value="description" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none whitespace-pre-wrap text-gray-600">
                {job.description || 'No description provided.'}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Candidate Profile</DialogTitle>
            <DialogDescription>
              Detailed profile for {selectedApplicant?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedApplicant && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-emerald-100 text-lg text-emerald-700">
                    {selectedApplicant.name.split(' ').map((n) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedApplicant.name}</h3>
                  <p className="text-sm text-gray-500">{selectedApplicant.email}</p>
                </div>
              </div>

              <div className="rounded-lg bg-emerald-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-emerald-700">AI Match Score</span>
                  <span className="text-2xl font-bold text-emerald-700">
                    {selectedApplicant.matchScore}%
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">Application Status</h4>
                <Badge className={`mt-2 ${statusConfig[selectedApplicant.status].color}`}>
                  {statusConfig[selectedApplicant.status].label}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleDownloadResume}
                  disabled={!selectedApplicant?.resumeUrl}
                  title={selectedApplicant?.resumeUrl ? 'Download resume' : 'No resume uploaded'}
                >
                  {selectedApplicant?.resumeUrl ? (
                    <><Download className="mr-2 h-4 w-4" />Download Resume</>
                  ) : (
                    <><FileText className="mr-2 h-4 w-4" />No Resume</>  
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
