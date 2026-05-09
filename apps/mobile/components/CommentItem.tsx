import { StyleSheet, Text, View } from "react-native";
import { Comment } from "@taskflow/shared";

import { formatDisplayDateTime } from "./date-format";

type CommentItemProps = {
  comment: Comment;
};

export function CommentItem({ comment }: CommentItemProps) {
  return (
    <View style={styles.item}>
      <Text style={styles.content}>{comment.content}</Text>
      <Text style={styles.meta}>{formatDisplayDateTime(comment.createdAt)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(23, 32, 51, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  content: {
    color: "#172033",
    fontSize: 15,
    lineHeight: 21,
  },
  meta: {
    color: "rgba(23, 32, 51, 0.62)",
    fontSize: 12,
    fontWeight: "700",
  },
});
