import { useEffect, useState } from "react";
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
import { playerService } from "../../services/players";
import { C } from "../../constants/Colors";
import { s } from "../../styles/player/username.styles";

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
