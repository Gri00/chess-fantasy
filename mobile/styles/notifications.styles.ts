import { StyleSheet } from "react-native";
import { C } from "@/constants/Colors";

export const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.dark },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.white6,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  backArrow: { color: C.gold, fontSize: 22 },
  title: { color: "#fff", fontSize: 17, fontWeight: "700" },

  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  card: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: C.dark3,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.white6,
  },
  cardUnread: { borderColor: C.gold33, backgroundColor: "rgba(212,175,55,0.05)" },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: C.dark2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  icon: { fontSize: 22 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  cardTitle: { color: "#fff", fontSize: 14, fontWeight: "700", flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.gold },
  cardBody: { color: C.white40, fontSize: 12, lineHeight: 18, marginBottom: 6 },
  cardTime: { color: C.white35, fontSize: 11 },

  endNote: { color: C.white35, fontSize: 12, textAlign: "center", marginTop: 20 },
});
