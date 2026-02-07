import { create } from 'zustand'
import type { Profile, SeekerProfile, RecruiterProfile, UserRole } from '@/types/database'

interface UserState {
  profile: Profile | null
  seekerProfile: SeekerProfile | null
  recruiterProfile: RecruiterProfile | null
  isLoading: boolean
  setProfile: (profile: Profile | null) => void
  setSeekerProfile: (seekerProfile: SeekerProfile | null) => void
  setRecruiterProfile: (recruiterProfile: RecruiterProfile | null) => void
  setIsLoading: (isLoading: boolean) => void
  clearUser: () => void
  role: () => UserRole | null
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  seekerProfile: null,
  recruiterProfile: null,
  isLoading: true,
  setProfile: (profile) => set({ profile }),
  setSeekerProfile: (seekerProfile) => set({ seekerProfile }),
  setRecruiterProfile: (recruiterProfile) => set({ recruiterProfile }),
  setIsLoading: (isLoading) => set({ isLoading }),
  clearUser: () => set({
    profile: null,
    seekerProfile: null,
    recruiterProfile: null,
    isLoading: false,
  }),
  role: () => get().profile?.role ?? null,
}))

interface AppState {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))
