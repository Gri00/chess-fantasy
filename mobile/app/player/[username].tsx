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
import { playerService } from "../../services/players";
import { C } from "../../constants/Colors";

const TIER_META: Record<string, { color: string; label: string }> = {
  S: { color: C.gold, label: "S Tier" },
  A: { color: C.accent2, label: "A Tier" },
  B: { color: C.blue, label: "B Tier" },
  C: { color: C.green, label: "C Tier" },
  D: { color: "#aaa", label: "D Tier" },
};

export default function PlayerDetailScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!username) return;
    playerService
      .getPlayer(username)
      .then(setPlayer)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [username]);

  console.log("Loaded player:", player);

  if (loading) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={C.gold} size="large" />
      </View>
    );
  }

  if (error || !player) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>♟</Text>
        <Text style={s.errorText}>Player not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backBtnText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const meta = TIER_META[player.tier] ?? TIER_META["D"];
  const r = player.ratings ?? {};

  const ratingRows = [
    { label: "Classical", val: r.classical },
    { label: "Rapid", val: r.rapid },
    { label: "Blitz", val: r.blitz },
    { label: "Bullet", val: r.bullet },
  ].filter((row) => row.val != null);

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero ── */}
      <LinearGradient
        colors={["#1a0a3a", "#0a1020"]}
        style={[s.hero, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity style={s.backRow} onPress={() => router.back()}>
          <Text style={s.backArrow}>←</Text>
          <Text style={s.backLabel}>Players</Text>
        </TouchableOpacity>

        <View style={s.avatarWrap}>
          <LinearGradient
            colors={[meta.color, meta.color + "88"]}
            style={s.avatarBox}
          >
            <Text style={s.avatarInitials}>
              {player.full_name
                .split(" ")
                .map((w: string) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </Text>
          </LinearGradient>
          {player.online && <View style={s.onlineDot} />}
        </View>

        <View style={s.nameRow}>
          {player.title && (
            <View style={s.titleBadge}>
              <Text style={s.titleBadgeText}>{player.title}</Text>
            </View>
          )}
          <Text style={s.name}>{player.full_name}</Text>
        </View>
        <Text style={s.handle}>@{player.id}</Text>

        <View
          style={[
            s.tierBadge,
            {
              backgroundColor: meta.color + "22",
              borderColor: meta.color + "55",
            },
          ]}
        >
          <Text style={[s.tierBadgeText, { color: meta.color }]}>
            {meta.label}
          </Text>
        </View>
      </LinearGradient>

      {/* ── Quick stats row ── */}
      <View style={s.statsRow}>
        {[
          { label: "RANK", val: player.rank ? `#${player.rank}` : "—" },
          { label: "COUNTRY", val: player.country_code ?? "—" },
          {
            label: "STATUS",
            val: player.online ? "Online" : "Offline",
            color: player.online ? C.green : C.white35,
          },
        ].map((stat, i) => (
          <View key={i} style={[s.statCell, i < 2 && s.statCellBorder]}>
            <Text
              style={[
                s.statVal,
                (stat as any).color
                  ? { color: (stat as any).color }
                  : undefined,
              ]}
            >
              {stat.val}
            </Text>
            <Text style={s.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Chess.com Ratings ── */}
      {ratingRows.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Chess.com Ratings</Text>
          <View style={s.infoCard}>
            {ratingRows.map((row, i) => (
              <View key={i} style={[s.infoRow, i > 0 && s.infoRowBorder]}>
                <Text style={s.infoLabel}>{row.label}</Text>
                <Text style={[s.infoVal, s.ratingVal]}>{row.val}</Text>
              </View>
            ))}
          </View>
          <Text style={s.ratingsNote}>
            These are Chess.com live ratings, not FIDE official ratings.
          </Text>
        </View>
      )}

      {/* ── Player Info ── */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Player Info</Text>
        <View style={s.infoCard}>
          {[
            { label: "Full Name", val: player.full_name },
            { label: "Username", val: player.id },
            { label: "Title", val: player.title ?? "Untitled" },
            {
              label: "Tier",
              val: `${meta.label}${player.rank ? `  ·  #${player.rank}` : ""}`,
            },
            { label: "Country", val: player.country_code ?? "Unknown" },
          ].map((row, i) => (
            <View key={i} style={[s.infoRow, i > 0 && s.infoRowBorder]}>
              <Text style={s.infoLabel}>{row.label}</Text>
              <Text style={s.infoVal}>{row.val}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.dark },
  center: {
    flex: 1,
    backgroundColor: C.dark,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: { color: C.white40, fontSize: 16, marginBottom: 20 },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: C.dark3,
    borderWidth: 1,
    borderColor: C.gold33,
  },
  backBtnText: { color: C.gold, fontWeight: "700" },

  hero: { padding: 24, paddingBottom: 28, overflow: "hidden" },

  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 24,
  },
  backArrow: { color: C.gold, fontSize: 20 },
  backLabel: { color: C.white40, fontSize: 14 },

  avatarWrap: { alignSelf: "center", marginBottom: 16, position: "relative" },
  avatarBox: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { fontSize: 32, fontWeight: "800", color: "#fff" },
  onlineDot: {
    position: "absolute",
    right: -3,
    bottom: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.green,
    borderWidth: 2,
    borderColor: C.dark,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 4,
  },
  titleBadge: {
    backgroundColor: C.gold18,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: C.gold55,
  },
  titleBadgeText: { color: C.gold, fontWeight: "800", fontSize: 13 },
  name: { color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "center" },
  handle: {
    color: C.white40,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 14,
  },

  tierBadge: {
    alignSelf: "center",
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  tierBadgeText: { fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },

  statsRow: {
    flexDirection: "row",
    backgroundColor: C.dark2,
    borderBottomWidth: 1,
    borderBottomColor: C.white6,
  },
  statCell: { flex: 1, alignItems: "center", paddingVertical: 16 },
  statCellBorder: { borderRightWidth: 1, borderRightColor: C.white6 },
  statVal: { color: "#fff", fontSize: 15, fontWeight: "700" },
  statLabel: {
    color: C.white35,
    fontSize: 9,
    letterSpacing: 0.5,
    marginTop: 3,
  },

  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  ratingsNote: { color: C.white35, fontSize: 10, marginTop: 8 },

  infoCard: {
    backgroundColor: C.dark3,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.white6,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: C.white4 },
  infoLabel: { color: C.white40, fontSize: 13 },
  infoVal: { color: "#fff", fontSize: 13, fontWeight: "600" },
  ratingVal: { fontSize: 16, fontWeight: "800", color: C.gold },
});
