# CV Upload and Parsing Setup

## Implemented Features

### 1. CV Upload & Parsing
- Upload PDF or Word documents (max 5MB)
- Automatic text extraction from documents
- AI-powered data extraction including:
  - Name, email, phone, location
  - Professional bio
  - Work experience
  - Education history
  - Skills

### 2. Database Integration
- Saves resume to Supabase Storage
- Stores profile data in `profiles` table
- Stores seeker-specific data in `seeker_profiles` table
- Manages skills in `skills` and `seeker_skills` tables

### 3. Required Setup

#### Install Dependencies
```bash
npm install pdf-parse mammoth
```

#### Create Supabase Storage Bucket
1. Go to your Supabase project dashboard
2. Navigate to Storage
3. Create a new bucket named `resumes`
4. Make it public or configure access policies:
```sql
-- Allow authenticated users to upload their resumes
CREATE POLICY "Users can upload their own resumes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to read their own resumes
CREATE POLICY "Users can read their own resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to update their own resumes
CREATE POLICY "Users can update their own resumes"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
```

## How It Works

1. **Upload**: User uploads CV (PDF/Word)
2. **Store**: File uploaded to Supabase Storage at `resumes/{userId}-{timestamp}.ext`
3. **Parse**: API route extracts text and parses:
   - Email via regex
   - Phone via regex
   - Skills by keyword matching
   - Experience/Education sections
4. **Fill Form**: Extracted data automatically populates form fields
5. **Review & Save**: User reviews and saves to database

## API Route

`/api/parse-cv` - Accepts multipart/form-data with file upload

The parsing logic uses:
- `pdf-parse` for PDF files
- `mammoth` for Word documents
- Regex patterns for email, phone extraction
- Keyword matching for skills
- Section parsing for experience/education

## Files Modified

1. `/app/api/parse-cv/route.ts` - CV parsing API endpoint
2. `/app/(dashboard)/seeker/profile/page.tsx` - Profile page with upload
3. `/lib/api/index.ts` - Updated to call real API

## Usage

1. User navigates to profile page
2. Clicks "Upload Resume" button
3. Selects CV file (PDF or Word)
4. System parses and fills form automatically
5. User reviews extracted data
6. User adds/removes skills as needed
7. Clicks "Save Profile" to store in database

## Note

The CV parsing is basic text extraction. For better results, consider:
- Integrating with OpenAI API for smarter parsing
- Using specialized resume parsing services
- Training custom ML models
