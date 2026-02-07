-- SmartHire Database Schema
-- Migration: 001_initial_schema
-- Description: Complete database schema for SmartHire AI-powered recruitment platform

-- ============================================================================
-- ENUMS
-- ============================================================================

-- User roles enum
CREATE TYPE user_role AS ENUM ('job_seeker', 'recruiter', 'admin');

-- Job type enum
CREATE TYPE job_type AS ENUM ('full_time', 'part_time', 'contract', 'remote', 'internship');

-- Job status enum
CREATE TYPE job_status AS ENUM ('draft', 'active', 'closed');

-- Application status enum
CREATE TYPE application_status AS ENUM ('pending', 'reviewing', 'interview', 'offer', 'rejected');

-- Interview type enum
CREATE TYPE interview_type AS ENUM ('video', 'phone', 'in_person');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'job_seeker',
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Job Seeker Profiles (1:1 with profiles where role='job_seeker')
CREATE TABLE seeker_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    resume_url TEXT,
    bio TEXT,
    phone TEXT,
    location TEXT,
    experience_summary JSONB DEFAULT '[]'::jsonb,
    education_summary JSONB DEFAULT '[]'::jsonb,
    parsed_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recruiter Profiles (1:1 with profiles where role='recruiter')
CREATE TABLE recruiter_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    company_name TEXT,
    company_logo TEXT,
    company_website TEXT,
    verification_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recruiter_id UUID NOT NULL REFERENCES recruiter_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    salary_min NUMERIC(12, 2),
    salary_max NUMERIC(12, 2),
    currency TEXT DEFAULT 'LKR',
    type job_type NOT NULL DEFAULT 'full_time',
    status job_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Skills master table
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Job Skills junction table
CREATE TABLE job_skills (
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (job_id, skill_id)
);

-- Seeker Skills junction table
CREATE TABLE seeker_skills (
    seeker_id UUID NOT NULL REFERENCES seeker_profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (seeker_id, skill_id)
);

-- Applications table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    seeker_id UUID NOT NULL REFERENCES seeker_profiles(id) ON DELETE CASCADE,
    status application_status NOT NULL DEFAULT 'pending',
    cover_letter TEXT,
    ai_match_score NUMERIC(5, 2) CHECK (ai_match_score >= 0 AND ai_match_score <= 100),
    ai_match_explanation TEXT,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(job_id, seeker_id)
);

-- Interviews table
CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    type interview_type NOT NULL DEFAULT 'video',
    meeting_link TEXT,
    location_address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plan_tier TEXT NOT NULL DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'active',
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Profiles indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Jobs indexes
CREATE INDEX idx_jobs_recruiter_id ON jobs(recruiter_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_type ON jobs(type);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_jobs_expires_at ON jobs(expires_at);

-- Applications indexes
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_seeker_id ON applications(seeker_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_ai_score ON applications(ai_match_score DESC);

-- Interviews indexes
CREATE INDEX idx_interviews_application_id ON interviews(application_id);
CREATE INDEX idx_interviews_scheduled_at ON interviews(scheduled_at);

-- Skills indexes
CREATE INDEX idx_skills_name ON skills(name);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seeker_profiles_updated_at
    BEFORE UPDATE ON seeker_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recruiter_profiles_updated_at
    BEFORE UPDATE ON recruiter_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at
    BEFORE UPDATE ON interviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeker_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Public profiles are viewable (for recruiters viewing candidates, seekers viewing company)
CREATE POLICY "Public profiles viewable by authenticated users"
    ON profiles FOR SELECT
    USING (auth.role() = 'authenticated');

-- Allow insert during registration
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================================================
-- SEEKER PROFILES POLICIES
-- ============================================================================

-- Seekers can view and update their own profile
CREATE POLICY "Seekers can view own seeker profile"
    ON seeker_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Seekers can update own seeker profile"
    ON seeker_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Seekers can insert own seeker profile"
    ON seeker_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Recruiters can view seeker profiles (for reviewing candidates)
CREATE POLICY "Recruiters can view seeker profiles"
    ON seeker_profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'recruiter'
        )
    );

-- Admins can view all seeker profiles
CREATE POLICY "Admins can view all seeker profiles"
    ON seeker_profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================================================
-- RECRUITER PROFILES POLICIES
-- ============================================================================

