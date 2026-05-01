import { C } from "@/constants/Colors";
import { StyleSheet } from "react-native";

export const s = StyleSheet.create({
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
    width: 60,
  },
  symbol: { fontSize: 22 },
  symbolDim: { opacity: 0.4 },
  label: { fontSize: 9, letterSpacing: 0.8, marginTop: 3, fontWeight: "700" },
  labelActive: { color: C.gold },
  labelDim: { color: "rgba(255,255,255,0.3)" },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.gold,
    marginTop: 3,
  },
});
