import { api } from './api'
import * as SecureStore from 'expo-secure-store'

export const authService = {
  async register(email: string, password: string, username: string) {
    const { data } = await api.post('/auth/register', { email, password, username })
    await SecureStore.setItemAsync('auth_token', data.token)
    return data
  },

  async login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password })
    await SecureStore.setItemAsync('auth_token', data.token)
    return data
  },

  async logout() {
    await SecureStore.deleteItemAsync('auth_token')
  },

  async getMe() {
    const { data } = await api.get('/auth/me')
    return data.user
  },

  async getToken() {
    return SecureStore.getItemAsync('auth_token')
  }
}