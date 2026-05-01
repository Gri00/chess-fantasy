import { useEffect, useState, useCallback, useRef } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { broadcastService, BroadcastGame } from "../../services/broadcasts";
import { C } from "../../constants/Colors";

const POLL_MS = 8000;

function resultColor(result: string, status: string) {
  if (status === "started") return C.red;
  if (result === "1-0") return C.green;
  if (result === "0-1") return "#aaa";
  if (result === "1/2-1/2") return C.gold;
  return C.white35;
}

function resultLabel(result: string, status: string) {
  if (status === "started") return "● LIVE";
  if (result === "1-0") return "1 – 0";
  if (result === "0-1") return "0 – 1";
  if (result === "1/2-1/2") return "½ – ½";
  return result;
}

export default function BroadcastRoundScreen() {
  const { roundId, name, roundName } = useLocalSearchParams<{
    roundId: string;
    name: string;
    roundName: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [games, setGames] = useState<BroadcastGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (initial = false) => {
    if (!roundId) return;
    try {
      const data = await broadcastService.getRoundGames(roundId);
      setGames(data);
      if (initial) setError(false);
    } catch {
      if (initial) setError(true);
    } finally {
      if (initial) setLoading(false);
      setRefreshing(false);
    }
  }, [roundId]);

  useEffect(() => {
    load(true);
    pollRef.current = setInterval(() => load(false), POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [roundId]);

  const renderGame = ({ item, index }: { item: BroadcastGame; index: number }) => {
    const moveCount = item.moves ? item.moves.trim().split(/\s+/).filter(Boolean).length : 0;
    const resColor = resultColor(item.result, item.status);
    const resLabel = resultLabel(item.result, item.status);

    return (
      <TouchableOpacity
        style={s.card}
        activeOpacity={0.8}
        onPress={() =>
          router.push({
            pathname: "/broadcast/game",
            params: {
              roundId,
              gameId: item.id,
              tournamentName: name,
              roundName,
            },
          })
        }
      >
        {/* Board number */}
        <View style={s.boardNum}>
          <Text style={s.boardNumText}>{index + 1}</Text>
        </View>

        <View style={s.cardBody}>
          {/* Players */}
          <View style={s.playerRow}>
            <View style={[s.colorDot, s.whiteDot]} />
            <Text style={s.playerName} numberOfLines={1}>
              {item.white.title ? <Text style={s.playerTitle}>{item.white.title} </Text> : null}
              {item.white.name}
            </Text>
            {item.white.rating && <Text style={s.playerRating}>{item.white.rating}</Text>}
          </View>
          <View style={s.playerRow}>
            <View style={[s.colorDot, s.blackDot]} />
            <Text style={s.playerName} numberOfLines={1}>
              {item.black.title ? <Text style={s.playerTitle}>{item.black.title} </Text> : null}
              {item.black.name}
            </Text>
            {item.black.rating && <Text style={s.playerRating}>{item.black.rating}</Text>}
          </View>

          {/* Meta row */}
          <View style={s.metaRow}>
            {item.opening && (
              <Text style={s.opening} numberOfLines={1}>{item.opening.eco ? `${item.opening.eco} · ` : ""}{item.opening.name}</Text>
            )}
            <Text style={s.moveCount}>{moveCount} moves</Text>
          </View>
        </View>

        {/* Result */}
        <View style={[s.resultBox, { borderColor: resColor + "55", backgroundColor: resColor + "15" }]}>
          <Text style={[s.resultText, { color: resColor }]}>{resLabel}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backRow} onPress={() => router.back()}>
          <Text style={s.backArrow}>←</Text>
          <Text style={s.backLabel}>Tournaments</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{name ?? "Tournament"}</Text>
        <Text style={s.headerSub}>{roundName ?? "Round"}</Text>
        <View style={s.searchBox}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search by player…"
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

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={C.gold} size="large" />
        </View>
      ) : error ? (
        <View style={s.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>♟</Text>
          <Text style={s.emptyText}>Failed to load games</Text>
          <TouchableOpacity onPress={() => load(true)} style={s.retryBtn}>
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={games.filter((g) => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
              g.white.name.toLowerCase().includes(q) ||
              g.black.name.toLowerCase().includes(q) ||
              (g.white.title ?? "").toLowerCase().includes(q) ||
              (g.black.title ?? "").toLowerCase().includes(q)
            );
          })}
          keyExtractor={(item) => item.id}
          renderItem={renderGame}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(false); }}
              tintColor={C.gold}
            />
          }
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={s.emptyText}>No games available</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.dark },

  header: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.white6 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14, marginTop: 4 },
  backArrow: { color: C.gold, fontSize: 20 },
  backLabel: { color: C.white40, fontSize: 14 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 2 },
  headerSub: { color: C.white40, fontSize: 13 },

  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: C.dark3, borderRadius: 13, borderWidth: 1, borderColor: C.white8, paddingHorizontal: 12, marginTop: 10 },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, color: "#fff", paddingVertical: 11, fontSize: 14 },
  searchClear: { color: C.white35, fontSize: 14, paddingLeft: 8 },

  list: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  center: { alignItems: "center", paddingTop: 80 },
  emptyText: { color: C.white40, fontSize: 15 },
  retryBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, backgroundColor: C.dark3, borderWidth: 1, borderColor: C.gold33 },
  retryText: { color: C.gold, fontWeight: "700" },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.dark3,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.white6,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },

  boardNum: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.dark2, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  boardNumText: { color: C.white35, fontSize: 11, fontWeight: "700" },

  cardBody: { flex: 1, gap: 4 },
  playerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  colorDot: { width: 9, height: 9, borderRadius: 5, borderWidth: 1, flexShrink: 0 },
  whiteDot: { backgroundColor: "#fff", borderColor: C.white35 },
  blackDot: { backgroundColor: "#1a1a2a", borderColor: C.white35 },
  playerName: { flex: 1, color: "#fff", fontSize: 13, fontWeight: "600" },
  playerTitle: { color: C.gold, fontWeight: "800" },
  playerRating: { color: C.white35, fontSize: 11 },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  opening: { flex: 1, color: C.white35, fontSize: 10 },
  moveCount: { color: C.white35, fontSize: 10 },

  resultBox: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5, alignItems: "center", minWidth: 54 },
  resultText: { fontSize: 11, fontWeight: "800" },
});
