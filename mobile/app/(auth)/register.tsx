import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../../stores/useAuthStore";
import { C } from "../../constants/Colors";
import { styles } from "../../styles/auth/register.styles";

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
    <LinearGradient colors={["#1a0a3a", C.dark]} style={styles.gradient}>
      {/* Floating corner pieces */}
      <Text style={[styles.floatingPiece, { top: 100, left: 24 }]}>♕</Text>
      <Text style={[styles.floatingPiece, { top: 120, right: 24 }]}>♙</Text>
      <Text style={[styles.floatingPiece, { bottom: 140, left: 20 }]}>♗</Text>

      <ScrollView
        automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.inner}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>♔</Text>
          </View>
          <Text style={styles.title}>CHESS</Text>
          <Text style={styles.titleSub}>FANTASY</Text>
          <View style={styles.divider} />
          <Text style={styles.subtitle}>Create your account</Text>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>USERNAME</Text>
              <TextInput
                style={styles.input}
                placeholder="GrandMaster99"
                placeholderTextColor={C.white35}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>EMAIL</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={C.white35}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="min. 6 characters"
                placeholderTextColor={C.white35}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
              style={styles.btnWrapper}
            >
              <LinearGradient
                colors={[C.gold, C.gold2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.btn, loading && styles.btnDisabled]}
              >
                {loading ? (
                  <ActivityIndicator color={C.dark} />
                ) : (
                  <Text style={styles.btnText}>START YOUR REIGN</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.linkBtn}>
              <Text style={styles.linkText}>
                Already have an account?{" "}
                <Text style={styles.linkBold}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </Link>
      </ScrollView>
    </LinearGradient>
  );
}
