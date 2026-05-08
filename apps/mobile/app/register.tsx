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
import { TASKFLOW_APP_NAME } from "@taskflow/shared";

import { register } from "@/lib/api";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleRegister() {
    setError(null);
    setIsLoading(true);

    try {
      await register({ name, email, password });
      router.replace("/dashboard");
    } catch (caughtError) {
      setError(readErrorMessage(caughtError));
    } finally {
      setIsLoading(false);
    }
  }

  const formIsReady =
    name.trim().length > 0 && email.trim().length > 0 && password.length >= 8;

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Create account</Text>
            <Text style={styles.title}>{TASKFLOW_APP_NAME}</Text>
            <Text style={styles.subtitle}>
              Set up your mobile access for projects and issues.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                autoCapitalize="words"
                autoComplete="name"
                onChangeText={setName}
                placeholder="Jane Cooper"
                placeholderTextColor="#8c95a8"
                style={styles.input}
                textContentType="name"
                value={name}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#8c95a8"
                style={styles.input}
                textContentType="emailAddress"
                value={email}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                autoCapitalize="none"
                onChangeText={setPassword}
                placeholder="At least 8 characters"
                placeholderTextColor="#8c95a8"
                secureTextEntry
                style={styles.input}
                textContentType="newPassword"
                value={password}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              accessibilityRole="button"
              disabled={!formIsReady || isLoading}
              onPress={handleRegister}
              style={({ pressed }) => [
                styles.button,
                (!formIsReady || isLoading) && styles.buttonDisabled,
                pressed && formIsReady && !isLoading ? styles.buttonPressed : null,
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Create account</Text>
              )}
            </Pressable>
          </View>

          <Text style={styles.switchText}>
            Already have an account?{" "}
            <Link href="/login" style={styles.switchLink}>
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
  eyebrow: {
    color: "#2f9f89",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    color: "#172033",
    fontSize: 40,
    fontWeight: "700",
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
