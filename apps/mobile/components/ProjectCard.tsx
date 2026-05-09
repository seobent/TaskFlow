import { Pressable, StyleSheet, Text, View } from "react-native";
import { Project } from "@taskflow/shared";

import { formatDisplayDate } from "./date-format";

type ProjectCardProps = {
  project: Project;
  taskCount?: number;
  onPress?: () => void;
};

export function ProjectCard({ project, taskCount, onPress }: ProjectCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
    >
      <View style={styles.header}>
        <Text numberOfLines={2} style={styles.title}>
          {project.name}
        </Text>
        {typeof taskCount === "number" ? (
          <Text style={styles.count}>{taskCount}</Text>
        ) : null}
      </View>

      {project.description ? (
        <Text numberOfLines={3} style={styles.description}>
          {project.description}
        </Text>
      ) : (
        <Text style={styles.description}>No description yet.</Text>
      )}

      <Text style={styles.meta}>Updated {formatDisplayDate(project.updatedAt)}</Text>
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
  cardPressed: {
    backgroundColor: "#f1f8f6",
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
