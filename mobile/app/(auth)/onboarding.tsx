import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { C } from "../../constants/Colors";
import { styles } from "../../styles/auth/onboarding.styles";

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
