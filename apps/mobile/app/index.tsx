import { useEffect } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import { TASKFLOW_APP_NAME } from "@taskflow/shared";

import { getAuthToken } from "@/lib/auth-storage";
import { useTheme } from "@/lib/theme";

export default function IndexScreen() {
  const { colors } = useTheme();
  useEffect(() => {
    let isMounted = true;

    async function routeByAuthState() {
      const token = await getAuthToken();

      if (!isMounted) {
        return;
      }

      router.replace(token ? "/dashboard" : "/login");
    }

    void routeByAuthState();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {TASKFLOW_APP_NAME}
      </Text>
      <ActivityIndicator color={colors.primary} size="large" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    backgroundColor: "#f7f8fb",
    flex: 1,
    gap: 20,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: "#172033",
    fontSize: 34,
    fontWeight: "700",
  },
});
