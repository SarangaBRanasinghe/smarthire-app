import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FileText, Briefcase, Clock, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react'

export default function SeekerOverviewPage() {
  // Mock data - will be replaced with actual data fetching
  const stats = {
    totalApplications: 12,
    pending: 5,
    interviewing: 3,
    offers: 1,
  }

  const recentApplications = [
    {
      id: '1',
      jobTitle: 'Senior Frontend Developer',
      company: 'Tech Solutions Ltd',
      appliedAt: '2 days ago',
      status: 'reviewing',
    },
    {
      id: '2',
      jobTitle: 'Full Stack Engineer',
      company: 'Digital Innovations',
      appliedAt: '4 days ago',
      status: 'interview',
    },
    {
      id: '3',
      jobTitle: 'React Developer',
      company: 'StartupX',
      appliedAt: '1 week ago',
      status: 'pending',
    },
  ]

  const recommendedJobs = [
    {
      id: '1',
      title: 'Senior React Developer',
      company: 'CloudTech Inc',
      location: 'Colombo',
      matchScore: 95,
    },
    {
      id: '2',
      title: 'Frontend Team Lead',
      company: 'Innovate Labs',
      location: 'Remote',
      matchScore: 88,
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reviewing':
        return 'bg-blue-100 text-blue-700'
      case 'interview':
        return 'bg-purple-100 text-purple-700'
      case 'offer':
        return 'bg-green-100 text-green-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-yellow-100 text-yellow-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 text-white">
        <h2 className="text-2xl font-bold">Welcome back!</h2>
        <p className="mt-1 text-emerald-100">
          You have {stats.pending} pending applications and {stats.interviewing} interviews scheduled.
        </p>
        <div className="mt-4 flex gap-3">
          <Link href="/seeker/jobs">
            <Button className="bg-white text-emerald-700 hover:bg-emerald-50">
              Browse Jobs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/seeker/profile">
            <Button variant="outline" className="border-white text-white hover:bg-emerald-500">
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
              <p className="text-2xl font-bold">{stats.totalApplications}</p>
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
              <Briefcase className="h-6 w-6 text-purple-600" />
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
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{app.jobTitle}</h4>
                    <p className="text-sm text-gray-500">{app.company}</p>
                    <p className="mt-1 text-xs text-gray-400">Applied {app.appliedAt}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusColor(
                      app.status
                    )}`}
                  >
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Recommended Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">AI Picks for You</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <Link href="/seeker/jobs">
              <Button variant="ghost" size="sm">
                Browse All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendedJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/50 p-4"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{job.title}</h4>
                    <p className="text-sm text-gray-500">{job.company}</p>
                    <p className="mt-1 text-xs text-gray-400">{job.location}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                      {job.matchScore}% Match
                    </span>
                    <Button size="sm" variant="outline" className="text-emerald-600">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
