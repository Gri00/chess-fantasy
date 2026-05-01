import { C } from "@/constants/Colors";
import { StyleSheet } from "react-native";

export const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.dark },
  hero: {
    padding: 24,
    paddingBottom: 0,
    overflow: "hidden",
    position: "relative",
  },
  heroBgPiece: {
    position: "absolute",
    right: -20,
    top: -20,
    fontSize: 160,
    color: C.gold,
    opacity: 0.04,
  },
  heroRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
    marginBottom: 20,
  },
  avatarBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 26, fontWeight: "800" },
  heroInfo: { flex: 1 },
  heroName: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 2 },
  heroHandle: { color: C.gold, fontSize: 12, marginBottom: 8 },
  heroBadges: { flexDirection: "row", gap: 8 },
  goldBadge: {
    backgroundColor: C.gold18,
    borderWidth: 1,
    borderColor: C.gold55,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  goldBadgeText: { color: C.gold, fontSize: 10, fontWeight: "700" },
  purpleBadge: {
    backgroundColor: C.accent33,
    borderWidth: 1,
    borderColor: C.accent2 + "55",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  purpleBadgeText: { color: C.accent2, fontSize: 10, fontWeight: "700" },

  statsRow: {
    flexDirection: "row",
    backgroundColor: C.white4,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.white6,
    marginBottom: 24,
  },
  statCell: { flex: 1, alignItems: "center", paddingVertical: 14 },
  statCellBorder: { borderRightWidth: 1, borderRightColor: C.white6 },
  statVal: { color: "#fff", fontSize: 16, fontWeight: "700" },
  statLabel: {
    color: C.white35,
    fontSize: 9,
    letterSpacing: 0.5,
    marginTop: 2,
  },

  // Section
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },

  // Achievements
  achieveCard: {
    width: 80,
    backgroundColor: C.gold18,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.gold55,
    marginRight: 10,
  },
  achieveCardLocked: { backgroundColor: C.white4, borderColor: C.white6 },
  achieveIcon: { fontSize: 26, marginBottom: 6 },
  achieveName: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  achieveDesc: { color: C.white35, fontSize: 9, marginTop: 2 },

  // Chart
  chartCard: {
    backgroundColor: C.dark3,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.white6,
  },
  chartBars: {
    flexDirection: "row",
    height: 64,
    alignItems: "flex-end",
    gap: 6,
  },
  barWrap: { flex: 1, height: "100%", justifyContent: "flex-end" },
  bar: { width: "100%", borderRadius: 4 },
  chartLabels: { flexDirection: "row", marginTop: 8 },
  chartLabel: { flex: 1, textAlign: "center", color: C.white35, fontSize: 10 },

  // Settings
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.white4,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.dark3,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: { color: "#fff", fontSize: 14 },
  settingSub: { color: C.white35, fontSize: 11, marginTop: 1 },
  settingArrow: { color: C.white35, fontSize: 20 },

  signOutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  signOutText: { color: C.red, fontSize: 14, fontWeight: "600" },
});
