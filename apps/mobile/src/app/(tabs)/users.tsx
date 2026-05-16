import { useCallback, useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import type { SafeUser } from "@taskflow/shared";

import {
  EmptyState,
  ErrorState,
  LoadingState,
  readErrorMessage,
} from "@/components/ScreenState";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getAdminUsers } from "@/lib/api";
import { useTheme } from "@/lib/theme";

export default function UsersScreen() {
  const { colors } = useTheme();
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    setError(null);

    try {
      setUsers(await getAdminUsers());
    } catch (caughtError) {
      setError(readErrorMessage(caughtError, "Unable to load users."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useFocusEffect(
    useCallback(() => {
      void loadUsers();
    }, [loadUsers]),
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.primary }]}>
              User directory
            </Text>
            <ThemeToggle compact />
          </View>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Admin view of TaskFlow accounts.
          </Text>
        </View>

        {isLoading ? (
          <LoadingState label="Loading users..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadUsers} />
        ) : users.length > 0 ? (
          <View style={styles.list}>
            {users.map((user) => (
              <View
                key={user.id}
                style={[
                  styles.userCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.userHeader}>
                  <View style={styles.userText}>
                    <Text style={[styles.userName, { color: colors.text }]}>
                      {user.name}
                    </Text>
                    <Text style={[styles.userEmail, { color: colors.muted }]}>
                      {user.email}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.roleBadge,
                      {
                        backgroundColor: colors.primarySoft,
                        color: colors.mutedStrong,
                      },
                    ]}
                  >
                    {user.role}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState
            actionLabel="Refresh"
            message="No users were returned by the API."
            onAction={loadUsers}
            title="No users found"
          />
        )}
      </ScrollView>
    </SafeAreaView>
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
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
  },
  title: {
    color: "#172033",
    flex: 1,
    fontSize: 30,
    fontWeight: "700",
  },
  subtitle: {
    color: "#566176",
    fontSize: 15,
    lineHeight: 22,
  },
  list: {
    gap: 12,
    marginTop: 20,
  },
  userCard: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(23, 32, 51, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  userHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  userText: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    color: "#172033",
    fontSize: 17,
    fontWeight: "700",
  },
  userEmail: {
    color: "#566176",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 3,
  },
  roleBadge: {
    borderRadius: 8,
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
});
