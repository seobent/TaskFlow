import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

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
  return (
    <View style={styles.state}>
      <ActivityIndicator color="#2f9f89" size="large" />
      <Text style={styles.stateText}>{label}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.errorPanel}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry ? (
        <Pressable accessibilityRole="button" onPress={onRetry} style={styles.button}>
          <Text style={styles.buttonText}>Try again</Text>
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
  return (
    <View style={styles.emptyPanel}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} style={styles.button}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
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
