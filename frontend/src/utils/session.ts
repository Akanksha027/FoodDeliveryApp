// src/utils/session.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SessionData {
  access_token: string;
  role: string;
}

export const storeSession = async (session: SessionData) => {
  try {
    await AsyncStorage.setItem('session', JSON.stringify(session));
  } catch (e) {
    console.error('Failed to store session', e);
  }
};

export const getSession = async (): Promise<SessionData | null> => {
  try {
    const json = await AsyncStorage.getItem('session');
    return json ? JSON.parse(json) : null;
  } catch (e) {
    console.error('Failed to get session', e);
    return null;
  }
};

export const clearSession = async () => {
  try {
    await AsyncStorage.removeItem('session');
  } catch (e) {
    console.error('Failed to clear session', e);
  }
};
