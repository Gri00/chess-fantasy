import { Tabs } from "expo-router";
import { Text } from "react-native";

function Icon({ symbol }: { symbol: string }) {
  return <Text style={{ fontSize: 20 }}>{symbol}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "#0f0f0f",
          borderTopColor: "#1a1a1a",
        },
        tabBarActiveTintColor: "#22c55e",
        tabBarInactiveTintColor: "#555",
        headerStyle: { backgroundColor: "#0f0f0f" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Icon symbol="🏠" />,
        }}
      />
      <Tabs.Screen
        name="leagues"
        options={{
          title: "Leagues",
          tabBarIcon: ({ color }) => <Icon symbol="🏆" />,
        }}
      />
      <Tabs.Screen
        name="players"
        options={{
          title: "Players",
          tabBarIcon: ({ color }) => <Icon symbol="♟" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <Icon symbol="👤" />,
        }}
      />
    </Tabs>
  );
}
