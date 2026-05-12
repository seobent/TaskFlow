import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/lib/theme";

type LoadingStateProps = {
  label?: string;
};

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

type EmptyStateProps = {
  actionLabel?: string;
  message: string;
  onAction?: () => void;
  title: string;
};

export function LoadingState({ label = "Loading..." }: LoadingStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.state}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={[styles.stateText, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.errorPanel,
        {
          backgroundColor: colors.dangerBackground,
          borderColor: colors.dangerBorder,
        },
      ]}
    >
      <Text style={[styles.errorTitle, { color: colors.danger }]}>
        Something went wrong
      </Text>
      <Text style={[styles.errorText, { color: colors.danger }]}>{message}</Text>
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>
            Try again
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({
  actionLabel,
  message,
  onAction,
  title,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.emptyPanel,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptyText, { color: colors.muted }]}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function readErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

const styles = StyleSheet.create({
  state: {
    alignItems: "center",
    gap: 14,
    marginTop: 72,
  },
  stateText: {
    color: "#566176",
    fontSize: 16,
  },
  errorPanel: {
    backgroundColor: "#fff2f1",
    borderColor: "#f0b7b2",
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    marginTop: 18,
    padding: 18,
  },
  errorTitle: {
    color: "#7d251c",
    fontSize: 17,
    fontWeight: "700",
  },
  errorText: {
    color: "#9a2d22",
    fontSize: 14,
    lineHeight: 20,
  },
  emptyPanel: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(23, 32, 51, 0.1)",
    borderRadius: 8,
    borderStyle: "dashed",
    borderWidth: 1,
    gap: 10,
    marginTop: 18,
    padding: 18,
  },
  emptyTitle: {
    color: "#172033",
    fontSize: 17,
    fontWeight: "700",
  },
  emptyText: {
    color: "#566176",
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    alignItems: "center",
    backgroundColor: "#2f9f89",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
