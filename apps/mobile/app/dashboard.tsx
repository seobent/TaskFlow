import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Project, SafeUser, Task, TaskStatus, TASKFLOW_APP_NAME } from "@taskflow/shared";

import { ProjectCard } from "@/components/ProjectCard";
import { ErrorState, LoadingState, readErrorMessage } from "@/components/ScreenState";
import { getCurrentUser, getProjects, getProjectTasks, logout } from "@/lib/api";

export default function DashboardScreen() {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const loadDashboard = useCallback(async () => {
    setError(null);

    try {
      const [currentUser, nextProjects] = await Promise.all([
        getCurrentUser(),
        getProjects(),
      ]);
      const projectTasks = await Promise.all(
        nextProjects.map((project) => getProjectTasks(project.id)),
      );

      setUser(currentUser);
      setProjects(nextProjects);
      setTasks(projectTasks.flat());
    } catch (caughtError) {
      setError(readErrorMessage(caughtError, "Unable to load your dashboard."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

  const taskCounts = useMemo(
    () => ({
      done: tasks.filter((task) => task.status === TaskStatus.Done).length,
      inProgress: tasks.filter((task) => task.status === TaskStatus.InProgress).length,
      todo: tasks.filter((task) => task.status === TaskStatus.Todo).length,
    }),
    [tasks],
  );

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      router.replace("/login");
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Dashboard</Text>
            <Text style={styles.title}>{TASKFLOW_APP_NAME}</Text>
            {user ? <Text style={styles.subtitle}>Signed in as {user.name}</Text> : null}
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={isLoggingOut}
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              isLoggingOut ? styles.buttonDisabled : null,
              pressed && !isLoggingOut ? styles.logoutButtonPressed : null,
            ]}
          >
            {isLoggingOut ? (
              <ActivityIndicator color="#2f7368" />
            ) : (
              <Text style={styles.logoutText}>Logout</Text>
            )}
          </Pressable>
        </View>

        {isLoading ? (
          <LoadingState label="Loading your workspace..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadDashboard} />
        ) : (
          <>
            <View style={styles.grid}>
              <View style={styles.tile}>
                <Text style={styles.tileValue}>{projects.length}</Text>
                <Text style={styles.tileLabel}>Projects</Text>
              </View>
              <View style={styles.tile}>
                <Text style={styles.tileValue}>{taskCounts.todo}</Text>
                <Text style={styles.tileLabel}>To Do</Text>
              </View>
              <View style={styles.tile}>
                <Text style={styles.tileValue}>{taskCounts.inProgress}</Text>
                <Text style={styles.tileLabel}>In Progress</Text>
              </View>
              <View style={styles.tile}>
                <Text style={styles.tileValue}>{taskCounts.done}</Text>
                <Text style={styles.tileLabel}>Done</Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent projects</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/projects")}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>View all</Text>
              </Pressable>
            </View>

            <View style={styles.list}>
              {projects.slice(0, 3).map((project) => (
                <ProjectCard
                  key={project.id}
                  onPress={() => router.push(`/projects/${project.id}`)}
                  project={project}
                  taskCount={tasks.filter((task) => task.projectId === project.id).length}
                />
              ))}
              {projects.length === 0 ? (
                <Text style={styles.empty}>No projects are available for your account yet.</Text>
              ) : null}
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
    alignItems: "flex-start",
    borderBottomColor: "rgba(23, 32, 51, 0.12)",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
    paddingBottom: 24,
  },
  headerText: {
    flex: 1,
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
    fontSize: 36,
    fontWeight: "700",
    marginTop: 8,
  },
  subtitle: {
    color: "#566176",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  logoutButton: {
    alignItems: "center",
    backgroundColor: "#e8f5f2",
    borderColor: "rgba(47, 159, 137, 0.28)",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 92,
    paddingHorizontal: 14,
  },
  logoutButtonPressed: {
    backgroundColor: "#d7eee9",
  },
  logoutText: {
    color: "#2f7368",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.58,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 22,
  },
  tile: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(23, 32, 51, 0.1)",
    borderLeftColor: "#d48a2c",
    borderLeftWidth: 4,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 86,
    padding: 14,
    width: "47%",
  },
  tileValue: {
    color: "#172033",
    fontSize: 24,
    fontWeight: "700",
  },
  tileLabel: {
    color: "rgba(23, 32, 51, 0.62)",
    fontSize: 13,
    marginTop: 4,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 28,
  },
  sectionTitle: {
    color: "#172033",
    fontSize: 20,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
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
  list: {
    gap: 14,
    marginTop: 14,
  },
  empty: {
    color: "#566176",
    fontSize: 15,
    lineHeight: 22,
  },
});
