import { SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";
import { TASKFLOW_APP_NAME } from "@taskflow/shared";

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export default function App() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Capstone Workspace</Text>
        <Text style={styles.title}>{TASKFLOW_APP_NAME}</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f7f8fb",
    paddingHorizontal: 24,
    paddingVertical: 32
  },
  header: {
    borderBottomColor: "rgba(23, 32, 51, 0.12)",
    borderBottomWidth: 1,
    paddingBottom: 24
  },
  eyebrow: {
    color: "#2f9f89",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  title: {
    color: "#172033",
    fontSize: 40,
    fontWeight: "700",
    marginTop: 8
  },
  panel: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(23, 32, 51, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 24,
    padding: 18
  },
  panelLabel: {
    color: "rgba(23, 32, 51, 0.58)",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8
  },
  panelValue: {
    color: "#172033",
    fontSize: 15,
    lineHeight: 22
  },
  grid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18
  },
  tile: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(23, 32, 51, 0.1)",
    borderLeftColor: "#d48a2c",
    borderLeftWidth: 4,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    padding: 14
  },
  tileValue: {
    color: "#172033",
    fontSize: 24,
    fontWeight: "700"
  },
  tileLabel: {
    color: "rgba(23, 32, 51, 0.62)",
    fontSize: 13,
    marginTop: 4
  }
});
