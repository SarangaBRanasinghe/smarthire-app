'use client'

import { useState } from 'react'
import Link from 'next/link'
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
  Calendar,
  TrendingUp,
  Star,
  Phone,
  Video,
  Building2,
} from 'lucide-react'
import type { ApplicationStatus } from '@/types/database'

// Mock data for job details
const mockJob = {
  id: '1',
  title: 'Senior Frontend Developer',
  location: 'Colombo, Sri Lanka',
  type: 'full_time',
  status: 'active',
  salary_min: 150000,
  salary_max: 250000,
  currency: 'LKR',
  description: `We are looking for an experienced Senior Frontend Developer to join our growing team. You will be responsible for building and maintaining high-quality web applications using modern technologies.

**Responsibilities:**
- Build responsive and performant web applications using React and TypeScript
- Collaborate with designers and backend developers
- Write clean, maintainable code with proper documentation
- Mentor junior developers and conduct code reviews
- Participate in architectural decisions

**Requirements:**
- 5+ years of experience in frontend development
- Strong proficiency in React, TypeScript, and modern CSS
- Experience with state management solutions (Redux, Zustand)
- Familiarity with testing frameworks (Jest, React Testing Library)
- Excellent problem-solving skills`,
  skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Node.js'],
  createdAt: '2024-01-15',
}

const mockApplicants = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+94 77 123 4567',
    location: 'Colombo, Sri Lanka',
    matchScore: 98,
    status: 'reviewing' as ApplicationStatus,
    appliedAt: '2024-01-16',
    keyStrengths: ['Strong React experience', '5+ years frontend', 'Team lead experience'],
    rank: 1,
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '+94 77 234 5678',
    location: 'Remote',
    matchScore: 95,
    status: 'interview' as ApplicationStatus,
    appliedAt: '2024-01-17',
    keyStrengths: ['TypeScript expert', 'Next.js projects', 'CI/CD experience'],
    rank: 2,
  },
  {
    id: '3',
    name: 'Mike Chen',
    email: 'mike.chen@email.com',
    phone: '+94 77 345 6789',
    location: 'Kandy, Sri Lanka',
    matchScore: 92,
    status: 'pending' as ApplicationStatus,
    appliedAt: '2024-01-18',
    keyStrengths: ['React Native', 'Full-stack skills', 'Startup experience'],
    rank: 3,
  },
  {
    id: '4',
    name: 'Emily Brown',
    email: 'emily.b@email.com',
    phone: '+94 77 456 7890',
    location: 'Galle, Sri Lanka',
    matchScore: 88,
    status: 'pending' as ApplicationStatus,
    appliedAt: '2024-01-19',
    keyStrengths: ['Vue.js background', 'Quick learner', 'Design skills'],
    rank: 4,
  },
]

const statusConfig: Record<ApplicationStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  reviewing: { label: 'Reviewing', color: 'bg-blue-100 text-blue-700' },
  interview: { label: 'Interview', color: 'bg-purple-100 text-purple-700' },
  offer: { label: 'Offer', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
}

function formatSalary(min: number, max: number, currency: string) {
  const formatter = new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  })
  return `${formatter.format(min)} - ${formatter.format(max)}`
}

export default function JobDetailsPage() {
  const [selectedApplicant, setSelectedApplicant] = useState<typeof mockApplicants[0] | null>(null)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)

  const handleScheduleInterview = () => {
    toast.success(`Interview scheduled with ${selectedApplicant?.name}`)
    setIsScheduleDialogOpen(false)
    setSelectedApplicant(null)
  }

  const handleUpdateStatus = (applicantId: string, newStatus: ApplicationStatus) => {
    toast.success(`Status updated to ${statusConfig[newStatus].label}`)
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
                <h1 className="text-2xl font-bold text-gray-900">{mockJob.title}</h1>
                <Badge className="bg-green-100 text-green-700">Active</Badge>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {mockJob.location}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  Full-time
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {formatSalary(mockJob.salary_min, mockJob.salary_max, mockJob.currency)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Posted Jan 15, 2024
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {mockApplicants.length} applicants
                </span>
              </div>
            </div>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Job
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {mockJob.skills.map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="applicants">
        <TabsList>
          <TabsTrigger value="applicants">
            Applicants ({mockApplicants.length})
          </TabsTrigger>
          <TabsTrigger value="description">Job Description</TabsTrigger>
        </TabsList>

        <TabsContent value="applicants" className="mt-6 space-y-4">
          {/* AI Ranked Candidates */}
          {mockApplicants.map((applicant) => (
            <Card
              key={applicant.id}
              className={`transition-all hover:shadow-md ${
                applicant.rank === 1
                  ? 'border-2 border-amber-300 bg-amber-50/30'
                  : applicant.rank <= 3
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Rank Badge */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      applicant.rank === 1
                        ? 'bg-amber-100 text-amber-700'
                        : applicant.rank <= 3
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {applicant.rank === 1 && <Star className="h-4 w-4" />}
                    {applicant.rank !== 1 && `#${applicant.rank}`}
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
                        <p className="text-sm text-gray-500">{applicant.location}</p>
                      </div>
                      <Badge className={statusConfig[applicant.status].color}>
                        {statusConfig[applicant.status].label}
                      </Badge>
                      {applicant.rank === 1 && (
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
                        <p className="text-sm font-medium text-gray-700">Key Strengths:</p>
                        <ul className="mt-1 space-y-1">
                          {applicant.keyStrengths.map((strength, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              {strength}
                            </li>
                          ))}
                        </ul>
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
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700"
                      size="sm"
                      onClick={() => {
                        setSelectedApplicant(applicant)
                        setIsScheduleDialogOpen(true)
                      }}
                    >
                      <Calendar className="mr-1 h-4 w-4" />
                      Schedule Interview
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="description" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none whitespace-pre-wrap text-gray-600">
                {mockJob.description}
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
                  <p className="text-sm text-gray-500">{selectedApplicant.phone}</p>
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
                <h4 className="font-medium text-gray-900">Key Strengths</h4>
                <ul className="mt-2 space-y-1">
                  {selectedApplicant.keyStrengths.map((strength, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Interview
                </Button>
                <Button variant="outline" className="flex-1">
                  Download Resume
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Interview Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogDescription>
              Schedule an interview with {selectedApplicant?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" className="flex flex-col gap-1 py-4">
                <Video className="h-5 w-5" />
                <span className="text-xs">Video Call</span>
              </Button>
              <Button variant="outline" className="flex flex-col gap-1 py-4">
                <Phone className="h-5 w-5" />
                <span className="text-xs">Phone Call</span>
              </Button>
              <Button variant="outline" className="flex flex-col gap-1 py-4">
                <Building2 className="h-5 w-5" />
                <span className="text-xs">In Person</span>
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Select a date and time for the interview. The candidate will be notified via email.
            </p>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={handleScheduleInterview}
            >
              Confirm Interview
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
