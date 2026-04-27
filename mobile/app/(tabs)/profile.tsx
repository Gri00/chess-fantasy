import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../stores/useAuthStore";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {user?.username?.[0]?.toUpperCase()}
        </Text>
      </View>

      <Text style={styles.username}>{user?.username}</Text>
      <Text style={styles.displayName}>
        {user?.display_name || "Chess Fantasy player"}
      </Text>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Username</Text>
          <Text style={styles.infoValue}>{user?.username}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    alignItems: "center",
    paddingTop: 60,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: { fontSize: 32, color: "#fff", fontWeight: "700" },
  username: { fontSize: 24, color: "#fff", fontWeight: "700", marginBottom: 4 },
  displayName: { fontSize: 15, color: "#888", marginBottom: 32 },
  infoCard: {
    width: "90%",
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  infoLabel: { color: "#888", fontSize: 14 },
  infoValue: { color: "#fff", fontSize: 14, fontWeight: "500" },
  logoutBtn: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderWidth: 1,
    borderColor: "#ff4444",
  },
  logoutText: { color: "#ff4444", fontWeight: "600", fontSize: 16 },
});
