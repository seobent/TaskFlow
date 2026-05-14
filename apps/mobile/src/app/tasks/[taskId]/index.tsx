import { useCallback, useEffect, useState } from "react";
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
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Comment, Task } from "@taskflow/shared";

import { CommentItem } from "@/components/CommentItem";
import { formatDisplayDate } from "@/components/date-format";
import { PriorityBadge } from "@/components/PriorityBadge";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  readErrorMessage,
} from "@/components/ScreenState";
import { statusLabels } from "@/components/StatusSection";
import { createComment, getProjectTasks, getTaskComments } from "@/lib/api";
import { useTheme } from "@/lib/theme";

export default function TaskDetailsScreen() {
  const { colors } = useTheme();
  const { projectId, taskId } = useLocalSearchParams<{
    projectId?: string;
    taskId: string;
  }>();
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentContent, setCommentContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingComment, setIsAddingComment] = useState(false);

  const loadTask = useCallback(async () => {
    if (!taskId || !projectId) {
      setError("Open this task from a project so TaskFlow can load its details.");
      setIsLoading(false);
      return;
    }

    setError(null);

    try {
      const [projectTasks, nextComments] = await Promise.all([
        getProjectTasks(projectId),
        getTaskComments(taskId),
      ]);
      const nextTask = projectTasks.find((projectTask) => projectTask.id === taskId);

      if (!nextTask) {
        setError("TaskFlow could not find this task in the current project.");
      } else {
        setTask(nextTask);
        setComments(nextComments);
      }
    } catch (caughtError) {
      setError(readErrorMessage(caughtError, "Unable to load task."));
    } finally {
      setIsLoading(false);
    }
  }, [projectId, taskId]);

  useEffect(() => {
    void loadTask();
  }, [loadTask]);

  useFocusEffect(
    useCallback(() => {
      void loadTask();
    }, [loadTask]),
  );

  async function handleAddComment() {
    const content = commentContent.trim();

    if (!taskId || content.length === 0) {
      return;
    }

    setCommentError(null);
    setIsAddingComment(true);

    try {
      const comment = await createComment(taskId, { content });
      setComments((currentComments) => [...currentComments, comment]);
      setCommentContent("");
    } catch (caughtError) {
      setCommentError(readErrorMessage(caughtError, "Unable to add comment."));
    } finally {
      setIsAddingComment(false);
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
            <Text style={[styles.eyebrow, { color: colors.primary }]}>Task</Text>
            <Text style={[styles.title, { color: colors.text }]}>
              {task?.title ?? "Task details"}
            </Text>
          </View>

          {isLoading ? (
            <LoadingState label="Loading task..." />
          ) : error ? (
            <ErrorState message={error} onRetry={loadTask} />
          ) : task ? (
            <>
              <View
                style={[
                  styles.panel,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.row}>
                  <PriorityBadge priority={task.priority} />
                  <Text style={[styles.status, { color: colors.text }]}>
                    {statusLabels[task.status]}
                  </Text>
                </View>
                <Text style={[styles.meta, { color: colors.muted }]}>
                  Due {task.dueDate ? formatDisplayDate(task.dueDate) : "No due date"}
                </Text>
                {task.description ? (
                  <Text style={[styles.description, { color: colors.muted }]}>
                    {task.description}
                  </Text>
                ) : (
                  <Text style={[styles.description, { color: colors.muted }]}>
                    No description yet.
                  </Text>
                )}
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: "/tasks/[taskId]/status",
                      params: { projectId, taskId },
                    })
                  }
                  style={({ pressed }) => [
                    styles.primaryButton,
                    {
                      backgroundColor: pressed
                        ? colors.primaryPressed
                        : colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.primaryButtonText,
                      { color: colors.textOnPrimary },
                    ]}
                  >
                    Edit status
                  </Text>
                </Pressable>
              </View>

              <View style={styles.commentsHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Comments
                </Text>
                <Text
                  style={[
                    styles.commentCount,
                    {
                      backgroundColor: colors.primarySoft,
                      color: colors.mutedStrong,
                    },
                  ]}
                >
                  {comments.length}
                </Text>
              </View>

              <View style={styles.commentForm}>
                <TextInput
                  multiline
                  onChangeText={setCommentContent}
                  placeholder="Add a comment"
                  placeholderTextColor={colors.muted}
                  style={[
                    styles.commentInput,
                    {
                      backgroundColor: colors.input,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  textAlignVertical="top"
                  value={commentContent}
                />
                {commentError ? (
                  <Text style={[styles.errorText, { color: colors.danger }]}>
                    {commentError}
                  </Text>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  disabled={commentContent.trim().length === 0 || isAddingComment}
                  onPress={handleAddComment}
                  style={[
                    styles.primaryButton,
                    { backgroundColor: colors.primary },
                    commentContent.trim().length === 0 || isAddingComment
                      ? styles.buttonDisabled
                      : null,
                  ]}
                >
                  {isAddingComment ? (
                    <ActivityIndicator color={colors.textOnPrimary} />
                  ) : (
                    <Text
                      style={[
                        styles.primaryButtonText,
                        { color: colors.textOnPrimary },
                      ]}
                    >
                      Add comment
                    </Text>
                  )}
                </Pressable>
              </View>

              <View style={styles.comments}>
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <CommentItem comment={comment} key={comment.id} />
                  ))
                ) : (
                  <EmptyState
                    message="No one has added comments to this task yet."
                    title="No comments yet"
                  />
                )}
              </View>
            </>
          ) : null}
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
  panel: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(23, 32, 51, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    marginTop: 20,
    padding: 16,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  status: {
    color: "#172033",
    fontSize: 14,
    fontWeight: "700",
  },
  meta: {
    color: "rgba(23, 32, 51, 0.62)",
    fontSize: 13,
    fontWeight: "700",
  },
  description: {
    color: "#566176",
    fontSize: 15,
    lineHeight: 22,
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
  commentsHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 26,
  },
  sectionTitle: {
    color: "#172033",
    fontSize: 20,
    fontWeight: "700",
  },
  commentCount: {
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
  commentForm: {
    gap: 12,
    marginTop: 14,
  },
  commentInput: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(23, 32, 51, 0.16)",
    borderRadius: 8,
    borderWidth: 1,
    color: "#172033",
    fontSize: 16,
    minHeight: 112,
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  comments: {
    gap: 10,
    marginTop: 16,
  },
  errorText: {
    color: "#9a2d22",
    fontSize: 13,
  },
  buttonDisabled: {
    opacity: 0.58,
  },
});
