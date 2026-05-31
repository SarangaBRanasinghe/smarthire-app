import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

const CANDIDATE_RANK_PROMPT = `You are a recruiter ranking candidates for a job.
Return ONLY valid JSON (no markdown, no code blocks, no extra text).
The JSON must be an array of objects in this exact format:
[{"seekerId":"string","score":number}]
Rules:
- score is an integer from 0 to 100
- use semantic matching, not just keyword overlap
- consider skills, experience, education, bio/about, and location fit
- keep the order the same as the input candidates
`

type JobInput = {
  id?: string
  title?: string
  description?: string
  skills?: string[]
  location?: string
  company?: string
}

type CandidateInput = {
  seekerId: string
  name?: string
  bio?: string
  skills?: string[]
  experience?: string
  education?: string
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
    const job = (body?.job || {}) as JobInput
    const candidates = (body?.candidates || []) as CandidateInput[]

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return NextResponse.json({ error: 'No candidates provided' }, { status: 400 })
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const results: Array<{ seekerId: string; score: number }> = []
    const chunkSize = 10

    for (let i = 0; i < candidates.length; i += chunkSize) {
      const chunk = candidates.slice(i, i + chunkSize)

      const jobPayload = {
        title: job.title || '',
        description: job.description || '',
        skills: job.skills || [],
        location: job.location || '',
        company: job.company || '',
      }

      const candidatePayload = chunk.map((c) => ({
        seekerId: c.seekerId,
        name: c.name || '',
        bio: c.bio || '',
        skills: c.skills || [],
        experience: c.experience || '',
        education: c.education || '',
        location: c.location || '',
      }))

      const prompt = `${CANDIDATE_RANK_PROMPT}

Job:
${JSON.stringify(jobPayload)}

Candidates:
${JSON.stringify(candidatePayload)}
`

      let responseText = ''
      try {
        const response = await model.generateContent([prompt])
        responseText = response.response.text()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        if (message.includes('429') || message.toLowerCase().includes('quota')) {
          return NextResponse.json(
            { error: 'Gemini quota exceeded. Please retry later.', retryAfterSeconds: 60 },
            { status: 429 }
          )
        }
        throw err
      }

      const cleaned = cleanJson(responseText)

      let parsed: Array<{ seekerId: string; score: number }> = []
      try {
        parsed = JSON.parse(cleaned)
      } catch {
        console.error('Failed to parse Gemini candidate rank response:', responseText)
        return NextResponse.json(
          { error: 'AI returned an unexpected format. Please try again.' },
          { status: 500 }
        )
      }

      parsed.forEach((item) => {
        if (!item?.seekerId) return
        const score = Math.max(0, Math.min(100, Math.round(Number(item.score) || 0)))
        results.push({ seekerId: item.seekerId, score })
      })

      if (i + chunkSize < candidates.length) {
        await delay(400)
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Candidate rank error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to rank candidates: ${message}` },
      { status: 500 }
    )
  }
}
