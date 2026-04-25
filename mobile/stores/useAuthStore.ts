import { create } from 'zustand'
import { authService } from '../services/auth'

interface User {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, username: string) => Promise<void>
  logout: () => Promise<void>
  loadUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  loadUser: async () => {
    try {
      const token = await authService.getToken()
      if (!token) {
        set({ isLoading: false, isAuthenticated: false })
        return
      }
      const user = await authService.getMe()
      set({ user, isAuthenticated: true, isLoading: false })
    } catch {
      set({ isLoading: false, isAuthenticated: false })
    }
  },

  login: async (email, password) => {
    const data = await authService.login(email, password)
    set({ user: data.user, isAuthenticated: true })
  },

  register: async (email, password, username) => {
    const data = await authService.register(email, password, username)
    set({ user: data.user, isAuthenticated: true })
  },

  logout: async () => {
    await authService.logout()
    set({ user: null, isAuthenticated: false })
  }
}))