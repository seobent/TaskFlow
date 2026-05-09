import { StyleSheet, Text } from "react-native";
import { TaskPriority } from "@taskflow/shared";

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
  const priorityStyle = priorityStyles[priority];

  return (
    <Text
      style={[
        styles.badge,
        {
          backgroundColor: priorityStyle.backgroundColor,
          borderColor: priorityStyle.borderColor,
          color: priorityStyle.color,
        },
      ]}
    >
      {priorityStyle.label}
    </Text>
  );
}

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
