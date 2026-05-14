import {
  deleteSecretValue,
  getSecretValue,
  saveSecretValue,
} from "./web-storage";

const AUTH_TOKEN_KEY = "taskflow.authToken";

export async function saveAuthToken(token: string) {
  await saveSecretValue(AUTH_TOKEN_KEY, token);
}

export async function getAuthToken() {
  return getSecretValue(AUTH_TOKEN_KEY);
}

export async function deleteAuthToken() {
  await deleteSecretValue(AUTH_TOKEN_KEY);
}
