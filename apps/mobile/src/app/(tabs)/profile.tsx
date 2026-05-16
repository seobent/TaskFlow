import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import type { SafeUser } from "@taskflow/shared";

import {
  ErrorState,
  LoadingState,
  readErrorMessage,
} from "@/components/ScreenState";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getCurrentUser, logout } from "@/lib/api";
import { useTheme } from "@/lib/theme";

export default function ProfileScreen() {
  const { colors } = useTheme();
  const [user, setUser] = useState<SafeUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const loadProfile = useCallback(async () => {
    setError(null);

    try {
      setUser(await getCurrentUser());
    } catch (caughtError) {
      setError(readErrorMessage(caughtError, "Unable to load your profile."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

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
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.primary }]}>
            Account settings
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Review your account and app preferences.
          </Text>
        </View>

        {isLoading ? (
          <LoadingState label="Loading profile..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadProfile} />
        ) : user ? (
          <View style={styles.sections}>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Account
              </Text>
              <ProfileRow label="Name" value={user.name} />
              <ProfileRow label="Email" value={user.email} />
              <ProfileRow label="Role" value={user.role} />
            </View>

            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Appearance
              </Text>
              <View style={styles.themeRow}>
                <Text style={[styles.rowLabel, { color: colors.muted }]}>
                  Theme
                </Text>
                <ThemeToggle compact />
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={isLoggingOut}
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.logoutButton,
                {
                  backgroundColor: pressed
                    ? colors.primaryPressed
                    : colors.primary,
                },
                isLoggingOut ? styles.buttonDisabled : null,
              ]}
            >
              {isLoggingOut ? (
                <ActivityIndicator color={colors.textOnPrimary} />
              ) : (
                <Text
                  style={[styles.logoutText, { color: colors.textOnPrimary }]}
                >
                  Logout
                </Text>
              )}
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, { borderTopColor: colors.border }]}>
      <Text style={[styles.rowLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#f7f8fb",
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 28,
  },
  header: {
    borderBottomColor: "rgba(23, 32, 51, 0.12)",
    borderBottomWidth: 1,
    gap: 8,
    paddingBottom: 20,
  },
  title: {
    color: "#172033",
    fontSize: 30,
    fontWeight: "700",
  },
  subtitle: {
    color: "#566176",
    fontSize: 15,
    lineHeight: 22,
  },
  sections: {
    gap: 14,
    marginTop: 20,
  },
  card: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(23, 32, 51, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  cardTitle: {
    color: "#172033",
    fontSize: 18,
    fontWeight: "700",
  },
  row: {
    borderTopColor: "rgba(23, 32, 51, 0.12)",
    borderTopWidth: 1,
    gap: 4,
    marginTop: 14,
    paddingTop: 14,
  },
  rowLabel: {
    color: "#566176",
    fontSize: 13,
    fontWeight: "700",
  },
  rowValue: {
    color: "#172033",
    fontSize: 16,
    fontWeight: "600",
  },
  themeRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  logoutButton: {
    alignItems: "center",
    backgroundColor: "#2f9f89",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 16,
  },
  logoutText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.58,
  },
});
