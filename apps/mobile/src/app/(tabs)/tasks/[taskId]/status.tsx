import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Task, TaskStatus } from "@taskflow/shared";

import { BackButton } from "@/components/BackButton";
import { ErrorState, LoadingState, readErrorMessage } from "@/components/ScreenState";
import { statusLabels } from "@/components/StatusSection";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getProjectTasks, updateTask } from "@/lib/api";
import { useTheme } from "@/lib/theme";

const statuses = [TaskStatus.Todo, TaskStatus.InProgress, TaskStatus.Done];

export default function EditTaskStatusScreen() {
  const { colors } = useTheme();
  const { projectId, taskId } = useLocalSearchParams<{
    projectId?: string;
    taskId: string;
  }>();
  const [task, setTask] = useState<Task | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>(TaskStatus.Todo);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadTask = useCallback(async () => {
    if (!projectId || !taskId) {
      setError("Open this task from a project to edit its status.");
      setIsLoading(false);
      return;
    }

    setError(null);

    try {
      const projectTasks = await getProjectTasks(projectId);
      const nextTask = projectTasks.find((projectTask) => projectTask.id === taskId);

      if (!nextTask) {
        setError("TaskFlow could not find this task in the current project.");
      } else {
        setTask(nextTask);
        setSelectedStatus(nextTask.status);
      }
    } catch (caughtError) {
      setError(readErrorMessage(caughtError, "Unable to load task status."));
    } finally {
      setIsLoading(false);
    }
  }, [projectId, taskId]);

  useEffect(() => {
    void loadTask();
  }, [loadTask]);

  async function handleSave() {
    if (!taskId) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await updateTask(taskId, { status: selectedStatus });
      router.back();
    } catch (caughtError) {
      setError(readErrorMessage(caughtError, "Unable to update task status."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerTop}>
            <BackButton onPress={() => router.back()} />
            <ThemeToggle compact />
          </View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>Status</Text>
          <Text style={[styles.title, { color: colors.text }]}>Edit task status</Text>
          {task ? (
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              {task.title}
            </Text>
          ) : null}
        </View>

        {isLoading ? (
          <LoadingState label="Loading status..." />
        ) : error && !task ? (
          <ErrorState message={error} onRetry={loadTask} />
        ) : (
          <>
            <View style={styles.options}>
              {statuses.map((status) => (
                <Pressable
                  accessibilityRole="button"
                  key={status}
                  onPress={() => setSelectedStatus(status)}
                  style={[
                    styles.option,
                    {
                      backgroundColor:
                        selectedStatus === status ? colors.primary : colors.card,
                      borderColor:
                        selectedStatus === status ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color:
                          selectedStatus === status
                            ? colors.textOnPrimary
                            : colors.text,
                      },
                    ]}
                  >
                    {statusLabels[status]}
                  </Text>
                </Pressable>
              ))}
            </View>

            {error ? (
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {error}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={handleSave}
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary },
                isSaving ? styles.buttonDisabled : null,
              ]}
            >
              {isSaving ? (
                <ActivityIndicator color={colors.textOnPrimary} />
              ) : (
                <Text
                  style={[
                    styles.primaryButtonText,
                    { color: colors.textOnPrimary },
                  ]}
                >
                  Save status
                </Text>
              )}
            </Pressable>
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
  headerTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
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
  },
  subtitle: {
    color: "#566176",
    fontSize: 15,
    lineHeight: 22,
  },
  options: {
    gap: 12,
    marginTop: 22,
  },
  option: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "rgba(23, 32, 51, 0.14)",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 58,
  },
  optionActive: {
    backgroundColor: "#2f9f89",
    borderColor: "#2f9f89",
  },
  optionText: {
    color: "#172033",
    fontSize: 16,
    fontWeight: "700",
  },
  optionTextActive: {
    color: "#ffffff",
  },
  errorText: {
    color: "#9a2d22",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 14,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2f9f89",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 18,
    minHeight: 52,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.58,
  },
});
