import Link from 'next/link'
import { Briefcase } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <Link href="/" className="mb-8 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">SmartHire</span>
          </Link>
          {children}
        </div>
      </div>

      {/* Right side - Image/Pattern */}
      <div className="relative hidden flex-1 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-emerald-800">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
          <div className="flex h-full flex-col items-center justify-center p-12">
            <div className="max-w-md text-center text-white">
              <h2 className="text-3xl font-bold">
                Find Your Dream Job with AI
              </h2>
              <p className="mt-4 text-lg text-emerald-100">
                Join thousands of professionals who have transformed their careers using SmartHires AI-powered matching technology.
              </p>
              <div className="mt-8 flex justify-center gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold">95%</div>
                  <div className="text-sm text-emerald-200">Match Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">50K+</div>
                  <div className="text-sm text-emerald-200">Jobs Matched</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">10K+</div>
                  <div className="text-sm text-emerald-200">Companies</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
