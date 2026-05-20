import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const BASE_URL = 'http://192.168.xxx' //replace with BE URL

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
})

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token')
    }
    return Promise.reject(error)
  }
)
