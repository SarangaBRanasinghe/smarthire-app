'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TrendingUp, PieChart as PieChartIcon } from 'lucide-react'
import { useState } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────────
export type WeeklyDataPoint = { day: string; applications: number }
export type StatusDataPoint = { name: string; value: number; color: string }

interface DashboardChartsProps {
  weeklyData: WeeklyDataPoint[]
  statusData: StatusDataPoint[]
}

// ─── Bar Chart (pure CSS) ──────────────────────────────────────────────────────
function WeeklyBarChart({ data }: { data: WeeklyDataPoint[] }) {
  const [hovered, setHovered] = useState<string | null>(null)
  const maxVal = Math.max(...data.map((d) => d.applications), 1)
  const CHART_H = 160

  return (
    <div className="select-none">
      <div
        className="flex items-end gap-1.5"
        style={{ height: CHART_H + 28 }}
      >
        {data.map((d) => {
          const barH =
            d.applications > 0
              ? Math.max((d.applications / maxVal) * CHART_H, 8)
              : 4
          const isActive = hovered === d.day

          return (
            <div
              key={d.day}
              className="relative flex flex-1 flex-col items-center"
              style={{ height: '100%', justifyContent: 'flex-end' }}
              onMouseEnter={() => setHovered(d.day)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Tooltip */}
              {isActive && (
                <div
                  className="absolute z-20 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-lg"
                  style={{ bottom: 30, left: '50%', transform: 'translateX(-50%)' }}
                >
                  <span className="font-bold text-indigo-600">{d.applications}</span>
                  <span className="ml-1 text-slate-400">
                    {d.applications === 1 ? 'app' : 'apps'}
                  </span>
                </div>
              )}

              {/* Bar */}
              <div
                className="w-full cursor-pointer rounded-t-lg transition-all duration-200"
                style={{
                  height: barH,
                  maxWidth: 40,
                  background:
                    d.applications === 0
                      ? '#e2e8f0'
                      : isActive
                      ? 'linear-gradient(to bottom, #4f46e5, #6366f1)'
                      : 'linear-gradient(to bottom, #6366f1, #a5b4fc)',
                }}
              />

              {/* Day label */}
              <span
                className="mt-1.5 text-center"
                style={{ fontSize: 10, color: '#94a3b8', height: 20 }}
              >
                {d.day}
              </span>
            </div>
          )
        })}
      </div>

      {/* Y-axis hint */}
      <div className="mt-1 flex items-center gap-1">
        <div className="h-px flex-1 bg-slate-100" />
        <span className="text-[10px] text-slate-300">max {maxVal}</span>
      </div>
    </div>
  )
}

// ─── Donut Chart (pure SVG) ────────────────────────────────────────────────────
function DonutChart({
  data,
  responseRate,
}: {
  data: StatusDataPoint[]
  responseRate: number
}) {
  const [hovered, setHovered] = useState<string | null>(null)
  const total = data.reduce((s, d) => s + d.value, 0)

  const R = 52
  const STROKE = 20
  const SIZE = 164
  const CX = SIZE / 2
  const C = 2 * Math.PI * R
  const GAP = 4

  let cumulative = 0
  const segments = data.map((d) => {
    const fraction = d.value / total
    const dash = Math.max(fraction * C - GAP, 0)
    const seg = { ...d, dash, cumulative }
    cumulative += fraction * C
    return seg
  })

  return (
    <div className="flex flex-col items-center gap-4">
      {/* SVG donut */}
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <g transform={`rotate(-90, ${CX}, ${CX})`}>
            {/* Background track */}
            <circle
              cx={CX}
              cy={CX}
              r={R}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth={STROKE}
            />
            {/* Segments */}
            {segments.map((seg, i) => (
              <circle
                key={i}
                cx={CX}
                cy={CX}
                r={R}
                fill="none"
                stroke={seg.color}
                strokeOpacity={
                  hovered === null || hovered === seg.name ? 1 : 0.3
                }
                strokeWidth={
                  hovered === seg.name ? STROKE + 4 : STROKE
                }
                strokeDasharray={`${seg.dash} ${C - seg.dash}`}
                strokeDashoffset={-seg.cumulative}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                onMouseEnter={() => setHovered(seg.name)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
          </g>
        </svg>

        {/* Centre label */}
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
        >
          {hovered ? (
            <>
              <span
                className="text-2xl font-bold"
                style={{
                  color:
                    data.find((d) => d.name === hovered)?.color ?? '#1e293b',
                }}
              >
                {data.find((d) => d.name === hovered)?.value ?? 0}
              </span>
              <span className="text-[10px] text-slate-400 capitalize">
                {hovered}
              </span>
            </>
          ) : (
            <>
              <span className="text-2xl font-bold text-slate-800">
                {responseRate}%
              </span>
              <span className="text-[10px] text-slate-400">responded</span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        {data.map((d, i) => (
          <li
            key={i}
            className="flex cursor-pointer items-center gap-1.5 transition-opacity duration-150"
            style={{
              opacity: hovered === null || hovered === d.name ? 1 : 0.35,
            }}
            onMouseEnter={() => setHovered(d.name)}
            onMouseLeave={() => setHovered(null)}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-xs text-slate-600">{d.name}</span>
            <span className="text-xs text-slate-400">({d.value})</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Main export ───────────────────────────────────────────────────────────────
export function DashboardCharts({ weeklyData, statusData }: DashboardChartsProps) {
  const totalApplications = statusData.reduce((s, d) => s + d.value, 0)

  // "Pending" = no recruiter reply yet — compare with capital P (as set in STATUS_CONFIG)
  const pendingCount = statusData.find((d) => d.name === 'Pending')?.value ?? 0
  const responded = totalApplications - pendingCount
  const responseRate =
    totalApplications > 0
      ? Math.round((responded / totalApplications) * 100)
      : 0

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* ── Weekly Applications ── */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold text-slate-800">
              Weekly Applications
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Job seeker applications — this week (Mon – Sun)
            </CardDescription>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {/* Always render the bar chart — zero bars shown as thin lines */}
          <WeeklyBarChart data={weeklyData} />
        </CardContent>
      </Card>

      {/* ── Recruiter Reply Progress ── */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold text-slate-800">
              Recruiter Reply Progress
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Application status breakdown — all time
            </CardDescription>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
            <PieChartIcon className="h-4 w-4 text-emerald-600" />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {totalApplications === 0 ? (
            <div className="flex h-52 items-center justify-center text-sm text-slate-400">
              No applications yet
            </div>
          ) : (
            <DonutChart data={statusData} responseRate={responseRate} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
