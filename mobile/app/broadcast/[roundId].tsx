import { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
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
import { s } from "../../styles/broadcast/round.styles";

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

  const load = useCallback(
    async (initial = false) => {
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
    },
    [roundId],
  );

  useEffect(() => {
    load(true);
    pollRef.current = setInterval(() => load(false), POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [roundId]);

  const renderGame = ({
    item,
    index,
  }: {
    item: BroadcastGame;
    index: number;
  }) => {
    const moveCount = item.moves
      ? item.moves.trim().split(/\s+/).filter(Boolean).length
      : 0;
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
              {item.white.title ? (
                <Text style={s.playerTitle}>{item.white.title} </Text>
              ) : null}
              {item.white.name}
            </Text>
            {item.white.rating && (
              <Text style={s.playerRating}>{item.white.rating}</Text>
            )}
          </View>
          <View style={s.playerRow}>
            <View style={[s.colorDot, s.blackDot]} />
            <Text style={s.playerName} numberOfLines={1}>
              {item.black.title ? (
                <Text style={s.playerTitle}>{item.black.title} </Text>
              ) : null}
              {item.black.name}
            </Text>
            {item.black.rating && (
              <Text style={s.playerRating}>{item.black.rating}</Text>
            )}
          </View>

          {/* Meta row */}
          <View style={s.metaRow}>
            {item.opening && (
              <Text style={s.opening} numberOfLines={1}>
                {item.opening.eco ? `${item.opening.eco} · ` : ""}
                {item.opening.name}
              </Text>
            )}
            <Text style={s.moveCount}>{moveCount} moves</Text>
          </View>
        </View>

        {/* Result */}
        <View
          style={[
            s.resultBox,
            { borderColor: resColor + "55", backgroundColor: resColor + "15" },
          ]}
        >
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
        <Text style={s.headerTitle} numberOfLines={1}>
          {name ?? "Tournament"}
        </Text>
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
              onRefresh={() => {
                setRefreshing(true);
                load(false);
              }}
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
