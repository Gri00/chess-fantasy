import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { broadcastService, Broadcast } from "../../services/broadcasts";
import { liveService, LiveGame } from "../../services/live";
import { C } from "../../constants/Colors";

// ── Tournaments tab

const TIER_META: Record<number, { label: string; color: string }> = {
  5: { label: "World Class", color: C.gold },
  4: { label: "Elite", color: C.accent2 },
  3: { label: "Major", color: C.blue },
  2: { label: "National", color: C.green },
  1: { label: "Open", color: C.white40 },
  0: { label: "Event", color: C.white35 },
};
const tierMeta = (tier: number) => TIER_META[tier] ?? TIER_META[0];

function TournamentsTab({ search }: { search: string }) {
  const router = useRouter();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(false);
      setBroadcasts(await broadcastService.getBroadcasts());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, []);

  const q = search.toLowerCase();
  const filtered = broadcasts.filter(
    (b) =>
      b.name.toLowerCase().includes(q) ||
      b.round.name.toLowerCase().includes(q),
  );

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.round.id}
      contentContainerStyle={s.list}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          tintColor={C.gold}
        />
      }
      renderItem={({ item }) => {
        const meta = tierMeta(item.tier);
        return (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: "/broadcast/[roundId]",
                params: {
                  roundId: item.round.id,
                  name: item.name,
                  roundName: item.round.name,
                },
              })
            }
          >
            <LinearGradient colors={["#1a0a3a", "#0a1020"]} style={s.card}>
              {/* <View style={s.cardLiveDot} /> */}
              <View style={s.cardTop}>
                <View
                  style={[
                    s.variantBadge,
                    {
                      backgroundColor: meta.color + "18",
                      borderColor: meta.color + "44",
                    },
                  ]}
                >
                  <Text style={[s.variantText, { color: meta.color }]}>
                    {meta.label}
                  </Text>
                </View>
                <Text style={s.cardArrow}>›</Text>
              </View>
              <Text style={s.cardTitle} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={s.cardSub}>{item.round.name}</Text>
            </LinearGradient>
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={
        loading ? (
          <View style={s.center}>
            <ActivityIndicator color={C.gold} size="large" />
          </View>
        ) : error ? (
          <View style={s.center}>
            <Text style={s.emptyIcon}>♟</Text>
            <Text style={s.emptyText}>Failed to load tournaments</Text>
            <TouchableOpacity onPress={load} style={s.retryBtn}>
              <Text style={s.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : search ? (
          <View style={s.center}>
            <Text style={s.emptyText}>No results for "{search}"</Text>
          </View>
        ) : (
          <View style={s.center}>
            <Text style={s.emptyIcon}>♟</Text>
            <Text style={s.emptyText}>No live tournaments right now</Text>
            <Text style={s.emptySub}>Pull down to refresh</Text>
          </View>
        )
      }
    />
  );
}

// ── Games tab ─────────────────────────────────────────────────────────────────

const VARIANT_META: Record<string, { piece: string; color: string }> = {
  Classical: { piece: "♔", color: C.gold },
  Rapid: { piece: "♕", color: C.accent2 },
  Blitz: { piece: "⚡", color: C.blue },
  Bullet: { piece: "🔫", color: C.red },
  Best: { piece: "⭐", color: C.green },
};

