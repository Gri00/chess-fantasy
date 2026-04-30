import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { playerService } from "../../services/players";
import { C } from "../../constants/Colors";

const TIERS = ["All", "S", "A", "B", "C", "D"];

const TIER_META: Record<string, { color: string; piece: string; label: string }> = {
  S: { color: C.gold,    piece: "♔", label: "S tier" },
  A: { color: C.accent2, piece: "♕", label: "A tier" },
  B: { color: C.blue,    piece: "♖", label: "B tier" },
  C: { color: C.green,   piece: "♗", label: "C tier" },
  D: { color: "#aaa",    piece: "♘", label: "D tier" },
};

export default function PlayersScreen() {
  const insets = useSafeAreaInsets();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTier, setSelectedTier] = useState("All");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(
    async (reset = false) => {
      const currentPage = reset ? 1 : page;
      if (!reset && !hasMore) return;
      try {
        const params = {
          page: currentPage,
          limit: 20,
          ...(search && { search }),
          ...(selectedTier !== "All" && { tier: selectedTier }),
        };
        const data = await playerService.getPlayers(params);
        if (reset) {
          setPlayers(data.players);
          setPage(2);
        } else {
          setPlayers((prev) => [...prev, ...data.players]);
          setPage((prev) => prev + 1);
        }
        setHasMore(data.pagination.page < data.pagination.pages);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [page, search, selectedTier, hasMore],
  );

  useEffect(() => {
    setLoading(true);
    setPage(1);
    setHasMore(true);
    load(true);
  }, [search, selectedTier]);

  const renderPlayer = ({ item }: { item: any }) => {
    const meta = TIER_META[item.tier] ?? TIER_META["D"];
    return (
      <View style={s.card}>
        <View style={[s.pieceBox, { borderColor: meta.color + "55", backgroundColor: meta.color + "18" }]}>
          <Text style={[s.piece, { color: meta.color }]}>{meta.piece}</Text>
        </View>
        <View style={s.cardInfo}>
          <Text style={s.playerName}>{item.full_name}</Text>
          <Text style={s.playerSub}>
            {item.title}  ·  {item.country_code}  ·  ELO {item.fide_rating}
          </Text>
        </View>
        <View style={s.cardRight}>
          <View style={[s.tierPill, { backgroundColor: meta.color + "22", borderColor: meta.color + "55" }]}>
            <Text style={[s.tierPillText, { color: meta.color }]}>{item.tier}</Text>
          </View>
          <Text style={[s.elo, { color: meta.color }]}>{item.fide_rating}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>
          ♟ Players <Text style={{ color: C.gold }}>List</Text>
        </Text>

        {/* Search */}
        <View style={s.searchBox}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search players..."
            placeholderTextColor={C.white35}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Tier filters */}
        <FlatList
          data={TIERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(t) => t}
          contentContainerStyle={s.tierList}
          renderItem={({ item: tier }) => {
            const active = selectedTier === tier;
            const color = TIER_META[tier]?.color ?? C.gold;
            return (
              <TouchableOpacity
                onPress={() => setSelectedTier(tier)}
                style={[
                  s.tierBtn,
                  active && { borderColor: color, backgroundColor: color + "18" },
                ]}
              >
                <Text style={[s.tierBtnText, active && { color }]}>
                  {tier === "All" ? "All" : `${TIER_META[tier].piece} ${tier}`}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        <Text style={s.countLabel}>
          {loading ? "Loading..." : `${players.length} players`}
        </Text>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.gold} size="large" />
        </View>
      ) : (
        <FlatList
          data={players}
          keyExtractor={(item) => item.id}
          renderItem={renderPlayer}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(true); }}
              tintColor={C.gold}
            />
          }
          onEndReached={() => {
            if (!loadingMore && hasMore) { setLoadingMore(true); load(); }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={C.gold} style={{ margin: 20 }} /> : null
          }
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>♟</Text>
              <Text style={s.emptyText}>No players found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.dark },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 14, marginTop: 8 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.dark3,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.white8,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  searchIcon: { fontSize: 15, marginRight: 8 },
  searchInput: { flex: 1, color: "#fff", paddingVertical: 13, fontSize: 14 },

  tierList: { gap: 8, paddingRight: 4, marginBottom: 10 },
  tierBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.white10,
    backgroundColor: "transparent",
  },
  tierBtnText: { color: C.white35, fontSize: 12, fontWeight: "600" },

  countLabel: { color: C.white35, fontSize: 11, letterSpacing: 0.5, marginBottom: 4 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  emptyText: { color: C.white40, fontSize: 15 },

  list: { paddingHorizontal: 20, paddingBottom: 100 },
  card: {
    backgroundColor: C.dark3,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.white6,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pieceBox: {
    width: 48,
    height: 48,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  piece: { fontSize: 26 },
  cardInfo: { flex: 1 },
  playerName: { color: "#fff", fontSize: 14, fontWeight: "700", marginBottom: 3 },
  playerSub: { color: C.white40, fontSize: 11 },
  cardRight: { alignItems: "flex-end", gap: 6 },
  tierPill: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tierPillText: { fontSize: 11, fontWeight: "700" },
  elo: { fontSize: 15, fontWeight: "700" },
});
