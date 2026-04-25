import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native'
import { Link } from 'expo-router'
import { useAuthStore } from '../../stores/useAuthStore'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Greška', 'Unesite email i lozinku')
      return
    }
    setLoading(true)
    try {
      await login(email.trim(), password)
    } catch (err: any) {
      Alert.alert('Greška', err.response?.data?.error || 'Neuspešna prijava')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>♟ ChessFantasy</Text>
        <Text style={styles.subtitle}>Prijavi se na svoj nalog</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Lozinka"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Prijavi se</Text>
          }
        </TouchableOpacity>

        <Link href="/(auth)/register" asChild>
          <TouchableOpacity style={styles.linkBtn}>
            <Text style={styles.linkText}>
              Nemaš nalog? <Text style={styles.linkBold}>Registruj se</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logo: { fontSize: 36, color: '#fff', fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#888', textAlign: 'center', marginBottom: 40 },
  input: {
    backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#2a2a2a'
  },
  button: {
    backgroundColor: '#22c55e', borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginTop: 8
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkBtn: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#888', fontSize: 14 },
  linkBold: { color: '#22c55e', fontWeight: '600' }
})