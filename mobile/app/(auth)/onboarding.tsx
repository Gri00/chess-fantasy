import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { C } from "../../constants/Colors";

const { height } = Dimensions.get("window");

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* ── Hero image ── */}
      <View style={styles.hero}>
        <Image
          source={require("../../assets/images/chess-hero.jpg")}
          style={styles.heroImage}
          resizeMode="cover"
        />
        {/* Purple/gold color grade overlay */}
        <LinearGradient
          colors={[
            "rgba(123,63,228,0.55)",
            "rgba(90,30,180,0.3)",
            "rgba(212,175,55,0.15)",
            C.dark,
          ]}
          locations={[0, 0.35, 0.65, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Stat cards */}
        <View style={[styles.statCard, styles.statLeft]}>
          <Text style={[styles.statLabel, { color: C.gold2 }]}>
            TOTAL PLAYERS
          </Text>
          <Text style={styles.statValue}>2.4M</Text>
        </View>
        <View style={[styles.statCard, styles.statRight]}>
          <Text style={[styles.statLabel, { color: C.accent2 }]}>
            TOTAL LEAGUES
          </Text>
          <Text style={styles.statValue}>50K+</Text>
        </View>
      </View>

      {/* ── Content ── */}
      <View style={styles.content}>
        <View>
          <Text style={styles.heading}>
            Build Your <Text style={{ color: C.gold }}>Chess</Text> Dynasty
          </Text>
          <Text style={styles.description}>
            Draft grandmasters, track live tournament moves, and compete in
            fantasy leagues where every sacrifice matters.
          </Text>

          {[
            {
              icon: "♟",
              title: "Draft Real GMs",
              desc: "Pick from 500+ active grandmasters by ELO, style & form",
            },
            {
              icon: "⚡",
              title: "Live Scoring",
              desc: "Points update move-by-move in real tournaments",
            },
            {
              icon: "🏆",
              title: "Be a winner",
              desc: "Create leagues and climb the board",
            },
          ].map((f, i) => (
            <View key={i} style={styles.feature}>
              <View style={styles.featureIconBox}>
                <Text style={styles.featureIconText}>{f.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/register")}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[C.gold, C.gold2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btn}
            >
              <Text style={styles.btnText}>START YOUR REIGN</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(auth)/login")}
            style={styles.signInLink}
          >
            <Text style={styles.signInText}>
              Already have an account?{" "}
              <Text style={{ color: C.gold }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.dark },

  // ── Hero ──
  hero: {
    height: height * 0.44,
    overflow: "hidden",
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  statCard: {
    position: "absolute",
    top: 70,
    backgroundColor: "rgba(12,12,26,0.82)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    zIndex: 10,
  },
  statLeft: { left: 16, borderColor: C.gold55 },
  statRight: { right: 16, borderColor: C.accent33 },
  statLabel: {
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: "700",
    marginBottom: 2,
  },
  statValue: { color: "#fff", fontSize: 22, fontWeight: "700" },

  // ── Content ──
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
    justifyContent: "space-between",
    backgroundColor: C.dark,
  },
  heading: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 34,
    marginBottom: 8,
  },
  description: {
    color: C.white50,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 30,
  },
  feature: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 18,
    alignItems: "center",
  },
  featureIconBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "rgba(212,175,55,0.1)",
    borderWidth: 1,
    borderColor: C.gold33,
    alignItems: "center",
    justifyContent: "center",
  },
  featureIconText: { fontSize: 30 },
  featureTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 3,
  },
  featureDesc: { color: C.white40, fontSize: 13 },

  // ── CTA ──
  btn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  btnText: { color: C.dark, fontSize: 15, fontWeight: "800", letterSpacing: 2 },
  signInLink: { marginTop: 16, alignItems: "center" },
  signInText: { color: C.white40, fontSize: 13 },
});