function GamesTab({ search }: { search: string }) {
  const router = useRouter();
  const [games, setGames] = useState<LiveGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(false);
      const { games: data } = await liveService.getLiveGames();
      setGames(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, []);

  const q = search.toLowerCase();
  const filtered = games.filter(
    (g) =>
      g.player.name.toLowerCase().includes(q) ||
      g.variant.toLowerCase().includes(q) ||
      (g.player.title ?? "").toLowerCase().includes(q),
  );

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => `${item.variant}-${item.id}`}
      contentContainerStyle={s.list}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          tintColor={C.gold}
        />
      }
      renderItem={({ item: game }) => {
        const meta = VARIANT_META[game.variant] ?? {
          piece: "♟",
          color: C.white40,
        };
        return (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: "/live/[id]",
                params: { id: game.id, channel: game.variant },
              })
            }
          >
            <LinearGradient colors={["#1a0a3a", "#0a1020"]} style={s.card}>
              {/* <View style={s.cardLiveDot} /> */}
              <View style={s.cardTop}>
                <View
                  style={[
                    s.variantBadge,
                    {
                      backgroundColor: meta.color + "18",
                      borderColor: meta.color + "44",
                    },
                  ]}
                >
                  <Text style={[s.variantText, { color: meta.color }]}>
                    {meta.piece} {game.variant}
                  </Text>
                </View>
                <Text style={s.cardArrow}>›</Text>
              </View>
              <Text style={s.cardTitle}>{game.player.name}</Text>
              <View style={s.gameMeta}>
                {game.player.title && (
                  <View style={s.titleBadge}>
                    <Text style={s.titleBadgeText}>{game.player.title}</Text>
                  </View>
                )}
                {game.player.rating != null && (
                  <Text style={s.gameRating}>ELO {game.player.rating}</Text>
                )}
                <View
                  style={[
                    s.colorDot,
                    {
                      backgroundColor:
                        game.player.color === "white" ? "#fff" : "#1a1a2a",
                    },
                  ]}
                />
                <Text style={s.colorLabel}>{game.player.color}</Text>
              </View>
              <Text style={s.gameId}>Game #{game.id}</Text>
            </LinearGradient>
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={
        loading ? (
          <View style={s.center}>
            <ActivityIndicator color={C.gold} size="large" />
          </View>
        ) : error ? (
          <View style={s.center}>
            <Text style={s.emptyIcon}>♟</Text>
            <Text style={s.emptyText}>Failed to load games</Text>
            <TouchableOpacity onPress={load} style={s.retryBtn}>
              <Text style={s.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : search ? (
          <View style={s.center}>
            <Text style={s.emptyText}>No results for "{search}"</Text>
          </View>
        ) : (
          <View style={s.center}>
            <Text style={s.emptyIcon}>♟</Text>
            <Text style={s.emptyText}>No live games right now</Text>
          </View>
        )
      }
    />
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

type Tab = "tournaments" | "games";

export default function LiveScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("tournaments");
  const [search, setSearch] = useState("");

  const handleTabChange = (t: Tab) => {
    setTab(t);
    setSearch("");
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.titleRow}>
          <View style={s.liveDot} />
          <Text style={s.title}>
            Live <Text style={{ color: C.gold }}>Chess</Text>
          </Text>
        </View>

        {/* Segmented tab switcher */}
        <View style={s.tabContainer}>
          <TouchableOpacity
            style={[s.tab, tab === "tournaments" && s.tabActive]}
            onPress={() => handleTabChange("tournaments")}
            activeOpacity={0.8}
          >
            <Text style={[s.tabText, tab === "tournaments" && s.tabTextActive]}>
              Tournaments
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tab, tab === "games" && s.tabActive]}
            onPress={() => handleTabChange("games")}
            activeOpacity={0.8}
          >
            <Text style={[s.tabText, tab === "games" && s.tabTextActive]}>
              Featured Games
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={s.searchBox}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder={
              tab === "tournaments"
                ? "Search tournaments…"
                : "Search by player or format…"
            }
            placeholderTextColor={C.white35}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Text style={s.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {tab === "tournaments" ? (
        <TournamentsTab search={search} />
      ) : (
        <GamesTab search={search} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.dark },

  header: { paddingHorizontal: 20, paddingBottom: 8 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
    marginTop: 8,
  },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.red },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },

  // Segmented control
  tabContainer: {
    flexDirection: "row",
    backgroundColor: C.dark3,
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: "#2a1060",
    shadowColor: C.accent,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  tabText: { color: C.white35, fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: "#fff", fontWeight: "700" },

  // Search
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.dark3,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.white8,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, color: "#fff", paddingVertical: 11, fontSize: 14 },
  searchClear: { color: C.white35, fontSize: 14, paddingLeft: 8 },

  list: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  center: { alignItems: "center", paddingTop: 80 },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyText: { color: C.white40, fontSize: 15, marginBottom: 6 },
  emptySub: { color: C.white35, fontSize: 12 },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: C.dark3,
    borderWidth: 1,
    borderColor: C.gold33,
  },
  retryText: { color: C.gold, fontWeight: "700" },

  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.gold33,
    overflow: "hidden",
  },
  cardLiveDot: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.red,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  variantBadge: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  variantText: { fontSize: 12, fontWeight: "700" },
  cardArrow: { color: C.white35, fontSize: 20, marginRight: 1 }, //change marginRight if we want live dot back
  cardTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 4,
  },
  cardSub: { color: C.white40, fontSize: 13 },

  gameMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  titleBadge: {
    backgroundColor: C.gold18,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: C.gold55,
  },
  titleBadgeText: { color: C.gold, fontWeight: "800", fontSize: 11 },
  gameRating: { color: C.white40, fontSize: 12 },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: C.white10,
  },
  colorLabel: { color: C.white35, fontSize: 11, textTransform: "capitalize" },
  gameId: { color: C.white35, fontSize: 10, letterSpacing: 0.5 },
});
