import { createClient } from '@/lib/supabase/server'
import type { Profile, SeekerProfile, RecruiterProfile } from '@/types/database'

export interface UserData {
  profile: Profile
  seekerProfile?: SeekerProfile | null
  recruiterProfile?: RecruiterProfile | null
}

export async function getUserData(): Promise<UserData | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single() as { data: Profile | null }

  if (!profile) return null

  let seekerProfile = null
  let recruiterProfile = null

  if (profile.role === 'job_seeker') {
    const { data } = await supabase
      .from('seeker_profiles')
      .select('*')
      .eq('id', user.id)
      .single() as { data: SeekerProfile | null }
    seekerProfile = data
  } else if (profile.role === 'recruiter') {
    const { data } = await supabase
      .from('recruiter_profiles')
      .select('*')
      .eq('id', user.id)
      .single() as { data: RecruiterProfile | null }
    recruiterProfile = data
  }

  return { profile, seekerProfile, recruiterProfile }
}
