import { Pressable, StyleSheet, Text, View } from "react-native";
import { Task } from "@taskflow/shared";

import { PriorityBadge } from "./PriorityBadge";
import { formatDisplayDate } from "./date-format";
import { useTheme } from "@/lib/theme";

type TaskCardProps = {
  task: Task;
  onPress?: () => void;
};

export function TaskCard({ task, onPress }: TaskCardProps) {
  const { colors } = useTheme();
  const content = (
    <>
      <View style={styles.header}>
        <Text numberOfLines={2} style={[styles.title, { color: colors.text }]}>
          {task.title}
        </Text>
        <PriorityBadge priority={task.priority} />
      </View>

      {task.description ? (
        <Text numberOfLines={2} style={[styles.description, { color: colors.muted }]}>
          {task.description}
        </Text>
      ) : null}

      <Text style={[styles.meta, { color: colors.muted }]}>
        Due {task.dueDate ? formatDisplayDate(task.dueDate) : "No due date"}
      </Text>
    </>
  );

  if (!onPress) {
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: pressed ? colors.primarySoft : colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(23, 32, 51, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    minHeight: 112,
    padding: 14,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  title: {
    color: "#172033",
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  description: {
    color: "#566176",
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    color: "rgba(23, 32, 51, 0.62)",
    fontSize: 13,
    fontWeight: "700",
  },
});
