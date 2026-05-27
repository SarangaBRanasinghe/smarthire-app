'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ShieldCheck, Building2 } from 'lucide-react'

const navItems = [
  {
    title: 'Company Verification',
    href: '/admin/companies',
    icon: <Building2 className="h-5 w-5" />,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
          <ShieldCheck className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold text-gray-900">Admin Panel</span>
      </div>

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

      <div className="border-t px-4 py-4">
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
          <ShieldCheck className="h-4 w-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-600">Administrator</span>
        </div>
      </div>
    </div>
  )
}
