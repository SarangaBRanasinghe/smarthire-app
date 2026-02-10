'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile, SeekerProfile, RecruiterProfile } from '@/types/database'

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
  refreshSession: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { profile, setProfile, setSeekerProfile, setRecruiterProfile, setIsLoading, clearUser, isLoading } = useUserStore()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const supabase = createClient()

  const fetchUserData = async (userId: string) => {
    setIsLoading(true)
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single() as { data: Profile | null }

      if (profileData) {
        setProfile(profileData)

        // Fetch role-specific profile
        if (profileData.role === 'job_seeker') {
          const { data: seekerData } = await supabase
            .from('seeker_profiles')
            .select('*')
            .eq('id', userId)
            .single() as { data: SeekerProfile | null }
          setSeekerProfile(seekerData)
        } else if (profileData.role === 'recruiter') {
          const { data: recruiterData } = await supabase
            .from('recruiter_profiles')
            .select('*')
            .eq('id', userId)
            .single() as { data: RecruiterProfile | null }
          setRecruiterProfile(recruiterData)
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession)
      setUser(initialSession?.user ?? null)
      if (initialSession?.user) {
        fetchUserData(initialSession.user.id)
      } else {
        setIsLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (event === 'SIGNED_IN' && currentSession?.user) {
          await fetchUserData(currentSession.user.id)
        } else if (event === 'SIGNED_OUT') {
          clearUser()
        } else if (event === 'USER_UPDATED' && currentSession?.user) {
          await fetchUserData(currentSession.user.id)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    clearUser()
  }

  const refreshSession = async () => {
    const { data: { session: refreshedSession } } = await supabase.auth.refreshSession()
    if (refreshedSession) {
      setSession(refreshedSession)
      setUser(refreshedSession.user)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user: user ?? (profile ? { id: profile.id } as User : null),
        session,
        isLoading,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
