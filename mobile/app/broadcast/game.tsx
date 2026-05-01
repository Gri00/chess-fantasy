import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { broadcastService, BroadcastGame } from "../../services/broadcasts";
import ChessBoard from "../../components/ChessBoard";
import { C } from "../../constants/Colors";

const POLL_MS = 4000;

export default function BroadcastGameScreen() {
  const { roundId, gameId, tournamentName, roundName } = useLocalSearchParams<{
    roundId: string;
    gameId: string;
    tournamentName: string;
    roundName: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [game, setGame] = useState<BroadcastGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [newMove, setNewMove] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchGame = async (initial = false) => {
    if (!roundId || !gameId) return;
    try {
      const games = await broadcastService.getRoundGames(roundId);
      const found = games.find((g) => g.id === gameId);
      if (!found) return;

      setGame((prev) => {
        const prevCount = prev?.moves?.trim().split(/\s+/).filter(Boolean).length ?? 0;
        const nextCount = found.moves?.trim().split(/\s+/).filter(Boolean).length ?? 0;
        if (!initial && nextCount > prevCount) {
          setNewMove(true);
          setTimeout(() => setNewMove(false), 1500);
        }
        return found;
      });

      // Stop polling once game is finished
      if (found.status !== "started") {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      }
    } catch {
      if (initial) setError(true);
    } finally {
      if (initial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchGame(true);
    pollRef.current = setInterval(() => fetchGame(false), POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [roundId, gameId]);

  if (loading) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={C.gold} size="large" />
      </View>
    );
  }

  if (error || !game) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>♟</Text>
        <Text style={s.errorText}>Game not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backBtnText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const moves = game.moves ? game.moves.trim().split(/\s+/).filter(Boolean) : [];
  const movePairs: [string, string][] = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push([moves[i], moves[i + 1] ?? ""]);
  }
  const isLive = game.status === "started";

  const resultLabel = () => {
    if (isLive) return "ongoing";
    if (game.result === "1-0") return "White wins";
    if (game.result === "0-1") return "Black wins";
    if (game.result === "1/2-1/2") return "Draw";
    return game.result;
  };

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <LinearGradient
        colors={["#1a0a3a", "#0a1020"]}
        style={[s.hero, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity style={s.backRow} onPress={() => router.back()}>
          <Text style={s.backArrow}>←</Text>
          <Text style={s.backLabel}>{roundName ?? "Round"}</Text>
        </TouchableOpacity>

        <View style={s.heroTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.heroTitle} numberOfLines={1}>{tournamentName ?? "Tournament"}</Text>
            <Text style={s.heroSub}>
              {game.opening?.name ?? "—"}  ·  {resultLabel()}
            </Text>
          </View>
          {isLive && (
            <View style={s.liveBadge}>
              <View style={s.livePulse} />
              <Text style={s.liveBadgeText}>LIVE</Text>
            </View>
          )}
        </View>

        {/* Players */}
        <View style={s.vsRow}>
          <View style={s.sideBox}>
            <View style={[s.colorDot, s.whiteDot]} />
            <Text style={s.playerName} numberOfLines={1}>{game.white.name}</Text>
            {game.white.title ? <Text style={s.playerTitle}>{game.white.title}</Text> : null}
            <Text style={s.playerRating}>{game.white.rating ?? "—"}</Text>
          </View>
          <Text style={s.vsText}>VS</Text>
          <View style={[s.sideBox, { alignItems: "flex-end" }]}>
            <View style={[s.colorDot, s.blackDot]} />
            <Text style={s.playerName} numberOfLines={1}>{game.black.name}</Text>
            {game.black.title ? <Text style={s.playerTitle}>{game.black.title}</Text> : null}
            <Text style={s.playerRating}>{game.black.rating ?? "—"}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Board */}
      <View style={s.section}>
        <View style={s.sectionTitleRow}>
          <Text style={s.sectionTitle}>
            Position  <Text style={s.movesCount}>· {moves.length} moves</Text>
          </Text>
          {newMove && (
            <View style={s.newMovePill}>
              <Text style={s.newMovePillText}>NEW MOVE</Text>
            </View>
          )}
        </View>
        {game.fen ? (
          <ChessBoard fen={game.fen} />
        ) : (
          <View style={s.noFen}>
            <Text style={s.noFenText}>Board position unavailable</Text>
          </View>
        )}
      </View>

      {/* Opening */}
      {game.opening && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Opening</Text>
          <View style={s.infoCard}>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Name</Text>
              <Text style={s.infoVal} numberOfLines={1}>{game.opening.name}</Text>
            </View>
            {game.opening.eco && (
              <View style={[s.infoRow, s.infoRowBorder]}>
                <Text style={s.infoLabel}>ECO</Text>
                <Text style={s.infoVal}>{game.opening.eco}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Moves */}
      {movePairs.length > 0 ? (
        <View style={s.section}>
          <Text style={s.sectionTitle}>
            Moves{movePairs.length > 20 ? "  (last 20)" : ""}
          </Text>
          <View style={s.movesCard}>
            {movePairs.slice(-20).map((pair, i) => {
              const moveNum = movePairs.length - Math.min(movePairs.length, 20) + i + 1;
              return (
                <View key={i} style={[s.moveRow, i > 0 && s.moveRowBorder]}>
                  <Text style={s.moveNum}>{moveNum}.</Text>
                  <Text style={s.moveWhite}>{pair[0]}</Text>
                  <Text style={s.moveBlack}>{pair[1]}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : isLive ? (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Moves</Text>
          <View style={s.broadcastNote}>
            <Text style={s.broadcastNoteText}>Game just started · Waiting for moves</Text>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.dark },
  center: { flex: 1, backgroundColor: C.dark, alignItems: "center", justifyContent: "center" },
  errorText: { color: C.white40, fontSize: 16, marginBottom: 20 },
  backBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: C.dark3, borderWidth: 1, borderColor: C.gold33 },
  backBtnText: { color: C.gold, fontWeight: "700" },

  hero: { padding: 24, paddingBottom: 28, overflow: "hidden" },
  backRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 },
  backArrow: { color: C.gold, fontSize: 20 },
  backLabel: { color: C.white40, fontSize: 14 },

  heroTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 12 },
  heroTitle: { color: "#fff", fontSize: 18, fontWeight: "800", marginBottom: 4 },
  heroSub: { color: C.white40, fontSize: 12 },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(228,75,75,0.15)", borderWidth: 1, borderColor: "rgba(228,75,75,0.4)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  livePulse: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.red },
  liveBadgeText: { color: C.red, fontSize: 11, fontWeight: "800", letterSpacing: 1 },

  vsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sideBox: { flex: 1 },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginBottom: 6, borderWidth: 1 },
  whiteDot: { backgroundColor: "#fff", borderColor: C.white35 },
  blackDot: { backgroundColor: "#1a1a2a", borderColor: C.white35 },
  playerName: { color: "#fff", fontSize: 14, fontWeight: "700" },
  playerTitle: { color: C.gold, fontSize: 11, fontWeight: "700" },
  playerRating: { color: C.white40, fontSize: 12 },
  vsText: { color: C.white35, fontSize: 13, fontWeight: "800", letterSpacing: 2 },

  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  movesCount: { color: C.white35, fontWeight: "400", fontSize: 13 },
  newMovePill: { backgroundColor: "rgba(100,220,100,0.15)", borderWidth: 1, borderColor: "rgba(100,220,100,0.45)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  newMovePillText: { color: "#64dc64", fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  noFen: { alignItems: "center", paddingVertical: 24 },
  noFenText: { color: C.white35, fontSize: 13 },

  infoCard: { backgroundColor: C.dark3, borderRadius: 16, borderWidth: 1, borderColor: C.white6, overflow: "hidden" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 13, gap: 20 },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: C.white4 },
  infoLabel: { color: C.white40, fontSize: 13 },
  infoVal: { color: "#fff", fontSize: 13, fontWeight: "600", flex: 1, textAlign: "right" },

  movesCard: { backgroundColor: C.dark3, borderRadius: 16, borderWidth: 1, borderColor: C.white6, overflow: "hidden" },
  moveRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  moveRowBorder: { borderTopWidth: 1, borderTopColor: C.white4 },
  moveNum: { color: C.white35, fontSize: 12, width: 28 },
  moveWhite: { color: "#fff", fontSize: 13, fontWeight: "600", flex: 1 },
  moveBlack: { color: C.white40, fontSize: 13, flex: 1 },

  broadcastNote: { backgroundColor: C.dark3, borderRadius: 16, borderWidth: 1, borderColor: C.white6, paddingHorizontal: 16, paddingVertical: 18, alignItems: "center" },
  broadcastNoteText: { color: C.white40, fontSize: 13 },
});
