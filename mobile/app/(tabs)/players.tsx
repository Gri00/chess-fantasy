import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl
} from 'react-native'
import { playerService } from '../../services/players'

const TIERS = ['Sve', 'S', 'A', 'B', 'C', 'D']

const TIER_COLORS: Record<string, string> = {
  S: '#f59e0b', A: '#22c55e', B: '#3b82f6', C: '#a855f7', D: '#888'
}

export default function PlayersScreen() {
  const [players, setPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedTier, setSelectedTier] = useState('Sve')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const load = useCallback(async (reset = false) => {
    const currentPage = reset ? 1 : page
    if (!reset && !hasMore) return

    try {
      const params = {
        page: currentPage,
        limit: 20,
        ...(search && { search }),
        ...(selectedTier !== 'Sve' && { tier: selectedTier })
      }
      const data = await playerService.getPlayers(params)

      if (reset) {
        setPlayers(data.players)
        setPage(2)
      } else {
        setPlayers(prev => [...prev, ...data.players])
        setPage(prev => prev + 1)
      }

      setHasMore(data.pagination.page < data.pagination.pages)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLoadingMore(false)
    }
  }, [page, search, selectedTier, hasMore])

  useEffect(() => {
    setLoading(true)
    setPage(1)
    setHasMore(true)
    load(true)
  }, [search, selectedTier])

  const renderPlayer = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={[styles.tierBadge, { backgroundColor: TIER_COLORS[item.tier] + '22' }]}>
          <Text style={[styles.tierText, { color: TIER_COLORS[item.tier] }]}>{item.tier}</Text>
        </View>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{item.full_name}</Text>
          <Text style={styles.playerSub}>
            {item.title} · {item.country_code} · {item.fide_rating}
          </Text>
        </View>
      </View>
      <View style={styles.ratingBox}>
        <Text style={styles.ratingNum}>{item.fide_rating}</Text>
        <Text style={styles.ratingLabel}>FIDE</Text>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.search}
          placeholder="Pretraži igrače..."
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
        />
        <View style={styles.tiers}>
          {TIERS.map(tier => (
            <TouchableOpacity
              key={tier}
              style={[styles.tierBtn, selectedTier === tier && styles.tierBtnActive]}
              onPress={() => setSelectedTier(tier)}
            >
              <Text style={[
                styles.tierBtnText,
                selectedTier === tier && { color: TIER_COLORS[tier] || '#22c55e' }
              ]}>
                {tier}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#22c55e" size="large" />
        </View>
      ) : (
        <FlatList
          data={players}
          keyExtractor={item => item.id}
          renderItem={renderPlayer}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(true) }}
              tintColor="#22c55e"
            />
          }
          onEndReached={() => {
            if (!loadingMore && hasMore) {
              setLoadingMore(true)
              load()
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color="#22c55e" style={{ margin: 20 }} /> : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Nema igrača</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  header: { padding: 16, paddingBottom: 8 },
  search: {
    backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 15,
    borderWidth: 1, borderColor: '#2a2a2a', marginBottom: 12
  },
  tiers: { flexDirection: 'row', gap: 8 },
  tierBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, backgroundColor: '#1a1a1a',
    borderWidth: 1, borderColor: '#2a2a2a'
  },
  tierBtnActive: { borderColor: '#22c55e' },
  tierBtnText: { color: '#888', fontSize: 13, fontWeight: '600' },
  list: { padding: 16, paddingTop: 8 },
  card: {
    backgroundColor: '#1a1a1a', borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#2a2a2a',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  tierBadge: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', marginRight: 12
  },
  tierText: { fontSize: 13, fontWeight: '700' },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 15, color: '#fff', fontWeight: '600', marginBottom: 2 },
  playerSub: { fontSize: 12, color: '#888' },
  ratingBox: { alignItems: 'flex-end' },
  ratingNum: { fontSize: 18, color: '#22c55e', fontWeight: '700' },
  ratingLabel: { fontSize: 10, color: '#666' },
  emptyText: { color: '#888', fontSize: 16 }
})