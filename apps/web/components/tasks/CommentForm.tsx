"use client";

import type { CreateCommentInput } from "@taskflow/shared";
import { type FormEvent, useId, useState } from "react";

import { Button } from "@/components/ui/Button";

type CommentFormProps = {
  error?: string | null;
  isSubmitting?: boolean;
  onSubmit: (
    values: CreateCommentInput,
  ) => Promise<boolean | void> | boolean | void;
};

const maxCommentLength = 2000;

export function CommentForm({
  error,
  isSubmitting = false,
  onSubmit,
}: CommentFormProps) {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const [content, setContent] = useState("");
  const [contentError, setContentError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      setContentError("Comment content is required.");
      return;
    }

    setContentError(null);

    const result = await onSubmit({
      content: trimmedContent,
    });

    if (result !== false) {
      setContent("");
    }
  }

  const visibleError = contentError ?? error;

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-ink" htmlFor={fieldId}>
          Add comment
        </label>
        <textarea
          aria-describedby={visibleError ? errorId : undefined}
          aria-invalid={visibleError ? true : undefined}
          className={[
            "min-h-28 w-full resize-y rounded-md border bg-white px-3 py-2.5 text-sm text-ink shadow-sm transition",
            "placeholder:text-ink/35 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20",
            "disabled:cursor-not-allowed disabled:bg-surface disabled:text-ink/50",
            visibleError ? "border-berry" : "border-ink/15",
          ].join(" ")}
          disabled={isSubmitting}
          id={fieldId}
          maxLength={maxCommentLength}
          name="content"
          onChange={(event) => setContent(event.target.value)}
          placeholder="Share an update, blocker, or decision."
          value={content}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink/55">
            {content.length}/{maxCommentLength} characters
          </p>
          {visibleError ? (
            <p className="text-xs font-medium text-berry" id={errorId} role="alert">
              {visibleError}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          isLoading={isSubmitting}
          loadingLabel="Posting..."
          type="submit"
        >
          Post comment
        </Button>
      </div>
    </form>
  );
}
