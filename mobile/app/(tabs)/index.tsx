import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../stores/useAuthStore";
import { broadcastService } from "../../services/broadcasts";
import { liveService } from "../../services/live";
import { C } from "../../constants/Colors";
import { s } from "../../styles/tabs/index.styles";

const MOCK_LINEUP = [
  { name: "Carlsen", piece: "♔", pts: 124, isCap: true },
  { name: "Pragg", piece: "♛", pts: 88, isCap: false },
  { name: "Wei Yi", piece: "♜", pts: 76, isCap: false },
  { name: "Aronian", piece: "♝", pts: 70, isCap: false },
];

function progCapMin(timeControl?: string | null): number {
  if (!timeControl) return 240;
  const base = parseInt(timeControl.split("+")[0], 10);
  if (isNaN(base)) return 240;
  if (base >= 3600) return 240;
  if (base >= 600) return 60;
  return 15;
}

interface HomeLiveItem {
  p1: string;
  p2: string;
  status: string;
  prog: number;
  startsAt?: number;
  type: "broadcast" | "tv";
  roundId?: string;
  gameId?: string;
  tournamentName?: string;
  roundName?: string;
  tvId?: string;
  channel?: string;
}

function GoldBadge({ children }: { children: string }) {
  return (
    <View style={s.badge}>
      <Text style={s.badgeText}>{children}</Text>
    </View>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "GOOD MORNING";
  if (h < 17) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

export default function HomeScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const firstName =
    user?.display_name?.split(" ")[0] ?? user?.username ?? "Player";
  const [liveItems, setLiveItems] = useState<HomeLiveItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const broadcasts = await broadcastService.getBroadcasts();
          if (broadcasts.length > 0) {
            const top = broadcasts[0];
            const games = await broadcastService.getRoundGames(top.round.id);
            const started = games
              .filter((g) => g.status === "started")
              .slice(0, 2);
            if (started.length > 0) {
              setLiveItems(
                started.map((g) => {
                  const moveCount = g.moves
                    ? g.moves.trim().split(/\s+/).filter(Boolean).length
                    : 0;
                  const startsAt = top.round.startsAt ?? undefined;
                  let elapsedLabel = "";
                  let prog = 50;
                  if (startsAt) {
                    const elapsedMin = Math.floor(
                      (Date.now() - startsAt) / 60_000,
                    );
                    const h = Math.floor(elapsedMin / 60);
                    const m = elapsedMin % 60;
                    elapsedLabel = h > 0 ? `${h}h ${m}m` : `${m}m`;
                    prog = Math.min(
                      95,
                      Math.round(
                        (elapsedMin / progCapMin(g.timeControl)) * 100,
                      ),
                    );
                  }
                  return {
                    type: "broadcast" as const,
                    p1: g.white.name,
                    p2: g.black.name,
                    status: `Move ${moveCount} · ${elapsedLabel || (g.opening?.name ?? "")}`,
                    prog,
                    startsAt,
                    roundId: top.round.id,
                    gameId: g.id,
                    tournamentName: top.name,
                    roundName: top.round.name,
                  };
                }),
              );
              return;
            }
          }
        } catch {}

        try {
          const { games } = await liveService.getLiveGames();
          const seen = new Set<string>();
          const unique = games.filter((g) => {
            if (seen.has(g.id)) return false;
            seen.add(g.id);
            return true;
          });
          setLiveItems(
            unique.slice(0, 2).map((g) => ({
              type: "tv" as const,
              p1: g.player.name,
              p2: "",
              status: `${g.variant} · Lichess TV`,
              prog: 50,
              tvId: g.id,
              channel: g.variant,
            })),
          );
        } catch {}
      })();
    }, []),
  );

  const handleLiveCardPress = (item: HomeLiveItem) => {
    if (item.type === "broadcast" && item.roundId && item.gameId) {
      router.push({
        pathname: "/broadcast/game",
        params: {
          roundId: item.roundId,
          gameId: item.gameId,
          tournamentName: item.tournamentName ?? "",
          roundName: item.roundName ?? "",
        },
      });
    } else if (item.tvId) {
      router.push({
        pathname: "/live/[id]",
        params: { id: item.tvId, channel: item.channel ?? "" },
      });
    }
  };

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={[s.content, { paddingTop: insets.top + 12 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>{getGreeting()}</Text>
          <Text style={s.name}>
            {firstName} <Text style={{ color: C.gold }}>♟</Text>
          </Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity
            style={s.bellBtn}
            activeOpacity={0.7}
            onPress={() => router.push("/notifications")}
          >
            <Text style={s.bellIcon}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.avatar}
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <Text style={s.avatarText}>
              {firstName.slice(0, 2).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <LinearGradient colors={["#1a0a3a", "#0a1a3a"]} style={s.banner}>
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

      <View style={s.statsGrid}>
        {[
          { label: "Team Points", val: "2,847", icon: "🏅", color: C.gold },
          {
            label: "Best Player",
            val: "Carlsen",
            icon: "⭐",
            color: C.accent2,
          },
          { label: "This Week", val: "+340", icon: "📈", color: C.green },
        ].map((stat, i) => (
          <View key={i} style={s.statCard}>
            <Text style={s.statIcon}>{stat.icon}</Text>
            <Text style={[s.statVal, { color: stat.color }]}>{stat.val}</Text>
            <Text style={s.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>My Lineup</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/players")}>
            <Text style={s.sectionLink}>Edit →</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {MOCK_LINEUP.map((pl, i) => (
            <View key={i} style={[s.playerCard, i === 0 && s.playerCardCap]}>
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

      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>🔴 Live Now</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/live")}>
            <Text style={s.sectionLink}>See all →</Text>
          </TouchableOpacity>
        </View>
        {liveItems.length === 0 ? (
          <View style={s.liveEmpty}>
            <Text style={s.liveEmptyText}>No live games right now</Text>
          </View>
        ) : (
          liveItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={s.liveCard}
              activeOpacity={0.8}
              onPress={() => handleLiveCardPress(item)}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.liveMatch} numberOfLines={1}>
                  {item.p1}
                  {item.p2 ? (
                    <>
                      {" "}
                      <Text style={{ color: C.white35 }}>vs</Text> {item.p2}
                    </>
                  ) : null}
                </Text>
                <Text style={s.liveStatus} numberOfLines={1}>
                  {item.status}
                </Text>
                <View style={s.liveTrack}>
                  <LinearGradient
                    colors={[C.accent, C.gold]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[s.liveBar, { width: `${item.prog}%` }]}
                  />
                </View>
              </View>
              <View style={s.liveDotBox}>
                <View style={s.liveDotInner} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}
