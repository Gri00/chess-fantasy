import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
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
import { s } from "../../styles/tabs/live.styles";

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
