import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
} from 'lucide-react'

export default function RecruiterOverviewPage() {
  // Mock data - will be replaced with actual data fetching
  const stats = {
    activeJobs: 8,
    totalApplicants: 124,
    interviewing: 12,
    hiredThisMonth: 3,
  }

  const recentJobs = [
    {
      id: '1',
      title: 'Senior Frontend Developer',
      applicants: 45,
      status: 'active',
      createdAt: '2 days ago',
    },
    {
      id: '2',
      title: 'Full Stack Engineer',
      applicants: 32,
      status: 'active',
      createdAt: '4 days ago',
    },
    {
      id: '3',
      title: 'DevOps Engineer',
      applicants: 28,
      status: 'active',
      createdAt: '1 week ago',
    },
  ]

  const topCandidates = [
    {
      id: '1',
      name: 'John Smith',
      role: 'Senior Frontend Developer',
      matchScore: 98,
      appliedFor: 'Senior Frontend Developer',
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      role: 'Full Stack Developer',
      matchScore: 95,
      appliedFor: 'Full Stack Engineer',
    },
    {
      id: '3',
      name: 'Mike Chen',
      role: 'React Developer',
      matchScore: 92,
      appliedFor: 'Senior Frontend Developer',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 text-white">
        <div>
          <h2 className="text-2xl font-bold">Welcome back!</h2>
          <p className="mt-1 text-emerald-100">
            You have {stats.totalApplicants} applicants across {stats.activeJobs} active jobs.
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
              <p className="text-2xl font-bold">{stats.hiredThisMonth}</p>
              <p className="text-sm text-gray-500">Hired This Month</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Your Active Jobs</CardTitle>
            <Link href="/recruiter/jobs">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{job.title}</h4>
                    <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {job.applicants} applicants
                      </span>
                      <span>Posted {job.createdAt}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                    <Link href={`/recruiter/jobs/${job.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-1 h-4 w-4" />
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Candidates */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Top AI Matches</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <Link href="/recruiter/candidates">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCandidates.map((candidate, index) => (
                <div
                  key={candidate.id}
                  className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{candidate.name}</h4>
                      <p className="text-sm text-gray-500">{candidate.role}</p>
                      <p className="text-xs text-gray-400">
                        Applied for: {candidate.appliedFor}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className="bg-emerald-100 text-emerald-700">
                      {candidate.matchScore}% Match
                    </Badge>
                    <Button size="sm" variant="outline" className="text-emerald-600">
                      View Profile
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
