import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthUser } from "../../features/auth/types/auth";

const AUTH_KEY = "hidrus.auth";
let memoryUser: AuthUser | null = null;

export async function saveAuthUser(user: AuthUser | null) {
  try {
    if (!user) {
      await AsyncStorage.removeItem(AUTH_KEY);
      memoryUser = null;
      return;
    }
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
    memoryUser = user;
  } catch (error) {
    // Fallback for environments where AsyncStorage native module is unavailable.
    memoryUser = user;
    console.warn("AsyncStorage unavailable, using in-memory session:", error);
  }
}

export async function getSavedAuthUser(): Promise<AuthUser | null> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_KEY);
    if (!raw) return memoryUser;
    return JSON.parse(raw) as AuthUser;
  } catch (error) {
    console.warn("AsyncStorage read failed, using in-memory session:", error);
    return memoryUser;
  }
}
