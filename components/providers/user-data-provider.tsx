'use client'

import { useEffect } from 'react'
import { useUserStore } from '@/lib/stores'
import type { Profile, SeekerProfile, RecruiterProfile } from '@/types/database'

interface UserDataProviderProps {
  profile: Profile
  seekerProfile?: SeekerProfile | null
  recruiterProfile?: RecruiterProfile | null
  children: React.ReactNode
}

export function UserDataProvider({ profile, seekerProfile, recruiterProfile, children }: UserDataProviderProps) {
  const { setProfile, setSeekerProfile, setRecruiterProfile, setIsLoading } = useUserStore()

  useEffect(() => {
    setProfile(profile)
    setSeekerProfile(seekerProfile ?? null)
    setRecruiterProfile(recruiterProfile ?? null)
    setIsLoading(false)
  }, [profile, seekerProfile, recruiterProfile, setProfile, setSeekerProfile, setRecruiterProfile, setIsLoading])

  return <>{children}</>
}
