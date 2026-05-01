import { C } from "@/constants/Colors";
import { StyleSheet, Dimensions } from "react-native";
const { height } = Dimensions.get("window");

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.dark },

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
