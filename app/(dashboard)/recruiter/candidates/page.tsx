'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Sparkles,
  TrendingUp,
  Star,
  Calendar,
  Eye,
  MapPin,
  Mail,
  Phone,
  Download,
  Award,
  Video,
  Building2,
  PhoneCall,
} from 'lucide-react'

// Mock data for jobs
const mockJobs = [
  { id: '1', title: 'Senior Frontend Developer', applicants: 45 },
  { id: '2', title: 'Full Stack Engineer', applicants: 32 },
  { id: '3', title: 'DevOps Engineer', applicants: 28 },
]

// Mock data for AI-ranked candidates
const mockCandidates = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+94 77 123 4567',
    location: 'Colombo, Sri Lanka',
    currentRole: 'Senior Software Engineer at Tech Corp',
    matchScore: 98,
    rank: 1,
    keyStrengths: [
      'Strong React and TypeScript expertise',
      '5+ years frontend development',
      'Experience leading teams of 5+',
      'Published tech articles',
    ],
    gaps: [],
    skills: ['React', 'TypeScript', 'Next.js', 'Node.js', 'AWS'],
    experience: '6 years',
    education: 'BSc Computer Science',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '+94 77 234 5678',
    location: 'Remote',
    currentRole: 'Frontend Developer at StartupX',
    matchScore: 95,
    rank: 2,
    keyStrengths: [
      'TypeScript expert',
      'Multiple Next.js production apps',
      'CI/CD pipeline experience',
    ],
    gaps: ['Less team lead experience'],
    skills: ['React', 'TypeScript', 'Next.js', 'Docker', 'GraphQL'],
    experience: '4 years',
    education: 'MSc Software Engineering',
  },
  {
    id: '3',
    name: 'Mike Chen',
    email: 'mike.chen@email.com',
    phone: '+94 77 345 6789',
    location: 'Kandy, Sri Lanka',
    currentRole: 'React Developer at Digital Agency',
    matchScore: 92,
    rank: 3,
    keyStrengths: [
      'React Native mobile experience',
      'Full-stack capabilities',
      'Fast learner with startup background',
    ],
    gaps: ['Limited TypeScript projects'],
    skills: ['React', 'JavaScript', 'React Native', 'Node.js', 'MongoDB'],
    experience: '4 years',
    education: 'BSc Information Technology',
  },
  {
    id: '4',
    name: 'Emily Brown',
    email: 'emily.b@email.com',
    phone: '+94 77 456 7890',
    location: 'Galle, Sri Lanka',
    currentRole: 'Frontend Developer at E-commerce Co',
    matchScore: 88,
    rank: 4,
    keyStrengths: [
      'Vue.js to React transition',
      'Strong design sensibility',
      'Performance optimization experience',
    ],
    gaps: ['Primary experience in Vue.js', 'Less Next.js experience'],
    skills: ['React', 'Vue.js', 'JavaScript', 'CSS', 'Figma'],
    experience: '3 years',
    education: 'BSc Computer Science',
  },
  {
    id: '5',
    name: 'Alex Kumar',
    email: 'alex.k@email.com',
    phone: '+94 77 567 8901',
    location: 'Colombo, Sri Lanka',
    currentRole: 'Junior Frontend Developer',
    matchScore: 75,
    rank: 5,
    keyStrengths: [
      'Quick learner',
      'Modern tech stack knowledge',
      'Active open source contributor',
    ],
    gaps: ['Less than required experience', 'No team lead experience'],
    skills: ['React', 'JavaScript', 'Tailwind CSS', 'Git'],
    experience: '2 years',
    education: 'BSc Software Engineering',
  },
]

