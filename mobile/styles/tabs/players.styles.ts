import { C } from "@/constants/Colors";
import { StyleSheet } from "react-native";

export const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.dark },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 14,
    marginTop: 8,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.dark3,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.white8,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  searchIcon: { fontSize: 15, marginRight: 8 },
  searchInput: { flex: 1, color: "#fff", paddingVertical: 13, fontSize: 14 },

  tierList: { gap: 8, paddingRight: 4, marginBottom: 10 },
  tierBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.white10,
  },
  tierBtnText: { color: C.white35, fontSize: 12, fontWeight: "600" },

  countLabel: {
    color: C.white35,
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 4,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: { color: C.white40, fontSize: 15 },

  list: { paddingHorizontal: 20, paddingBottom: 100 },
  card: {
    backgroundColor: C.dark3,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.white6,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  rankBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rankNum: { fontSize: 12, fontWeight: "800" },

  cardInfo: { flex: 1 },
  playerName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 3,
  },
  playerSub: { color: C.white40, fontSize: 11 },

  tierPill: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignItems: "center",
  },
  tierPillText: { fontSize: 10, fontWeight: "700" },
});
