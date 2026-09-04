import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "mednexus:";

/**
 * Minimal async key/value store that works on both React Native (AsyncStorage,
 * bundled in Expo Go) and web (localStorage). All reads/writes are safe —
 * they never throw and return null on any failure.
 */
export async function storageGet(key: string): Promise<string | null> {
  const full = PREFIX + key;
  if (Platform.OS === "web") {
    try {
      return globalThis.localStorage?.getItem(full) ?? null;
    } catch {
      return null;
    }
  }
  try {
    return await AsyncStorage.getItem(full);
  } catch {
    return null;
  }
}

export async function storageSet(key: string, value: string): Promise<void> {
  const full = PREFIX + key;
  if (Platform.OS === "web") {
    try {
      globalThis.localStorage?.setItem(full, value);
    } catch {
      /* ignore */
    }
    return;
  }
  try {
    await AsyncStorage.setItem(full, value);
  } catch {
    /* ignore */
  }
}
