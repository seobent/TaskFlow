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
import { Link } from "expo-router";

import { TaskFlowLogo } from "@/components/TaskFlowLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { register } from "@/lib/api";
import { useTheme } from "@/lib/theme";

const REGISTRATION_SUCCESS_MESSAGE =
  "Your account has been created successfully. An Admin or Manager must assign you to a project before you can access project tasks.";

export default function RegisterScreen() {
  const { colors } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleRegister() {
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      await register({ name, email, password });
      setName("");
      setEmail("");
      setPassword("");
      setSuccessMessage(REGISTRATION_SUCCESS_MESSAGE);
    } catch (caughtError) {
      setError(readErrorMessage(caughtError));
    } finally {
      setIsLoading(false);
    }
  }

  const formIsReady =
    name.trim().length > 0 && email.trim().length > 0 && password.length >= 8;

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
                  Create account
                </Text>
                <TaskFlowLogo style={styles.logo} />
              </View>
              <ThemeToggle />
            </View>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Set up your mobile access for projects and issues.
            </Text>
          </View>

          <View
            style={[
              styles.form,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Name</Text>
              <TextInput
                autoCapitalize="words"
                autoComplete="name"
                onChangeText={setName}
                placeholder="Jane Cooper"
                placeholderTextColor={colors.muted}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                textContentType="name"
                value={name}
              />
            </View>

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
                placeholder="At least 8 characters"
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
                textContentType="newPassword"
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

            {successMessage ? (
              <Text
                accessibilityLiveRegion="polite"
                style={[
                  styles.success,
                  {
                    backgroundColor: colors.primarySoft,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              >
                {successMessage}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={!formIsReady || isLoading}
              onPress={handleRegister}
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
                  Create account
                </Text>
              )}
            </Pressable>
          </View>

          <Text style={[styles.switchText, { color: colors.muted }]}>
            Already have an account?{" "}
            <Link
              href="/login"
              style={[styles.switchLink, { color: colors.mutedStrong }]}
            >
              Log in
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
    : "Unable to register. Please try again.";
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
  success: {
    backgroundColor: "#ebfaf4",
    borderColor: "#b8e6d5",
    borderRadius: 8,
    borderWidth: 1,
    color: "#172033",
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
