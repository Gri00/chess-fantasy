import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { C } from "../constants/Colors";

export default function SplashLoader() {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <LinearGradient colors={["#1a0a3a", C.dark]} style={styles.container}>
      {/* Floating corner pieces */}
      <Text style={[styles.floatingPiece, { top: 180, left: 32 }]}>♖</Text>
      <Text style={[styles.floatingPiece, { top: 160, right: 32 }]}>♗</Text>
      <Text style={[styles.floatingPiece, { bottom: 220, left: 28 }]}>♘</Text>
      <Text style={[styles.floatingPiece, { bottom: 200, right: 28 }]}>♙</Text>

      {/* Logo box */}
      <View style={styles.logoBox}>
        <Text style={styles.logoIcon}>♔</Text>
      </View>

      <Text style={styles.title}>CHESS</Text>
      <Text style={styles.subtitle}>FANTASY</Text>

      <View style={styles.divider} />

      <Text style={styles.tagline}>Draft. Duel. Dominate.</Text>

      {/* Loading bar */}
      <View style={styles.loadingTrack}>
        <Animated.View style={[styles.loadingBar, { width: barWidth }]} />
      </View>
      <Text style={styles.loadingText}>LOADING...</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingPiece: {
    position: "absolute",
    fontSize: 26,
    color: C.gold,
    opacity: 0.18,
  },
  logoBox: {
    width: 100,
    height: 100,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: C.gold55,
    backgroundColor: C.gold18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  logoIcon: {
    fontSize: 52,
    color: C.gold,
  },
  title: {
    color: C.gold,
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: 6,
  },
  subtitle: {
    color: C.gold2,
    fontSize: 20,
    fontWeight: "400",
    letterSpacing: 14,
    fontStyle: "italic",
    marginTop: 2,
  },
  divider: {
    width: 60,
    height: 1,
    backgroundColor: C.gold,
    opacity: 0.6,
    marginVertical: 14,
  },
  tagline: {
    color: C.white40,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 60,
  },
  loadingTrack: {
    width: 160,
    height: 2,
    backgroundColor: C.white10,
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 40,
  },
  loadingBar: {
    height: "100%",
    backgroundColor: C.gold,
    borderRadius: 2,
  },
  loadingText: {
    color: C.white35,
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 10,
  },
});