-- Recruiters can view and update their own profile
CREATE POLICY "Recruiters can view own recruiter profile"
    ON recruiter_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Recruiters can update own recruiter profile"
    ON recruiter_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Recruiters can insert own recruiter profile"
    ON recruiter_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Public can view recruiter profiles (company info on job listings)
CREATE POLICY "Anyone can view recruiter profiles"
    ON recruiter_profiles FOR SELECT
    USING (auth.role() = 'authenticated');

-- ============================================================================
-- JOBS POLICIES
-- ============================================================================

-- Anyone authenticated can view active jobs
CREATE POLICY "Active jobs are viewable by all authenticated users"
    ON jobs FOR SELECT
    USING (
        auth.role() = 'authenticated'
        AND (status = 'active' OR recruiter_id = auth.uid())
    );

-- Recruiters can insert jobs
CREATE POLICY "Recruiters can create jobs"
    ON jobs FOR INSERT
    WITH CHECK (
        auth.uid() = recruiter_id
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'recruiter'
        )
    );

-- Recruiters can update their own jobs
CREATE POLICY "Recruiters can update own jobs"
    ON jobs FOR UPDATE
    USING (auth.uid() = recruiter_id);

-- Recruiters can delete their own jobs
CREATE POLICY "Recruiters can delete own jobs"
    ON jobs FOR DELETE
    USING (auth.uid() = recruiter_id);

-- Admins can view all jobs
CREATE POLICY "Admins can view all jobs"
    ON jobs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================================================
-- SKILLS POLICIES
-- ============================================================================

-- Everyone can view skills
CREATE POLICY "Skills are viewable by all authenticated users"
    ON skills FOR SELECT
    USING (auth.role() = 'authenticated');

-- Only admins and system can insert skills (or auto-create on job/seeker update)
CREATE POLICY "Authenticated users can insert skills"
    ON skills FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- JOB_SKILLS POLICIES
-- ============================================================================

-- Anyone can view job skills
CREATE POLICY "Job skills viewable by authenticated users"
    ON job_skills FOR SELECT
    USING (auth.role() = 'authenticated');

-- Recruiters can manage their job's skills
CREATE POLICY "Recruiters can insert job skills for own jobs"
    ON job_skills FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = job_id
            AND jobs.recruiter_id = auth.uid()
        )
    );

CREATE POLICY "Recruiters can delete job skills for own jobs"
    ON job_skills FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = job_id
            AND jobs.recruiter_id = auth.uid()
        )
    );

-- ============================================================================
-- SEEKER_SKILLS POLICIES
-- ============================================================================

-- Seekers can manage their own skills
CREATE POLICY "Seekers can view own skills"
    ON seeker_skills FOR SELECT
    USING (auth.uid() = seeker_id);

CREATE POLICY "Seekers can insert own skills"
    ON seeker_skills FOR INSERT
    WITH CHECK (auth.uid() = seeker_id);

CREATE POLICY "Seekers can delete own skills"
    ON seeker_skills FOR DELETE
    USING (auth.uid() = seeker_id);

-- Recruiters can view seeker skills
CREATE POLICY "Recruiters can view seeker skills"
    ON seeker_skills FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'recruiter'
        )
    );

-- ============================================================================
-- APPLICATIONS POLICIES
-- ============================================================================

-- Seekers can view their own applications
CREATE POLICY "Seekers can view own applications"
    ON applications FOR SELECT
    USING (auth.uid() = seeker_id);

-- Seekers can create applications
CREATE POLICY "Seekers can create applications"
    ON applications FOR INSERT
    WITH CHECK (
        auth.uid() = seeker_id
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'job_seeker'
        )
    );

-- Seekers can update their own pending applications (withdraw)
CREATE POLICY "Seekers can update own pending applications"
    ON applications FOR UPDATE
    USING (
        auth.uid() = seeker_id
        AND status = 'pending'
    );

-- Recruiters can view applications for their jobs
CREATE POLICY "Recruiters can view applications for own jobs"
    ON applications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = job_id
            AND jobs.recruiter_id = auth.uid()
        )
    );

-- Recruiters can update application status for their jobs
CREATE POLICY "Recruiters can update applications for own jobs"
    ON applications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = job_id
            AND jobs.recruiter_id = auth.uid()
        )
    );

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
    ON applications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================================================
-- INTERVIEWS POLICIES
-- ============================================================================

-- Seekers can view interviews for their applications
CREATE POLICY "Seekers can view own interviews"
    ON interviews FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = application_id
            AND applications.seeker_id = auth.uid()
        )
    );

