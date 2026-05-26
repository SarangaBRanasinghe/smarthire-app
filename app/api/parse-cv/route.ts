import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

const CV_PARSE_PROMPT = `You are an expert CV/Resume parser. Analyze the provided CV/Resume document and extract all relevant information. 

Return ONLY a valid JSON object (no markdown, no code blocks, no extra text) with this EXACT structure:

{
  "fullName": "string - full name of the person",
  "email": "string - email address or empty string",
  "phone": "string - phone number or empty string",
  "location": "string - city/country or empty string",
  "bio": "string - professional summary/objective (2-4 sentences) or empty string",
  "skills": ["array", "of", "skill", "strings"],
  "experience": [
    {
      "id": "string - unique id like exp_1",
      "title": "string - job title",
      "company": "string - company name",
      "location": "string - job location or empty string",
      "startDate": "string - start date like '2020-01' or '2020' or empty string",
      "endDate": "string - end date like '2023-06' or '2023' or empty string if current",
      "current": "boolean - true if this is current job",
      "description": "string - job responsibilities and achievements"
    }
  ],
  "education": [
    {
      "id": "string - unique id like edu_1",
      "degree": "string - degree name e.g. BSc Computer Science",
      "institution": "string - university/school name",
      "location": "string - location or empty string",
      "startDate": "string - start year or date or empty string",
      "endDate": "string - end year or date or empty string if current",
      "current": "boolean - true if currently studying",
      "field": "string - field of study or empty string"
    }
  ]
}

Important rules:
- Extract ALL skills including technical and soft skills
- For dates, use YYYY-MM format when month is available, or just YYYY
- If a field is not found, use empty string "" for strings, false for booleans, [] for arrays
- Ensure all JSON is valid and properly escaped
- The bio should be a professional summary extracted or inferred from the CV`

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return NextResponse.json(
      { error: 'Gemini API key is not configured. Please add GEMINI_API_KEY to your .env.local file.' },
      { status: 500 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: "${file.type}". Please upload a PDF, DOC, DOCX, or TXT file.` },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Data = buffer.toString('base64')

    // Initialize Gemini with the correct model name
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    let result

    if (file.type === 'application/pdf') {
      // PDF: send directly as inline data (Gemini natively supports PDF)
      result = await model.generateContent([
        {
          inlineData: {
            data: base64Data,
            mimeType: 'application/pdf',
          },
        },
        CV_PARSE_PROMPT,
      ])
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword'
    ) {
      // DOCX/DOC: extract text first using mammoth, then send as plain text to Gemini
      let extractedText = ''
      try {
        const mammoth = await import('mammoth')
        const { value } = await mammoth.extractRawText({ buffer })
        extractedText = value
      } catch (mammothError) {
        console.error('Mammoth extraction error:', mammothError)
        return NextResponse.json(
          { error: 'Failed to read DOCX file. Please try converting it to PDF and uploading again.' },
          { status: 500 }
        )
      }

      if (!extractedText.trim()) {
        return NextResponse.json(
          { error: 'The document appears to be empty or unreadable. Please try a different file.' },
          { status: 400 }
        )
      }

      result = await model.generateContent([
        `Here is the CV/Resume content extracted from a Word document:\n\n${extractedText}\n\n${CV_PARSE_PROMPT}`,
      ])
    } else {
      // Plain text
      const text = buffer.toString('utf-8')
      result = await model.generateContent([
        `Here is the CV/Resume content:\n\n${text}\n\n${CV_PARSE_PROMPT}`,
      ])
    }

    const responseText = result.response.text()

    // Clean the response - remove markdown code blocks if present
    let cleanedJson = responseText.trim()

    // Handle ```json ... ``` or ``` ... ``` blocks
    const jsonBlockMatch = cleanedJson.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonBlockMatch) {
      cleanedJson = jsonBlockMatch[1].trim()
    }

    // Parse and validate the JSON response
    let parsedData
    try {
      parsedData = JSON.parse(cleanedJson)
    } catch {
      console.error('Failed to parse Gemini response as JSON:', responseText)
      return NextResponse.json(
        { error: 'AI returned an unexpected format. Please try again.' },
        { status: 500 }
      )
    }

    // Normalize and ensure required fields with proper types
    const normalizedData = {
      fullName: parsedData.fullName || '',
      email: parsedData.email || '',
      phone: parsedData.phone || '',
      location: parsedData.location || '',
      bio: parsedData.bio || '',
      skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
      experience: Array.isArray(parsedData.experience)
        ? parsedData.experience.map((exp: Record<string, unknown>, index: number) => ({
            id: (exp.id as string) || `exp_${index + 1}`,
            title: (exp.title as string) || '',
            company: (exp.company as string) || '',
            location: (exp.location as string) || '',
            startDate: (exp.startDate as string) || '',
            endDate: (exp.endDate as string) || '',
            current: Boolean(exp.current),
            description: (exp.description as string) || '',
          }))
        : [],
      education: Array.isArray(parsedData.education)
        ? parsedData.education.map((edu: Record<string, unknown>, index: number) => ({
            id: (edu.id as string) || `edu_${index + 1}`,
            degree: (edu.degree as string) || '',
            institution: (edu.institution as string) || '',
            location: (edu.location as string) || '',
            startDate: (edu.startDate as string) || '',
            endDate: (edu.endDate as string) || '',
            current: Boolean(edu.current),
            field: (edu.field as string) || '',
          }))
        : [],
    }

    return NextResponse.json(normalizedData)
  } catch (error) {
    console.error('CV parsing error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to parse CV: ${message}` },
      { status: 500 }
    )
  }
}
