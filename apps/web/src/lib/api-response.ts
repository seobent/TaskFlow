import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export type ApiErrorBody = {
  error: {
    message: string;
    details?: unknown;
  };
};

export function apiSuccess<TData>(data: TData, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function apiError(
  message: string,
  status: number,
  details?: unknown,
) {
  const body: ApiErrorBody = {
    error: {
      message,
    },
  };

  if (details !== undefined) {
    body.error.details = details;
  }

  return NextResponse.json(body, { status });
}

export function validationError(error: ZodError) {
  return apiError("Invalid request body.", 400, error.flatten());
}
