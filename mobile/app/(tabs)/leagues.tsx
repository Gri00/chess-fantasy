import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, Modal, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform
} from 'react-native'
import { useRouter } from 'expo-router'
import { leagueService } from '../../services/leagues'

export default function LeaguesScreen() {
  const [leagues, setLeagues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const router = useRouter()

  // Create form
  const [name, setName] = useState('')
  const [teamName, setTeamName] = useState('')
  const [creating, setCreating] = useState(false)

  // Join form
  const [inviteCode, setInviteCode] = useState('')
  const [joinTeamName, setJoinTeamName] = useState('')
  const [joining, setJoining] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await leagueService.getMyLeagues()
      setLeagues(data)
    } catch (err) {
      Alert.alert('Greška', 'Nije moguće učitati lige')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!name || !teamName) {
      Alert.alert('Greška', 'Popuni sva polja')
      return
    }
    setCreating(true)
    try {
      await leagueService.createLeague({ name, team_name: teamName, roster_size: 5 })
      setShowCreate(false)
      setName('')
      setTeamName('')
      load()
    } catch (err: any) {
      Alert.alert('Greška', err.response?.data?.error || 'Neuspešno kreiranje')
    } finally {
      setCreating(false)
    }
  }

  const handleJoin = async () => {
    if (!inviteCode || !joinTeamName) {
      Alert.alert('Greška', 'Popuni sva polja')
      return
    }
    setJoining(true)
    try {
      await leagueService.joinByCode(inviteCode.trim(), joinTeamName.trim())
      setShowJoin(false)
      setInviteCode('')
      setJoinTeamName('')
      load()
    } catch (err: any) {
      Alert.alert('Greška', err.response?.data?.error || 'Nevažeći invite kod')
    } finally {
      setJoining(false)
    }
  }

  const statusColor = (status: string) => ({
    pending: '#f59e0b', active: '#22c55e', completed: '#888'
  }[status] || '#888')

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator color="#22c55e" size="large" />
    </View>
  )

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor="#22c55e" />}
      >
        <Text style={styles.title}>Moje lige</Text>

        {leagues.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏆</Text>
            <Text style={styles.emptyText}>Nisi u nijednoj ligi</Text>
            <Text style={styles.emptySubtext}>Kreiraj novu ili se pridruži postojećoj</Text>
          </View>
        ) : (
          leagues.map((item) => (
            <TouchableOpacity
              key={item.league.id}
              style={styles.card}
              onPress={() => router.push(`/league/${item.league.id}`)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.leagueName}>{item.league.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor(item.league.status) + '22' }]}>
                  <Text style={[styles.statusText, { color: statusColor(item.league.status) }]}>
                    {item.league.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.teamName}>Tim: {item.team_name}</Text>
              {item.league.invite_code && (
                <Text style={styles.inviteCode}>Invite: {item.league.invite_code}</Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.joinBtn} onPress={() => setShowJoin(true)}>
          <Text style={styles.joinBtnText}>+ Pridruži se</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
          <Text style={styles.createBtnText}>+ Kreiraj ligu</Text>
        </TouchableOpacity>
      </View>

      {/* Create Modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Nova liga</Text>
            <TextInput style={styles.input} placeholder="Naziv lige" placeholderTextColor="#666"
              value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Naziv tvog tima" placeholderTextColor="#666"
              value={teamName} onChangeText={setTeamName} />
            <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={creating}>
              {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>Kreiraj</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}>
              <Text style={styles.cancelText}>Otkaži</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Join Modal */}
      <Modal visible={showJoin} animationType="slide" transparent>
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Pridruži se ligi</Text>
            <TextInput style={styles.input} placeholder="Invite kod (npr. CA8265DB)" placeholderTextColor="#666"
              value={inviteCode} onChangeText={setInviteCode} autoCapitalize="characters" maxLength={8}/>
            <TextInput style={styles.input} placeholder="Naziv tvog tima" placeholderTextColor="#666"
              value={joinTeamName} onChangeText={setJoinTeamName} />
            <TouchableOpacity style={styles.createBtn} onPress={handleJoin} disabled={joining}>
              {joining ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>Pridruži se</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowJoin(false)}>
              <Text style={styles.cancelText}>Otkaži</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  center: { flex: 1, backgroundColor: '#0f0f0f', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 26, color: '#fff', fontWeight: '700', marginBottom: 20 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, color: '#fff', fontWeight: '600', marginBottom: 6 },
  emptySubtext: { fontSize: 14, color: '#888', textAlign: 'center' },
  card: {
    backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#2a2a2a'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  leagueName: { fontSize: 17, color: '#fff', fontWeight: '600', flex: 1 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  teamName: { fontSize: 13, color: '#888', marginBottom: 4 },
  inviteCode: { fontSize: 12, color: '#22c55e', fontFamily: 'monospace' },
  actions: {
    position: 'absolute', bottom: 24, left: 20, right: 20,
    flexDirection: 'row', gap: 12
  },
  joinBtn: {
    flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a'
  },
  joinBtnText: { color: '#fff', fontWeight: '600' },
  createBtn: {
    flex: 1, backgroundColor: '#22c55e', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center'
  },
  createBtnText: { color: '#fff', fontWeight: '600' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end'
  },
  modal: {
    backgroundColor: '#1a1a1a', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40
  },
  modalTitle: { fontSize: 20, color: '#fff', fontWeight: '700', marginBottom: 20 },
  input: {
    backgroundColor: '#0f0f0f', color: '#fff', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#2a2a2a'
  },
  cancelBtn: { marginTop: 8, alignItems: 'center', paddingVertical: 12 },
  cancelText: { color: '#888', fontSize: 15 }
})