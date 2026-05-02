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
import { styles } from "../../styles/auth/login.styles";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#1a0a3a", C.dark]} style={styles.gradient}>
      {/* Floating corner pieces */}
      <Text style={[styles.floatingPiece, { top: 120, left: 24 }]}>♖</Text>
      <Text style={[styles.floatingPiece, { top: 100, right: 24 }]}>♗</Text>
      <Text style={[styles.floatingPiece, { bottom: 140, right: 20 }]}>♘</Text>

      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
      >
          {/* Logo */}
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>♔</Text>
          </View>
          <Text style={styles.title}>CHESS</Text>
          <Text style={styles.titleSub}>FANTASY</Text>
          <View style={styles.divider} />
          <Text style={styles.subtitle}>Sign in to your account</Text>

          {/* Form */}
          <View style={styles.form}>
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
                placeholder="••••••••"
                placeholderTextColor={C.white35}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              onPress={handleLogin}
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
                  <Text style={styles.btnText}>SIGN IN</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Link href="/(auth)/register" asChild>
            <TouchableOpacity style={styles.linkBtn}>
              <Text style={styles.linkText}>
                Don't have an account?{" "}
                <Text style={styles.linkBold}>Sign up</Text>
              </Text>
            </TouchableOpacity>
          </Link>
      </ScrollView>
    </LinearGradient>
  );
}