-- Recruiters can manage interviews for their job applications
CREATE POLICY "Recruiters can view interviews for own jobs"
    ON interviews FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM applications
            JOIN jobs ON jobs.id = applications.job_id
            WHERE applications.id = application_id
            AND jobs.recruiter_id = auth.uid()
        )
    );

CREATE POLICY "Recruiters can create interviews for own jobs"
    ON interviews FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM applications
            JOIN jobs ON jobs.id = applications.job_id
            WHERE applications.id = application_id
            AND jobs.recruiter_id = auth.uid()
        )
    );

CREATE POLICY "Recruiters can update interviews for own jobs"
    ON interviews FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM applications
            JOIN jobs ON jobs.id = applications.job_id
            WHERE applications.id = application_id
            AND jobs.recruiter_id = auth.uid()
        )
    );

CREATE POLICY "Recruiters can delete interviews for own jobs"
    ON interviews FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM applications
            JOIN jobs ON jobs.id = applications.job_id
            WHERE applications.id = application_id
            AND jobs.recruiter_id = auth.uid()
        )
    );

-- ============================================================================
-- SUBSCRIPTIONS POLICIES
-- ============================================================================

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- System/Admin can manage subscriptions (insert done via service role)
CREATE POLICY "Users can insert own subscription"
    ON subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
    ON subscriptions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role user_role;
    full_name TEXT;
    avatar_url TEXT;
    company_name TEXT;
BEGIN
    -- Extract and coalesce role (default to job_seeker)
    user_role := COALESCE(
        (NEW.raw_user_meta_data->>'role')::user_role, 
        'job_seeker'
    );
    
    -- Extract full_name - try 'full_name' first, then 'name' (Google OAuth provides 'name')
    full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        SPLIT_PART(NEW.email, '@', 1)
    );
    
    -- Extract avatar_url
    avatar_url := NEW.raw_user_meta_data->>'avatar_url';
    
    -- Extract company_name for recruiters
    company_name := COALESCE(
        NEW.raw_user_meta_data->>'company_name',
        'My Company'
    );
    
    -- Insert into profiles table
    BEGIN
        INSERT INTO profiles (id, email, role, full_name, avatar_url)
        VALUES (NEW.id, NEW.email, user_role, full_name, avatar_url);
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error inserting profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
    END;

    -- Create role-specific profile
    IF user_role = 'job_seeker' THEN
        BEGIN
            INSERT INTO seeker_profiles (id, experience_summary, education_summary)
            VALUES (NEW.id, '[]'::jsonb, '[]'::jsonb);
        EXCEPTION WHEN unique_violation THEN
            -- Profile already exists, ignore
            NULL;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error inserting seeker profile for user %: %', NEW.id, SQLERRM;
        END;
    ELSIF user_role = 'recruiter' THEN
        BEGIN
            INSERT INTO recruiter_profiles (id, company_name)
            VALUES (NEW.id, company_name);
        EXCEPTION WHEN unique_violation THEN
            -- Profile already exists, ignore
            NULL;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error inserting recruiter profile for user %: %', NEW.id, SQLERRM;
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
    SELECT role FROM profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================================
-- SEED DATA (Optional - Skills)
-- ============================================================================

INSERT INTO skills (name) VALUES
    ('JavaScript'),
    ('TypeScript'),
    ('Python'),
    ('Java'),
    ('React'),
    ('Next.js'),
    ('Node.js'),
    ('PostgreSQL'),
    ('MongoDB'),
    ('AWS'),
    ('Docker'),
    ('Kubernetes'),
    ('Git'),
    ('Agile'),
    ('Scrum'),
    ('REST API'),
    ('GraphQL'),
    ('Machine Learning'),
    ('Data Analysis'),
    ('SQL'),
    ('HTML'),
    ('CSS'),
    ('Tailwind CSS'),
    ('Vue.js'),
    ('Angular'),
    ('C++'),
    ('C#'),
    ('.NET'),
    ('Ruby'),
    ('Ruby on Rails'),
    ('PHP'),
    ('Laravel'),
    ('Swift'),
    ('Kotlin'),
    ('Flutter'),
    ('React Native'),
    ('DevOps'),
    ('CI/CD'),
    ('Linux'),
    ('Figma'),
    ('UI/UX Design'),
    ('Project Management'),
    ('Communication'),
    ('Leadership'),
    ('Problem Solving')
ON CONFLICT (name) DO NOTHING;
