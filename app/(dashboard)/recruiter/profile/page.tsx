'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Loader2,
  Building2,
  Globe,
  Mail,
  User,
  Save,
  Briefcase,
  Users,
  CheckCircle,
  ShieldCheck,
  Edit2,
  ImageIcon,
  Upload,
  X,
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface RecruiterData {
  fullName: string
  email: string
  companyName: string
  companyWebsite: string
  companyLogo: string
  verificationStatus: boolean
  memberSince: string
}

interface JobStats {
  totalJobs: number
  activeJobs: number
  totalApplicants: number
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RecruiterProfilePage() {
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)

  // Data
  const [data, setData] = useState<RecruiterData>({
    fullName: '',
    email: '',
    companyName: '',
    companyWebsite: '',
    companyLogo: '',
    verificationStatus: false,
    memberSince: '',
  })

  // Form state (editable copy)
  const [form, setForm] = useState({
    fullName: '',
    companyName: '',
    companyWebsite: '',
  })

  const [stats, setStats] = useState<JobStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalApplicants: 0,
  })

  // ── Load ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, created_at')
          .eq('id', user.id)
          .single()

        // Recruiter profile
        const { data: rp } = await supabase
          .from('recruiter_profiles')
          .select('company_name, company_logo, company_website, verification_status, created_at')
          .eq('id', user.id)
          .single()

        const p = profile as { full_name: string | null; email: string; created_at: string } | null
        const r = rp as {
          company_name: string | null
          company_logo: string | null
          company_website: string | null
          verification_status: boolean
          created_at: string
        } | null

        const loaded: RecruiterData = {
          fullName: p?.full_name ?? '',
          email: p?.email ?? user.email ?? '',
          companyName: r?.company_name ?? '',
          companyWebsite: r?.company_website ?? '',
          companyLogo: r?.company_logo ?? '',
          verificationStatus: r?.verification_status ?? false,
          memberSince: p?.created_at
            ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : '',
        }

        setData(loaded)
        setForm({
          fullName: loaded.fullName,
          companyName: loaded.companyName,
          companyWebsite: loaded.companyWebsite,
        })

        // Job stats
        const { data: jobRows } = await supabase
          .from('jobs')
          .select('id, status')
          .eq('recruiter_id', user.id)

        const jobs = (jobRows ?? []) as { id: string; status: string }[]
        const jobIds = jobs.map((j) => j.id)

        let totalApps = 0
        if (jobIds.length > 0) {
          const { count } = await supabase
            .from('applications')
            .select('id', { count: 'exact', head: true })
            .in('job_id', jobIds)
          totalApps = count ?? 0
        }

        setStats({
          totalJobs: jobs.length,
          activeJobs: jobs.filter((j) => j.status === 'active').length,
          totalApplicants: totalApps,
        })
      } catch (err) {
        console.error('Profile load error:', err)
        toast.error('Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Update profiles (full_name)
      const { error: profileError } = await supabase
        .from('profiles')
        // @ts-expect-error Supabase type inference
        .update({ full_name: form.fullName.trim() })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Upsert recruiter_profiles
      const { error: rpError } = await supabase
        .from('recruiter_profiles')
        // @ts-expect-error Supabase type inference
        .upsert({
          id: user.id,
          company_name: form.companyName.trim() || null,
          company_website: form.companyWebsite.trim() || null,
        })

      if (rpError) throw rpError

      // Update local data
      setData((prev) => ({
        ...prev,
        fullName: form.fullName.trim(),
        companyName: form.companyName.trim(),
        companyWebsite: form.companyWebsite.trim(),
      }))

      setIsEditing(false)
      toast.success('Profile updated successfully!')
    } catch (err) {
      console.error('Save error:', err)
      toast.error('Failed to save profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setForm({
      fullName: data.fullName,
      companyName: data.companyName,
      companyWebsite: data.companyWebsite,
    })
    setIsEditing(false)
  }

  // ── Logo Upload ──────────────────────────────────────────────────────────────

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate type & size (max 2 MB)
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
    if (!allowed.includes(file.type)) {
      toast.error('Please upload a PNG, JPG, WebP or SVG image.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be smaller than 2 MB.')
      return
    }

    setIsUploadingLogo(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Convert to base64 data URL (stored directly in the DB column)
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // Persist to recruiter_profiles.company_logo
      const { error: rpError } = await supabase
        .from('recruiter_profiles')
        // @ts-expect-error Supabase type inference
        .upsert({ id: user.id, company_logo: base64 })

      if (rpError) throw rpError

      // Update local state
      setData((prev) => ({ ...prev, companyLogo: base64 }))
      toast.success('Company logo uploaded!')
    } catch (err) {
      console.error('Logo upload error:', err)
      toast.error('Failed to upload logo. Please try again.')
    } finally {
      setIsUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  const handleRemoveLogo = async () => {
    setIsUploadingLogo(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error: rpError } = await supabase
        .from('recruiter_profiles')
        // @ts-expect-error Supabase type inference
        .upsert({ id: user.id, company_logo: null })

      if (rpError) throw rpError

      setData((prev) => ({ ...prev, companyLogo: '' }))
      toast.success('Company logo removed.')
    } catch (err) {
      console.error('Remove logo error:', err)
      toast.error('Failed to remove logo.')
    } finally {
      setIsUploadingLogo(false)
    }
  }

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-gray-500">Loading your profile...</p>
        </div>
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const initials = data.fullName
    ? data.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : data.email.charAt(0).toUpperCase()

  return (
    <div className="mx-auto max-w-3xl space-y-6">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recruiter Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your personal information and company details.
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            {/* Avatar / Company Logo */}
            <div className="relative shrink-0">
              {data.companyLogo ? (
                <img
                  src={data.companyLogo}
                  alt="Company logo"
                  className="h-20 w-20 rounded-full object-contain border border-gray-200 bg-white p-1"
                />
              ) : (
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-emerald-100 text-2xl font-bold text-emerald-700">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {data.fullName || 'Recruiter'}
                  </h2>
                  <p className="text-sm text-gray-500">{data.email}</p>
                  {data.companyName && (
                    <p className="mt-1 flex items-center gap-1 text-sm font-medium text-emerald-700">
                      <Building2 className="h-4 w-4" />
                      {data.companyName}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {data.verificationStatus ? (
                    <Badge className="bg-emerald-100 text-emerald-700">
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-500">
                      Unverified
                    </Badge>
                  )}
                  {!isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="mr-1 h-4 w-4" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>

              {data.companyWebsite && !isEditing && (
                <a
                  href={data.companyWebsite.startsWith('http') ? data.companyWebsite : `https://${data.companyWebsite}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:underline"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {data.companyWebsite}
                </a>
              )}

              {data.memberSince && (
                <p className="mt-2 text-xs text-gray-400">
                  Member since {data.memberSince}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100">
              <Briefcase className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.totalJobs}</p>
              <p className="text-sm text-gray-500">Total Jobs Posted</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.activeJobs}</p>
              <p className="text-sm text-gray-500">Active Jobs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-100">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{stats.totalApplicants}</p>
              <p className="text-sm text-gray-500">Total Applicants</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>
              Update your personal and company information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Personal Info */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                <User className="h-4 w-4" /> Personal Information
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    className="mt-1"
                    placeholder="Your full name"
                    value={form.fullName}
                    onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="email"
                      className="pl-10 bg-gray-50"
                      value={data.email}
                      disabled
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">Email cannot be changed here.</p>
                </div>
              </div>
            </div>

            <hr />

            {/* Company Info */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                <Building2 className="h-4 w-4" /> Company Information
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    className="mt-1"
                    placeholder="e.g. Tech Solutions Ltd"
                    value={form.companyName}
                    onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    This name is shown to job seekers on all your job postings.
                  </p>
                </div>
                <div>
                  <Label htmlFor="companyWebsite">Company Website</Label>
                  <div className="relative mt-1">
                    <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="companyWebsite"
                      className="pl-10"
                      placeholder="https://yourcompany.com"
                      value={form.companyWebsite}
                      onChange={(e) => setForm((f) => ({ ...f, companyWebsite: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Company Logo Upload */}
                <div>
                  <Label className="mb-2 block">Company Logo</Label>
                  <div className="flex items-center gap-4">
                    {/* Preview */}
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden">
                      {isUploadingLogo ? (
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                      ) : data.companyLogo ? (
                        <img
                          src={data.companyLogo}
                          alt="Logo preview"
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-gray-300" />
                      )}
                    </div>

                    {/* Controls */}
                    <div className="flex-1 space-y-2">
                      <p className="text-xs text-gray-500">
                        PNG, JPG, WebP or SVG · Max 2 MB · Recommended: 256×256 px
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isUploadingLogo}
                          onClick={() => logoInputRef.current?.click()}
                        >
                          <Upload className="mr-1 h-4 w-4" />
                          {data.companyLogo ? 'Change Logo' : 'Upload Logo'}
                        </Button>
                        {data.companyLogo && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isUploadingLogo}
                            className="text-red-500 hover:text-red-600"
                            onClick={handleRemoveLogo}
                          >
                            <X className="mr-1 h-4 w-4" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" />Save Changes</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Read-only details when not editing */}
      {!isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {[
              { label: 'Full Name', value: data.fullName || '—', icon: <User className="h-4 w-4 text-gray-400" /> },
              { label: 'Email', value: data.email, icon: <Mail className="h-4 w-4 text-gray-400" /> },
              { label: 'Company', value: data.companyName || '—', icon: <Building2 className="h-4 w-4 text-gray-400" /> },
              { label: 'Website', value: data.companyWebsite || '—', icon: <Globe className="h-4 w-4 text-gray-400" /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {icon}
                  {label}
                </div>
                <span className="text-sm font-medium text-gray-900">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
