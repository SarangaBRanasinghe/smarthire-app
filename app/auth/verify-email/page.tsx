'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { MailCheck, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || 'your email address'

  return (
    <div className="flex flex-col items-center text-center">
      {/* Icon */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 mb-6">
        <MailCheck className="h-10 w-10 text-emerald-600" />
      </div>

      {/* Heading */}
      <h2 className="text-2xl font-bold text-gray-900">Check your inbox</h2>
      <p className="mt-3 text-sm text-gray-600 max-w-sm">
        <span className="font-semibold text-gray-900">{email}</span>
      </p>

      {/* Steps */}
      <div className="mt-8 w-full max-w-sm rounded-xl border border-gray-200 bg-gray-50 p-5 text-left space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">What to do next</p>
        {[
          'Open the verification email we just sent you',
          'Click the "Confirm your email" link inside',
          'You will be taken to the login page',
          'Enter your email & password to sign in',
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white mt-0.5">
              {i + 1}
            </span>
            <p className="text-sm text-gray-700">{step}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3 w-full max-w-sm">
        <Link href="/login">
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
            Go to Login
          </Button>
        </Link>
        <Link href="/register">
          <Button variant="ghost" className="w-full text-gray-500">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Register
          </Button>
        </Link>
      </div>

      <p className="mt-6 text-xs text-gray-400">
        Didn&apos;t receive the email? Check your spam folder or{' '}
        <Link href="/register" className="text-emerald-600 hover:underline">
          try registering again
        </Link>.
      </p>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center gap-4">
        <div className="h-20 w-20 rounded-full bg-gray-200 animate-pulse" />
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
