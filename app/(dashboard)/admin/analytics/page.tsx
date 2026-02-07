import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  TrendingUp,
  Users,
  Briefcase,
  FileText,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

export default function AdminAnalyticsPage() {
  // Mock analytics data
  const stats = {
    totalUsers: 5420,
    userGrowth: 12.5,
    activeJobs: 843,
    jobGrowth: 8.2,
    applications: 12450,
    applicationGrowth: 15.3,
    hires: 342,
    hireGrowth: -2.1,
  }

  const topCategories = [
    { name: 'Software Development', jobs: 234, percentage: 28 },
    { name: 'Data Science', jobs: 156, percentage: 18 },
    { name: 'Design', jobs: 123, percentage: 15 },
    { name: 'Marketing', jobs: 98, percentage: 12 },
    { name: 'Finance', jobs: 87, percentage: 10 },
  ]

  const recentActivity = [
    { action: 'New recruiter registered', user: 'TechCorp Ltd', time: '2 minutes ago' },
    { action: 'Job posted', user: 'Digital Solutions', time: '15 minutes ago' },
    { action: 'Application submitted', user: 'John Smith', time: '32 minutes ago' },
    { action: 'Interview scheduled', user: 'Sarah Johnson', time: '1 hour ago' },
    { action: 'Offer accepted', user: 'Mike Chen', time: '2 hours ago' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
        <p className="text-sm text-gray-500">
          Overview of platform performance and metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <Badge
                className={
                  stats.userGrowth >= 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }
              >
                {stats.userGrowth >= 0 ? (
                  <ArrowUpRight className="mr-1 h-3 w-3" />
                ) : (
                  <ArrowDownRight className="mr-1 h-3 w-3" />
                )}
                {Math.abs(stats.userGrowth)}%
              </Badge>
            </div>
            <p className="mt-4 text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Users</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <Briefcase className="h-6 w-6 text-purple-600" />
              </div>
              <Badge
                className={
                  stats.jobGrowth >= 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }
              >
                {stats.jobGrowth >= 0 ? (
                  <ArrowUpRight className="mr-1 h-3 w-3" />
                ) : (
                  <ArrowDownRight className="mr-1 h-3 w-3" />
                )}
                {Math.abs(stats.jobGrowth)}%
              </Badge>
            </div>
            <p className="mt-4 text-2xl font-bold">{stats.activeJobs.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Active Jobs</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <FileText className="h-6 w-6 text-amber-600" />
              </div>
              <Badge
                className={
                  stats.applicationGrowth >= 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }
              >
                {stats.applicationGrowth >= 0 ? (
                  <ArrowUpRight className="mr-1 h-3 w-3" />
                ) : (
                  <ArrowDownRight className="mr-1 h-3 w-3" />
                )}
                {Math.abs(stats.applicationGrowth)}%
              </Badge>
            </div>
            <p className="mt-4 text-2xl font-bold">{stats.applications.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Applications</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <Badge
                className={
                  stats.hireGrowth >= 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }
              >
                {stats.hireGrowth >= 0 ? (
                  <ArrowUpRight className="mr-1 h-3 w-3" />
                ) : (
                  <ArrowDownRight className="mr-1 h-3 w-3" />
                )}
                {Math.abs(stats.hireGrowth)}%
              </Badge>
            </div>
            <p className="mt-4 text-2xl font-bold">{stats.hires.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Successful Hires</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Job Categories */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              <CardTitle>Top Job Categories</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCategories.map((category) => (
                <div key={category.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900">{category.name}</span>
                    <span className="text-gray-500">{category.jobs} jobs ({category.percentage}%)</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <CardTitle>Recent Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.user}</p>
                  </div>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Health */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <p className="text-2xl font-bold text-green-700">99.9%</p>
              <p className="text-sm text-green-600">Uptime</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">142ms</p>
              <p className="text-sm text-blue-600">Avg Response Time</p>
            </div>
            <div className="rounded-lg bg-purple-50 p-4 text-center">
              <p className="text-2xl font-bold text-purple-700">95%</p>
              <p className="text-sm text-purple-600">AI Match Accuracy</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4 text-center">
              <p className="text-2xl font-bold text-amber-700">4.8/5</p>
              <p className="text-sm text-amber-600">User Satisfaction</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
