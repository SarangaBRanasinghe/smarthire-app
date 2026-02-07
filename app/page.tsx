import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Navbar, Footer } from '@/components/shared'
import {
  Zap,
  FileText,
  Target,
  Users,
  Building2,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white py-20 lg:py-32">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-emerald-100 opacity-50 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-emerald-100 opacity-50 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
                <Sparkles className="h-4 w-4" />
                AI-Powered Recruitment Platform
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                SmartHire: AI-Powered
                <span className="block text-emerald-600">Job Finding</span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
                Revolutionizing recruitment with intelligent CV parsing and precision job matching.
                Connect with the right opportunities faster than ever before.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/register?role=job_seeker">
                  <Button
                    size="lg"
                    className="w-full bg-emerald-600 px-8 text-white hover:bg-emerald-700 sm:w-auto"
                  >
                    Find Jobs
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/register?role=recruiter">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full border-emerald-600 px-8 text-emerald-600 hover:bg-emerald-50 sm:w-auto"
                  >
                    Hire Talent
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-y bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600">10K+</div>
                <div className="mt-1 text-sm text-gray-600">Active Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600">50K+</div>
                <div className="mt-1 text-sm text-gray-600">Job Seekers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600">5K+</div>
                <div className="mt-1 text-sm text-gray-600">Companies</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600">95%</div>
                <div className="mt-1 text-sm text-gray-600">Match Accuracy</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-gray-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">
                Powerful Features for Modern Recruitment
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-gray-600">
                Our AI-powered platform streamlines the hiring process for both job seekers and recruiters.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              <Card className="border-0 bg-white shadow-lg transition-shadow hover:shadow-xl">
                <CardContent className="p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                    <Zap className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-gray-900">
                    Instant AI Matching
                  </h3>
                  <p className="mt-3 text-gray-600">
                    Our advanced AI algorithms analyze skills, experience, and preferences to deliver
                    highly accurate job matches in seconds.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 bg-white shadow-lg transition-shadow hover:shadow-xl">
                <CardContent className="p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                    <FileText className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-gray-900">
                    Smart CV Parsing
                  </h3>
                  <p className="mt-3 text-gray-600">
                    Upload your resume and let our AI extract and structure your information
                    automatically. No manual data entry required.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 bg-white shadow-lg transition-shadow hover:shadow-xl">
                <CardContent className="p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                    <Target className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-gray-900">
                    Precision Hiring
                  </h3>
                  <p className="mt-3 text-gray-600">
                    Recruiters get AI-ranked candidate lists with detailed match scores and
                    explanations for faster, better hiring decisions.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
              <p className="mx-auto mt-4 max-w-2xl text-gray-600">
                Get started in minutes with our simple, streamlined process.
              </p>
            </div>

            <div className="mt-16 grid gap-12 lg:grid-cols-2">
              {/* For Job Seekers */}
              <div>
                <div className="mb-8 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                    <Users className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">For Job Seekers</h3>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-medium text-white">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Upload Your CV</h4>
                      <p className="mt-1 text-sm text-gray-600">
                        Our AI parses your resume and builds your professional profile automatically.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-medium text-white">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Get AI Recommendations</h4>
                      <p className="mt-1 text-sm text-gray-600">
                        Receive personalized job recommendations based on your skills and preferences.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-medium text-white">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Apply & Track</h4>
                      <p className="mt-1 text-sm text-gray-600">
                        Apply with one click and track your application status in real-time.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* For Recruiters */}
              <div>
                <div className="mb-8 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">For Recruiters</h3>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-medium text-white">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Post Your Job</h4>
                      <p className="mt-1 text-sm text-gray-600">
                        Create detailed job listings with required skills and qualifications.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-medium text-white">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Review AI Shortlist</h4>
                      <p className="mt-1 text-sm text-gray-600">
                        Get a ranked list of candidates with match scores and key strengths.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-medium text-white">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Schedule Interviews</h4>
                      <p className="mt-1 text-sm text-gray-600">
                        Connect with top candidates and manage the hiring process seamlessly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-emerald-600 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white">
                Ready to Transform Your Hiring Process?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-emerald-100">
                Join thousands of companies and job seekers who are already using SmartHire
                to find the perfect match.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="w-full bg-white px-8 text-emerald-600 hover:bg-gray-100 sm:w-auto"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-emerald-100">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Free forever for job seekers
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  14-day recruiter trial
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
