import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { liveService } from "../../services/live";
import ChessBoard from "../../components/ChessBoard";
import { C } from "../../constants/Colors";
import { s } from "../../styles/live/liveGame.styles";

const POLL_INTERVAL_MS = 3000;
const PAGE_SIZE = 7;

//Screen

export default function GameDetailScreen() {
  const { id, channel } = useLocalSearchParams<{
    id: string;
    channel?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [newMove, setNewMove] = useState(false);
  const [movePage, setMovePage] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const moveTokens = ((game as any)?.moves ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean) as string[];
  const movePairs: [string, string][] = [];
  for (let i = 0; i < moveTokens.length; i += 2) {
    movePairs.push([moveTokens[i], moveTokens[i + 1] ?? ""]);
  }
  const totalMovePages = Math.ceil(movePairs.length / PAGE_SIZE);

  const fetchGame = async (initial = false) => {
    if (!id) return;
    try {
      const res = await liveService.getLiveGame(id, channel);
      const g = res.game ?? res;
      const live = res.live ?? false;

      setGame((prev: any) => {
        const prevMoves =
          prev?.moves?.trim().split(/\s+/).filter(Boolean).length ?? 0;
        const nextMoves =
          g?.moves?.trim().split(/\s+/).filter(Boolean).length ?? 0;
        if (!initial && nextMoves > prevMoves) {
          setNewMove(true);
          setTimeout(() => setNewMove(false), 1200);
        }
        return g;
      });
      setIsLive(live);

      // Stop polling if game is finished
      if (g.status && !["started", "created"].includes(g.status)) {
        stopPolling();
      }
    } catch {
      if (initial) setError(true);
    } finally {
      if (initial) setLoading(false);
    }
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    fetchGame(true);
    // Only poll real (non-mock) games
    if (id && !id.startsWith("mock_")) {
      pollRef.current = setInterval(() => fetchGame(false), POLL_INTERVAL_MS);
    }
    return () => stopPolling();
  }, [id]);

  useEffect(() => {
    if (totalMovePages > 0) setMovePage(totalMovePages - 1);
  }, [totalMovePages]);

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
            <Text style={s.heroSub}>
              {game.opening?.name ?? "—"} · {game.status ?? "ongoing"}
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
            <Text style={s.playerName}>{white?.user?.name ?? "White"}</Text>
            {white?.user?.title ? (
              <Text style={s.playerTitle}>{white.user.title}</Text>
            ) : null}
            <Text style={s.playerRating}>{white?.rating ?? "—"}</Text>
          </View>
          <Text style={s.vsText}>VS</Text>
          <View style={[s.sideBox, { alignItems: "flex-end" }]}>
            <View style={[s.colorDot, s.blackDot]} />
            <Text style={s.playerName}>{black?.user?.name ?? "Black"}</Text>
            {black?.user?.title ? (
              <Text style={s.playerTitle}>{black.user.title}</Text>
            ) : null}
            <Text style={s.playerRating}>{black?.rating ?? "—"}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Board */}
      <View style={s.section}>
        <View style={s.sectionTitleRow}>
          <Text style={s.sectionTitle}>
            Position{" "}
            <Text style={s.movesCount}>· {moveTokens.length} moves</Text>
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
          <Text style={[s.sectionTitle, { marginBottom: 10 }]}>Opening</Text>
          <View style={s.infoCard}>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Name</Text>
              <Text style={s.infoVal} numberOfLines={1}>
                {game.opening.name}
              </Text>
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

      {/* Moves list */}
      {movePairs.length > 0 ? (
        <View style={s.section}>
          <View style={s.sectionTitleRow}>
            <Text style={s.sectionTitle}>
              Moves{" "}
              <Text style={s.movesCount}>· {moveTokens.length} half-moves</Text>
            </Text>
            {newMove && (
              <View style={s.newMovePill}>
                <Text style={s.newMovePillText}>NEW MOVE</Text>
              </View>
            )}
          </View>
          <View style={s.movesCard}>
            {movePairs
              .slice(movePage * PAGE_SIZE, (movePage + 1) * PAGE_SIZE)
              .map((pair, i) => {
                const moveNum = movePage * PAGE_SIZE + i + 1;
                return (
                  <View key={i} style={[s.moveRow, i > 0 && s.moveRowBorder]}>
                    <Text style={s.moveNum}>{moveNum}.</Text>
                    <Text style={s.moveWhite}>{pair[0]}</Text>
                    <Text style={s.moveBlack}>{pair[1]}</Text>
                  </View>
                );
              })}
          </View>
          {totalMovePages > 1 && (
            <View style={s.paginationRow}>
              <TouchableOpacity
                style={[s.pageBtn, movePage === 0 && s.pageBtnDisabled]}
                onPress={() => setMovePage((p) => Math.max(0, p - 1))}
                disabled={movePage === 0}
              >
                <Text
                  style={[
                    s.pageBtnText,
                    movePage === 0 && s.pageBtnTextDisabled,
                  ]}
                >
                  ‹
                </Text>
              </TouchableOpacity>
              <Text style={s.pageIndicator}>
                {movePage + 1} / {totalMovePages}
              </Text>
              <TouchableOpacity
                style={[
                  s.pageBtn,
                  movePage === totalMovePages - 1 && s.pageBtnDisabled,
                ]}
                onPress={() =>
                  setMovePage((p) => Math.min(totalMovePages - 1, p + 1))
                }
                disabled={movePage === totalMovePages - 1}
              >
                <Text
                  style={[
                    s.pageBtnText,
                    movePage === totalMovePages - 1 && s.pageBtnTextDisabled,
                  ]}
                >
                  ›
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : isLive ? (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Moves</Text>
          <View style={s.broadcastNote}>
            <Text style={s.broadcastNoteText}>
              Live broadcast · Move history unavailable
            </Text>
            <Text style={s.broadcastNoteSub}>
              Board position updates every few seconds
            </Text>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}
