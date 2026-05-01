import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { s } from "../../styles/tabs/layout.styles";

function TabIcon({
  symbol,
  label,
  focused,
}: {
  symbol: string;
  label: string;
  focused: boolean;
}) {
  return (
    <View style={s.iconWrap}>
      <Text style={[s.symbol, !focused && s.symbolDim]}>{symbol}</Text>
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
        name="live"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon symbol="🔴" label="Live" focused={focused} />
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
