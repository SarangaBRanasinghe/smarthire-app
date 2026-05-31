'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, X, Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const jobSchema = z.object({
  title: z.string().min(3, 'Job title must be at least 3 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  location: z.string().min(2, 'Location is required'),
  type: z.enum(['full_time', 'part_time', 'contract', 'remote', 'internship']),
  salary_min: z.string().optional(),
  salary_max: z.string().optional(),
  currency: z.string().optional(),
})

type JobFormData = z.infer<typeof jobSchema>

const jobTypes = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'remote', label: 'Remote' },
  { value: 'internship', label: 'Internship' },
]

const currencies = [
  { value: 'LKR', label: 'LKR - Sri Lankan Rupee' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
]

const suggestedSkills = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python',
  'Java', 'PostgreSQL', 'MongoDB', 'AWS', 'Docker',
  'Kubernetes', 'Git', 'Agile', 'REST API', 'GraphQL',
]

export default function CreateJobPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')
  const [status, setStatus] = useState<'draft' | 'active'>('draft')
  const [recruiterId, setRecruiterId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      type: 'full_time',
      currency: 'LKR',
    },
  })

  // Get current user/recruiter
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Check if user has recruiter profile
        const { data: recruiterProfile } = await supabase
          .from('recruiter_profiles')
          .select('id, company_name')
          .eq('id', user.id)
          .single()
        
        if (recruiterProfile) {
          // @ts-expect-error - Supabase type inference issue
          setRecruiterId(recruiterProfile.id)
          // @ts-expect-error - Supabase type inference issue
          setCompanyName(recruiterProfile.company_name || '')
        } else {
          toast.error('Recruiter profile not found')
          router.push('/recruiter/jobs')
        }
      } else {
        toast.error('Please login to create jobs')
        router.push('/login')
      }
    }
    getUser()
  }, [supabase, router])

  const selectedType = watch('type')

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove))
  }

  const handleSuggestedSkill = (skill: string) => {
    if (!skills.includes(skill)) {
      setSkills([...skills, skill])
    }
  }

  const onSubmit = async (data: JobFormData) => {
    if (!recruiterId) {
      toast.error('Recruiter profile not found')
      return
    }

    setIsLoading(true)
    try {
      // If recruiter edited company name, persist it back to their profile
      if (companyName.trim()) {
        await supabase
          .from('recruiter_profiles')
          // @ts-expect-error - Supabase type inference issue
          .update({ company_name: companyName.trim() })
          .eq('id', recruiterId)
      }

      // Insert the job
      const { data: newJob, error: jobError } = await supabase
        .from('jobs')
        // @ts-expect-error - Supabase type inference issue
        .insert({
          recruiter_id: recruiterId,
          title: data.title,
          description: data.description,
          location: data.location,
          type: data.type,
          salary_min: data.salary_min ? parseFloat(data.salary_min) : null,
          salary_max: data.salary_max ? parseFloat(data.salary_max) : null,
          currency: data.currency || 'LKR',
          status: status,
        })
        .select()
        .single()

      if (jobError) {
        console.error('Job creation error:', jobError)
        throw new Error(jobError.message)
      }

      // Handle skills if any
      if (skills.length > 0 && newJob) {
        // First, insert skills that don't exist
        for (const skillName of skills) {
          const { error: skillError } = await supabase
            .from('skills')
            // @ts-expect-error - Supabase type inference issue
            .upsert({ name: skillName }, { onConflict: 'name', ignoreDuplicates: true })
          
          if (skillError) {
            console.error('Skill insert error:', skillError)
          }
        }

        // Get skill IDs
        const { data: skillRecords } = await supabase
          .from('skills')
          .select('id, name')
          .in('name', skills)

        if (skillRecords) {
          // Create job_skills relationships
          const jobSkills = skillRecords.map(skill => ({
            // @ts-expect-error - Supabase type inference issue
            job_id: newJob.id,
            // @ts-expect-error - Supabase type inference issue
            skill_id: skill.id,
          }))

          const { error: jobSkillsError } = await supabase
            .from('job_skills')
            // @ts-expect-error - Supabase type inference issue
            .insert(jobSkills)

          if (jobSkillsError) {
            console.error('Job skills error:', jobSkillsError)
          }
        }
      }

      if (status === 'active') {
        toast.success('Job posted successfully!')
      } else {
        toast.success('Job saved as draft!')
      }

      router.push('/recruiter/jobs')
    } catch (error) {
      console.error('Error creating job:', error)
      toast.error('Failed to create job. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/recruiter/jobs"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Job Posting</CardTitle>
            <CardDescription>
              Fill in the details below to create a new job listing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Job Title */}
            <div>
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Senior Frontend Developer"
                className="mt-1"
                {...register('title')}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            {/* Company Name */}
            <div>
              <Label htmlFor="companyName">Company Name *</Label>
              <p className="text-xs text-gray-400 mb-1">Auto-filled from your recruiter profile. Edit if needed.</p>
              <Input
                id="companyName"
                placeholder="e.g., Tech Solutions Ltd"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
              {!companyName.trim() && (
                <p className="mt-1 text-xs text-amber-500">⚠ Company name will be visible to job seekers. Update your recruiter profile to set a default.</p>
              )}
            </div>

            {/* Job Type */}
            <div>
              <Label>Job Type *</Label>
              <Select
                value={selectedType}
                onValueChange={(value) => setValue('type', value as JobFormData['type'])}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  {jobTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                placeholder="e.g., Colombo, Sri Lanka or Remote"
                className="mt-1"
                {...register('location')}
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-500">{errors.location.message}</p>
              )}
            </div>

            {/* Salary Range */}
            <div>
              <Label>Salary Range (Optional)</Label>
              <div className="mt-1 flex gap-3">
                <Select
                  defaultValue="LKR"
                  onValueChange={(value) => setValue('currency', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Min salary"
                  {...register('salary_min')}
                />
                <span className="flex items-center text-gray-500">to</span>
                <Input
                  type="number"
                  placeholder="Max salary"
                  {...register('salary_max')}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the role, responsibilities, and requirements..."
                className="mt-1"
                rows={8}
                {...register('description')}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Required Skills</CardTitle>
            <CardDescription>
              Add skills that are required or preferred for this role
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Selected Skills */}
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="flex items-center gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-1 rounded-full hover:bg-emerald-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            {/* Add New Skill */}
            <div className="mt-4 flex gap-2">
              <Input
                placeholder="Add a skill..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddSkill()
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddSkill}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Suggested Skills */}
            <div className="mt-4">
              <p className="text-sm text-gray-500">Suggested skills:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestedSkills
                  .filter((skill) => !skills.includes(skill))
                  .slice(0, 10)
                  .map((skill) => (
                    <Badge
                      key={skill}
                      variant="outline"
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSuggestedSkill(skill)}
                    >
                      + {skill}
                    </Badge>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/recruiter/jobs')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="outline"
            onClick={() => setStatus('draft')}
            disabled={isLoading}
          >
            Save as Draft
          </Button>
          <Button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setStatus('active')}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              'Publish Job'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
