import { useEffect } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import { TASKFLOW_APP_NAME } from "@taskflow/shared";

import { getAuthToken } from "@/lib/auth-storage";

export default function IndexScreen() {
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
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>{TASKFLOW_APP_NAME}</Text>
      <ActivityIndicator color="#2f9f89" size="large" />
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
