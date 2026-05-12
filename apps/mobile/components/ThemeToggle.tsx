import { Pressable, StyleSheet, Text } from "react-native";

import { useTheme } from "@/lib/theme";

type ThemeToggleProps = {
  compact?: boolean;
};

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { colors, isDark, toggleMode } = useTheme();

  return (
    <Pressable
      accessibilityLabel={isDark ? "Switch to light mode" : "Switch to dark mode"}
      accessibilityRole="button"
      onPress={toggleMode}
      style={({ pressed }) => [
        styles.button,
        compact ? styles.compact : null,
        {
          backgroundColor: pressed ? colors.primarySoftPressed : colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.icon, { color: colors.text }]}>
        {isDark ? "☀" : "☾"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  compact: {
    height: 40,
    width: 40,
  },
  icon: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 24,
  },
});
