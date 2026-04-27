import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { playerService } from "../../../services/players";

const TIERS = ["Sve", "S", "A", "B", "C", "D"];

const TIER_COLORS: Record<string, string> = {
  S: "#f59e0b",
  A: "#22c55e",
  B: "#3b82f6",
  C: "#a855f7",
  D: "#888",
};

export default function PickPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTier, setSelectedTier] = useState("Sve");
  const [adding, setAdding] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...(search && { search }),
        ...(selectedTier !== "All" && { tier: selectedTier }),
      };
      const data = await playerService.getAvailable(id, params);
      setPlayers(data.players);
    } catch (err) {
      Alert.alert("Error", "Failed to load players");
    } finally {
      setLoading(false);
    }
  }, [id, search, selectedTier]);

  useEffect(() => {
    load();
  }, [search, selectedTier]);

  const handleAdd = async (playerId: string, playerName: string) => {
    setAdding(playerId);
    try {
      await playerService.addToRoster(id, playerId);
      Alert.alert("Added!", `${playerName} has been added to your team`, [
        { text: "Continue", style: "cancel" },
        { text: "Back to Team", onPress: () => router.back() },
      ]);
      load();
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Failed to add player");
    } finally {
      setAdding(null);
    }
  };

  const renderPlayer = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View
        style={[
          styles.tierBadge,
          { backgroundColor: TIER_COLORS[item.tier] + "22" },
        ]}
      >
        <Text style={[styles.tierText, { color: TIER_COLORS[item.tier] }]}>
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
        style={[styles.addBtn, adding === item.id && styles.addBtnDisabled]}
        onPress={() => handleAdd(item.id, item.full_name)}
        disabled={adding === item.id}
      >
        {adding === item.id ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.addBtnText}>+</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Pick Player</Text>
      </View>

      <View style={styles.filters}>
        <TextInput
          style={styles.search}
          placeholder="Search..."
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
        />
        <View style={styles.tiers}>
          {TIERS.map((tier) => (
            <TouchableOpacity
              key={tier}
              style={[
                styles.tierBtn,
                selectedTier === tier && styles.tierBtnActive,
              ]}
              onPress={() => setSelectedTier(tier)}
            >
              <Text
                style={[
                  styles.tierBtnText,
                  selectedTier === tier && {
                    color: TIER_COLORS[tier] || "#22c55e",
                  },
                ]}
              >
                {tier}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#22c55e" size="large" />
        </View>
      ) : (
        <FlatList
          data={players}
          keyExtractor={(item) => item.id}
          renderItem={renderPlayer}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No available players</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  backBtn: { paddingVertical: 4 },
  backText: { color: "#22c55e", fontSize: 15 },
  title: { fontSize: 20, color: "#fff", fontWeight: "700" },
  filters: { paddingHorizontal: 16, paddingBottom: 8 },
  search: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    marginBottom: 12,
  },
  tiers: { flexDirection: "row", gap: 8 },
  tierBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  tierBtnActive: { borderColor: "#22c55e" },
  tierBtnText: { color: "#888", fontSize: 13, fontWeight: "600" },
  list: { padding: 16, paddingTop: 8 },
  emptyText: { color: "#888", fontSize: 15, textAlign: "center" },
  card: {
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
  addBtn: {
    backgroundColor: "#22c55e",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "300",
    lineHeight: 28,
  },
});
