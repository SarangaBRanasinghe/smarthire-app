import { redirect } from 'next/navigation'
import { getAdminSessionFromCookies } from '@/lib/admin/session'
import { AdminLayoutClient } from '@/components/admin/layout-client'

export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSessionFromCookies()

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <AdminLayoutClient username={session.username}>
      {children}
    </AdminLayoutClient>
  )
}
