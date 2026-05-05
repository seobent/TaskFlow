"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";

export type ProjectFormValues = {
  description: string;
  name: string;
};

type ProjectFormProps = {
  cancelHref?: string;
  cancelLabel?: string;
  error?: string | null;
  initialValues?: Partial<ProjectFormValues>;
  isSubmitting?: boolean;
  onCancel?: () => void;
  onSubmit: (values: ProjectFormValues) => Promise<void> | void;
  submitLabel: string;
  submittingLabel?: string;
};

export function ProjectForm({
  cancelHref,
  cancelLabel = "Cancel",
  error,
  initialValues,
  isSubmitting = false,
  onCancel,
  onSubmit,
  submitLabel,
  submittingLabel = "Saving...",
}: ProjectFormProps) {
  const [description, setDescription] = useState(
    initialValues?.description ?? "",
  );
  const [name, setName] = useState(initialValues?.name ?? "");
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    setDescription(initialValues?.description ?? "");
    setName(initialValues?.name ?? "");
  }, [initialValues?.description, initialValues?.name]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setNameError("Project name is required.");
      return;
    }

    setNameError(null);

    await onSubmit({
      description: description.trim(),
      name: trimmedName,
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {error ? (
        <div
          className="rounded-md border border-berry/25 bg-berry/10 px-3 py-2 text-sm font-medium text-berry"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <TextInput
        disabled={isSubmitting}
        error={nameError ?? undefined}
        id="project-name"
        label="Name"
        maxLength={120}
        name="name"
        onChange={(event) => setName(event.target.value)}
        placeholder="Website redesign"
        required
        value={name}
      />

      <div className="space-y-2">
        <label
          className="block text-sm font-medium text-ink"
          htmlFor="project-description"
        >
          Description
        </label>
        <textarea
          className="min-h-36 w-full resize-y rounded-md border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink shadow-sm transition placeholder:text-ink/35 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20 disabled:cursor-not-allowed disabled:bg-surface disabled:text-ink/50"
          disabled={isSubmitting}
          id="project-description"
          maxLength={2000}
          name="description"
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe the goal, scope, and team context."
          value={description}
        />
        <p className="text-xs text-ink/55">
          {description.length}/2000 characters
        </p>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {cancelHref ? (
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink/15 bg-white px-4 text-sm font-semibold text-ink shadow-sm transition hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
            href={cancelHref}
          >
            {cancelLabel}
          </Link>
        ) : null}
        {onCancel ? (
          <Button
            disabled={isSubmitting}
            onClick={onCancel}
            type="button"
            variant="secondary"
          >
            {cancelLabel}
          </Button>
        ) : null}
        <Button
          isLoading={isSubmitting}
          loadingLabel={submittingLabel}
          type="submit"
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
