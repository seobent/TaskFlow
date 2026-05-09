import { StyleSheet, Text, View } from "react-native";
import { Task, TaskStatus } from "@taskflow/shared";

import { TaskCard } from "./TaskCard";

type StatusSectionProps = {
  status: TaskStatus;
  tasks: Task[];
  onTaskPress?: (task: Task) => void;
};

export const statusLabels = {
  [TaskStatus.Todo]: "To Do",
  [TaskStatus.InProgress]: "In Progress",
  [TaskStatus.Done]: "Done",
};

export function StatusSection({
  status,
  tasks,
  onTaskPress,
}: StatusSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{statusLabels[status]}</Text>
        <Text style={styles.count}>{tasks.length}</Text>
      </View>

      {tasks.length > 0 ? (
        <View style={styles.list}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              onPress={onTaskPress ? () => onTaskPress(task) : undefined}
              task={task}
            />
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>No tasks here yet.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    color: "#172033",
    fontSize: 18,
    fontWeight: "700",
  },
  count: {
    backgroundColor: "#e8f5f2",
    borderRadius: 999,
    color: "#2f7368",
    fontSize: 13,
    fontWeight: "700",
    minWidth: 30,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5,
    textAlign: "center",
  },
  list: {
    gap: 10,
  },
  empty: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(23, 32, 51, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    color: "#566176",
    fontSize: 14,
    padding: 16,
  },
});
