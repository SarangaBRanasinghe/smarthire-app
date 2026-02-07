'use client'

import { useState } from 'react'
import Link from 'next/link'
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
import type { JobStatus } from '@/types/database'

// Mock data for jobs
const mockJobs = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    location: 'Colombo, Sri Lanka',
    type: 'full_time',
    status: 'active' as JobStatus,
    applicants: 45,
    createdAt: '2024-01-15',
    salary_min: 150000,
    salary_max: 250000,
    currency: 'LKR',
  },
  {
    id: '2',
    title: 'Full Stack Engineer',
    location: 'Remote',
    type: 'remote',
    status: 'active' as JobStatus,
    applicants: 32,
    createdAt: '2024-01-12',
    salary_min: 200000,
    salary_max: 350000,
    currency: 'LKR',
  },
  {
    id: '3',
    title: 'DevOps Engineer',
    location: 'Hybrid',
    type: 'full_time',
    status: 'active' as JobStatus,
    applicants: 28,
    createdAt: '2024-01-10',
    salary_min: 220000,
    salary_max: 400000,
    currency: 'LKR',
  },
  {
    id: '4',
    title: 'React Developer',
    location: 'Kandy, Sri Lanka',
    type: 'full_time',
    status: 'draft' as JobStatus,
    applicants: 0,
    createdAt: '2024-01-18',
    salary_min: 100000,
    salary_max: 180000,
    currency: 'LKR',
  },
  {
    id: '5',
    title: 'Backend Developer',
    location: 'Colombo, Sri Lanka',
    type: 'contract',
    status: 'closed' as JobStatus,
    applicants: 56,
    createdAt: '2023-12-15',
    salary_min: 180000,
    salary_max: 280000,
    currency: 'LKR',
  },
]

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

function formatSalary(min: number, max: number, currency: string) {
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
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<typeof mockJobs[0] | null>(null)

  const stats = {
    active: mockJobs.filter((j) => j.status === 'active').length,
    draft: mockJobs.filter((j) => j.status === 'draft').length,
    totalApplicants: mockJobs.reduce((sum, j) => sum + j.applicants, 0),
  }

  const filteredJobs = mockJobs.filter((job) =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDelete = () => {
    toast.success(`Job "${selectedJob?.title}" deleted successfully`)
    setDeleteDialogOpen(false)
    setSelectedJob(null)
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
                      Posted {formatDate(job.createdAt)}
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
