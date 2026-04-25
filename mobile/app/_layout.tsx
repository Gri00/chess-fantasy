import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { useRouter, useSegments } from 'expo-router'
import { useAuthStore } from '../stores/useAuthStore'

export default function RootLayout() {
  const { isAuthenticated, isLoading, loadUser } = useAuthStore()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    if (isLoading) return

    const inAuthGroup = segments[0] === '(auth)'

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [isAuthenticated, isLoading, segments])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  )
}