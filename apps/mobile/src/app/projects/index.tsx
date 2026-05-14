import { useCallback, useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Project } from "@taskflow/shared";

import { ProjectCard } from "@/components/ProjectCard";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  readErrorMessage,
} from "@/components/ScreenState";
import { getProjects } from "@/lib/api";
import { useTheme } from "@/lib/theme";

export default function ProjectsScreen() {
  const { colors } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    setError(null);

    try {
      const nextProjects = await getProjects();
      setProjects(nextProjects);
    } catch (caughtError) {
      setError(readErrorMessage(caughtError, "Unable to load projects."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useFocusEffect(
    useCallback(() => {
      void loadProjects();
    }, [loadProjects]),
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.secondaryButton,
              {
                backgroundColor: pressed
                  ? colors.primarySoftPressed
                  : colors.primarySoft,
              },
            ]}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.mutedStrong }]}>
              Back
            </Text>
          </Pressable>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>Projects</Text>
          <Text style={[styles.title, { color: colors.text }]}>
            Workspace projects
          </Text>
        </View>

        {isLoading ? (
          <LoadingState label="Loading projects..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadProjects} />
        ) : projects.length > 0 ? (
          <View style={styles.list}>
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                onPress={() => router.push(`/projects/${project.id}`)}
                project={project}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            actionLabel="Refresh"
            message="No projects are available for your account yet."
            onAction={loadProjects}
            title="No projects yet"
          />
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
  list: {
    gap: 14,
    marginTop: 20,
  },
});
