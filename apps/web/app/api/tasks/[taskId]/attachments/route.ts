import { idSchema } from "@taskflow/shared";
import { desc, eq } from "drizzle-orm";

import { db, schema } from "@/db";
import {
  createAttachmentObjectKey,
  serializeAttachment,
  validateAttachmentFile,
} from "@/lib/attachments";
import { apiError, apiSuccess } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/lib/auth";
import { R2ConfigError, uploadR2Object } from "@/lib/r2-storage";
import { findTaskAccess, type TaskAccess } from "@/lib/tasks";

const { attachments } = schema;
const taskIdSchema = idSchema.uuid("Invalid task id.");

type TaskAttachmentsRouteContext = {
  params: Promise<{
    taskId: string;
  }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: TaskAttachmentsRouteContext,
) {
  try {
    const user = await requireAuth(request);
    const taskId = await parseTaskId(context);

    if (!taskId.ok) {
      return taskId.response;
    }

    const access = await findTaskAccess(taskId.value, user);

    if (!access.task) {
      return apiError("Task not found.", 404);
    }

    if (!canAccessAttachments(access)) {
      return apiError("Task attachment access denied.", 403);
    }

    const attachmentRecords = await db
      .select()
      .from(attachments)
      .where(eq(attachments.taskId, taskId.value))
      .orderBy(desc(attachments.createdAt));

    return apiSuccess({
      attachments: attachmentRecords.map(serializeAttachment),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }

    return apiError("Unable to load attachments.", 500);
  }
}

export async function POST(
  request: Request,
  context: TaskAttachmentsRouteContext,
) {
  try {
    const user = await requireAuth(request);
    const taskId = await parseTaskId(context);

    if (!taskId.ok) {
      return taskId.response;
    }

    const access = await findTaskAccess(taskId.value, user);

    if (!access.task) {
      return apiError("Task not found.", 404);
    }

    if (!canAccessAttachments(access)) {
      return apiError("Task attachment upload denied.", 403);
    }

    let formData: FormData;

    try {
      formData = await request.formData();
    } catch {
      return apiError("Invalid multipart form data.", 400);
    }

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return apiError("Attachment file is required.", 400);
    }

    const validation = validateAttachmentFile(file);

    if (!validation.ok) {
      return apiError(validation.message, 400);
    }

    const key = createAttachmentObjectKey(
      taskId.value,
      validation.value.fileName,
    );
    const fileUrl = await uploadR2Object({
      body: await file.arrayBuffer(),
      contentType: validation.value.fileType,
      key,
    });

    const [createdAttachment] = await db
      .insert(attachments)
      .values({
        taskId: taskId.value,
        uploadedById: user.id,
        fileName: validation.value.fileName,
        fileUrl,
        fileType: validation.value.fileType,
        fileSize: validation.value.fileSize,
      })
      .returning();

    if (!createdAttachment) {
      throw new Error("Attachment insert returned no row.");
    }

    return apiSuccess(
      { attachment: serializeAttachment(createdAttachment) },
      201,
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }

    if (error instanceof R2ConfigError) {
      return apiError("Attachment storage is not configured.", 500);
    }

    return apiError("Unable to upload attachment.", 500);
  }
}

function canAccessAttachments(access: TaskAccess) {
  return access.canView;
}

async function parseTaskId(context: TaskAttachmentsRouteContext) {
  const { taskId } = await context.params;
  const parsed = taskIdSchema.safeParse(taskId);

  if (!parsed.success) {
    return {
      ok: false as const,
      response: apiError("Invalid task id.", 400, parsed.error.flatten()),
    };
  }

  return {
    ok: true as const,
    value: parsed.data,
  };
}
