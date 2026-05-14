import { Pressable, StyleSheet, Text, View } from "react-native";
import { Project } from "@taskflow/shared";

import { formatDisplayDate } from "./date-format";
import { useTheme } from "@/lib/theme";

type ProjectCardProps = {
  project: Project;
  taskCount?: number;
  onPress?: () => void;
};

export function ProjectCard({ project, taskCount, onPress }: ProjectCardProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: pressed ? colors.primarySoft : colors.card,
          borderColor: colors.border,
          borderLeftColor: colors.primary,
        },
      ]}
    >
      <View style={styles.header}>
        <Text numberOfLines={2} style={[styles.title, { color: colors.text }]}>
          {project.name}
        </Text>
        {typeof taskCount === "number" ? (
          <Text
            style={[
              styles.count,
              { backgroundColor: colors.primarySoft, color: colors.mutedStrong },
            ]}
          >
            {taskCount}
          </Text>
        ) : null}
      </View>

      {project.description ? (
        <Text numberOfLines={3} style={[styles.description, { color: colors.muted }]}>
          {project.description}
        </Text>
      ) : (
        <Text style={[styles.description, { color: colors.muted }]}>
          No description yet.
        </Text>
      )}

      <Text style={[styles.meta, { color: colors.muted }]}>
        Updated {formatDisplayDate(project.updatedAt)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(23, 32, 51, 0.1)",
    borderLeftColor: "#2f9f89",
    borderLeftWidth: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    minHeight: 132,
    padding: 16,
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
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
  count: {
    backgroundColor: "#fff7e7",
    borderRadius: 999,
    color: "#94630f",
    fontSize: 13,
    fontWeight: "700",
    minWidth: 32,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5,
    textAlign: "center",
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
