"use client";

import { type Comment, type SafeUser } from "@taskflow/shared";
import { useMemo } from "react";

import { CommentItem } from "@/components/tasks/CommentItem";

type CommentListProps = {
  comments: Comment[];
  currentUser: SafeUser;
  deletingCommentId?: string | null;
  onDeleteComment: (comment: Comment) => void;
};

export function CommentList({
  comments,
  currentUser,
  deletingCommentId = null,
  onDeleteComment,
}: CommentListProps) {
  const orderedComments = useMemo(
    () =>
      [...comments].sort(
        (first, second) =>
          new Date(first.createdAt).getTime() -
          new Date(second.createdAt).getTime(),
      ),
    [comments],
  );

  if (orderedComments.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-ink/15 bg-white px-4 py-6 text-center text-sm font-medium text-ink/50">
        No comments yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orderedComments.map((comment) => (
        <CommentItem
          comment={comment}
          currentUser={currentUser}
          isDeleting={deletingCommentId === comment.id}
          key={comment.id}
          onDelete={onDeleteComment}
        />
      ))}
    </div>
  );
}
