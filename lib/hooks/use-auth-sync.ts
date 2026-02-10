'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores'
import { useRouter } from 'next/navigation'

export function useAuthSync() {
  const { clearUser } = useUserStore()
  const router = useRouter()
  const supabase = createClient()
  const syncInitialized = useRef(false)

  useEffect(() => {
    if (syncInitialized.current) return
    syncInitialized.current = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        clearUser()
        router.push('/login')
      } else if (event === 'SIGNED_IN') {
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, clearUser, router])
}