export default function CandidatesPage() {
  const [selectedJob, setSelectedJob] = useState(mockJobs[0].id)
  const [selectedCandidate, setSelectedCandidate] = useState<typeof mockCandidates[0] | null>(null)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)

  const handleScheduleInterview = () => {
    toast.success(`Interview scheduled with ${selectedCandidate?.name}`)
    setIsScheduleDialogOpen(false)
  }

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-white'
    if (rank === 2) return 'border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-white'
    if (rank === 3) return 'border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-white'
    return ''
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-amber-100 text-amber-700"><Award className="mr-1 h-3 w-3" />Top 1</Badge>
    if (rank === 2) return <Badge className="bg-gray-100 text-gray-700">Top 2</Badge>
    if (rank === 3) return <Badge className="bg-orange-100 text-orange-700">Top 3</Badge>
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-emerald-600" />
          <h1 className="text-2xl font-bold text-gray-900">AI Candidate Shortlist</h1>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          AI-ranked candidates based on job requirements and profile matching
        </p>
      </div>

      {/* Job Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Select Job:</label>
            <Select value={selectedJob} onValueChange={setSelectedJob}>
              <SelectTrigger className="w-80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mockJobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title} ({job.applicants} applicants)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights Card */}
      <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-white">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg">AI Matching Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-2xl font-bold text-emerald-600">{mockCandidates.length}</p>
              <p className="text-sm text-gray-500">Total Candidates</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-2xl font-bold text-emerald-600">
                {mockCandidates.filter(c => c.matchScore >= 90).length}
              </p>
              <p className="text-sm text-gray-500">High Match (90%+)</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-2xl font-bold text-emerald-600">
                {Math.round(mockCandidates.reduce((sum, c) => sum + c.matchScore, 0) / mockCandidates.length)}%
              </p>
              <p className="text-sm text-gray-500">Average Match Score</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidates List */}
      <div className="space-y-4">
        {mockCandidates.map((candidate) => (
          <Card
            key={candidate.id}
            className={`transition-all hover:shadow-lg ${getRankStyle(candidate.rank)}`}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                {/* Rank & Avatar */}
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ${
                      candidate.rank === 1
                        ? 'bg-amber-100 text-amber-700'
                        : candidate.rank <= 3
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {candidate.rank === 1 ? (
                      <Star className="h-6 w-6" />
                    ) : (
                      `#${candidate.rank}`
                    )}
                  </div>
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-emerald-100 text-lg text-emerald-700">
                      {candidate.name.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Candidate Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold text-gray-900">{candidate.name}</h3>
                    {getRankBadge(candidate.rank)}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{candidate.currentRole}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {candidate.location}
                    </span>
                    <span>{candidate.experience} experience</span>
                    <span>{candidate.education}</span>
                  </div>

                  {/* Skills */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {candidate.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  {/* Key Strengths */}
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700">Key Strengths:</p>
                    <ul className="mt-2 grid gap-1 md:grid-cols-2">
                      {candidate.keyStrengths.map((strength, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Gaps */}
                  {candidate.gaps.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">Areas to Consider:</p>
                      <ul className="mt-1">
                        {candidate.gaps.map((gap, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-amber-600">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                            {gap}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Match Score & Actions */}
                <div className="flex flex-col items-end gap-4">
                  <div className="text-center">
                    <div
                      className={`flex h-20 w-20 items-center justify-center rounded-full ${
                        candidate.matchScore >= 90
                          ? 'bg-emerald-100'
                          : candidate.matchScore >= 80
                          ? 'bg-green-100'
                          : 'bg-yellow-100'
                      }`}
                    >
                      <span
                        className={`text-2xl font-bold ${
                          candidate.matchScore >= 90
                            ? 'text-emerald-700'
                            : candidate.matchScore >= 80
                            ? 'text-green-700'
                            : 'text-yellow-700'
                        }`}
                      >
                        {candidate.matchScore}%
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Match Score</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCandidate(candidate)
                        setIsProfileDialogOpen(true)
                      }}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      View Full Profile
                    </Button>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700"
                      size="sm"
                      onClick={() => {
                        setSelectedCandidate(candidate)
                        setIsScheduleDialogOpen(true)
                      }}
                    >
                      <Calendar className="mr-1 h-4 w-4" />
                      Schedule Interview
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Candidate Profile</DialogTitle>
            <DialogDescription>
              Full profile details for {selectedCandidate?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-6 py-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-emerald-100 text-2xl text-emerald-700">
                    {selectedCandidate.name.split(' ').map((n) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedCandidate.name}</h3>
                  <p className="text-gray-600">{selectedCandidate.currentRole}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {selectedCandidate.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {selectedCandidate.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {selectedCandidate.location}
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                    <span className="text-xl font-bold text-emerald-700">
                      {selectedCandidate.matchScore}%
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Match</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium text-gray-900">Experience</h4>
                  <p className="text-sm text-gray-600">{selectedCandidate.experience}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Education</h4>
                  <p className="text-sm text-gray-600">{selectedCandidate.education}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">Skills</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedCandidate.skills.map((skill) => (
                    <Badge key={skill} className="bg-emerald-100 text-emerald-700">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Interview
                </Button>
                <Button variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Download Resume
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Interview Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogDescription>
              Schedule an interview with {selectedCandidate?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" className="flex flex-col gap-2 py-4">
                <Video className="h-5 w-5" />
                <span className="text-xs">Video Call</span>
              </Button>
              <Button variant="outline" className="flex flex-col gap-2 py-4">
                <PhoneCall className="h-5 w-5" />
                <span className="text-xs">Phone Call</span>
              </Button>
              <Button variant="outline" className="flex flex-col gap-2 py-4">
                <Building2 className="h-5 w-5" />
                <span className="text-xs">In Person</span>
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Select interview type and the candidate will be notified via email with the details.
            </p>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={handleScheduleInterview}
            >
              Confirm Interview
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
