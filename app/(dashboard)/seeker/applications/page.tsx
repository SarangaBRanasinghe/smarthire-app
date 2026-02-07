'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import type { ApplicationStatus } from '@/types/database'

// Mock data for applications
const mockApplications = [
  {
    id: '1',
    job: {
      title: 'Senior Frontend Developer',
      company: 'Tech Solutions Ltd',
      location: 'Colombo, Sri Lanka',
    },
    status: 'reviewing' as ApplicationStatus,
    appliedAt: '2024-01-15',
    matchScore: 95,
    interview: null,
  },
  {
    id: '2',
    job: {
      title: 'Full Stack Engineer',
      company: 'Digital Innovations',
      location: 'Remote',
    },
    status: 'interview' as ApplicationStatus,
    appliedAt: '2024-01-12',
    matchScore: 88,
    interview: {
      type: 'video',
      scheduledAt: '2024-01-25T14:00:00',
      meetingLink: 'https://meet.example.com/interview',
    },
  },
  {
    id: '3',
    job: {
      title: 'React Developer',
      company: 'StartupX',
      location: 'Kandy, Sri Lanka',
    },
    status: 'pending' as ApplicationStatus,
    appliedAt: '2024-01-10',
    matchScore: 82,
    interview: null,
  },
  {
    id: '4',
    job: {
      title: 'Backend Developer',
      company: 'CloudTech Inc',
      location: 'Colombo, Sri Lanka',
    },
    status: 'offer' as ApplicationStatus,
    appliedAt: '2024-01-05',
    matchScore: 90,
    interview: null,
  },
  {
    id: '5',
    job: {
      title: 'DevOps Engineer',
      company: 'Innovate Labs',
      location: 'Hybrid',
    },
    status: 'rejected' as ApplicationStatus,
    appliedAt: '2024-01-02',
    matchScore: 70,
    interview: null,
  },
]

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
    label: 'Offer',
    color: 'bg-green-100 text-green-700',
    icon: <CheckCircle className="h-4 w-4" />,
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-700',
    icon: <XCircle className="h-4 w-4" />,
  },
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export default function SeekerApplicationsPage() {
  const [selectedApplication, setSelectedApplication] = useState<typeof mockApplications[0] | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const stats = {
    pending: mockApplications.filter((a) => a.status === 'pending').length,
    reviewing: mockApplications.filter((a) => a.status === 'reviewing').length,
    interview: mockApplications.filter((a) => a.status === 'interview').length,
    offers: mockApplications.filter((a) => a.status === 'offer').length,
  }

  const filterApplications = (status?: ApplicationStatus) => {
    if (!status) return mockApplications
    return mockApplications.filter((a) => a.status === status)
  }

  const ApplicationCard = ({ application }: { application: typeof mockApplications[0] }) => {
    const status = statusConfig[application.status]

    return (
      <Card
        className="cursor-pointer transition-all hover:shadow-md"
        onClick={() => {
          setSelectedApplication(application)
          setIsDialogOpen(true)
        }}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                <Building2 className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{application.job.title}</h3>
                <p className="text-sm text-gray-500">{application.job.company}</p>
                <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {application.job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Applied {formatDate(application.appliedAt)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={`${status.color} flex items-center gap-1`}>
                {status.icon}
                {status.label}
              </Badge>
              {application.matchScore >= 80 && (
                <span className="text-sm font-medium text-emerald-600">
                  {application.matchScore}% Match
                </span>
              )}
            </div>
          </div>

          {application.interview && (
            <div className="mt-4 rounded-lg bg-purple-50 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-purple-700">
                <Video className="h-4 w-4" />
                Interview Scheduled
              </div>
              <p className="mt-1 text-sm text-purple-600">
                {formatDateTime(application.interview.scheduledAt)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

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
          <CardTitle>My Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All ({mockApplications.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="reviewing">Reviewing ({stats.reviewing})</TabsTrigger>
              <TabsTrigger value="interview">Interview ({stats.interview})</TabsTrigger>
              <TabsTrigger value="offer">Offers ({stats.offers})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4 space-y-4">
              {filterApplications().map((app) => (
                <ApplicationCard key={app.id} application={app} />
              ))}
            </TabsContent>

            <TabsContent value="pending" className="mt-4 space-y-4">
              {filterApplications('pending').map((app) => (
                <ApplicationCard key={app.id} application={app} />
              ))}
            </TabsContent>

            <TabsContent value="reviewing" className="mt-4 space-y-4">
              {filterApplications('reviewing').map((app) => (
                <ApplicationCard key={app.id} application={app} />
              ))}
            </TabsContent>

            <TabsContent value="interview" className="mt-4 space-y-4">
              {filterApplications('interview').map((app) => (
                <ApplicationCard key={app.id} application={app} />
              ))}
            </TabsContent>

            <TabsContent value="offer" className="mt-4 space-y-4">
              {filterApplications('offer').map((app) => (
                <ApplicationCard key={app.id} application={app} />
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Application Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedApplication?.job.title}</DialogTitle>
            <DialogDescription>
              {selectedApplication?.job.company} &bull; {selectedApplication?.job.location}
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <Badge className={statusConfig[selectedApplication.status].color}>
                  {statusConfig[selectedApplication.status].label}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Applied On</span>
                <span className="text-sm font-medium">
                  {formatDate(selectedApplication.appliedAt)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Match Score</span>
                <span className="text-sm font-medium text-emerald-600">
                  {selectedApplication.matchScore}%
                </span>
              </div>

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
                    <strong>Type:</strong> Video Call
                  </p>
                  <Button
                    className="mt-3 bg-purple-600 hover:bg-purple-700"
                    onClick={() => window.open(selectedApplication.interview?.meetingLink, '_blank')}
                  >
                    Join Meeting
                  </Button>
                </div>
              )}

              {selectedApplication.status === 'offer' && (
                <div className="rounded-lg bg-green-50 p-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Congratulations!</span>
                  </div>
                  <p className="mt-1 text-sm text-green-600">
                    You have received an offer for this position.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button className="bg-green-600 hover:bg-green-700">
                      Accept Offer
                    </Button>
                    <Button variant="outline">
                      View Details
                    </Button>
                  </div>
                </div>
              )}

              {selectedApplication.status === 'rejected' && (
                <div className="rounded-lg bg-red-50 p-4">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Application Not Selected</span>
                  </div>
                  <p className="mt-1 text-sm text-red-600">
                    Unfortunately, your application was not selected for this position.
                    Keep applying to find the right opportunity!
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
