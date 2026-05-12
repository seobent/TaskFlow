import { Stack } from "expo-router";
import { StatusBar } from "react-native";

import { ThemeProvider, useTheme } from "@/lib/theme";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ThemedStack />
    </ThemeProvider>
  );
}

function ThemedStack() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar
        backgroundColor={colors.background}
        barStyle={isDark ? "light-content" : "dark-content"}
      />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerShown: false,
        }}
      />
    </>
  );
}
