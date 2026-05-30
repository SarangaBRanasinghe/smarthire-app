'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Users, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/database'

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  companyName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'job_seeker' | 'recruiter'>('job_seeker')

  useEffect(() => {
    const role = searchParams.get('role')
    if (role === 'recruiter') {
      setSelectedRole('recruiter')
    }
  }, [searchParams])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?role=${selectedRole}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        toast.error(error.message)
        setIsGoogleLoading(false)
      }
    } catch {
      toast.error('Failed to sign up with Google')
      setIsGoogleLoading(false)
    }
  }

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role: selectedRole as UserRole,
            company_name: selectedRole === 'recruiter' ? data.companyName : undefined,
          },
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      const user = signUpData?.user
      const hasSession = Boolean(signUpData?.session)

      if (user && hasSession) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(
            {
              id: user.id,
              email: data.email,
              full_name: data.fullName,
              role: selectedRole as UserRole,
              avatar_url: user.user_metadata?.avatar_url ?? null,
            } as never,
            { onConflict: 'id' }
          )

        if (profileError) {
          toast.error('Account created, but profile setup failed. Please log in again.')
          return
        }

        if (selectedRole === 'recruiter') {
          const { error: recruiterError } = await supabase
            .from('recruiter_profiles')
            .upsert(
              {
                id: user.id,
                company_name: data.companyName || 'My Company',
              } as never,
              { onConflict: 'id' }
            )

          if (recruiterError) {
            toast.error('Account created, but recruiter profile setup failed.')
            return
          }
        } else {
          const { error: seekerError } = await supabase
            .from('seeker_profiles')
            .upsert(
              {
                id: user.id,
                experience_summary: [],
                education_summary: [],
              } as never,
              { onConflict: 'id' }
            )

          if (seekerError) {
            toast.error('Account created, but seeker profile setup failed.')
            return
          }
        }

        toast.success('Account created! You can sign in now.')
        router.push('/login')
        return
      }

      toast.success('Account created! Please check your inbox for a verification email.')

      // Email confirmation is required — redirect to the "check your email" page
      router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}&role=${selectedRole}`)

    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
        <p className="mt-2 text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
            Sign in
          </Link>
        </p>
      </div>

      {/* Role Selection */}
      <div className="mt-8">
        <Label className="text-sm font-medium text-gray-700">I am a...</Label>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSelectedRole('job_seeker')}
            className={cn(
              'flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all',
              selectedRole === 'job_seeker'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            )}
          >
            <Users className="mb-2 h-6 w-6" />
            <span className="text-sm font-medium">Job Seeker</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('recruiter')}
            className={cn(
              'flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all',
              selectedRole === 'recruiter'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            )}
          >
            <Building2 className="mb-2 h-6 w-6" />
            <span className="text-sm font-medium">Recruiter</span>
          </button>
        </div>
      </div>

      {/* Google Sign Up */}
      <div className="mt-6">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignUp}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon className="mr-2 h-4 w-4" />
          )}
          Continue with Google as {selectedRole === 'recruiter' ? 'Recruiter' : 'Job Seeker'}
        </Button>

        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-500">or continue with email</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            type="text"
            autoComplete="name"
            placeholder="John Doe"
            className="mt-1"
            {...register('fullName')}
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-500">{errors.fullName.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="mt-1"
            {...register('email')}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {selectedRole === 'recruiter' && (
          <div>
            <Label htmlFor="companyName">Company name</Label>
            <Input
              id="companyName"
              type="text"
              placeholder="Acme Inc."
              className="mt-1"
              {...register('companyName')}
            />
            {errors.companyName && (
              <p className="mt-1 text-sm text-red-500">{errors.companyName.message}</p>
            )}
          </div>
        )}

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Create a password"
            className="mt-1"
            {...register('password')}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Confirm your password"
            className="mt-1"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            `Create ${selectedRole === 'recruiter' ? 'Recruiter' : 'Job Seeker'} Account`
          )}
        </Button>

        <p className="text-center text-xs text-gray-500">
          By creating an account, you agree to our{' '}
          <Link href="#" className="text-emerald-600 hover:text-emerald-500">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="#" className="text-emerald-600 hover:text-emerald-500">
            Privacy Policy
          </Link>
        </p>
      </form>
    </>
  )
}

function RegisterFormSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="mt-2 h-4 w-64 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="h-24 bg-gray-200 rounded animate-pulse" />
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFormSkeleton />}>
      <RegisterForm />
    </Suspense>
  )
}
