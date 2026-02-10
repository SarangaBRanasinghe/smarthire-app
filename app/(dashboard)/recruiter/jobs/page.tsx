'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Users,
  Briefcase,
  Clock,
  MapPin,
  DollarSign,
} from 'lucide-react'
import type { JobStatus, Database } from '@/types/database'

type Job = {
  id: string
  title: string
  location: string | null
  type: string
  status: JobStatus
  applicants: number
  created_at: string
  salary_min: number | null
  salary_max: number | null
  currency: string | null
}

const statusConfig: Record<JobStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  closed: { label: 'Closed', color: 'bg-red-100 text-red-700' },
}

const jobTypes: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  remote: 'Remote',
  internship: 'Internship',
}

function formatSalary(min: number | null, max: number | null, currency: string | null) {
  if (!min || !max || !currency) return 'Not specified'
  
  const formatter = new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

export default function RecruiterJobsPage() {
  const supabase = createClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch jobs from Supabase
  useEffect(() => {
    async function fetchJobs() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          toast.error('Please login to view jobs')
          return
        }

        // Fetch jobs for this recruiter
        const { data: jobsData, error: jobsError } = await supabase
          .from('jobs')
          .select('*')
          .eq('recruiter_id', user.id)
          .order('created_at', { ascending: false })
          .returns<Database['public']['Tables']['jobs']['Row'][]>()

        if (jobsError) {
          console.error('Error fetching jobs:', jobsError)
          toast.error('Failed to fetch jobs')
          return
        }

        if (!jobsData) {
          setJobs([])
          return
        }

        // Fetch application counts for each job
        const jobsWithApplicants: Job[] = await Promise.all(
          jobsData.map(async (job): Promise<Job> => {
            const { count } = await supabase
              .from('applications')
              .select('*', { count: 'exact', head: true })
              .eq('job_id', job.id)

            return {
              id: job.id,
              title: job.title,
              location: job.location,
              type: job.type,
              status: job.status,
              applicants: count || 0,
              created_at: job.created_at,
              salary_min: job.salary_min,
              salary_max: job.salary_max,
              currency: job.currency,
            }
          })
        )

        setJobs(jobsWithApplicants)
      } catch (error) {
        console.error('Error:', error)
        toast.error('An error occurred while fetching jobs')
      } finally {
        setIsLoading(false)
      }
    }

    fetchJobs()
  }, [supabase])

  const stats = {
    active: jobs.filter((j) => j.status === 'active').length,
    draft: jobs.filter((j) => j.status === 'draft').length,
    totalApplicants: jobs.reduce((sum, j) => sum + j.applicants, 0),
  }

  const filteredJobs = jobs.filter((job) =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDelete = async () => {
    if (!selectedJob) return

    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', selectedJob.id)

      if (error) {
        console.error('Error deleting job:', error)
        toast.error('Failed to delete job')
        return
      }

      toast.success(`Job "${selectedJob.title}" deleted successfully`)
      // Remove from local state
      setJobs(jobs.filter(j => j.id !== selectedJob.id))
      setDeleteDialogOpen(false)
      setSelectedJob(null)
    } catch (error) {
      console.error('Error:', error)
      toast.error('An error occurred while deleting the job')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
            <p className="mt-4 text-sm text-gray-500">Loading jobs...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Postings</h1>
          <p className="text-sm text-gray-500">
            Manage your job listings and track applicants
          </p>
        </div>
        <Link href="/recruiter/jobs/create">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="mr-2 h-4 w-4" />
            Create New Job
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Briefcase className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-sm text-gray-500">Active Jobs</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <Clock className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.draft}</p>
              <p className="text-sm text-gray-500">Draft Jobs</p>
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
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search jobs..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>All Jobs ({filteredJobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-gray-900">{job.title}</h4>
                    <Badge className={statusConfig[job.status].color}>
                      {statusConfig[job.status].label}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {jobTypes[job.type]}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {formatSalary(job.salary_min, job.salary_max, job.currency)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {job.applicants} applicants
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Posted {formatDate(job.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/recruiter/jobs/${job.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="mr-1 h-4 w-4" />
                      View
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/recruiter/jobs/${job.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => {
                          setSelectedJob(job)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}

            {filteredJobs.length === 0 && (
              <div className="py-12 text-center">
                <Briefcase className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No jobs found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Get started by creating your first job posting'}
                </p>
                {!searchQuery && (
                  <Link href="/recruiter/jobs/create">
                    <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Job
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedJob?.title}&quot;? This action cannot
              be undone and will also delete all associated applications.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
