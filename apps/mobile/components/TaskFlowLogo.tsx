import { TASKFLOW_APP_NAME } from "@taskflow/shared";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, Text, View } from "react-native";

type TaskFlowLogoProps = {
  showText?: boolean;
  size?: "small" | "large";
  style?: StyleProp<ViewStyle>;
};

export function TaskFlowLogo({
  showText = true,
  size = "large",
  style,
}: TaskFlowLogoProps) {
  const isLarge = size === "large";
  const markSize = isLarge ? 82 : 48;
  const barHeight = isLarge ? 22 : 13;
  const barWidth = isLarge ? 64 : 38;
  const inset = isLarge ? 6 : 4;
  const borderWidth = isLarge ? 5 : 3;

  return (
    <View
      accessibilityLabel={`${TASKFLOW_APP_NAME} logo`}
      accessibilityRole="image"
      accessible
      style={[styles.root, style]}
    >
      <View style={[styles.mark, { height: markSize, width: markSize }]}>
        <View
          style={[
            styles.bar,
            styles.mintBar,
            {
              borderRadius: barHeight / 2,
              borderWidth,
              height: barHeight,
              left: inset,
              top: isLarge ? 4 : 2,
              width: barWidth,
            },
          ]}
        />
        <View
          style={[
            styles.bar,
            styles.mintBar,
            {
              borderRadius: barHeight / 2,
              borderWidth,
              height: barHeight,
              left: inset,
              top: isLarge ? 31 : 18,
              width: barWidth,
            },
          ]}
        />
        <View
          style={[
            styles.bar,
            styles.pinkBar,
            {
              borderRadius: barHeight / 2,
              borderWidth,
              height: barHeight,
              left: inset,
              top: isLarge ? 58 : 34,
              width: barWidth,
            },
          ]}
        />
        <View
          style={[
            styles.arrowStemBorder,
            {
              height: isLarge ? 17 : 10,
              left: isLarge ? 25 : 14,
              top: isLarge ? 32 : 19,
              width: isLarge ? 72 : 43,
            },
          ]}
        />
        <View
          style={[
            styles.arrowStem,
            {
              height: isLarge ? 10 : 6,
              left: isLarge ? 29 : 16,
              top: isLarge ? 35 : 21,
              width: isLarge ? 64 : 38,
            },
          ]}
        />
        <View
          style={[
            styles.arrowHeadBorder,
            {
              borderBottomWidth: isLarge ? 16 : 9,
              borderLeftWidth: isLarge ? 28 : 17,
              borderTopWidth: isLarge ? 16 : 9,
              left: isLarge ? 61 : 35,
              top: isLarge ? 18 : 10,
            },
          ]}
        />
        <View
          style={[
            styles.arrowHead,
            {
              borderBottomWidth: isLarge ? 11 : 7,
              borderLeftWidth: isLarge ? 21 : 13,
              borderTopWidth: isLarge ? 11 : 7,
              left: isLarge ? 64 : 37,
              top: isLarge ? 23 : 12,
            },
          ]}
        />
      </View>
      {showText ? (
        <Text style={[styles.wordmark, { fontSize: isLarge ? 36 : 23 }]}>
          {TASKFLOW_APP_NAME}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    flexDirection: "row",
  },
  mark: {
    position: "relative",
  },
  bar: {
    backgroundColor: "rgba(127, 220, 212, 0.74)",
    borderColor: "#1fa79a",
    position: "absolute",
  },
  mintBar: {
    borderColor: "#1fa79a",
  },
  pinkBar: {
    backgroundColor: "rgba(239, 135, 195, 0.78)",
    borderColor: "#cf2a80",
  },
  arrowStemBorder: {
    backgroundColor: "#ffffff",
    borderRadius: 999,
    position: "absolute",
    transform: [{ rotate: "-54deg" }],
  },
  arrowStem: {
    backgroundColor: "#f8a51f",
    borderRadius: 999,
    position: "absolute",
    transform: [{ rotate: "-54deg" }],
  },
  arrowHeadBorder: {
    borderBottomColor: "transparent",
    borderLeftColor: "#ffffff",
    borderTopColor: "transparent",
    height: 0,
    position: "absolute",
    transform: [{ rotate: "-54deg" }],
    width: 0,
  },
  arrowHead: {
    borderBottomColor: "transparent",
    borderLeftColor: "#ff971b",
    borderTopColor: "transparent",
    height: 0,
    position: "absolute",
    transform: [{ rotate: "-54deg" }],
    width: 0,
  },
  wordmark: {
    color: "#13213f",
    fontWeight: "900",
    letterSpacing: 0,
    marginLeft: 10,
  },
});
