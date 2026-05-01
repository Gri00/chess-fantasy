import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../stores/useAuthStore";
import { C } from "../../constants/Colors";
import { s } from "../../styles/tabs/profile.styles";

const MOCK_ACHIEVEMENTS = [
  { icon: "🥇", name: "First Blood", desc: "First win", locked: false },
  { icon: "🏆", name: "Champion", desc: "Season win", locked: false },
  { icon: "♔", name: "Grand Master", desc: "5 seasons", locked: true },
];

const MOCK_BARS = [40, 55, 45, 70, 60, 85, 100];

const SETTINGS = [
  { icon: "💳", label: "Manage Subscription", sub: "Free tier" },
  { icon: "🔔", label: "Notifications", sub: "Live scores, Deadlines" },
  { icon: "🔒", label: "Privacy & Security", sub: "Two-factor disabled" },
  { icon: "❓", label: "Help & Support", sub: "" },
];

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const initials = (user?.display_name ?? user?.username ?? "?")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
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
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingBottom: insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero banner ── */}
      <LinearGradient
        colors={["#1a0a3a", "#0a1020"]}
        style={[s.hero, { paddingTop: insets.top + 16 }]}
      >
        <Text style={s.heroBgPiece}>♔</Text>
        <View style={s.heroRow}>
          <View>
            <LinearGradient colors={[C.accent, C.gold]} style={s.avatarBox}>
              <Text style={s.avatarText}>{initials}</Text>
            </LinearGradient>
          </View>
          <View style={s.heroInfo}>
            <Text style={s.heroName}>
              {user?.display_name ?? user?.username}
            </Text>
            <Text style={s.heroHandle}>
              @{user?.username} · Grand Master Tier
            </Text>
            <View style={s.heroBadges}>
              <View style={s.goldBadge}>
                <Text style={s.goldBadgeText}>⭐ Top Player</Text>
              </View>
              <View style={s.purpleBadge}>
                <Text style={s.purpleBadgeText}>TOP 1%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Season stats */}
        <View style={s.statsRow}>
          {[
            { label: "BEST RANK", val: "#12" },
            { label: "TOTAL PTS", val: "18.4K" },
            { label: "WIN RATE", val: "68%" },
          ].map((stat, i) => (
            <View key={i} style={[s.statCell, i < 2 && s.statCellBorder]}>
              <Text style={s.statVal}>{stat.val}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* ── Achievements ── */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Achievements</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {MOCK_ACHIEVEMENTS.map((a, i) => (
            <View
              key={i}
              style={[s.achieveCard, a.locked && s.achieveCardLocked]}
            >
              <Text style={[s.achieveIcon, a.locked && { opacity: 0.4 }]}>
                {a.icon}
              </Text>
              <Text style={[s.achieveName, a.locked && { color: C.white35 }]}>
                {a.name}
              </Text>
              <Text style={s.achieveDesc}>{a.locked ? "🔒" : a.desc}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* ── Weekly points chart ── */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Weekly Points</Text>
        <View style={s.chartCard}>
          <View style={s.chartBars}>
            {MOCK_BARS.map((h, i) => (
              <View key={i} style={s.barWrap}>
                {i === 6 ? (
                  <LinearGradient
                    colors={[C.gold2, C.gold]}
                    style={[s.bar, { height: `${h}%` }]}
                  />
                ) : (
                  <View
                    style={[
                      s.bar,
                      { height: `${h}%`, backgroundColor: C.accent + "66" },
                    ]}
                  />
                )}
              </View>
            ))}
          </View>
          <View style={s.chartLabels}>
            {["W1", "W2", "W3", "W4", "W5", "W6", "W7"].map((w, i) => (
              <Text
                key={i}
                style={[s.chartLabel, i === 6 && { color: C.gold }]}
              >
                {w}
              </Text>
            ))}
          </View>
        </View>
      </View>

      {/* ── Settings ── */}
      <View style={s.section}>
        {SETTINGS.map((item, i) => (
          <TouchableOpacity key={i} style={s.settingRow} activeOpacity={0.7}>
            <View style={s.settingIcon}>
              <Text style={{ fontSize: 16 }}>{item.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.settingLabel}>{item.label}</Text>
              {item.sub ? <Text style={s.settingSub}>{item.sub}</Text> : null}
            </View>
            <Text style={s.settingArrow}>›</Text>
          </TouchableOpacity>
        ))}

        {/* Sign out */}
        <TouchableOpacity
          style={s.signOutRow}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <View style={[s.settingIcon, { backgroundColor: C.red + "18" }]}>
            <Text style={{ fontSize: 16 }}>🚪</Text>
          </View>
          <Text style={s.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
