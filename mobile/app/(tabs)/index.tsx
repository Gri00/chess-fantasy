import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../stores/useAuthStore";
import { C } from "../../constants/Colors";

// ── Mock data ──
const MOCK_LINEUP = [
  { name: "Carlsen", piece: "♔", pts: 124, isCap: true },
  { name: "Pragg", piece: "♛", pts: 88, isCap: false },
  { name: "Wei Yi", piece: "♜", pts: 76, isCap: false },
  { name: "Aronian", piece: "♝", pts: 70, isCap: false },
];

const MOCK_LIVE = [
  { p1: "Carlsen", p2: "Nepomniachtchi", status: "Move 34 · ♞e5", prog: 60 },
  { p1: "Ding Liren", p2: "Gukesh", status: "Move 18 · ♝f6", prog: 30 },
];

function GoldBadge({ children }: { children: string }) {
  return (
    <View style={s.badge}>
      <Text style={s.badgeText}>{children}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const firstName = user?.display_name?.split(" ")[0] ?? user?.username ?? "Player";

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={[s.content, { paddingTop: insets.top + 12 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>GOOD MORNING</Text>
          <Text style={s.name}>
            {firstName} <Text style={{ color: C.gold }}>♟</Text>
          </Text>
        </View>
        <View style={s.avatar}>
          <Text style={s.avatarText}>
            {firstName.slice(0, 2).toUpperCase()}
          </Text>
        </View>
      </View>

      {/* ── Season banner ── */}
      <LinearGradient
        colors={["#1a0a3a", "#0a1a3a"]}
        style={s.banner}
      >
        <View style={s.bannerAbsPiece}>
          <Text style={{ fontSize: 80, color: C.gold, opacity: 0.07 }}>♔</Text>
        </View>
        <View style={s.bannerTop}>
          <View style={{ flex: 1 }}>
            <GoldBadge>LIVE LEAGUE</GoldBadge>
            <Text style={s.bannerTitle}>World Chess Championship</Text>
            <Text style={s.bannerSub}>Round 6 of 14 · Ends in 3d 14h</Text>
          </View>
          <View style={s.bannerRank}>
            <Text style={s.bannerRankNum}>#47</Text>
            <Text style={s.bannerRankLabel}>YOUR RANK</Text>
          </View>
        </View>
        <View style={s.progressTrack}>
          <View style={[s.progressBar, { width: "43%" }]} />
        </View>
        <View style={s.bannerFooter}>
          <Text style={s.bannerFooterLabel}>Round 6/14</Text>
          <Text style={s.bannerFooterPts}>2,847 pts</Text>
        </View>
      </LinearGradient>

      {/* ── Quick stats ── */}
      <View style={s.statsGrid}>
        {[
          { label: "Team Points", val: "2,847", icon: "🏅", color: C.gold },
          { label: "Best Player", val: "Carlsen", icon: "⭐", color: C.accent2 },
          { label: "This Week", val: "+340", icon: "📈", color: C.green },
        ].map((stat, i) => (
          <View key={i} style={s.statCard}>
            <Text style={s.statIcon}>{stat.icon}</Text>
            <Text style={[s.statVal, { color: stat.color }]}>{stat.val}</Text>
            <Text style={s.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* ── My Lineup ── */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>My Lineup</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/players")}>
            <Text style={s.sectionLink}>Edit →</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {MOCK_LINEUP.map((pl, i) => (
            <View
              key={i}
              style={[s.playerCard, i === 0 && s.playerCardCap]}
            >
              <View style={s.playerPieceBox}>
                <Text style={s.playerPiece}>{pl.piece}</Text>
              </View>
              <Text style={s.playerName}>{pl.name}</Text>
              <Text style={s.playerPts}>{pl.pts} pts</Text>
              {pl.isCap && (
                <View style={s.capBadge}>
                  <Text style={s.capText}>C</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* ── Live Now ── */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>🔴 Live Now</Text>
          <Text style={s.sectionLink}>See all →</Text>
        </View>
        {MOCK_LIVE.map((m, i) => (
          <View key={i} style={s.liveCard}>
            <View style={{ flex: 1 }}>
              <Text style={s.liveMatch}>
                {m.p1}{" "}
                <Text style={{ color: C.white35 }}>vs</Text>{" "}
                {m.p2}
              </Text>
              <Text style={s.liveStatus}>{m.status}</Text>
              <View style={s.liveTrack}>
                <LinearGradient
                  colors={[C.accent, C.gold]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[s.liveBar, { width: `${m.prog}%` }]}
                />
              </View>
            </View>
            <View style={s.liveDotBox}>
              <View style={s.liveDotInner} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.dark },
  content: { paddingHorizontal: 20, paddingBottom: 24 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greeting: { color: C.white40, fontSize: 11, letterSpacing: 2, fontWeight: "600" },
  name: { color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 2 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  // Badge
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(212,175,55,0.12)",
    borderWidth: 1,
    borderColor: C.gold55,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  badgeText: { color: C.gold, fontSize: 10, fontWeight: "700", letterSpacing: 1 },

  // Banner
  banner: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.gold33,
    overflow: "hidden",
  },
  bannerAbsPiece: { position: "absolute", right: -10, top: -10 },
  bannerTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
  bannerTitle: { color: "#fff", fontSize: 17, fontWeight: "700", marginBottom: 4 },
  bannerSub: { color: C.white40, fontSize: 12 },
  bannerRank: { alignItems: "flex-end" },
  bannerRankNum: { color: C.gold, fontSize: 26, fontWeight: "800" },
  bannerRankLabel: { color: C.white40, fontSize: 10, letterSpacing: 1 },
  progressTrack: {
    height: 4,
    backgroundColor: C.white10,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: C.gold,
    borderRadius: 2,
  },
  bannerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  bannerFooterLabel: { color: C.white35, fontSize: 10 },
  bannerFooterPts: { color: C.gold, fontSize: 10, fontWeight: "700" },

  // Stats
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.dark3,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.white6,
  },
  statIcon: { fontSize: 20, marginBottom: 6 },
  statVal: { fontSize: 13, fontWeight: "700" },
  statLabel: { color: C.white35, fontSize: 9, marginTop: 2, textAlign: "center" },

  // Section
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  sectionLink: { color: C.gold, fontSize: 12 },

  // Player cards
  playerCard: {
    width: 80,
    backgroundColor: C.dark3,
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: C.white6,
  },
  playerCardCap: { borderColor: C.gold55 },
  playerPieceBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(123,63,228,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  playerPiece: { fontSize: 22, color: C.gold },
  playerName: { color: "#fff", fontSize: 10, fontWeight: "700", marginBottom: 2 },
  playerPts: { color: C.gold, fontSize: 10 },
  capBadge: {
    marginTop: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  capText: { color: C.dark, fontSize: 9, fontWeight: "800" },

  // Live
  liveCard: {
    backgroundColor: C.dark3,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.white6,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  liveMatch: { color: "#fff", fontSize: 13, fontWeight: "700", marginBottom: 4 },
  liveStatus: { color: C.white40, fontSize: 11, marginBottom: 6 },
  liveTrack: {
    height: 3,
    backgroundColor: C.white8,
    borderRadius: 2,
    overflow: "hidden",
  },
  liveBar: { height: "100%", borderRadius: 2 },
  liveDotBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(228,75,75,0.15)",
    borderWidth: 1,
    borderColor: "rgba(228,75,75,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  liveDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.red,
  },
});
