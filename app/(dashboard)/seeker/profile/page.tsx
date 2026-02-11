'use client'

import { useState, useRef, useEffect } from 'react'
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
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { aiService } from '@/lib/api'
import {
  Upload,
  FileText,
  Loader2,
  Sparkles,
  X,
  Plus,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
} from 'lucide-react'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  experience: z.string().optional(),
  education: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function SeekerProfilePage() {
  const supabase = createClient()
  const [isParsingCV, setIsParsingCV] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      bio: '',
      experience: '',
      education: '',
    },
  })

  // Load existing profile data on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          toast.error('Please login to view your profile')
          return
        }

        setUserId(user.id)

        // Fetch profile (full_name, email)
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single<{ full_name: string | null; email: string }>()

        // Fetch seeker_profile (bio, phone, location, experience_summary, education_summary)
        const { data: seekerProfile } = await supabase
          .from('seeker_profiles')
          .select('bio, phone, location, experience_summary, education_summary')
          .eq('id', user.id)
          .single<{
            bio: string | null
            phone: string | null
            location: string | null
            experience_summary: string | object | null
            education_summary: string | object | null
          }>()

        // Fetch seeker skills
        const { data: seekerSkills } = await supabase
          .from('seeker_skills')
          .select('skills(name)')
          .eq('seeker_id', user.id)

        // Populate form
        reset({
          fullName: profile?.full_name || '',
          email: profile?.email || user.email || '',
          phone: seekerProfile?.phone || '',
          location: seekerProfile?.location || '',
          bio: seekerProfile?.bio || '',
          experience: typeof seekerProfile?.experience_summary === 'string'
            ? seekerProfile.experience_summary
            : '',
          education: typeof seekerProfile?.education_summary === 'string'
            ? seekerProfile.education_summary
            : '',
        })

        // Populate skills
        if (seekerSkills && seekerSkills.length > 0) {
          const loadedSkills = seekerSkills
            .map((s: { skills: { name: string } | null }) => s.skills?.name)
            .filter(Boolean) as string[]
          setSkills(loadedSkills)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        toast.error('Failed to load profile data')
      } finally {
        setIsLoadingProfile(false)
      }
    }

    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or Word document')
      return
    }

    setUploadedFile(file)
    setIsParsingCV(true)

    try {
      // Call the AI service to parse the CV
      const parsedData = await aiService.parseCV(file)

      // Fill the form with parsed data
      setValue('fullName', parsedData.fullName)
      setValue('email', parsedData.email)
      setValue('phone', parsedData.phone)
      setValue('location', parsedData.location)
      setValue('bio', parsedData.bio)

      // Format experience
      const experienceText = parsedData.experience
        .map((exp) => `${exp.title} at ${exp.company} (${exp.startDate} - ${exp.current ? 'Present' : exp.endDate})\n${exp.description || ''}`)
        .join('\n\n')
      setValue('experience', experienceText)

      // Format education
      const educationText = parsedData.education
        .map((edu) => `${edu.degree} - ${edu.institution} (${edu.startDate} - ${edu.current ? 'Present' : edu.endDate})`)
        .join('\n')
      setValue('education', educationText)

      // Set skills
      setSkills(parsedData.skills)

      toast.success('CV parsed successfully! Review and save your profile.')
    } catch {
      toast.error('Failed to parse CV. Please try again.')
    } finally {
      setIsParsingCV(false)
    }
  }

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove))
  }

  const onSubmit = async (data: ProfileFormData) => {
    if (!userId) {
      toast.error('User not authenticated')
      return
    }

    setIsSaving(true)
    try {
      // 1. Update profiles table (full_name)
      const { error: profileError } = await supabase
        .from('profiles')
        // @ts-expect-error - Supabase type inference issue
        .update({ full_name: data.fullName })
        .eq('id', userId)

      if (profileError) {
        console.error('Profile update error:', profileError)
        throw new Error(profileError.message)
      }

      // 2. Upsert seeker_profiles table
      const { error: seekerError } = await supabase
        .from('seeker_profiles')
        // @ts-expect-error - Supabase type inference issue
        .upsert({
          id: userId,
          bio: data.bio || null,
          phone: data.phone || null,
          location: data.location || null,
          experience_summary: data.experience || '',
          education_summary: data.education || '',
        })

      if (seekerError) {
        console.error('Seeker profile update error:', seekerError)
        throw new Error(seekerError.message)
      }

      // 3. Handle skills
      if (skills.length > 0) {
        // Upsert each skill into the skills table
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
          // Delete existing seeker_skills for this user
          await supabase
            .from('seeker_skills')
            .delete()
            .eq('seeker_id', userId)

          // Insert new seeker_skills relationships
          const seekerSkills = skillRecords.map((skill: { id: string; name: string }) => ({
            seeker_id: userId,
            skill_id: skill.id,
          }))

          const { error: seekerSkillsError } = await supabase
            .from('seeker_skills')
            // @ts-expect-error - Supabase type inference issue
            .insert(seekerSkills)

          if (seekerSkillsError) {
            console.error('Seeker skills error:', seekerSkillsError)
          }
        }
      } else {
        // No skills — clear existing seeker_skills
        await supabase
          .from('seeker_skills')
          .delete()
          .eq('seeker_id', userId)
      }

      toast.success('Profile saved successfully!')
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoadingProfile) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-gray-500">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* AI CV Parsing Card */}
      <Card className="border-emerald-200 bg-linear-to-r from-emerald-50 to-emerald-100/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">AI-Powered CV Parsing</CardTitle>
              <CardDescription>
                Upload your resume and let AI extract your information automatically
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-emerald-300 bg-white p-8">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />

            {isParsingCV ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
                <p className="font-medium text-emerald-700">Parsing your CV...</p>
                <p className="text-sm text-gray-500">
                  Our AI is extracting your information
                </p>
              </div>
            ) : uploadedFile ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <FileText className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload Different File
                </Button>
              </div>
            ) : (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <Upload className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900">
                    Drag and drop your CV here
                  </p>
                  <p className="text-sm text-gray-500">or click to browse</p>
                </div>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload CV
                </Button>
                <p className="text-xs text-gray-400">
                  Supported formats: PDF, DOC, DOCX
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Your personal information that will be visible to recruiters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  className="mt-1"
                  {...register('fullName')}
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-500">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  className="mt-1"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  className="mt-1"
                  {...register('phone')}
                />
              </div>

              <div>
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </Label>
                <Input
                  id="location"
                  className="mt-1"
                  {...register('location')}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Professional Summary</Label>
              <Textarea
                id="bio"
                className="mt-1"
                rows={3}
                placeholder="Write a brief summary about yourself..."
                {...register('bio')}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              Skills
            </CardTitle>
            <CardDescription>
              Add skills to help AI match you with the right jobs
            </CardDescription>
          </CardHeader>
          <CardContent>
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
              <Button
                type="button"
                variant="outline"
                onClick={handleAddSkill}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Work Experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              id="experience"
              rows={6}
              placeholder="Describe your work experience..."
              {...register('experience')}
            />
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Education
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              id="education"
              rows={4}
              placeholder="List your educational background..."
              {...register('education')}
            />
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Profile'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
