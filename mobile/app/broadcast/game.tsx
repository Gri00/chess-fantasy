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
import { broadcastService, BroadcastGame } from "../../services/broadcasts";
import ChessBoard from "../../components/ChessBoard";
import { C } from "../../constants/Colors";
import { s } from "../../styles/broadcast/game.styles";

const PAGE_SIZE = 7;

function getIntervalMs(timeControl: string | null): number {
  if (!timeControl) return 30_000;
  const base = parseInt(timeControl.split("+")[0] ?? "0", 10);
  if (isNaN(base)) return 30_000;
  return base >= 3600 ? 30_000 : 3_000;
}

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
  const [movePage, setMovePage] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derived — computed here so totalMovePages is available before early returns
  const moveTokens = (game?.moves ?? "").trim().split(/\s+/).filter(Boolean);
  const movePairs: [string, string][] = [];
  for (let i = 0; i < moveTokens.length; i += 2) {
    movePairs.push([moveTokens[i], moveTokens[i + 1] ?? ""]);
  }
  const totalMovePages = Math.ceil(movePairs.length / PAGE_SIZE);

  const fetchGame = async (initial = false) => {
    if (!roundId || !gameId) return;
    try {
      const games = await broadcastService.getRoundGames(roundId);
      const found = games.find((g) => g.id === gameId);
      if (!found) return;

      setGame((prev) => {
        const prevCount =
          prev?.moves?.trim().split(/\s+/).filter(Boolean).length ?? 0;
        const nextCount =
          found.moves?.trim().split(/\s+/).filter(Boolean).length ?? 0;
        if (!initial && nextCount > prevCount) {
          setNewMove(true);
          setTimeout(() => setNewMove(false), 1500);
        }
        return found;
      });

      if (initial) {
        // Restart with the correct interval for this time control
        const ms = getIntervalMs(found.timeControl);
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(() => fetchGame(false), ms);
      }

      // Stop polling once game is finished
      if (found.status !== "started") {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }
    } catch {
      if (initial) setError(true);
    } finally {
      if (initial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchGame(true);
    // Start with a default interval; fetchGame(initial=true) will restart with correct one
    pollRef.current = setInterval(() => fetchGame(false), 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [roundId, gameId]);

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
            <Text style={s.heroTitle} numberOfLines={1}>
              {tournamentName ?? "Tournament"}
            </Text>
            <Text style={s.heroSub}>
              {game.opening?.name ?? "—"} · {resultLabel()}
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
            <Text style={s.playerName} numberOfLines={1}>
              {game.white.name}
            </Text>
            {game.white.title ? (
              <Text style={s.playerTitle}>{game.white.title}</Text>
            ) : null}
            <Text style={s.playerRating}>{game.white.rating ?? "—"}</Text>
            {game.clock?.white ? (
              <Text style={s.clockText}>{game.clock.white}</Text>
            ) : null}
          </View>
          <Text style={s.vsText}>VS</Text>
          <View style={[s.sideBox, { alignItems: "flex-end" }]}>
            <View style={[s.colorDot, s.blackDot]} />
            <Text style={s.playerName} numberOfLines={1}>
              {game.black.name}
            </Text>
            {game.black.title ? (
              <Text style={s.playerTitle}>{game.black.title}</Text>
            ) : null}
            <Text style={s.playerRating}>{game.black.rating ?? "—"}</Text>
            {game.clock?.black ? (
              <Text style={s.clockText}>{game.clock.black}</Text>
            ) : null}
          </View>
        </View>

        {/* Win probability bar */}
        {game.winChance && (
          <View style={s.winSection}>
            <View style={s.winBar}>
              <View style={[s.winWhite, { flex: game.winChance.white }]} />
              <View style={[s.winBlack, { flex: game.winChance.black }]} />
            </View>
            <View style={s.winLabels}>
              <Text style={s.winLabelWhite}>{game.winChance.white}%</Text>
              <Text style={s.winLabelCenter}>Win chances</Text>
              <Text style={s.winLabelBlack}>{game.winChance.black}%</Text>
            </View>
          </View>
        )}
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

      {/* Moves */}
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
              Game just started · Waiting for moves
            </Text>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}
