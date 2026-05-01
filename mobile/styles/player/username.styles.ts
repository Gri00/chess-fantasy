import { C } from "@/constants/Colors";
import { StyleSheet } from "react-native";

export const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.dark },
  center: {
    flex: 1,
    backgroundColor: C.dark,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: { color: C.white40, fontSize: 16, marginBottom: 20 },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: C.dark3,
    borderWidth: 1,
    borderColor: C.gold33,
  },
  backBtnText: { color: C.gold, fontWeight: "700" },

  hero: { padding: 24, paddingBottom: 28, overflow: "hidden" },

  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 24,
  },
  backArrow: { color: C.gold, fontSize: 20 },
  backLabel: { color: C.white40, fontSize: 14 },

  avatarWrap: { alignSelf: "center", marginBottom: 16, position: "relative" },
  avatarBox: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { fontSize: 32, fontWeight: "800", color: "#fff" },
  onlineDot: {
    position: "absolute",
    right: -3,
    bottom: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.green,
    borderWidth: 2,
    borderColor: C.dark,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 4,
  },
  titleBadge: {
    backgroundColor: C.gold18,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: C.gold55,
  },
  titleBadgeText: { color: C.gold, fontWeight: "800", fontSize: 13 },
  name: { color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "center" },
  handle: {
    color: C.white40,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 14,
  },

  tierBadge: {
    alignSelf: "center",
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  tierBadgeText: { fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },

  statsRow: {
    flexDirection: "row",
    backgroundColor: C.dark2,
    borderBottomWidth: 1,
    borderBottomColor: C.white6,
  },
  statCell: { flex: 1, alignItems: "center", paddingVertical: 16 },
  statCellBorder: { borderRightWidth: 1, borderRightColor: C.white6 },
  statVal: { color: "#fff", fontSize: 15, fontWeight: "700" },
  statLabel: {
    color: C.white35,
    fontSize: 9,
    letterSpacing: 0.5,
    marginTop: 3,
  },

  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  ratingsNote: { color: C.white35, fontSize: 10, marginTop: 8 },

  infoCard: {
    backgroundColor: C.dark3,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.white6,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: C.white4 },
  infoLabel: { color: C.white40, fontSize: 13 },
  infoVal: { color: "#fff", fontSize: 13, fontWeight: "600" },
  ratingVal: { fontSize: 16, fontWeight: "800", color: C.gold },
});
