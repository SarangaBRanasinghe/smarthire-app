'use client'

import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const { profile, clearUser } = useUserStore()
  const router = useRouter()
  const supabase = createClient()

  const signOut = async () => {
    await supabase.auth.signOut()
    clearUser()
    router.push('/login')
  }

  return {
    user: profile,
    profile,
    signOut,
  }
}
