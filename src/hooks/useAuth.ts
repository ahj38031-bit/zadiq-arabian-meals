import { useCallback, useEffect, useState } from "react";

const KEY = "zadak-user-info-v1";
const EVENT = "zadak-auth-change";

export type LocalUser = { name: string; email: string; language?: string; savedAt?: number };

function read(): LocalUser | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalUser;
    return parsed?.name && parsed?.email ? parsed : null;
  } catch {
    return null;
  }
}

export function signInLocal(user: LocalUser) {
  window.localStorage.setItem(KEY, JSON.stringify({ ...user, savedAt: Date.now() }));
  window.dispatchEvent(new Event(EVENT));
}

/** Local, browser-only account: name + email kept in this device's storage. */
export function useAuth() {
  const [user, setUser] = useState<LocalUser | null>(() => read());
  useEffect(() => {
    const sync = () => setUser(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const logout = useCallback(async () => {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return { user, loading: false, error: null, isAuthenticated: Boolean(user), logout, refresh: () => setUser(read()) };
}
