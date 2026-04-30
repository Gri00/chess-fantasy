import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { C } from "../../constants/Colors";

function TabIcon({
  symbol,
  label,
  focused,
  live,
}: {
  symbol: string;
  label: string;
  focused: boolean;
  live?: boolean;
}) {
  return (
    <View style={s.iconWrap}>
      <View style={s.iconRow}>
        <Text style={[s.symbol, !focused && s.symbolDim]}>{symbol}</Text>
        {live && <View style={s.liveDot} />}
      </View>
      <Text style={[s.label, focused ? s.labelActive : s.labelDim]}>
        {label}
      </Text>
      {focused && <View style={s.activeDot} />}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "rgba(12,12,26,0.98)",
          borderTopWidth: 1,
          borderTopColor: "rgba(212,175,55,0.15)",
          height: 72,
          paddingBottom: 0,
          paddingTop: 0,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon symbol="🏠" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="players"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon symbol="♟" label="Players" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="leagues"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon symbol="🏆" label="League" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon symbol="👤" label="Profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const s = StyleSheet.create({
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
    width: 60,
  },
  iconRow: { flexDirection: "row", alignItems: "center" },
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
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.red,
    marginLeft: 3,
    marginTop: -8,
  },
});
