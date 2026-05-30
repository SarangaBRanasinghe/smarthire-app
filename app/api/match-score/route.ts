import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

const MATCH_SCORE_PROMPT = `You are a job matching engine. Compare a candidate profile with job postings.
Return ONLY valid JSON (no markdown, no code blocks, no extra text).
The JSON must be an array of objects in this exact format:
[{"jobId":"string","score":number}]
Rules:
- score is an integer from 0 to 100
- use semantic matching, not just keyword overlap
- consider skills, experience, education, and bio/about
- keep the order the same as the input jobs
`

type MatchJobInput = {
  id: string
  title?: string
  description?: string
  skills?: string[]
  location?: string
  company?: string
}

type SeekerProfileInput = {
  bio?: string
  experience?: string
  education?: string
  skills?: string[]
  location?: string
}

function cleanJson(text: string) {
  const trimmed = text.trim()
  const blockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (blockMatch) return blockMatch[1].trim()
  return trimmed
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return NextResponse.json(
      { error: 'Gemini API key is not configured. Please add GEMINI_API_KEY to your .env.local file.' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const seekerProfile = (body?.seekerProfile || {}) as SeekerProfileInput
    const jobs = (body?.jobs || []) as MatchJobInput[]

    if (!Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json({ error: 'No jobs provided' }, { status: 400 })
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const results: Array<{ jobId: string; score: number }> = []
    const chunkSize = 10

    for (let i = 0; i < jobs.length; i += chunkSize) {
      const chunk = jobs.slice(i, i + chunkSize)

      const seekerText = {
        bio: seekerProfile.bio || '',
        experience: seekerProfile.experience || '',
        education: seekerProfile.education || '',
        skills: seekerProfile.skills || [],
        location: seekerProfile.location || '',
      }

      const jobPayload = chunk.map((job) => ({
        jobId: job.id,
        title: job.title || '',
        description: job.description || '',
        skills: job.skills || [],
        location: job.location || '',
        company: job.company || '',
      }))

      const prompt = `${MATCH_SCORE_PROMPT}

Candidate profile:
${JSON.stringify(seekerText)}

Jobs:
${JSON.stringify(jobPayload)}
`

      let responseText = ''
      try {
        const response = await model.generateContent([prompt])
        responseText = response.response.text()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        if (message.includes('429') || message.toLowerCase().includes('quota')) {
          return NextResponse.json(
            { error: 'Gemini quota exceeded. Please retry later.' },
            { status: 429 }
          )
        }
        throw err
      }
      const cleaned = cleanJson(responseText)

      let parsed: Array<{ jobId: string; score: number }> = []
      try {
        parsed = JSON.parse(cleaned)
      } catch {
        console.error('Failed to parse Gemini match score response:', responseText)
        return NextResponse.json(
          { error: 'AI returned an unexpected format. Please try again.' },
          { status: 500 }
        )
      }

      parsed.forEach((item) => {
        if (!item?.jobId) return
        const score = Math.max(0, Math.min(100, Math.round(Number(item.score) || 0)))
        results.push({ jobId: item.jobId, score })
      })

      if (i + chunkSize < jobs.length) {
        await delay(400)
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Match score error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to compute match scores: ${message}` },
      { status: 500 }
    )
  }
}
