import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Project, Task, TaskStatus } from "@taskflow/shared";

import { ErrorState, LoadingState, readErrorMessage } from "@/components/ScreenState";
import { StatusSection } from "@/components/StatusSection";
import { getProject, getProjectTasks } from "@/lib/api";

const statuses = [TaskStatus.Todo, TaskStatus.InProgress, TaskStatus.Done];

export default function ProjectDetailsScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProject = useCallback(async () => {
    if (!projectId) {
      return;
    }

    setError(null);

    try {
      const [nextProject, nextTasks] = await Promise.all([
        getProject(projectId),
        getProjectTasks(projectId),
      ]);
      setProject(nextProject);
      setTasks(nextTasks);
    } catch (caughtError) {
      setError(readErrorMessage(caughtError, "Unable to load project."));
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  useFocusEffect(
    useCallback(() => {
      void loadProject();
    }, [loadProject]),
  );

  const groupedTasks = useMemo(
    () =>
      statuses.reduce<Record<TaskStatus, Task[]>>(
        (groups, status) => ({
          ...groups,
          [status]: tasks.filter((task) => task.status === status),
        }),
        {
          [TaskStatus.Todo]: [],
          [TaskStatus.InProgress]: [],
          [TaskStatus.Done]: [],
        },
      ),
    [tasks],
  );

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
          <Text style={styles.eyebrow}>Project</Text>
          <Text style={styles.title}>{project?.name ?? "Project details"}</Text>
          {project?.description ? (
            <Text style={styles.subtitle}>{project.description}</Text>
          ) : null}
        </View>

        {isLoading ? (
          <LoadingState label="Loading project tasks..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadProject} />
        ) : (
          <>
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: "/projects/[projectId]/create-task",
                    params: { projectId },
                  })
                }
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Create task</Text>
              </Pressable>
            </View>

            <View style={styles.sections}>
              {statuses.map((status) => (
                <StatusSection
                  key={status}
                  onTaskPress={(task) =>
                    router.push({
                      pathname: "/tasks/[taskId]",
                      params: { projectId, taskId: task.id },
                    })
                  }
                  status={status}
                  tasks={groupedTasks[status]}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#f7f8fb",
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    borderBottomColor: "rgba(23, 32, 51, 0.12)",
    borderBottomWidth: 1,
    gap: 8,
    paddingBottom: 20,
  },
  eyebrow: {
    color: "#2f9f89",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    color: "#172033",
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 36,
  },
  subtitle: {
    color: "#566176",
    fontSize: 15,
    lineHeight: 22,
  },
  secondaryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#e8f5f2",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: "#2f7368",
    fontSize: 15,
    fontWeight: "700",
  },
  actions: {
    marginTop: 20,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2f9f89",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  sections: {
    gap: 24,
    marginTop: 24,
  },
});
