import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { playerService } from "../../../../services/players";

const TIER_COLORS: Record<string, string> = {
  S: "#f59e0b",
  A: "#22c55e",
  B: "#3b82f6",
  C: "#a855f7",
  D: "#888",
};

export default function TeamDetailScreen() {
  const { id, memberId } = useLocalSearchParams<{
    id: string;
    memberId: string;
  }>();
  const router = useRouter();
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await playerService.getRoster(id, memberId);
      setRoster(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, memberId]);

  useEffect(() => {
    load();
  }, []);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#22c55e" size="large" />
      </View>
    );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Team Roster</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {roster.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>♟</Text>
            <Text style={styles.emptyText}>No players yet</Text>
          </View>
        ) : (
          roster.map((item) => (
            <View key={item.roster_id} style={styles.playerCard}>
              <View
                style={[
                  styles.tierBadge,
                  {
                    backgroundColor: TIER_COLORS[item.tier] + "22",
                  },
                ]}
              >
                <Text
                  style={[styles.tierText, { color: TIER_COLORS[item.tier] }]}
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
              <Text style={styles.playerRating}>{item.fide_rating}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  center: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
  },
  backBtn: { paddingVertical: 4 },
  backText: { color: "#22c55e", fontSize: 15 },
  title: { fontSize: 20, color: "#fff", fontWeight: "700" },
  content: { padding: 16 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: "#888", fontSize: 15 },
  playerCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    flexDirection: "row",
    alignItems: "center",
  },
  tierBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  tierText: { fontSize: 13, fontWeight: "700" },
  playerInfo: { flex: 1 },
  playerName: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 2,
  },
  playerSub: { fontSize: 12, color: "#888" },
  playerRating: { fontSize: 16, color: "#22c55e", fontWeight: "700" },
});
