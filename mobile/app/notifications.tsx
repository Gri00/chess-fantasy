import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C } from "../constants/Colors";

const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    icon: "🏆",
    title: "League started",
    body: "Your league \"Kings\" is now active. Make your picks!",
    time: "2h ago",
    read: false,
  },
  {
    id: "2",
    icon: "♟",
    title: "Pick deadline approaching",
    body: "You have 24 hours left to finalise your team roster.",
    time: "5h ago",
    read: false,
  },
  {
    id: "3",
    icon: "⭐",
    title: "Magnus Carlsen scored",
    body: "Your player Magnus Carlsen earned 42 pts in today's game.",
    time: "1d ago",
    read: true,
  },
  {
    id: "4",
    icon: "🎯",
    title: "Rank up!",
    body: "You moved from #52 to #47 on the leaderboard.",
    time: "2d ago",
    read: true,
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Notifications</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {MOCK_NOTIFICATIONS.map((n) => (
          <View key={n.id} style={[s.card, !n.read && s.cardUnread]}>
            <View style={s.iconBox}>
              <Text style={s.icon}>{n.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={s.cardHeader}>
                <Text style={s.cardTitle}>{n.title}</Text>
                {!n.read && <View style={s.unreadDot} />}
              </View>
              <Text style={s.cardBody}>{n.body}</Text>
              <Text style={s.cardTime}>{n.time}</Text>
            </View>
          </View>
        ))}

        <Text style={s.endNote}>You're all caught up</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.dark },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.white6,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  backArrow: { color: C.gold, fontSize: 22 },
  title: { color: "#fff", fontSize: 17, fontWeight: "700" },

  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  card: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: C.dark3,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.white6,
  },
  cardUnread: { borderColor: C.gold33, backgroundColor: "rgba(212,175,55,0.05)" },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: C.dark2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  icon: { fontSize: 22 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  cardTitle: { color: "#fff", fontSize: 14, fontWeight: "700", flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.gold },
  cardBody: { color: C.white40, fontSize: 12, lineHeight: 18, marginBottom: 6 },
  cardTime: { color: C.white35, fontSize: 11 },

  endNote: { color: C.white35, fontSize: 12, textAlign: "center", marginTop: 20 },
});
