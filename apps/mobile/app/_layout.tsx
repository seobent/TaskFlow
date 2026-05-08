import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: "#f7f8fb" },
        headerShown: false,
      }}
    />
  );
}
