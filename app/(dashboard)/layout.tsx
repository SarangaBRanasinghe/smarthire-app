import { redirect } from 'next/navigation'
import { getUserData } from '@/lib/server/get-user-data'
import { UserDataProvider } from '@/components/providers/user-data-provider'
import { DashboardLayoutClient } from '@/components/dashboard/layout-client'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const userData = await getUserData()

  if (!userData) {
    redirect('/login')
  }

  return (
    <UserDataProvider 
      profile={userData.profile}
      seekerProfile={userData.seekerProfile}
      recruiterProfile={userData.recruiterProfile}
    >
      <DashboardLayoutClient>
        {children}
      </DashboardLayoutClient>
    </UserDataProvider>
  )
}
