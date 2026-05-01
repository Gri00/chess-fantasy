import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { s } from "../styles/notifications.styles";

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
