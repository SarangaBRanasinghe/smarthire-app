'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useUserStore, useAppStore } from '@/lib/stores'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { DashboardSidebar, DashboardHeader, DashboardLoading } from '@/components/dashboard'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { profile, isLoading } = useUserStore()
  const { sidebarOpen } = useAppStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (isLoading) return <DashboardLoading />
  if (!profile) return null

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden border-r bg-white transition-all lg:block',
        sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
      )}>
        <DashboardSidebar role={profile.role} />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <DashboardSidebar role={profile.role} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader 
          pathname={pathname} 
          mobileOpen={mobileOpen} 
          setMobileOpen={setMobileOpen} 
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
