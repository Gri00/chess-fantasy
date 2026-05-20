import { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Share,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { leagueService } from "../../services/leagues";
import { playerService } from "../../services/players";
import { useAuthStore } from "../../stores/useAuthStore";
import { C } from "../../constants/Colors";
import { styles } from "../../styles/league/leagueDetail.styles";

const TIER_COLORS: Record<string, string> = {
  S: "#f59e0b",
  A: "#22c55e",
  B: "#3b82f6",
  C: "#a855f7",
  D: "#888",
};

export default function LeagueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const router = useRouter();
  const [league, setLeague] = useState<any>(null);
  const [standings, setStandings] = useState<any[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"roster" | "standings" | "info">(
    "roster",
  );

  const load = useCallback(async () => {
    try {
      const [leagueData, rosterData] = await Promise.all([
        leagueService.getLeague(id),
        playerService.getRoster(id),
      ]);
      setLeague(leagueData);
      setRoster(rosterData);

      if (leagueData.status === "active") {
        const standingsData = await leagueService.getStandings(id);
        setStandings(standingsData);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to load league data");
      router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [id]),
  );

  const handleShare = async () => {
    if (!league?.invite_code) return;
    await Share.share({
      message: `Join my Chess Fantasy league: ${league.invite_code}`,
    });
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.gold} size="large" />
      </View>
    );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.leagueName}>{league?.name}</Text>
          <View style={styles.headerMeta}>
            <Text style={styles.metaText}>
              {league?.members?.length}/{league?.max_teams} teams
            </Text>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    league?.status === "active" ? C.green : C.gold,
                },
              ]}
            />
          </View>
        </View>
        {league?.invite_code && (
          <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
            <Text style={styles.shareBtnText}>Invite</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Invite kod */}
      {league?.invite_code && (
        <TouchableOpacity style={styles.inviteBanner} onPress={handleShare}>
          <Text style={styles.inviteLabel}>Invite Code</Text>
          <Text style={styles.inviteCode}>{league.invite_code}</Text>
          <Text style={styles.inviteShare}>Share →</Text>
        </TouchableOpacity>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {(["roster", "standings", "info"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab === "roster"
                ? "My Team"
                : tab === "standings"
                  ? "Standings"
                  : "Info"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
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
      >
        {/* ROSTER TAB */}
        {activeTab === "roster" && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                My Players ({roster.length}/{league?.roster_size})
              </Text>
              {roster.length < league?.roster_size && (
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => router.push(`/league/${id}/pick`)}
                >
                  <Text style={styles.addBtnText}>+ Add Player</Text>
                </TouchableOpacity>
              )}
            </View>

            {roster.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>♟</Text>
                <Text style={styles.emptyText}>
                  You have no players on your team
                </Text>
                <TouchableOpacity
                  style={styles.pickBtn}
                  onPress={() => router.push(`/league/${id}/pick`)}
                >
                  <Text style={styles.pickBtnText}>Pick Players</Text>
                </TouchableOpacity>
              </View>
            ) : (
              roster.map((item) => (
                <View key={item.roster_id} style={styles.playerCard}>
                  <View
                    style={[
                      styles.tierBadge,
                      { backgroundColor: TIER_COLORS[item.tier] + "22" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tierText,
                        { color: TIER_COLORS[item.tier] },
                      ]}
                    >
                      {item.tier}
                    </Text>
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{item.full_name}</Text>
                    <Text style={styles.playerSub}>
                      {item.title} · {item.country_code} · {item.fide_rating}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        "Remove Player",
                        `Remove ${item.full_name} from your team?`,
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Remove",
                            style: "destructive",
                            onPress: async () => {
                              try {
                                await playerService.removeFromRoster(
                                  id,
                                  item.chess_player_id,
                                );
                                load();
                              } catch (err: any) {
                                Alert.alert(
                                  "Error",
                                  err.response?.data?.error ||
                                    "Failed to remove player",
                                );
                              }
                            },
                          },
                        ],
                      );
                    }}
                  >
                    <Text
                      style={{
                        color: "#ff4444",
                        fontSize: 20,
                        fontWeight: "300",
                        paddingHorizontal: 8,
                      }}
                    >
                      ✕
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* STANDINGS TAB */}
        {activeTab === "standings" && (
          <View>
            <Text style={styles.sectionTitle}>
              {league?.status === "pending" && (
                <View
                  style={{
                    backgroundColor: C.gold18,
                    borderRadius: 10,
                    padding: 10,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: C.gold33,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Text style={{ fontSize: 16 }}>⏳</Text>
                  <Text
                    style={{
                      color: C.gold,
                      fontSize: 13,
                      fontWeight: "500",
                    }}
                  >
                    League hasn't started yet! Picks are still open
                  </Text>
                </View>
              )}
              {league?.status === "pending" ? "Teams" : "Standings"}
            </Text>
            {league?.members?.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No teams yet</Text>
              </View>
            ) : league?.status === "pending" ? (
              // Prikaz timova dok liga nije počela
              league.members.map((member: any) => (
                <TouchableOpacity
                  key={member.id}
                  style={styles.standingRow}
                  onPress={() => router.push(`/league/${id}/team/${member.id}`)}
                >
                  <Text style={styles.rank}>
                    {member.user.id === user?.id ? "⭐" : "👤"}
                  </Text>
                  <View style={styles.standingInfo}>
                    <Text style={styles.standingTeam}>{member.team_name}</Text>
                    <Text style={styles.standingUser}>
                      {member.user.username}
                    </Text>
                  </View>
                  {league?.commissioner_id === user?.id &&
                  member.user.id !== user?.id ? (
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(
                          "Remove Member",
                          `Remove ${member.team_name} from the league?`,
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Remove",
                              style: "destructive",
                              onPress: async () => {
                                try {
                                  await leagueService.removeMember(
                                    id,
                                    member.user.id,
                                  );
                                  load();
                                } catch (err: any) {
                                  Alert.alert(
                                    "Error",
                                    err.response?.data?.error ||
                                      "Failed to remove member",
                                  );
                                }
                              },
                            },
                          ],
                        );
                      }}
                    >
                      <Text
                        style={{
                          color: "#ff4444",
                          fontSize: 18,
                          paddingHorizontal: 8,
                        }}
                      >
                        ✕
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={{ color: C.gold, fontSize: 13 }}>View →</Text>
                  )}
                </TouchableOpacity>
              ))
            ) : standings.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No results available yet</Text>
              </View>
            ) : (
              standings.map((item, index) => (
                <View key={item.league_member_id} style={styles.standingRow}>
                  <Text
                    style={[styles.rank, index < 3 && { color: C.gold }]}
                  >
                    #{item.rank}
                  </Text>
                  <View style={styles.standingInfo}>
                    <Text style={styles.standingTeam}>{item.team_name}</Text>
                    <Text style={styles.standingUser}>{item.username}</Text>
                  </View>
                  <Text style={styles.standingPoints}>
                    {item.total_points} <Text style={styles.ptsLabel}>pts</Text>
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* INFO TAB */}
        {activeTab === "info" && (
          <View>
            <Text style={styles.sectionTitle}>League Details</Text>
            <View style={styles.infoCard}>
              {[
                ["Type", league?.league_type],
                ["Status", league?.status],
                ["Roster Size", `${league?.roster_size} players`],
                ["Max Teams", league?.max_teams],
                ["Season Start", league?.season_start || "Not set"],
                ["Season End", league?.season_end || "Not set"],
              ].map(([label, value]) => (
                <View key={label} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{label}</Text>
                  <Text style={styles.infoValue}>{value}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
              Tier limits
            </Text>
            <View style={styles.infoCard}>
              {Object.entries(league?.tier_limits || {}).map(
                ([tier, limit]) => (
                  <View key={tier} style={styles.infoRow}>
                    <Text
                      style={[styles.infoLabel, { color: TIER_COLORS[tier] }]}
                    >
                      {tier}-Tier
                    </Text>
                    <Text style={styles.infoValue}>
                      {limit === null ? "Unlimited" : `Max ${limit}`}
                    </Text>
                  </View>
                ),
              )}
            </View>

            {league?.commissioner_id !== user?.id && (
              <TouchableOpacity
                style={styles.leaveBtn}
                onPress={() => {
                  Alert.alert(
                    "Leave League",
                    "Are you sure you want to leave this league?",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Leave",
                        style: "destructive",
                        onPress: async () => {
                          try {
                            await leagueService.leaveLeague(league.id);
                            router.replace("/(tabs)/leagues");
                          } catch (err: any) {
                            Alert.alert(
                              "Error",
                              err.response?.data?.error ||
                                "Failed to leave league",
                            );
                          }
                        },
                      },
                    ],
                  );
                }}
              >
                <Text style={styles.leaveBtnText}>Leave League</Text>
              </TouchableOpacity>
            )}

            {league?.commissioner_id === user?.id && (
              <TouchableOpacity
                style={[
                  styles.leaveBtn,
                  {
                    borderColor: "#ff4444",
                    marginTop: 12,
                    backgroundColor: "#ff444411",
                  },
                ]}
                onPress={() => {
                  Alert.alert(
                    "Delete League",
                    "Are you sure? This will permanently delete the league and all its data.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete League",
                        style: "destructive",
                        onPress: async () => {
                          try {
                            await leagueService.deleteLeague(league.id);
                            router.replace("/(tabs)/leagues");
                          } catch (err: any) {
                            Alert.alert(
                              "Error",
                              err.response?.data?.error ||
                                "Failed to delete league",
                            );
                          }
                        },
                      },
                    ],
                  );
                }}
              >
                <Text style={[styles.leaveBtnText, { color: "#ff4444" }]}>
                  🗑 Delete League
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
