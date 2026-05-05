import { idSchema, UserRole } from "@taskflow/shared";
import { eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/lib/auth";

const { comments } = schema;
const commentIdSchema = idSchema.uuid("Invalid comment id.");

type CommentRouteContext = {
  params: Promise<{
    commentId: string;
  }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: Request, context: CommentRouteContext) {
  try {
    const user = await requireAuth(request);
    const commentId = await parseCommentId(context);

    if (!commentId.ok) {
      return commentId.response;
    }

    const comment = await db.query.comments.findFirst({
      where: eq(comments.id, commentId.value),
    });

    if (!comment) {
      return apiError("Comment not found.", 404);
    }

    if (user.role !== UserRole.Admin && comment.authorId !== user.id) {
      return apiError("Comment delete access denied.", 403);
    }

    const [deletedComment] = await db
      .delete(comments)
      .where(eq(comments.id, commentId.value))
      .returning({ id: comments.id });

    if (!deletedComment) {
      return apiError("Comment not found.", 404);
    }

    return apiSuccess({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }

    return apiError("Unable to delete comment.", 500);
  }
}

async function parseCommentId(context: CommentRouteContext) {
  const { commentId } = await context.params;
  const parsed = commentIdSchema.safeParse(commentId);

  if (!parsed.success) {
    return {
      ok: false as const,
      response: apiError("Invalid comment id.", 400, parsed.error.flatten()),
    };
  }

  return {
    ok: true as const,
    value: parsed.data,
  };
}
