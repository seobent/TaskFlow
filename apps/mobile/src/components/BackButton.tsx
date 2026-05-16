import { Platform, Pressable, StyleSheet, Text } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useTheme } from "@/lib/theme";

type BackButtonProps = {
  onPress: () => void;
};

const isIOS = Platform.OS === "ios";

export function BackButton({ onPress }: BackButtonProps) {
  const { colors } = useTheme();
  const tintColor = isIOS ? "#2f7368" : colors.mutedStrong;

  return (
    <Pressable
      accessibilityLabel="Go back"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: pressed
            ? colors.primarySoftPressed
            : "transparent",
          borderColor: colors.border,
        },
      ]}
    >
      <Svg height={20} viewBox="0 0 24 24" width={20}>
        <Path
          d="m15 18-6-6 6-6"
          fill="none"
          stroke={tintColor}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.4}
        />
      </Svg>
      <Text style={[styles.label, { color: tintColor }]}>Back</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 2,
    justifyContent: "center",
    minHeight: 44,
    paddingLeft: 8,
    paddingRight: 14,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
  },
});
