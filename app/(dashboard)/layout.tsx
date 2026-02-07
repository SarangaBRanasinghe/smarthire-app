'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUserStore, useAppStore } from '@/lib/stores'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
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
  LogOut,
  Menu,
  ChevronDown,
  Building2,
} from 'lucide-react'
import type { UserRole, Profile, SeekerProfile, RecruiterProfile } from '@/types/database'

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
}

const seekerNavItems: NavItem[] = [
  { title: 'Overview', href: '/seeker/overview', icon: <LayoutDashboard className="h-5 w-5" /> },
  { title: 'Browse Jobs', href: '/seeker/jobs', icon: <Search className="h-5 w-5" /> },
  { title: 'Applications', href: '/seeker/applications', icon: <FileText className="h-5 w-5" /> },
  { title: 'My Profile', href: '/seeker/profile', icon: <User className="h-5 w-5" /> },
]

const recruiterNavItems: NavItem[] = [
  { title: 'Overview', href: '/recruiter/overview', icon: <LayoutDashboard className="h-5 w-5" /> },
  { title: 'Job Postings', href: '/recruiter/jobs', icon: <Briefcase className="h-5 w-5" /> },
  { title: 'Create Job', href: '/recruiter/jobs/create', icon: <Plus className="h-5 w-5" /> },
  { title: 'Candidates', href: '/recruiter/candidates', icon: <Users className="h-5 w-5" /> },
]

const adminNavItems: NavItem[] = [
  { title: 'User Management', href: '/admin/users', icon: <Users className="h-5 w-5" /> },
  { title: 'Analytics', href: '/admin/analytics', icon: <BarChart3 className="h-5 w-5" /> },
]

function getNavItems(role: UserRole): NavItem[] {
  switch (role) {
    case 'recruiter':
      return recruiterNavItems
    case 'admin':
      return adminNavItems
    default:
      return seekerNavItems
  }
}

function SidebarContent({ role, pathname }: { role: UserRole; pathname: string }) {
  const navItems = getNavItems(role)

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
          {role === 'recruiter' ? (
            <Building2 className="h-4 w-4 text-gray-500" />
          ) : role === 'admin' ? (
            <Settings className="h-4 w-4 text-gray-500" />
          ) : (
            <User className="h-4 w-4 text-gray-500" />
          )}
          <span className="text-xs font-medium text-gray-600 capitalize">
            {role.replace('_', ' ')} Account
          </span>
        </div>
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { profile, isLoading, setProfile, setSeekerProfile, setRecruiterProfile, setIsLoading, clearUser } = useUserStore()
  const { sidebarOpen, setSidebarOpen } = useAppStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/login')
          return
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single() as { data: Profile | null }

        if (profileData) {
          setProfile(profileData)

          if (profileData.role === 'job_seeker') {
            const { data: seekerData } = await supabase
              .from('seeker_profiles')
              .select('*')
              .eq('id', user.id)
              .single() as { data: SeekerProfile | null }
            setSeekerProfile(seekerData)
          } else if (profileData.role === 'recruiter') {
            const { data: recruiterData } = await supabase
              .from('recruiter_profiles')
              .select('*')
              .eq('id', user.id)
              .single() as { data: RecruiterProfile | null }
            setRecruiterProfile(recruiterData)
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [supabase, router, setProfile, setSeekerProfile, setRecruiterProfile, setIsLoading])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    clearUser()
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <div className="hidden w-64 border-r bg-white lg:block">
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="space-y-2 p-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>
        <div className="flex flex-1 flex-col">
          <div className="flex h-16 items-center justify-between border-b bg-white px-6">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <div className="flex-1 bg-gray-50 p-6">
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden border-r bg-white transition-all lg:block',
        sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
      )}>
        <SidebarContent role={profile.role} pathname={pathname} />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent role={profile.role} pathname={pathname} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 lg:px-6">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>

            {/* Desktop Sidebar Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <h1 className="text-lg font-semibold text-gray-900">
              {getNavItems(profile.role).find(
                (item) => pathname === item.href || pathname.startsWith(item.href + '/')
              )?.title || 'Dashboard'}
            </h1>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700">
                    {profile.full_name?.charAt(0).toUpperCase() || profile.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium text-gray-700 md:inline">
                  {profile.full_name || profile.email}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{profile.full_name || 'User'}</span>
                  <span className="text-xs font-normal text-gray-500">{profile.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={
                  profile.role === 'recruiter'
                    ? '/recruiter/overview'
                    : profile.role === 'admin'
                    ? '/admin/users'
                    : '/seeker/profile'
                }>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="#">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
