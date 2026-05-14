type ApiErrorPayload = {
  error?: {
    message?: unknown;
  };
};

export async function readResponseJson(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

export function readApiErrorMessage(payload: unknown, fallback: string) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload
  ) {
    const error = (payload as ApiErrorPayload).error;

    if (typeof error?.message === "string" && error.message.length > 0) {
      return error.message;
    }
  }

  return fallback;
}
