import { C } from "@/constants/Colors";
import { StyleSheet } from "react-native";

export const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.dark },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 20, paddingBottom: 16 },

  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    marginTop: 8,
  },

  empty: { alignItems: "center", paddingTop: 80 },
  emptyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySub: {
    color: C.white40,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },

  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.gold33,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  leagueName: { color: "#fff", fontSize: 16, fontWeight: "700", flex: 1 },
  statusPill: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusText: { fontSize: 11, fontWeight: "600" },
  teamNameText: { color: C.white40, fontSize: 13, marginBottom: 8 },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  codeLabel: { color: C.white35, fontSize: 10, letterSpacing: 1 },
  codeValue: {
    color: C.gold,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  cardArrow: { color: C.gold, fontSize: 12, marginTop: 4 },

  actions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    backgroundColor: C.dark,
    borderTopWidth: 1,
    borderTopColor: C.white6,
  },
  joinBtn: {
    flex: 1,
    backgroundColor: C.dark3,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.gold55,
  },
  joinBtnText: { color: C.gold, fontWeight: "700", fontSize: 14 },
  createBtn: { borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  createBtnText: {
    color: C.dark,
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 1,
  },

  // Modal / dialog
  modalBackdrop: {
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  dialog: {
    position: "absolute",
    left: 24,
    right: 24,
    top: "30%",
    backgroundColor: C.dark2,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: C.gold33,
  },
  dialogTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
  },
  inputWrapper: { marginBottom: 12 },
  input: {
    backgroundColor: C.dark3,
    color: "#fff",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 15,
    fontSize: 15,
    borderWidth: 1,
    borderColor: C.gold33,
  },
  sheetBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 4,
  },
  sheetBtnText: {
    color: C.dark,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 2,
  },
  cancelBtn: { marginTop: 12, alignItems: "center", paddingVertical: 10 },
  cancelText: { color: C.white40, fontSize: 14 },
});
