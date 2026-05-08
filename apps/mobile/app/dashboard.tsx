import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeUser, TASKFLOW_APP_NAME } from "@taskflow/shared";

import { getCurrentUser, logout } from "@/lib/api";

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export default function DashboardScreen() {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();

        if (isMounted) {
          setUser(currentUser);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(readErrorMessage(caughtError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      router.replace("/login");
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Mobile dashboard</Text>
            <Text style={styles.title}>{TASKFLOW_APP_NAME}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={isLoggingOut}
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              isLoggingOut && styles.buttonDisabled,
              pressed && !isLoggingOut ? styles.logoutButtonPressed : null,
            ]}
          >
            {isLoggingOut ? (
              <ActivityIndicator color="#2f7368" />
            ) : (
              <Text style={styles.logoutText}>Logout</Text>
            )}
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.statusPanel}>
            <ActivityIndicator color="#2f9f89" size="large" />
            <Text style={styles.statusText}>Loading your workspace...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorPanel}>
            <Text style={styles.errorTitle}>Could not load dashboard</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={handleLogout}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Return to login</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.panel}>
              <Text style={styles.panelLabel}>Signed in as</Text>
              <Text style={styles.panelValue}>{user?.name}</Text>
              <Text style={styles.panelMeta}>{user?.email}</Text>
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelLabel}>API URL</Text>
              <Text style={styles.panelValue}>{apiUrl}</Text>
            </View>

            <View style={styles.grid}>
              {["Projects", "Issues", "Teams"].map((item) => (
                <View key={item} style={styles.tile}>
                  <Text style={styles.tileValue}>0</Text>
                  <Text style={styles.tileLabel}>{item}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function readErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Unable to load your dashboard. Please log in again.";
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#f7f8fb",
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: "flex-start",
    borderBottomColor: "rgba(23, 32, 51, 0.12)",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
    paddingBottom: 24,
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
    fontSize: 36,
    fontWeight: "700",
    marginTop: 8,
  },
  logoutButton: {
    alignItems: "center",
    backgroundColor: "#e8f5f2",
    borderColor: "rgba(47, 159, 137, 0.28)",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 92,
    paddingHorizontal: 14,
  },
  logoutButtonPressed: {
    backgroundColor: "#d7eee9",
  },
  logoutText: {
    color: "#2f7368",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.58,
  },
  panel: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(23, 32, 51, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 24,
    padding: 18,
  },
  panelLabel: {
    color: "rgba(23, 32, 51, 0.58)",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  panelValue: {
    color: "#172033",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 25,
  },
  panelMeta: {
    color: "#566176",
    fontSize: 15,
    marginTop: 6,
  },
  grid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  tile: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(23, 32, 51, 0.1)",
    borderLeftColor: "#d48a2c",
    borderLeftWidth: 4,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 86,
    padding: 14,
  },
  tileValue: {
    color: "#172033",
    fontSize: 24,
    fontWeight: "700",
  },
  tileLabel: {
    color: "rgba(23, 32, 51, 0.62)",
    fontSize: 13,
    marginTop: 4,
  },
  statusPanel: {
    alignItems: "center",
    gap: 14,
    marginTop: 80,
  },
  statusText: {
    color: "#566176",
    fontSize: 16,
  },
  errorPanel: {
    backgroundColor: "#fff2f1",
    borderColor: "#f0b7b2",
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    marginTop: 24,
    padding: 18,
  },
  errorTitle: {
    color: "#7d251c",
    fontSize: 17,
    fontWeight: "700",
  },
  errorText: {
    color: "#9a2d22",
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    alignItems: "center",
    backgroundColor: "#2f9f89",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
