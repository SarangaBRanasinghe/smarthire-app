'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
  const [isParsingCV, setIsParsingCV] = useState(false)
  const [skills, setSkills] = useState<string[]>(['JavaScript', 'React', 'TypeScript'])
  const [newSkill, setNewSkill] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+94 77 123 4567',
      location: 'Colombo, Sri Lanka',
      bio: 'Experienced software engineer passionate about building great products.',
      experience: '',
      education: '',
    },
  })

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
    try {
      // TODO: Save to Supabase
      console.log('Saving profile:', { ...data, skills })
      toast.success('Profile saved successfully!')
    } catch {
      toast.error('Failed to save profile')
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* AI CV Parsing Card */}
      <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100/50">
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
            disabled={!isDirty}
          >
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  )
}
