import { StyleSheet } from "react-native";
import { C } from "@/constants/Colors";

export const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.dark },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.white6,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
    marginTop: 4,
  },
  backArrow: { color: C.gold, fontSize: 20 },
  backLabel: { color: C.white40, fontSize: 14 },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 2,
  },
  headerSub: { color: C.white40, fontSize: 13 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.dark3,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.white8,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, color: "#fff", paddingVertical: 11, fontSize: 14 },
  searchClear: { color: C.white35, fontSize: 14, paddingLeft: 8 },

  list: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  center: { alignItems: "center", paddingTop: 80 },
  emptyText: { color: C.white40, fontSize: 15 },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: C.dark3,
    borderWidth: 1,
    borderColor: C.gold33,
  },
  retryText: { color: C.gold, fontWeight: "700" },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.dark3,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.white6,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },

  boardNum: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.dark2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  boardNumText: { color: C.white35, fontSize: 11, fontWeight: "700" },

  cardBody: { flex: 1, gap: 4 },
  playerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  colorDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1,
    flexShrink: 0,
  },
  whiteDot: { backgroundColor: "#fff", borderColor: C.white35 },
  blackDot: { backgroundColor: "#1a1a2a", borderColor: C.white35 },
  playerName: { flex: 1, color: "#fff", fontSize: 13, fontWeight: "600" },
  playerTitle: { color: C.gold, fontWeight: "800" },
  playerRating: { color: C.white35, fontSize: 11 },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  opening: { flex: 1, color: C.white35, fontSize: 10 },
  moveCount: { color: C.white35, fontSize: 10 },

  resultBox: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignItems: "center",
    minWidth: 54,
  },
  resultText: { fontSize: 11, fontWeight: "800" },
});
