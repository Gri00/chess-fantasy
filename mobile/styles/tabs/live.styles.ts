import { C } from "@/constants/Colors";
import { StyleSheet } from "react-native";

export const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.dark },

  header: { paddingHorizontal: 20, paddingBottom: 8 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
    marginTop: 8,
  },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.red },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },

  // Segmented control
  tabContainer: {
    flexDirection: "row",
    backgroundColor: C.dark3,
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: "#2a1060",
    shadowColor: C.accent,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  tabText: { color: C.white35, fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: "#fff", fontWeight: "700" },

  // Search
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.dark3,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.white8,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, color: "#fff", paddingVertical: 11, fontSize: 14 },
  searchClear: { color: C.white35, fontSize: 14, paddingLeft: 8 },

  list: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  center: { alignItems: "center", paddingTop: 80 },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyText: { color: C.white40, fontSize: 15, marginBottom: 6 },
  emptySub: { color: C.white35, fontSize: 12 },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: C.dark3,
    borderWidth: 1,
    borderColor: C.gold33,
  },
  retryText: { color: C.gold, fontWeight: "700" },

  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.gold33,
    overflow: "hidden",
  },
  // cardLiveDot: {
  //   position: "absolute",
  //   top: 14,
  //   right: 14,
  //   width: 8,
  //   height: 8,
  //   borderRadius: 4,
  //   backgroundColor: C.red,
  // },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  variantBadge: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  variantText: { fontSize: 12, fontWeight: "700" },
  cardArrow: { color: C.white35, fontSize: 20, marginRight: 1 }, //change marginRight if we want live dot back
  cardTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 4,
  },
  cardSub: { color: C.white40, fontSize: 13 },

  gameMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  titleBadge: {
    backgroundColor: C.gold18,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: C.gold55,
  },
  titleBadgeText: { color: C.gold, fontWeight: "800", fontSize: 11 },
  gameRating: { color: C.white40, fontSize: 12 },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: C.white10,
  },
  colorLabel: { color: C.white35, fontSize: 11, textTransform: "capitalize" },
  gameId: { color: C.white35, fontSize: 10, letterSpacing: 0.5 },
});
