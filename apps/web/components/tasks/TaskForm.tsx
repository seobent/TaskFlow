"use client";

import { TaskPriority, TaskStatus } from "@taskflow/shared";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";

export type TaskFormValues = {
  assigneeId: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  title: string;
};

type TaskFormProps = {
  error?: string | null;
  initialValues?: Partial<TaskFormValues>;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: TaskFormValues) => Promise<void> | void;
  submitLabel: string;
  submittingLabel?: string;
};

const taskStatusOptions = [
  { label: "To Do", value: TaskStatus.Todo },
  { label: "In Progress", value: TaskStatus.InProgress },
  { label: "Done", value: TaskStatus.Done },
];

const taskPriorityOptions = [
  { label: "Low", value: TaskPriority.Low },
  { label: "Medium", value: TaskPriority.Medium },
  { label: "High", value: TaskPriority.High },
];

export function TaskForm({
  error,
  initialValues,
  isSubmitting = false,
  onCancel,
  onSubmit,
  submitLabel,
  submittingLabel = "Saving...",
}: TaskFormProps) {
  const [assigneeId, setAssigneeId] = useState(initialValues?.assigneeId ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? "",
  );
  const [dueDate, setDueDate] = useState(initialValues?.dueDate ?? "");
  const [dueDateError, setDueDateError] = useState<string | null>(null);
  const [priority, setPriority] = useState(
    initialValues?.priority ?? TaskPriority.Medium,
  );
  const [status, setStatus] = useState(
    initialValues?.status ?? TaskStatus.Todo,
  );
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [titleError, setTitleError] = useState<string | null>(null);

  useEffect(() => {
    setAssigneeId(initialValues?.assigneeId ?? "");
    setDescription(initialValues?.description ?? "");
    setDueDate(initialValues?.dueDate ?? "");
    setDueDateError(null);
    setPriority(initialValues?.priority ?? TaskPriority.Medium);
    setStatus(initialValues?.status ?? TaskStatus.Todo);
    setTitle(initialValues?.title ?? "");
    setTitleError(null);
  }, [
    initialValues?.assigneeId,
    initialValues?.description,
    initialValues?.dueDate,
    initialValues?.priority,
    initialValues?.status,
    initialValues?.title,
  ]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setTitleError("Task title is required.");
      return;
    }

    if (dueDate && Number.isNaN(new Date(dueDate).getTime())) {
      setDueDateError("Enter a valid due date.");
      return;
    }

    setDueDateError(null);
    setTitleError(null);

    await onSubmit({
      assigneeId: assigneeId.trim(),
      description: description.trim(),
      dueDate,
      priority,
      status,
      title: trimmedTitle,
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
        error={titleError ?? undefined}
        id="task-title"
        label="Title"
        maxLength={160}
        name="title"
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Draft project brief"
        required
        value={title}
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-ink" htmlFor="task-description">
          Description
        </label>
        <textarea
          className="min-h-32 w-full resize-y rounded-md border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink shadow-sm transition placeholder:text-ink/35 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20 disabled:cursor-not-allowed disabled:bg-surface disabled:text-ink/50"
          disabled={isSubmitting}
          id="task-description"
          maxLength={5000}
          name="description"
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Add notes, acceptance criteria, or context."
          value={description}
        />
        <p className="text-xs text-ink/55">
          {description.length}/5000 characters
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-ink" htmlFor="task-status">
            Status
          </label>
          <select
            className="min-h-11 w-full rounded-md border border-ink/15 bg-white px-3 py-2.5 text-sm font-medium text-ink shadow-sm transition focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20 disabled:cursor-not-allowed disabled:bg-surface disabled:text-ink/50"
            disabled={isSubmitting}
            id="task-status"
            name="status"
            onChange={(event) => setStatus(event.target.value as TaskStatus)}
            value={status}
          >
            {taskStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-ink" htmlFor="task-priority">
            Priority
          </label>
          <select
            className="min-h-11 w-full rounded-md border border-ink/15 bg-white px-3 py-2.5 text-sm font-medium text-ink shadow-sm transition focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20 disabled:cursor-not-allowed disabled:bg-surface disabled:text-ink/50"
            disabled={isSubmitting}
            id="task-priority"
            name="priority"
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
            value={priority}
          >
            {taskPriorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <TextInput
        disabled={isSubmitting}
        hint="Use a project member user UUID, or leave blank."
        id="task-assignee"
        label="Assignee"
        maxLength={128}
        name="assigneeId"
        onChange={(event) => setAssigneeId(event.target.value)}
        placeholder="User UUID"
        value={assigneeId}
      />

      <TextInput
        disabled={isSubmitting}
        error={dueDateError ?? undefined}
        id="task-due-date"
        label="Due date"
        name="dueDate"
        onChange={(event) => setDueDate(event.target.value)}
        type="datetime-local"
        value={dueDate}
      />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          disabled={isSubmitting}
          onClick={onCancel}
          type="button"
          variant="secondary"
        >
          Cancel
        </Button>
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
