import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { TaskPriority, TaskStatus } from "@taskflow/shared";

import { BackButton } from "@/components/BackButton";
import { readErrorMessage } from "@/components/ScreenState";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createTask } from "@/lib/api";
import { useTheme } from "@/lib/theme";

const priorities = [TaskPriority.Low, TaskPriority.Medium, TaskPriority.High];
const priorityLabels = {
  [TaskPriority.Low]: "Low",
  [TaskPriority.Medium]: "Medium",
  [TaskPriority.High]: "High",
};

export default function CreateTaskScreen() {
  const { colors } = useTheme();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState(TaskPriority.Medium);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreateTask() {
    if (!projectId) {
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      await createTask(projectId, {
        description: description.trim() || null,
        dueDate: dueDate.trim() ? new Date(dueDate.trim()).toISOString() : null,
        priority,
        status: TaskStatus.Todo,
        title: title.trim(),
      });
      router.replace(`/projects/${projectId}`);
    } catch (caughtError) {
      setError(readErrorMessage(caughtError, "Unable to create task."));
    } finally {
      setIsSaving(false);
    }
  }

  const dueDateIsValid =
    dueDate.trim().length === 0 || !Number.isNaN(new Date(dueDate.trim()).getTime());
  const formIsReady = title.trim().length > 0 && dueDateIsValid && !isSaving;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTop}>
              <BackButton onPress={() => router.back()} />
              <ThemeToggle compact />
            </View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>New task</Text>
            <Text style={[styles.title, { color: colors.text }]}>Create task</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Title</Text>
              <TextInput
                onChangeText={setTitle}
                placeholder="Write task title"
                placeholderTextColor={colors.muted}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={title}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Description</Text>
              <TextInput
                multiline
                onChangeText={setDescription}
                placeholder="Add helpful context"
                placeholderTextColor={colors.muted}
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                textAlignVertical="top"
                value={description}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Priority</Text>
              <View style={styles.segmentedControl}>
                {priorities.map((nextPriority) => (
                  <Pressable
                    accessibilityRole="button"
                    key={nextPriority}
                    onPress={() => setPriority(nextPriority)}
                    style={[
                      styles.segment,
                      {
                        backgroundColor:
                          priority === nextPriority ? colors.primary : colors.card,
                        borderColor:
                          priority === nextPriority ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        {
                          color:
                            priority === nextPriority
                              ? colors.textOnPrimary
                              : colors.muted,
                        },
                      ]}
                    >
                      {priorityLabels[nextPriority]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Due date</Text>
              <TextInput
                autoCapitalize="none"
                onChangeText={setDueDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.muted}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={dueDate}
              />
              {!dueDateIsValid ? (
                <Text style={[styles.fieldError, { color: colors.danger }]}>
                  Enter a readable date or leave it blank.
                </Text>
              ) : null}
            </View>

            {error ? (
              <Text
                style={[
                  styles.error,
                  {
                    backgroundColor: colors.dangerBackground,
                    borderColor: colors.dangerBorder,
                    color: colors.danger,
                  },
                ]}
              >
                {error}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={!formIsReady}
              onPress={handleCreateTask}
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary },
                !formIsReady ? styles.buttonDisabled : null,
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
                  Create task
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#f7f8fb",
    flex: 1,
  },
  keyboardView: {
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
  form: {
    gap: 16,
    marginTop: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    color: "#172033",
    fontSize: 14,
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(23, 32, 51, 0.16)",
    borderRadius: 8,
    borderWidth: 1,
    color: "#172033",
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  textArea: {
    minHeight: 124,
    paddingTop: 14,
  },
  segmentedControl: {
    flexDirection: "row",
    gap: 8,
  },
  segment: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "rgba(23, 32, 51, 0.14)",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  segmentActive: {
    backgroundColor: "#2f9f89",
    borderColor: "#2f9f89",
  },
  segmentText: {
    color: "#566176",
    fontSize: 14,
    fontWeight: "700",
  },
  segmentTextActive: {
    color: "#ffffff",
  },
  fieldError: {
    color: "#9a2d22",
    fontSize: 13,
  },
  error: {
    backgroundColor: "#fff2f1",
    borderColor: "#f0b7b2",
    borderRadius: 8,
    borderWidth: 1,
    color: "#9a2d22",
    fontSize: 14,
    lineHeight: 20,
    padding: 12,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2f9f89",
    borderRadius: 8,
    justifyContent: "center",
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
