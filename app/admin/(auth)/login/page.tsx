import { redirect } from 'next/navigation'
import { getAdminSessionFromCookies } from '@/lib/admin/session'
import { AdminLoginForm } from '@/components/admin/login-form'

export default async function AdminLoginPage() {
  const session = await getAdminSessionFromCookies()
  if (session) {
    redirect('/admin/companies')
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Access</h1>
        <p className="mt-2 text-sm text-gray-600">
          Use your administrator credentials to manage company verification.
        </p>
      </div>
      <AdminLoginForm />
    </div>
  )
}
