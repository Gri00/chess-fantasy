export async function sendPushNotification(pushToken, title, body, data = {}) {
  if (!pushToken) return;

  const message = {
    to: pushToken,
    sound: "default",
    title,
    body,
    data,
  };

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log("[Push] Sent:", result);
    return result;
  } catch (err) {
    console.error("[Push] Error:", err);
  }
}
