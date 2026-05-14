import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const memoryStorage = new Map<string, string>();

export async function saveSecretValue(key: string, value: string) {
  if (Platform.OS === "web") {
    memoryStorage.set(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

export async function getSecretValue(key: string) {
  if (Platform.OS === "web") {
    return memoryStorage.get(key) ?? null;
  }

  return SecureStore.getItemAsync(key);
}

export async function deleteSecretValue(key: string) {
  if (Platform.OS === "web") {
    memoryStorage.delete(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export async function savePublicValue(key: string, value: string) {
  const storage = getBrowserStorage();

  if (storage) {
    storage.setItem(key, value);
    return;
  }

  memoryStorage.set(key, value);
}

export async function getPublicValue(key: string) {
  const storage = getBrowserStorage();

  if (storage) {
    return storage.getItem(key);
  }

  return memoryStorage.get(key) ?? null;
}

function getBrowserStorage() {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}
