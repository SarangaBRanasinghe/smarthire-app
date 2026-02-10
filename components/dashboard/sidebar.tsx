'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Briefcase,
  LayoutDashboard,
  Search,
  FileText,
  User,
  Users,
  Plus,
  BarChart3,
  Settings,
  Building2,
} from 'lucide-react'
import type { UserRole } from '@/types/database'

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
}

const navByRole: Record<UserRole, NavItem[]> = {
  job_seeker: [
    { title: 'Overview', href: '/seeker/overview', icon: <LayoutDashboard className="h-5 w-5" /> },
    { title: 'Browse Jobs', href: '/seeker/jobs', icon: <Search className="h-5 w-5" /> },
    { title: 'Applications', href: '/seeker/applications', icon: <FileText className="h-5 w-5" /> },
    { title: 'My Profile', href: '/seeker/profile', icon: <User className="h-5 w-5" /> },
  ],
  recruiter: [
    { title: 'Overview', href: '/recruiter/overview', icon: <LayoutDashboard className="h-5 w-5" /> },
    { title: 'Job Postings', href: '/recruiter/jobs', icon: <Briefcase className="h-5 w-5" /> },
    { title: 'Create Job', href: '/recruiter/jobs/create', icon: <Plus className="h-5 w-5" /> },
    { title: 'Candidates', href: '/recruiter/candidates', icon: <Users className="h-5 w-5" /> },
  ],
  admin: [
    { title: 'User Management', href: '/admin/users', icon: <Users className="h-5 w-5" /> },
    { title: 'Analytics', href: '/admin/analytics', icon: <BarChart3 className="h-5 w-5" /> },
  ],
}

const roleConfig = {
  job_seeker: { icon: User, label: 'Job Seeker Account' },
  recruiter: { icon: Building2, label: 'Recruiter Account' },
  admin: { icon: Settings, label: 'Admin Account' },
}

interface DashboardSidebarProps {
  role: UserRole
}

export function DashboardSidebar({ role }: DashboardSidebarProps) {
  const pathname = usePathname()
  const navItems = navByRole[role]
  const { icon: RoleIcon, label } = roleConfig[role]

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
          <Briefcase className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold text-gray-900">SmartHire</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              {item.icon}
              {item.title}
            </Link>
          )
        })}
      </nav>

      {/* Role Badge */}
      <div className="border-t px-4 py-4">
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
          <RoleIcon className="h-4 w-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-600">{label}</span>
        </div>
      </div>
    </div>
  )
}
