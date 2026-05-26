import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Types for AI service responses
export interface ParsedCVData {
  fullName: string
  email: string
  phone: string
  location: string
  bio: string
  skills: string[]
  experience: Array<{
    id: string
    title: string
    company: string
    location?: string
    startDate: string
    endDate?: string
    current: boolean
    description?: string
  }>
  education: Array<{
    id: string
    degree: string
    institution: string
    location?: string
    startDate: string
    endDate?: string
    current: boolean
    field?: string
  }>
}

export interface MatchScoreResult {
  score: number
  explanation: string
  keyStrengths: string[]
  gaps: string[]
}

// Mock implementation - will be replaced with actual API calls
export const aiService = {
  /**
   * Parse a CV/Resume file and extract structured data
   * @param file - The CV file to parse
   * @returns Parsed CV data
   */
  async parseCV(file: File): Promise<ParsedCVData> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/parse-cv', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse CV' }))
      throw new Error(errorData.error || `HTTP ${response.status}: Failed to parse CV`)
    }

    const data = await response.json()
    return data as ParsedCVData
  },

  /**
   * Calculate match score between a job and a candidate
   * @param jobId - The job ID
   * @param seekerId - The seeker ID
   * @returns Match score and explanation
   */
  async calculateMatchScore(jobId: string, seekerId: string): Promise<MatchScoreResult> {
    // TODO: Replace with actual API call when FastAPI backend is ready
    // const response = await apiClient.post('/api/match-score', { jobId, seekerId })
    // return response.data

    // Mock implementation for demonstration
    await new Promise(resolve => setTimeout(resolve, 500))

    const score = Math.floor(Math.random() * 20) + 80 // Random score between 80-99

    const allStrengths = [
      'Strong technical skills alignment',
      'Relevant industry experience',
      'Required certification present',
      'Leadership experience',
      'Excellent communication skills',
      'Project management expertise',
    ]

    const allGaps = [
      'Missing specific framework knowledge',
      'Less experience than preferred',
      'Location preference mismatch',
    ]

    const keyStrengths = allStrengths.slice(0, Math.floor(Math.random() * 3) + 2)
    const gaps = score < 90 ? allGaps.slice(0, Math.floor(Math.random() * 2) + 1) : []

    return {
      score,
      explanation: `This candidate shows a ${score}% match with the job requirements based on skills, experience, and qualifications analysis.`,
      keyStrengths,
      gaps,
    }
  },

  /**
   * Get AI-recommended jobs for a seeker
   * @param seekerId - The seeker ID
   * @returns List of job IDs with match scores
   */
  async getRecommendedJobs(seekerId: string): Promise<Array<{ jobId: string; score: number }>> {
    // TODO: Replace with actual API call when FastAPI backend is ready
    // const response = await apiClient.get(`/api/recommendations/${seekerId}`)
    // return response.data

    // Mock implementation - will return empty array, actual scores computed elsewhere
    await new Promise(resolve => setTimeout(resolve, 300))
    return []
  },

  /**
   * Get AI-ranked candidates for a job
   * @param jobId - The job ID
   * @returns List of seeker IDs with match scores
   */
  async getRankedCandidates(jobId: string): Promise<Array<{ seekerId: string; score: number }>> {
    // TODO: Replace with actual API call when FastAPI backend is ready
    // const response = await apiClient.get(`/api/candidates/${jobId}/ranked`)
    // return response.data

    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 300))
    return []
  },
}

export default apiClient
