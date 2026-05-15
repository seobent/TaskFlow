import {
  readApiData,
  readApiErrorMessage,
  readResponseJson,
} from "@/lib/api-client";

export class AdminRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminRequestError";
    this.status = status;
  }
}

export async function fetchAdminResource<TData>(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  const response = await fetch(input, {
    credentials: "include",
    ...init,
  });
  const body = await readResponseJson(response);

  if (!response.ok) {
    throw new AdminRequestError(
      readApiErrorMessage(body, "Unable to load admin data."),
      response.status,
    );
  }

  const payload = readApiData<TData>(body);

  if (!payload) {
    throw new AdminRequestError("Unexpected admin response.", response.status);
  }

  return payload;
}
