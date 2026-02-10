'use client'

import { type ReactNode } from 'react'
import { useAuthSync } from '@/lib/hooks/use-auth-sync'

export function AuthSyncProvider({ children }: { children: ReactNode }) {
  useAuthSync()
  return <>{children}</>
}
