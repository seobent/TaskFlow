import { StyleSheet, Text } from "react-native";
import { TaskPriority } from "@taskflow/shared";

import { useTheme } from "@/lib/theme";

type PriorityBadgeProps = {
  priority: TaskPriority;
};

const priorityStyles = {
  [TaskPriority.Low]: {
    backgroundColor: "#edf7f3",
    borderColor: "#b8ddd0",
    color: "#28735f",
    label: "Low",
  },
  [TaskPriority.Medium]: {
    backgroundColor: "#fff7e7",
    borderColor: "#f2cf8f",
    color: "#94630f",
    label: "Medium",
  },
  [TaskPriority.High]: {
    backgroundColor: "#fff0ef",
    borderColor: "#edb3ad",
    color: "#9a2d22",
    label: "High",
  },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { isDark } = useTheme();
  const priorityStyle = priorityStyles[priority];
  const darkStyle = darkPriorityStyles[priority];

  return (
    <Text
      style={[
        styles.badge,
        {
          backgroundColor: isDark
            ? darkStyle.backgroundColor
            : priorityStyle.backgroundColor,
          borderColor: isDark ? darkStyle.borderColor : priorityStyle.borderColor,
          color: isDark ? darkStyle.color : priorityStyle.color,
        },
      ]}
    >
      {priorityStyle.label}
    </Text>
  );
}

const darkPriorityStyles = {
  [TaskPriority.Low]: {
    backgroundColor: "rgba(104, 211, 184, 0.14)",
    borderColor: "rgba(104, 211, 184, 0.32)",
    color: "#68d3b8",
  },
  [TaskPriority.Medium]: {
    backgroundColor: "rgba(245, 178, 86, 0.14)",
    borderColor: "rgba(245, 178, 86, 0.34)",
    color: "#f5b256",
  },
  [TaskPriority.High]: {
    backgroundColor: "rgba(231, 121, 166, 0.14)",
    borderColor: "rgba(231, 121, 166, 0.34)",
    color: "#e779a6",
  },
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
