import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { playerService } from "../../../../services/players";
import { styles } from "../../../../styles/league/teamMember.styles";

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
