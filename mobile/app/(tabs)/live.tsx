import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { liveService, LiveGame } from "../../services/live";
import { C } from "../../constants/Colors";

const VARIANT_META: Record<string, { piece: string; color: string }> = {
  Classical: { piece: "♔", color: C.gold },
  Rapid:     { piece: "♕", color: C.accent2 },
  Blitz:     { piece: "⚡", color: C.blue },
  Bullet:    { piece: "🔫", color: C.red },
  Best:      { piece: "⭐", color: C.green },
};

export default function LiveScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [games, setGames] = useState<LiveGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(false);
      const { games } = await liveService.getLiveGames();
      setGames(games);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={C.gold}
          />
        }
      >
        <View style={s.header}>
          <View style={s.titleRow}>
            <View style={s.liveDot} />
            <Text style={s.title}>
              Live <Text style={{ color: C.gold }}>Games</Text>
            </Text>
          </View>
          <Text style={s.subtitle}>Top games from Lichess TV · Updates every 30s</Text>
        </View>

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color={C.gold} size="large" />
          </View>
        ) : error ? (
          <View style={s.center}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>♟</Text>
            <Text style={s.errorText}>Failed to load live games</Text>
            <TouchableOpacity onPress={load} style={s.retryBtn}>
              <Text style={s.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : games.length === 0 ? (
          <View style={s.center}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>♟</Text>
            <Text style={s.errorText}>No live games right now</Text>
          </View>
        ) : (
          games.map((game) => {
            const meta = VARIANT_META[game.variant] ?? { piece: "♟", color: C.white40 };
            return (
              <TouchableOpacity
                key={game.id}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: "/live/[id]", params: { id: game.id } })}
              >
                <LinearGradient colors={["#1a0a3a", "#0a1020"]} style={s.card}>
                  {/* Live pulse */}
                  <View style={s.cardLiveDot} />

                  <View style={s.cardTop}>
                    <View style={[s.variantBadge, { backgroundColor: meta.color + "18", borderColor: meta.color + "44" }]}>
                      <Text style={[s.variantText, { color: meta.color }]}>
                        {meta.piece}  {game.variant}
                      </Text>
                    </View>
                    <Text style={s.cardArrow}>›</Text>
                  </View>

                  <Text style={s.playerName}>{game.player.name}</Text>
                  <View style={s.cardMeta}>
                    {game.player.title && (
                      <View style={s.titleBadge}>
                        <Text style={s.titleBadgeText}>{game.player.title}</Text>
                      </View>
                    )}
                    {game.player.rating && (
                      <Text style={s.rating}>ELO {game.player.rating}</Text>
                    )}
                    <View style={[s.colorDot, { backgroundColor: game.player.color === "white" ? "#fff" : C.dark }]} />
                    <Text style={s.colorLabel}>{game.player.color}</Text>
                  </View>

                  <Text style={s.gameId}>Game #{game.id}</Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.dark },
  content: { paddingHorizontal: 20, paddingBottom: 24 },

  header: { marginBottom: 20, marginTop: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.red,
  },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },
  subtitle: { color: C.white35, fontSize: 12 },

  center: { alignItems: "center", paddingTop: 80 },
  errorText: { color: C.white40, fontSize: 15, marginBottom: 16 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, backgroundColor: C.dark3, borderWidth: 1, borderColor: C.gold33 },
  retryText: { color: C.gold, fontWeight: "700" },

  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.gold33,
    position: "relative",
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
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  variantBadge: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  variantText: { fontSize: 12, fontWeight: "700" },
  cardArrow: { color: C.white35, fontSize: 20, marginRight: 18 },

  playerName: { color: "#fff", fontSize: 18, fontWeight: "800", marginBottom: 8 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  titleBadge: { backgroundColor: C.gold18, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: C.gold55 },
  titleBadgeText: { color: C.gold, fontWeight: "800", fontSize: 11 },
  rating: { color: C.white40, fontSize: 12 },
  colorDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: C.white10 },
  colorLabel: { color: C.white35, fontSize: 11, textTransform: "capitalize" },

  gameId: { color: C.white35, fontSize: 10, letterSpacing: 0.5 },
});
