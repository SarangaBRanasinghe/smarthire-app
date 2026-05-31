'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, LogOut } from 'lucide-react'
import { AdminSidebar } from '@/components/admin/sidebar'

function getPageTitle(pathname: string) {
  if (pathname.startsWith('/admin/companies')) return 'Company Verification'
  return 'Admin Dashboard'
}

export function AdminHeader({
  pathname,
  mobileOpen,
  setMobileOpen,
  sidebarOpen,
  setSidebarOpen,
  username,
}: {
  pathname: string
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  username: string
}) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      toast.success('Signed out')
      router.push('/admin/login')
    } catch {
      toast.error('Failed to sign out')
    }
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <AdminSidebar />
          </SheetContent>
        </Sheet>

        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div>
          <p className="text-lg font-semibold text-gray-900">
            {getPageTitle(pathname)}
          </p>
          <p className="text-xs text-gray-500">Signed in as {username}</p>
        </div>
      </div>

      <Button variant="outline" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        Sign out
      </Button>
    </header>
  )
}
