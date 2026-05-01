import { useEffect, useState } from "react";
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
import { liveService } from "../../services/live";
import { C } from "../../constants/Colors";

// ── FEN board ─────────────────────────────────────────────────────────────────

const PIECE_UNICODE: Record<string, string> = {
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
};

function parseFenPosition(fen: string): (string | null)[][] {
  const position = fen.split(" ")[0];
  return position.split("/").map((rank) => {
    const row: (string | null)[] = [];
    for (const ch of rank) {
      if (/\d/.test(ch)) {
        for (let i = 0; i < parseInt(ch); i++) row.push(null);
      } else {
        row.push(ch);
      }
    }
    return row;
  });
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const CELL_SIZE = 40;
const BOARD_SIZE = CELL_SIZE * 8;

function ChessBoard({ fen }: { fen: string }) {
  const board = parseFenPosition(fen);

  return (
    <View style={b.container}>
      <View style={b.board}>
        {board.map((rank, rankIdx) => (
          <View key={rankIdx} style={b.rank}>
            <Text style={b.rankLabel}>{8 - rankIdx}</Text>
            {rank.map((piece, fileIdx) => {
              const isLight = (rankIdx + fileIdx) % 2 === 0;
              const isWhitePiece = piece ? piece === piece.toUpperCase() : false;
              return (
                <View
                  key={fileIdx}
                  style={[b.cell, isLight ? b.cellLight : b.cellDark]}
                >
                  {piece && (
                    <Text
                      style={[
                        b.piece,
                        isWhitePiece ? b.pieceWhite : b.pieceBlack,
                      ]}
                    >
                      {PIECE_UNICODE[piece] ?? piece}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}
        <View style={b.fileRow}>
          <View style={b.rankLabelSpacer} />
          {FILES.map((f) => (
            <Text key={f} style={b.fileLabel}>{f}</Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const b = StyleSheet.create({
  container: { alignItems: "center" },
  board: {
    borderWidth: 1,
    borderColor: C.gold33,
    borderRadius: 6,
    overflow: "hidden",
  },
  rank: { flexDirection: "row", alignItems: "center" },
  rankLabel: {
    width: 18,
    textAlign: "center",
    color: C.white35,
    fontSize: 9,
    backgroundColor: "#0a0a18",
  },
  cell: { width: CELL_SIZE, height: CELL_SIZE, alignItems: "center", justifyContent: "center" },
  cellLight: { backgroundColor: "#f0d9b5" },
  cellDark:  { backgroundColor: "#b58863" },
  piece:      { fontSize: 26, lineHeight: 34 },
  pieceWhite: { color: "#fff", textShadowColor: "#000", textShadowOffset: { width: 0.5, height: 0.5 }, textShadowRadius: 1 },
  pieceBlack: { color: "#1a1a1a" },
  fileRow: { flexDirection: "row", backgroundColor: "#0a0a18", paddingVertical: 3 },
  rankLabelSpacer: { width: 18 },
  fileLabel: { width: CELL_SIZE, textAlign: "center", color: C.white35, fontSize: 9 },
});

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!id) return;
    liveService.getLiveGame(id)
      .then((res) => {
        setGame(res.game ?? res);
        setIsLive(res.live ?? false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

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

  const white = game.players?.white;
  const black = game.players?.black;
  const moves: string[] = game.moves ? game.moves.trim().split(/\s+/).filter(Boolean) : [];
  const movePairs: [string, string][] = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push([moves[i], moves[i + 1] ?? ""]);
  }

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
          <Text style={s.backLabel}>Live</Text>
        </TouchableOpacity>

        <View style={s.heroTopRow}>
          <View>
            <Text style={s.heroTitle}>{game.variant ?? "Classical"}</Text>
            <Text style={s.heroSub}>{game.opening?.name ?? "—"}  ·  {game.status ?? "ongoing"}</Text>
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
            <Text style={s.playerName}>{white?.user?.name ?? "White"}</Text>
            {white?.user?.title ? <Text style={s.playerTitle}>{white.user.title}</Text> : null}
            <Text style={s.playerRating}>{white?.rating ?? "—"}</Text>
          </View>
          <Text style={s.vsText}>VS</Text>
          <View style={[s.sideBox, { alignItems: "flex-end" }]}>
            <View style={[s.colorDot, s.blackDot]} />
            <Text style={s.playerName}>{black?.user?.name ?? "Black"}</Text>
            {black?.user?.title ? <Text style={s.playerTitle}>{black.user.title}</Text> : null}
            <Text style={s.playerRating}>{black?.rating ?? "—"}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Board */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>
          Position  <Text style={s.movesCount}>· {moves.length} moves</Text>
        </Text>
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

      {/* Moves list (last 20) */}
      {movePairs.length > 0 && (
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
      )}
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

  heroTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  heroTitle: { color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 4 },
  heroSub: { color: C.white40, fontSize: 12 },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(228,75,75,0.15)", borderWidth: 1, borderColor: "rgba(228,75,75,0.4)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  livePulse: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.red },
  liveBadgeText: { color: C.red, fontSize: 11, fontWeight: "800", letterSpacing: 1 },

  vsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sideBox: { flex: 1 },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginBottom: 6, borderWidth: 1 },
  whiteDot: { backgroundColor: "#fff", borderColor: C.white35 },
  blackDot: { backgroundColor: "#1a1a2a", borderColor: C.white35 },
  playerName: { color: "#fff", fontSize: 15, fontWeight: "700" },
  playerTitle: { color: C.gold, fontSize: 11, fontWeight: "700" },
  playerRating: { color: C.white40, fontSize: 12 },
  vsText: { color: C.white35, fontSize: 13, fontWeight: "800", letterSpacing: 2 },

  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { color: "#fff", fontSize: 15, fontWeight: "700", marginBottom: 12 },
  movesCount: { color: C.white35, fontWeight: "400", fontSize: 13 },
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
});
