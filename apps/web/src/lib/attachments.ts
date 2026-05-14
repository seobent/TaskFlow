import {
  type Attachment,
  type ISODateString,
  MAX_ATTACHMENT_FILE_SIZE_BYTES,
} from "@taskflow/shared";
import { randomUUID } from "node:crypto";

import { schema } from "@/db";

const { attachments } = schema;

const allowedImageTypes = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const allowedTextTypes = new Set([
  "application/json",
  "application/xml",
  "application/x-yaml",
  "text/csv",
  "text/markdown",
  "text/plain",
  "text/xml",
  "text/yaml",
]);
const extensionContentTypes = new Map<string, string>([
  [".csv", "text/csv"],
  [".gif", "image/gif"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".json", "application/json"],
  [".log", "text/plain"],
  [".markdown", "text/markdown"],
  [".md", "text/markdown"],
  [".pdf", "application/pdf"],
  [".png", "image/png"],
  [".txt", "text/plain"],
  [".webp", "image/webp"],
  [".xml", "application/xml"],
  [".yaml", "application/x-yaml"],
  [".yml", "application/x-yaml"],
]);

export type AttachmentRecord = typeof attachments.$inferSelect;

export type ValidatedAttachmentFile = {
  fileName: string;
  fileSize: number;
  fileType: string;
};

type AttachmentFileValidation =
  | {
      ok: true;
      value: ValidatedAttachmentFile;
    }
  | {
      ok: false;
      message: string;
    };

export function serializeAttachment(attachment: AttachmentRecord): Attachment {
  if (!attachment.taskId) {
    throw new Error("Attachment task is missing.");
  }

  if (!attachment.uploadedById) {
    throw new Error("Attachment uploader is missing.");
  }

  return {
    id: attachment.id,
    taskId: attachment.taskId,
    uploadedById: attachment.uploadedById,
    fileName: attachment.fileName,
    fileUrl: attachment.fileUrl,
    fileType: attachment.fileType ?? "application/octet-stream",
    fileSize: attachment.fileSize ?? 0,
    createdAt: serializeTimestamp(attachment.createdAt),
  };
}

export function validateAttachmentFile(file: File): AttachmentFileValidation {
  const fileName = file.name.trim();

  if (!fileName) {
    return {
      ok: false,
      message: "Attachment file name is required.",
    };
  }

  if (file.size <= 0) {
    return {
      ok: false,
      message: "Attachment file must not be empty.",
    };
  }

  if (file.size > MAX_ATTACHMENT_FILE_SIZE_BYTES) {
    return {
      ok: false,
      message: `Attachment file must be ${formatBytes(MAX_ATTACHMENT_FILE_SIZE_BYTES)} or smaller.`,
    };
  }

  const fileType = resolveAllowedFileType(fileName, file.type);

  if (!fileType) {
    return {
      ok: false,
      message: "Attachment must be an image, PDF, or supported text file.",
    };
  }

  return {
    ok: true,
    value: {
      fileName,
      fileSize: file.size,
      fileType,
    },
  };
}

export function createAttachmentObjectKey(taskId: string, fileName: string) {
  return `tasks/${taskId}/${randomUUID()}-${sanitizeStorageFileName(fileName)}`;
}

function resolveAllowedFileType(fileName: string, declaredType: string) {
  const contentType = declaredType.trim().toLowerCase();
  const extension = getFileExtension(fileName);
  const extensionType = extensionContentTypes.get(extension);
  const isImageExtension = extensionType?.startsWith("image/");
  const isTextExtension =
    extensionType &&
    (extensionType.startsWith("text/") ||
      extensionType === "application/json" ||
      extensionType === "application/xml" ||
      extensionType === "application/x-yaml");

  if (contentType === "application/pdf" && extension === ".pdf") {
    return contentType;
  }

  if (contentType && allowedImageTypes.has(contentType) && isImageExtension) {
    return contentType;
  }

  if (contentType && allowedTextTypes.has(contentType) && isTextExtension) {
    return contentType;
  }

  return contentType ? null : extensionType ?? null;
}

function getFileExtension(fileName: string) {
  const match = /\.[^.]+$/.exec(fileName.toLowerCase());

  return match?.[0] ?? "";
}

function sanitizeStorageFileName(fileName: string) {
  const sanitized = fileName
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 120);

  return sanitized || "attachment";
}

function formatBytes(bytes: number) {
  const megabytes = bytes / (1024 * 1024);

  return `${megabytes.toFixed(0)} MB`;
}

function serializeTimestamp(value: Date | string | null): ISODateString {
  if (!value) {
    throw new Error("Attachment timestamp is missing.");
  }

  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}
