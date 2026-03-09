// ─── Keys ────────────────────────────────────────────────────────────────────
const TOKEN_KEY = 'lh_access_token';
const REFRESH_KEY = 'lh_refresh_token';
const USER_KEY = 'lh_user';
const ONBOARDING_KEY = 'lh_onboarding_seen';

// ─── Access Token ─────────────────────────────────────────────────────────────
export const storage = {
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  removeToken: (): void => localStorage.removeItem(TOKEN_KEY),

  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_KEY),
  setRefreshToken: (token: string): void => localStorage.setItem(REFRESH_KEY, token),
  removeRefreshToken: (): void => localStorage.removeItem(REFRESH_KEY),

  getUser: <T>(): T | null => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  setUser: <T>(user: T): void => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  removeUser: (): void => localStorage.removeItem(USER_KEY),

  clearAll: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },

  // ─── Onboarding ───────────────────────────────────────────────────────────
  getOnboardingSeen: (): boolean => localStorage.getItem(ONBOARDING_KEY) === 'true',
  setOnboardingSeen: (): void => localStorage.setItem(ONBOARDING_KEY, 'true'),
};
