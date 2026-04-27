import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Link } from "expo-router";
import { useAuthStore } from "../../stores/useAuthStore";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();

  const handleRegister = async () => {
    if (!email || !password || !username) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), password, username.trim());
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.inner}
      keyboardShouldPersistTaps="handled"
      bounces={false}
    >
      <Text style={styles.logo}>♟ ChessFantasy</Text>
      <Text style={styles.subtitle}>Create a new account</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#666"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password (min. 6 characters)"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign up</Text>
        )}
      </TouchableOpacity>

      <Link href="/(auth)/login" asChild>
        <TouchableOpacity style={styles.linkBtn}>
          <Text style={styles.linkText}>
            Already have an account?{" "}
            <Text style={styles.linkBold}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  inner: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 60,
    paddingBottom: 180,
  },
  logo: {
    fontSize: 36,
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginBottom: 40,
  },
  input: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  button: {
    backgroundColor: "#22c55e",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  linkBtn: { marginTop: 20, alignItems: "center" },
  linkText: { color: "#888", fontSize: 14 },
  linkBold: { color: "#22c55e", fontWeight: "600" },
});
