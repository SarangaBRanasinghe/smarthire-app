// Database Types for SmartHire
// Auto-generated types based on the Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'job_seeker' | 'recruiter' | 'admin'
export type JobType = 'full_time' | 'part_time' | 'contract' | 'remote' | 'internship'
export type JobStatus = 'draft' | 'active' | 'closed'
export type ApplicationStatus = 'pending' | 'reviewing' | 'interview' | 'offer' | 'rejected'
export type InterviewType = 'video' | 'phone' | 'in_person'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          role: UserRole
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: UserRole
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: UserRole
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      seeker_profiles: {
        Row: {
          id: string
          resume_url: string | null
          bio: string | null
          phone: string | null
          location: string | null
          experience_summary: Json
          education_summary: Json
          parsed_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          resume_url?: string | null
          bio?: string | null
          phone?: string | null
          location?: string | null
          experience_summary?: Json
          education_summary?: Json
          parsed_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          resume_url?: string | null
          bio?: string | null
          phone?: string | null
          location?: string | null
          experience_summary?: Json
          education_summary?: Json
          parsed_data?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      recruiter_profiles: {
        Row: {
          id: string
          company_name: string | null
          company_logo: string | null
          company_website: string | null
          verification_status: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          company_name?: string | null
          company_logo?: string | null
          company_website?: string | null
          verification_status?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name?: string | null
          company_logo?: string | null
          company_website?: string | null
          verification_status?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          recruiter_id: string
          title: string
          description: string | null
          location: string | null
          salary_min: number | null
          salary_max: number | null
          currency: string
          type: JobType
          status: JobStatus
          created_at: string
          updated_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          recruiter_id: string
          title: string
          description?: string | null
          location?: string | null
          salary_min?: number | null
          salary_max?: number | null
          currency?: string
          type?: JobType
          status?: JobStatus
          created_at?: string
          updated_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          recruiter_id?: string
          title?: string
          description?: string | null
          location?: string | null
          salary_min?: number | null
          salary_max?: number | null
          currency?: string
          type?: JobType
          status?: JobStatus
          created_at?: string
          updated_at?: string
          expires_at?: string | null
        }
      }
      skills: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      job_skills: {
        Row: {
          job_id: string
          skill_id: string
        }
        Insert: {
          job_id: string
          skill_id: string
        }
        Update: {
          job_id?: string
          skill_id?: string
        }
      }
      seeker_skills: {
        Row: {
          seeker_id: string
          skill_id: string
        }
        Insert: {
          seeker_id: string
          skill_id: string
        }
        Update: {
          seeker_id?: string
          skill_id?: string
        }
      }
      applications: {
        Row: {
          id: string
          job_id: string
          seeker_id: string
          status: ApplicationStatus
          cover_letter: string | null
          ai_match_score: number | null
          ai_match_explanation: string | null
          applied_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          seeker_id: string
          status?: ApplicationStatus
          cover_letter?: string | null
          ai_match_score?: number | null
          ai_match_explanation?: string | null
          applied_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          seeker_id?: string
          status?: ApplicationStatus
          cover_letter?: string | null
          ai_match_score?: number | null
          ai_match_explanation?: string | null
          applied_at?: string
          updated_at?: string
        }
      }
      interviews: {
        Row: {
          id: string
          application_id: string
          scheduled_at: string
          type: InterviewType
          meeting_link: string | null
          location_address: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id: string
          scheduled_at: string
          type?: InterviewType
          meeting_link?: string | null
          location_address?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          scheduled_at?: string
          type?: InterviewType
          meeting_link?: string | null
          location_address?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_tier: string
          status: string
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_tier?: string
          status?: string
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_tier?: string
          status?: string
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: {
          user_id: string
        }
        Returns: UserRole
      }
    }
    Enums: {
      user_role: UserRole
      job_type: JobType
      job_status: JobStatus
      application_status: ApplicationStatus
      interview_type: InterviewType
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type SeekerProfile = Database['public']['Tables']['seeker_profiles']['Row']
export type RecruiterProfile = Database['public']['Tables']['recruiter_profiles']['Row']
export type Job = Database['public']['Tables']['jobs']['Row']
export type Skill = Database['public']['Tables']['skills']['Row']
export type Application = Database['public']['Tables']['applications']['Row']
export type Interview = Database['public']['Tables']['interviews']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']

// Extended types with relations
export interface ProfileWithRole extends Profile {
  seeker_profile?: SeekerProfile | null
  recruiter_profile?: RecruiterProfile | null
}

export interface JobWithRecruiter extends Job {
  recruiter_profiles: RecruiterProfile
  job_skills: Array<{ skills: Skill }>
}

export interface ApplicationWithDetails extends Application {
  jobs: JobWithRecruiter
  seeker_profiles: SeekerProfile & { profiles: Profile }
}

export interface SeekerWithProfile extends SeekerProfile {
  profiles: Profile
  seeker_skills: Array<{ skills: Skill }>
}

// Experience and Education structured types
export interface Experience {
  id: string
  title: string
  company: string
  location?: string
  startDate: string
  endDate?: string
  current: boolean
  description?: string
}

export interface Education {
  id: string
  degree: string
  institution: string
  location?: string
  startDate: string
  endDate?: string
  current: boolean
  field?: string
}
