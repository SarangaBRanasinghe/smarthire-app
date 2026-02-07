'use client'

import { useState } from 'react'
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
} from 'lucide-react'

// Mock data for jobs
const mockJobs = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    company: 'Tech Solutions Ltd',
    companyLogo: null,
    location: 'Colombo, Sri Lanka',
    type: 'full_time',
    salary_min: 150000,
    salary_max: 250000,
    currency: 'LKR',
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
    description: 'We are looking for an experienced Frontend Developer to join our team and help build amazing user experiences.',
    created_at: '2 days ago',
    matchScore: 95,
  },
  {
    id: '2',
    title: 'Full Stack Engineer',
    company: 'Digital Innovations',
    companyLogo: null,
    location: 'Remote',
    type: 'remote',
    salary_min: 200000,
    salary_max: 350000,
    currency: 'LKR',
    skills: ['Node.js', 'React', 'PostgreSQL', 'AWS'],
    description: 'Join our growing team to build scalable applications using modern technologies.',
    created_at: '4 days ago',
    matchScore: 88,
  },
  {
    id: '3',
    title: 'React Developer',
    company: 'StartupX',
    companyLogo: null,
    location: 'Kandy, Sri Lanka',
    type: 'full_time',
    salary_min: 100000,
    salary_max: 180000,
    currency: 'LKR',
    skills: ['React', 'JavaScript', 'Redux', 'CSS'],
    description: 'Work on exciting projects and help shape the future of our product.',
    created_at: '1 week ago',
    matchScore: 82,
  },
  {
    id: '4',
    title: 'Backend Developer',
    company: 'CloudTech Inc',
    companyLogo: null,
    location: 'Colombo, Sri Lanka',
    type: 'contract',
    salary_min: 180000,
    salary_max: 280000,
    currency: 'LKR',
    skills: ['Python', 'Django', 'PostgreSQL', 'Docker'],
    description: 'Build robust backend systems for our cloud platform.',
    created_at: '3 days ago',
    matchScore: 75,
  },
  {
    id: '5',
    title: 'DevOps Engineer',
    company: 'Innovate Labs',
    companyLogo: null,
    location: 'Hybrid',
    type: 'full_time',
    salary_min: 220000,
    salary_max: 400000,
    currency: 'LKR',
    skills: ['Kubernetes', 'AWS', 'Terraform', 'CI/CD'],
    description: 'Design and maintain our cloud infrastructure.',
    created_at: '5 days ago',
    matchScore: 70,
  },
]

const aiPickedJobs = mockJobs.filter((job) => job.matchScore >= 85)

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

export default function SeekerJobsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selectedJob, setSelectedJob] = useState<typeof mockJobs[0] | null>(null)
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')

  const filteredJobs = mockJobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.skills.some((skill) =>
        skill.toLowerCase().includes(searchQuery.toLowerCase())
      )
    const matchesLocation =
      !locationFilter || job.location.toLowerCase().includes(locationFilter.toLowerCase())
    const matchesType = !typeFilter || job.type === typeFilter

    return matchesSearch && matchesLocation && matchesType
  })

  const handleApply = async () => {
    // TODO: Implement actual application submission
    toast.success(`Application submitted for ${selectedJob?.title}!`)
    setIsApplyDialogOpen(false)
    setCoverLetter('')
    setSelectedJob(null)
  }

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
              Jobs matching your profile
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiPickedJobs.map((job) => (
              <button
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className="w-full rounded-lg border border-emerald-200 bg-white p-3 text-left transition-all hover:border-emerald-400 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{job.title}</h4>
                    <p className="text-sm text-gray-500">{job.company}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                      <MapPin className="h-3 w-3" />
                      {job.location}
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {job.matchScore}%
                  </Badge>
                </div>
              </button>
            ))}
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
                {(searchQuery || locationFilter || typeFilter) && (
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
          <p className="text-sm text-gray-500">
            Showing {filteredJobs.length} jobs
          </p>

          {filteredJobs.map((job) => (
            <Card
              key={job.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedJob?.id === job.id ? 'border-emerald-400 ring-1 ring-emerald-400' : ''
              }`}
              onClick={() => setSelectedJob(job)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                      <Building2 className="h-6 w-6 text-gray-400" />
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
                          {jobTypes[job.type]}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {formatSalary(job.salary_min, job.salary_max, job.currency)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {job.created_at}
                        </span>
                      </div>
                    </div>
                  </div>
                  {job.matchScore >= 80 && (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                      {job.matchScore}% Match
                    </Badge>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>

                <p className="mt-4 text-sm text-gray-600 line-clamp-2">
                  {job.description}
                </p>

                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedJob(job)}>
                    View Details
                  </Button>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedJob(job)
                      setIsApplyDialogOpen(true)
                    }}
                  >
                    Quick Apply
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Apply Dialog */}
      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply to {selectedJob?.title}</DialogTitle>
            <DialogDescription>
              at {selectedJob?.company}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Cover Letter (Optional)
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
                Your profile and CV will be shared with the employer.
                Make sure your profile is up to date.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsApplyDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleApply}
            >
              Submit Application
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
