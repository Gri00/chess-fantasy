import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { playerService } from "../../services/players";
import { C } from "../../constants/Colors";
import { s } from "../../styles/tabs/players.styles";

// Tier labels shown in filter chips and cards
const TIER_LABEL: Record<string, string> = {
  S: "S Tier",
  A: "A Tier",
  B: "B Tier",
  C: "C Tier",
  D: "D Tier",
};

const TIER_COLOR: Record<string, string> = {
  S: C.gold,
  A: C.accent2,
  B: C.blue,
  C: C.green,
  D: "#aaa",
};

const FORMAT_LABEL: Record<string, string> = {
  classical: "Classical",
  rapid: "Rapid",
  blitz: "Blitz",
};

const TIERS = ["All", "S", "A", "B", "C", "D"];

export default function PlayersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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
    const color = TIER_COLOR[item.tier] ?? "#aaa";
    const tierLabel = TIER_LABEL[item.tier] ?? "Master";
    const formatLabel =
      FORMAT_LABEL[item.rating_format] ?? item.rating_format ?? "";

    return (
      <TouchableOpacity
        style={s.card}
        activeOpacity={0.75}
        onPress={() =>
          router.push({
            pathname: "/player/[username]",
            params: { username: item.id },
          })
        }
      >
        {/* Rank */}
        <View
          style={[
            s.rankBox,
            { borderColor: color + "55", backgroundColor: color + "12" },
          ]}
        >
          <Text style={[s.rankNum, { color }]}>#{item.rank ?? "—"}</Text>
        </View>

        {/* Info */}
        <View style={s.cardInfo}>
          <Text style={s.playerName} numberOfLines={1}>
            {item.full_name}
          </Text>
          <Text style={s.playerSub} numberOfLines={1}>
            {[item.title, item.country_code].filter(Boolean).join("  ·  ")}
            {item.fide_rating && formatLabel
              ? `  ·  ${formatLabel} ${item.fide_rating}`
              : ""}
          </Text>
        </View>

        {/* Tier pill */}
        <View
          style={[
            s.tierPill,
            { backgroundColor: color + "1A", borderColor: color + "55" },
          ]}
        >
          <Text style={[s.tierPillText, { color }]}>{tierLabel}</Text>
        </View>
      </TouchableOpacity>
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

        {/* Tier filter chips */}
        <FlatList
          data={TIERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(t) => t}
          contentContainerStyle={s.tierList}
          renderItem={({ item: tier }) => {
            const active = selectedTier === tier;
            const color = TIER_COLOR[tier] ?? C.gold;
            const label = tier === "All" ? "All" : TIER_LABEL[tier];
            return (
              <TouchableOpacity
                onPress={() => setSelectedTier(tier)}
                style={[
                  s.tierBtn,
                  active && {
                    borderColor: color,
                    backgroundColor: color + "1A",
                  },
                ]}
              >
                <Text style={[s.tierBtnText, active && { color }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        <Text style={s.countLabel}>
          {loading ? "Loading…" : `${players.length} players`}
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
              onRefresh={() => {
                setRefreshing(true);
                load(true);
              }}
              tintColor={C.gold}
            />
          }
          onEndReached={() => {
            if (!loadingMore && hasMore) {
              setLoadingMore(true);
              load();
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={C.gold} style={{ margin: 20 }} />
            ) : null
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
