import { TASKFLOW_APP_NAME } from "@taskflow/shared";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";
import { SvgXml } from "react-native-svg";

import { TASKFLOW_DARK_LOGO_SVG } from "@/components/taskflow-logo-dark-svg";
import { TASKFLOW_LIGHT_LOGO_SVG } from "@/components/taskflow-logo-light-svg";
import { useTheme } from "@/lib/theme";

type TaskFlowLogoProps = {
  size?: "small" | "large";
  style?: StyleProp<ViewStyle>;
};

export function TaskFlowLogo({
  size = "large",
  style,
}: TaskFlowLogoProps) {
  const { isDark } = useTheme();
  const isLarge = size === "large";
  const logoWidth = isLarge ? 292 : 174;
  const logoHeight = isLarge ? 82 : 49;
  const logoXml = isDark ? TASKFLOW_DARK_LOGO_SVG : TASKFLOW_LIGHT_LOGO_SVG;

  return (
    <View
      accessibilityLabel={`${TASKFLOW_APP_NAME} logo`}
      accessibilityRole="image"
      accessible
      style={[styles.root, style]}
    >
      <SvgXml height={logoHeight} width={logoWidth} xml={logoXml} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    flexDirection: "row",
  },
});
