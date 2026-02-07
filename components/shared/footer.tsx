import Link from 'next/link'
import { Briefcase } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">SmartHire</span>
            </Link>
            <p className="mt-4 text-sm text-gray-600">
              Revolutionizing recruitment with AI-powered job matching and smart CV parsing.
            </p>
          </div>

          {/* Job Seekers */}
          <div>
            <h3 className="font-semibold text-gray-900">For Job Seekers</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/jobs" className="text-sm text-gray-600 hover:text-emerald-600">
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-sm text-gray-600 hover:text-emerald-600">
                  Create Profile
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-600 hover:text-emerald-600">
                  Career Resources
                </Link>
              </li>
            </ul>
          </div>

          {/* Recruiters */}
          <div>
            <h3 className="font-semibold text-gray-900">For Recruiters</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/register" className="text-sm text-gray-600 hover:text-emerald-600">
                  Post a Job
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-600 hover:text-emerald-600">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-600 hover:text-emerald-600">
                  AI Matching
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-gray-900">Company</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="#" className="text-sm text-gray-600 hover:text-emerald-600">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-600 hover:text-emerald-600">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-600 hover:text-emerald-600">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-600 hover:text-emerald-600">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} SmartHire. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
