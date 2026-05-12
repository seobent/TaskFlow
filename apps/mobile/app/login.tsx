import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, router } from "expo-router";

import { TaskFlowLogo } from "@/components/TaskFlowLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { login } from "@/lib/api";
import { useTheme } from "@/lib/theme";

export default function LoginScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin() {
    setError(null);
    setIsLoading(true);

    try {
      await login({ email, password });
      router.replace("/dashboard");
    } catch (caughtError) {
      setError(readErrorMessage(caughtError));
    } finally {
      setIsLoading(false);
    }
  }

  const formIsReady = email.trim().length > 0 && password.length > 0;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerText}>
                <Text style={[styles.eyebrow, { color: colors.primary }]}>
                  Welcome back
                </Text>
                <TaskFlowLogo style={styles.logo} />
              </View>
              <ThemeToggle />
            </View>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Sign in to review projects, issues, and team activity.
            </Text>
          </View>

          <View
            style={[
              styles.form,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.muted}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                textContentType="emailAddress"
                value={email}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Password</Text>
              <TextInput
                autoCapitalize="none"
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={colors.muted}
                secureTextEntry
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                textContentType="password"
                value={password}
              />
            </View>

            {error ? (
              <Text
                style={[
                  styles.error,
                  {
                    backgroundColor: colors.dangerBackground,
                    borderColor: colors.dangerBorder,
                    color: colors.danger,
                  },
                ]}
              >
                {error}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={!formIsReady || isLoading}
              onPress={handleLogin}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: colors.primary },
                (!formIsReady || isLoading) && styles.buttonDisabled,
                pressed && formIsReady && !isLoading
                  ? { backgroundColor: colors.primaryPressed }
                  : null,
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.textOnPrimary} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>
                  Log in
                </Text>
              )}
            </Pressable>
          </View>

          <Text style={[styles.switchText, { color: colors.muted }]}>
            New to TaskFlow?{" "}
            <Link
              href="/register"
              style={[styles.switchLink, { color: colors.mutedStrong }]}
            >
              Create an account
            </Link>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function readErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Unable to log in. Please try again.";
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#f7f8fb",
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    marginBottom: 28,
  },
  headerTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    color: "#2f9f89",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  logo: {
    marginTop: 8,
  },
  subtitle: {
    color: "#566176",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
  },
  form: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(23, 32, 51, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
    padding: 18,
  },
  field: {
    gap: 8,
  },
  label: {
    color: "#172033",
    fontSize: 14,
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(23, 32, 51, 0.16)",
    borderRadius: 8,
    borderWidth: 1,
    color: "#172033",
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  error: {
    backgroundColor: "#fff2f1",
    borderColor: "#f0b7b2",
    borderRadius: 8,
    borderWidth: 1,
    color: "#9a2d22",
    fontSize: 14,
    lineHeight: 20,
    padding: 12,
  },
  button: {
    alignItems: "center",
    backgroundColor: "#2f9f89",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 18,
  },
  buttonDisabled: {
    opacity: 0.58,
  },
  buttonPressed: {
    backgroundColor: "#257f6e",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  switchText: {
    color: "#566176",
    fontSize: 15,
    marginTop: 22,
    textAlign: "center",
  },
  switchLink: {
    color: "#2f7368",
    fontWeight: "700",
  },
});
