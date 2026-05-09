"use client";

import {
  ATTACHMENT_FILE_ACCEPT,
  type Attachment,
  MAX_ATTACHMENT_FILE_SIZE_BYTES,
} from "@taskflow/shared";
import {
  type ChangeEvent,
  type FormEvent,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { formatTaskDateTime } from "@/components/tasks/task-formatting";
import { Button } from "@/components/ui/Button";

type TaskAttachmentsProps = {
  attachments: Attachment[];
  error?: string | null;
  isUploading?: boolean;
  onUpload: (file: File) => Promise<boolean | void> | boolean | void;
};

export function TaskAttachments({
  attachments,
  error,
  isUploading = false,
  onUpload,
}: TaskAttachmentsProps) {
  const fileInputId = useId();
  const errorId = `${fileInputId}-error`;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const orderedAttachments = useMemo(
    () =>
      [...attachments].sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime(),
      ),
    [attachments],
  );
  const visibleError = selectionError ?? error;

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    setSelectedFile(file);
    setSelectionError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setSelectionError("Choose a file to upload.");
      return;
    }

    if (selectedFile.size > MAX_ATTACHMENT_FILE_SIZE_BYTES) {
      setSelectionError(
        `File must be ${formatFileSize(MAX_ATTACHMENT_FILE_SIZE_BYTES)} or smaller.`,
      );
      return;
    }

    setSelectionError(null);

    const result = await onUpload(selectedFile);

    if (result !== false) {
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <section className="space-y-4 border-t border-ink/10 pt-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-mint">
            Attachments
          </p>
          <h3 className="mt-1 text-lg font-semibold text-ink">Files</h3>
        </div>
        <span className="rounded bg-surface px-2 py-1 text-xs font-semibold text-ink/55">
          {orderedAttachments.length}
        </span>
      </div>

      <form
        className="rounded-md border border-ink/10 bg-white p-4 shadow-sm"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="space-y-2">
            <label
              className="block text-sm font-medium text-ink"
              htmlFor={fileInputId}
            >
              Upload file
            </label>
            <input
              accept={ATTACHMENT_FILE_ACCEPT}
              aria-describedby={visibleError ? errorId : undefined}
              aria-invalid={visibleError ? true : undefined}
              className={[
                "block w-full rounded-md border bg-white px-3 py-2 text-sm text-ink shadow-sm transition",
                "file:mr-3 file:rounded file:border-0 file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ink",
                "focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20",
                "disabled:cursor-not-allowed disabled:bg-surface disabled:text-ink/50",
                visibleError ? "border-berry" : "border-ink/15",
              ].join(" ")}
              disabled={isUploading}
              id={fileInputId}
              name="file"
              onChange={handleFileChange}
              ref={fileInputRef}
              type="file"
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-ink/55">
                Max {formatFileSize(MAX_ATTACHMENT_FILE_SIZE_BYTES)}
              </p>
              {visibleError ? (
                <p
                  className="text-xs font-medium text-berry"
                  id={errorId}
                  role="alert"
                >
                  {visibleError}
                </p>
              ) : null}
            </div>
          </div>

          <Button
            className="w-full lg:w-auto"
            disabled={!selectedFile}
            isLoading={isUploading}
            loadingLabel="Uploading..."
            type="submit"
          >
            Upload
          </Button>
        </div>
      </form>

      {orderedAttachments.length === 0 ? (
        <div className="rounded-md border border-dashed border-ink/15 bg-white px-4 py-6 text-center text-sm font-medium text-ink/50">
          No attachments yet.
        </div>
      ) : (
        <div className="space-y-3">
          {orderedAttachments.map((attachment) => (
            <article
              className="rounded-md border border-ink/10 bg-white p-4 shadow-sm"
              key={attachment.id}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h4 className="break-words text-sm font-semibold text-ink">
                    {attachment.fileName}
                  </h4>
                  <p className="mt-1 text-xs font-medium text-ink/45">
                    {formatFileSize(attachment.fileSize)}
                    {" / "}
                    {formatTaskDateTime(attachment.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    className="inline-flex min-h-9 items-center justify-center rounded-md border border-ink/15 bg-white px-3 text-sm font-semibold text-ink shadow-sm transition hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
                    href={attachment.fileUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open
                  </a>
                  <a
                    className="inline-flex min-h-9 items-center justify-center rounded-md border border-ink/15 bg-white px-3 text-sm font-semibold text-ink shadow-sm transition hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
                    download={attachment.fileName}
                    href={attachment.fileUrl}
                  >
                    Download
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
