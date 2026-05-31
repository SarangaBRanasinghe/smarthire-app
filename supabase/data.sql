-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  seeker_id uuid NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::application_status,
  cover_letter text,
  ai_match_score numeric CHECK (ai_match_score >= 0::numeric AND ai_match_score <= 100::numeric),
  ai_match_explanation text,
  applied_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT applications_pkey PRIMARY KEY (id),
  CONSTRAINT applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT applications_seeker_id_fkey FOREIGN KEY (seeker_id) REFERENCES public.seeker_profiles(id)
);
CREATE TABLE public.interviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  scheduled_at timestamp with time zone NOT NULL,
  type USER-DEFINED NOT NULL DEFAULT 'video'::interview_type,
  meeting_link text,
  location_address text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT interviews_pkey PRIMARY KEY (id),
  CONSTRAINT interviews_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id)
);
CREATE TABLE public.job_skills (
  job_id uuid NOT NULL,
  skill_id uuid NOT NULL,
  CONSTRAINT job_skills_pkey PRIMARY KEY (job_id, skill_id),
  CONSTRAINT job_skills_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT job_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id)
);
CREATE TABLE public.jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recruiter_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  location text,
  salary_min numeric,
  salary_max numeric,
  currency text DEFAULT 'LKR'::text,
  type USER-DEFINED NOT NULL DEFAULT 'full_time'::job_type,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::job_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  CONSTRAINT jobs_pkey PRIMARY KEY (id),
  CONSTRAINT jobs_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES public.recruiter_profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  role USER-DEFINED NOT NULL DEFAULT 'job_seeker'::user_role,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.recruiter_profiles (
  id uuid NOT NULL,
  company_name text,
  company_logo text,
  company_website text,
  verification_status boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT recruiter_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT recruiter_profiles_id_fkey FOREIGN KEY (id) REFERENCES public.profiles(id)
);
CREATE TABLE public.seeker_profiles (
  id uuid NOT NULL,
  resume_url text,
  bio text,
  phone text,
  location text,
  experience_summary jsonb DEFAULT '[]'::jsonb,
  education_summary jsonb DEFAULT '[]'::jsonb,
  parsed_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT seeker_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT seeker_profiles_id_fkey FOREIGN KEY (id) REFERENCES public.profiles(id)
);
CREATE TABLE public.seeker_skills (
  seeker_id uuid NOT NULL,
  skill_id uuid NOT NULL,
  CONSTRAINT seeker_skills_pkey PRIMARY KEY (seeker_id, skill_id),
  CONSTRAINT seeker_skills_seeker_id_fkey FOREIGN KEY (seeker_id) REFERENCES public.seeker_profiles(id),
  CONSTRAINT seeker_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id)
);
CREATE TABLE public.skills (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT skills_pkey PRIMARY KEY (id)
);
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan_tier text NOT NULL DEFAULT 'free'::text,
  status text NOT NULL DEFAULT 'active'::text,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);