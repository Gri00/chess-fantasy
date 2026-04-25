import { useState, useEffect, useCallback } from 'react'
import { useFocusEffect } from 'expo-router'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, Share
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { leagueService } from '../../services/leagues'
import { playerService } from '../../services/players'
import { useAuthStore } from '../../stores/useAuthStore'

const TIER_COLORS: Record<string, string> = {
  S: '#f59e0b', A: '#22c55e', B: '#3b82f6', C: '#a855f7', D: '#888'
}

export default function LeagueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuthStore()
  const router = useRouter()
  const [league, setLeague] = useState<any>(null)
  const [standings, setStandings] = useState<any[]>([])
  const [roster, setRoster] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'roster' | 'standings' | 'info'>('roster')

  const load = useCallback(async () => {
    try {
      const [leagueData, rosterData] = await Promise.all([
        leagueService.getLeague(id),
        playerService.getRoster(id)
      ])
      setLeague(leagueData)
      setRoster(rosterData)

      if (leagueData.status === 'active') {
        const standingsData = await leagueService.getStandings(id)
        setStandings(standingsData)
      }
    } catch (err) {
      Alert.alert('Greška', 'Nije moguće učitati ligu')
      router.back()
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [id])

  useFocusEffect(
  useCallback(() => { load() }, [id])
)

  const handleShare = async () => {
    if (!league?.invite_code) return
    await Share.share({
      message: `Pridruži se mojoj Chess Fantasy ligi! Invite kod: ${league.invite_code}`
    })
  }

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator color="#22c55e" size="large" />
    </View>
  )

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Nazad</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.leagueName}>{league?.name}</Text>
          <View style={styles.headerMeta}>
            <Text style={styles.metaText}>
              {league?.members?.length}/{league?.max_teams} timova
            </Text>
            <View style={[styles.statusDot, {
              backgroundColor: league?.status === 'active' ? '#22c55e' : '#f59e0b'
            }]} />
          </View>
        </View>
        {league?.invite_code && (
          <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
            <Text style={styles.shareBtnText}>Pozovi</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Invite kod */}
      {league?.invite_code && (
        <TouchableOpacity style={styles.inviteBanner} onPress={handleShare}>
          <Text style={styles.inviteLabel}>Invite kod</Text>
          <Text style={styles.inviteCode}>{league.invite_code}</Text>
          <Text style={styles.inviteShare}>Podeli →</Text>
        </TouchableOpacity>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['roster', 'standings', 'info'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'roster' ? 'Moj tim' : tab === 'standings' ? 'Tabela' : 'Info'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load() }}
            tintColor="#22c55e" />
        }
      >
        {/* ROSTER TAB */}
        {activeTab === 'roster' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Moji igrači ({roster.length}/{league?.roster_size})
              </Text>
              {roster.length < league?.roster_size && (
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => router.push(`/league/${id}/pick`)}
                >
                  <Text style={styles.addBtnText}>+ Dodaj</Text>
                </TouchableOpacity>
              )}
            </View>

            {roster.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>♟</Text>
                <Text style={styles.emptyText}>Nemaš igrača u timu</Text>
                <TouchableOpacity
                  style={styles.pickBtn}
                  onPress={() => router.push(`/league/${id}/pick`)}
                >
                  <Text style={styles.pickBtnText}>Izaberi igrače</Text>
                </TouchableOpacity>
              </View>
            ) : (
              roster.map((item) => (
                <View key={item.roster_id} style={styles.playerCard}>
                  <View style={[styles.tierBadge, {
                    backgroundColor: TIER_COLORS[item.tier] + '22'
                  }]}>
                    <Text style={[styles.tierText, { color: TIER_COLORS[item.tier] }]}>
                      {item.tier}
                    </Text>
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{item.full_name}</Text>
                    <Text style={styles.playerSub}>
                      {item.title} · {item.country_code} · {item.fide_rating}
                    </Text>
                  </View>
                  <Text style={styles.playerRating}>{item.fide_rating}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* STANDINGS TAB */}
        {activeTab === 'standings' && (
          <View>
            <Text style={styles.sectionTitle}>Tabela</Text>
            {league?.status === 'pending' ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Liga još nije počela</Text>
              </View>
            ) : standings.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Nema rezultata još</Text>
              </View>
            ) : (
              standings.map((item, index) => (
                <View key={item.league_member_id} style={styles.standingRow}>
                  <Text style={[styles.rank, index < 3 && { color: '#f59e0b' }]}>
                    #{item.rank}
                  </Text>
                  <View style={styles.standingInfo}>
                    <Text style={styles.standingTeam}>{item.team_name}</Text>
                    <Text style={styles.standingUser}>{item.username}</Text>
                  </View>
                  <Text style={styles.standingPoints}>
                    {item.total_points} <Text style={styles.ptsLabel}>pts</Text>
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* INFO TAB */}
        {activeTab === 'info' && (
          <View>
            <Text style={styles.sectionTitle}>Detalji lige</Text>
            <View style={styles.infoCard}>
              {[
                ['Tip', league?.league_type],
                ['Status', league?.status],
                ['Roster veličina', `${league?.roster_size} igrača`],
                ['Max timova', league?.max_teams],
                ['Sezona počinje', league?.season_start || 'Nije postavljeno'],
                ['Sezona završava', league?.season_end || 'Nije postavljeno'],
              ].map(([label, value]) => (
                <View key={label} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{label}</Text>
                  <Text style={styles.infoValue}>{value}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Tier limiti</Text>
            <View style={styles.infoCard}>
              {Object.entries(league?.tier_limits || {}).map(([tier, limit]) => (
                <View key={tier} style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: TIER_COLORS[tier] }]}>
                    {tier}-Tier
                  </Text>
                  <Text style={styles.infoValue}>
                    {limit === null ? 'Neograničeno' : `Max ${limit}`}
                  </Text>
                </View>
              ))}
            </View>

            {league?.commissioner_id !== user?.id && (
              <TouchableOpacity
                style={styles.leaveBtn}
                onPress={() => {
                  Alert.alert(
                    'Napusti ligu',
                    'Da li si siguran da želiš da napustiš ovu ligu?',
                    [
                      { text: 'Otkaži', style: 'cancel' },
                      {
                        text: 'Napusti',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await leagueService.leaveLeague(league.id)
                            router.replace('/(tabs)/leagues')
                          } catch (err: any) {
                            Alert.alert('Greška', err.response?.data?.error || 'Neuspešno')
                          }
                        }
                      }
                    ]
                  )
                }}
              >
                <Text style={styles.leaveBtnText}>Napusti ligu</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  center: { flex: 1, backgroundColor: '#0f0f0f', alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
    backgroundColor: '#0f0f0f', gap: 12
  },
  backBtn: { paddingVertical: 4 },
  backText: { color: '#22c55e', fontSize: 15 },
  headerInfo: { flex: 1 },
  leagueName: { fontSize: 18, color: '#fff', fontWeight: '700' },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  metaText: { fontSize: 12, color: '#888' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  shareBtn: {
    backgroundColor: '#1a1a1a', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#2a2a2a'
  },
  shareBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  inviteBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#22c55e11', marginHorizontal: 16, marginBottom: 4,
    borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#22c55e33'
  },
  inviteLabel: { color: '#888', fontSize: 12, marginRight: 8 },
  inviteCode: { color: '#22c55e', fontSize: 16, fontWeight: '700', fontFamily: 'monospace', flex: 1 },
  inviteShare: { color: '#22c55e', fontSize: 13 },
  tabs: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 8,
    backgroundColor: '#1a1a1a', borderRadius: 12, padding: 4
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#2a2a2a' },
  tabText: { color: '#888', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  content: { padding: 16, paddingBottom: 40 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, color: '#fff', fontWeight: '600', marginBottom: 12 },
  addBtn: {
    backgroundColor: '#22c55e', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: '#888', fontSize: 15, marginBottom: 20 },
  pickBtn: {
    backgroundColor: '#22c55e', borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12
  },
  pickBtnText: { color: '#fff', fontWeight: '600' },
  playerCard: {
    backgroundColor: '#1a1a1a', borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#2a2a2a',
    flexDirection: 'row', alignItems: 'center'
  },
  tierBadge: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', marginRight: 12
  },
  tierText: { fontSize: 13, fontWeight: '700' },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 15, color: '#fff', fontWeight: '600', marginBottom: 2 },
  playerSub: { fontSize: 12, color: '#888' },
  playerRating: { fontSize: 16, color: '#22c55e', fontWeight: '700' },
  standingRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: '#2a2a2a'
  },
  rank: { fontSize: 16, color: '#888', fontWeight: '700', width: 36 },
  standingInfo: { flex: 1 },
  standingTeam: { fontSize: 15, color: '#fff', fontWeight: '600' },
  standingUser: { fontSize: 12, color: '#888' },
  standingPoints: { fontSize: 18, color: '#22c55e', fontWeight: '700' },
  ptsLabel: { fontSize: 11, color: '#888' },
  infoCard: {
    backgroundColor: '#1a1a1a', borderRadius: 14,
    padding: 4, borderWidth: 1, borderColor: '#2a2a2a'
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#2a2a2a'
  },
  infoLabel: { color: '#888', fontSize: 14 },
  infoValue: { color: '#fff', fontSize: 14, fontWeight: '500' },
  leaveBtn: {
  marginTop: 24, borderRadius: 12, paddingVertical: 14,
  alignItems: 'center', borderWidth: 1, borderColor: '#ff4444'},
  leaveBtnText: { color: '#ff4444', fontWeight: '600', fontSize: 16 }
})