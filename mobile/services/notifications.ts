import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { api } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("Push notifikacije rade samo na pravom uređaju");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Korisnik nije dao dozvolu za notifikacije");
    return null;
  }

  const token = (
    await Notifications.getExpoPushTokenAsync({
      projectId: "36b45c99-489d-42f7-9f4c-1a178afb654b",
    })
  ).data;

  // Sačuvaj token u bazi
  try {
    await api.patch("/auth/me", { push_token: token });
  } catch (err) {
    console.error("Greška pri čuvanju push tokena:", err);
  }

  return token;
}

export function useNotificationListeners() {
  Notifications.addNotificationReceivedListener((notification) => {
    console.log("Notifikacija primljena:", notification);
  });

  Notifications.addNotificationResponseReceivedListener((response) => {
    console.log("Korisnik kliknuo notifikaciju:", response);
  });
}
