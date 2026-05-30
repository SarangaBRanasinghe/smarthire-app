import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserCheck, Building2 } from 'lucide-react'
import { DashboardCharts } from '@/components/admin/dashboard-charts'
import type { WeeklyDataPoint, StatusDataPoint } from '@/components/admin/dashboard-charts'

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getRoleCount(role: 'job_seeker' | 'recruiter') {
  const supabase = createAdminClient()
  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', role)

  if (error) throw new Error(error.message)
  return count ?? 0
}

/** Returns Mon–Sun of the ISO week that contains `date`. */
function getWeekRange(date: Date): { monday: Date; sunday: Date } {
  const day = date.getDay() // 0=Sun … 6=Sat
  const diff = (day === 0 ? -6 : 1 - day) // shift so Monday = 0
  const monday = new Date(date)
  monday.setDate(date.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { monday, sunday }
}

async function getWeeklyApplications(): Promise<WeeklyDataPoint[]> {
  const supabase = createAdminClient()
  const { monday, sunday } = getWeekRange(new Date())

  const { data, error } = await supabase
    .from('applications')
    .select('applied_at')
    .gte('applied_at', monday.toISOString())
    .lte('applied_at', sunday.toISOString())

  if (error) throw new Error(error.message)

  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const counts: Record<string, number> = {}
  DAY_LABELS.forEach((d) => (counts[d] = 0))

  ;(data ?? []).forEach(({ applied_at }) => {
    const jsDay = new Date(applied_at).getDay() // 0=Sun … 6=Sat
    const label = DAY_LABELS[jsDay === 0 ? 6 : jsDay - 1]
    counts[label] = (counts[label] ?? 0) + 1
  })

  return DAY_LABELS.map((day) => ({ day, applications: counts[day] }))
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pending',   color: '#94a3b8' },
  reviewing: { label: 'Reviewing', color: '#6366f1' },
  interview: { label: 'Interview', color: '#f59e0b' },
  offer:     { label: 'Offer',     color: '#10b981' },
  rejected:  { label: 'Rejected',  color: '#ef4444' },
}

async function getApplicationStatusBreakdown(): Promise<StatusDataPoint[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('applications').select('status')
  if (error) throw new Error(error.message)

  const counts: Record<string, number> = {}
  ;(data ?? []).forEach(({ status }) => {
    counts[status] = (counts[status] ?? 0) + 1
  })

  return Object.entries(STATUS_CONFIG)
    .map(([key, cfg]) => ({
      name: cfg.label,
      value: counts[key] ?? 0,
      color: cfg.color,
    }))
    .filter((d) => d.value > 0)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminHomePage() {
  let jobSeekerCount = 0
  let recruiterCount = 0
  let weeklyData: WeeklyDataPoint[] = []
  let statusData: StatusDataPoint[] = []
  let errorMessage: string | null = null

  try {
    const [jobSeekerTotal, recruiterTotal, weekly, statuses] = await Promise.all([
      getRoleCount('job_seeker'),
      getRoleCount('recruiter'),
      getWeeklyApplications(),
      getApplicationStatusBreakdown(),
    ])
    jobSeekerCount = jobSeekerTotal
    recruiterCount = recruiterTotal
    weeklyData = weekly
    statusData = statuses
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Failed to load admin metrics'
  }

  const totalUsers = jobSeekerCount + recruiterCount

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">Track user activity across the platform.</p>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">Total Users</CardTitle>
            <Users className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-gray-900">{totalUsers}</div>
            <p className="text-xs text-gray-500">Job seekers + recruiters</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">Job Seekers</CardTitle>
            <UserCheck className="h-5 w-5 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-gray-900">{jobSeekerCount}</div>
            <p className="text-xs text-gray-500">Active seeker profiles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">Recruiters</CardTitle>
            <Building2 className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-gray-900">{recruiterCount}</div>
            <p className="text-xs text-gray-500">Company accounts onboarded</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Charts ── */}
      <DashboardCharts weeklyData={weeklyData} statusData={statusData} />
    </div>
  )
}
