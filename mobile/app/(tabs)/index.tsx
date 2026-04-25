import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../../stores/useAuthStore'

export default function HomeScreen() {
  const { user } = useAuthStore()
  const router = useRouter()

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Zdravo, {user?.username} 👋</Text>
      <Text style={styles.subtitle}>Dobrodošao u Chess Fantasy</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>♟ Tvoje lige</Text>
        <Text style={styles.cardText}>Nemaš aktivnih liga.</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(tabs)/leagues')}
        >
          <Text style={styles.buttonText}>Idi na Lige →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🏆 Igrači</Text>
        <Text style={styles.cardText}>Pregledaj top GM-ove i sastavi tim.</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(tabs)/players')}
        >
          <Text style={styles.buttonText}>Pregledaj igrače →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  content: { padding: 20 },
  greeting: { fontSize: 26, color: '#fff', fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#888', marginBottom: 28 },
  card: {
    backgroundColor: '#1a1a1a', borderRadius: 16,
    padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#2a2a2a'
  },
  cardTitle: { fontSize: 18, color: '#fff', fontWeight: '600', marginBottom: 8 },
  cardText: { fontSize: 14, color: '#888', marginBottom: 16 },
  button: {
    backgroundColor: '#22c55e', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 16, alignSelf: 'flex-start'
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 14 }
})