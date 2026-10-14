import { useCallback, useEffect, useState } from "react";

const KEY = "zadak-user-info-v1";
const ACCOUNTS_KEY = "zadak-accounts-v1";
const EVENT = "zadak-auth-change";

export type LocalUser = { name: string; email: string; language?: string; savedAt?: number };
type Account = { name: string; email: string; passwordHash: string; createdAt: number };

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

function readAccounts(): Account[] {
  try {
    return JSON.parse(window.localStorage.getItem(ACCOUNTS_KEY) ?? "[]") as Account[];
  } catch {
    return [];
  }
}

async function hash(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function signInLocal(user: LocalUser) {
  window.localStorage.setItem(KEY, JSON.stringify({ ...user, savedAt: Date.now() }));
  window.dispatchEvent(new Event(EVENT));
}

export type AuthResult = { ok: true; user: LocalUser } | { ok: false; error: "exists" | "not_found" | "wrong_password" };

export async function registerLocal(name: string, email: string, password: string): Promise<AuthResult> {
  const accounts = readAccounts();
  if (accounts.some((a) => a.email === email)) return { ok: false, error: "exists" };
  accounts.push({ name, email, passwordHash: await hash(password), createdAt: Date.now() });
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  return { ok: true, user: { name, email } };
}

export async function loginLocal(email: string, password: string): Promise<AuthResult> {
  const account = readAccounts().find((a) => a.email === email);
  if (!account) return { ok: false, error: "not_found" };
  if (account.passwordHash !== (await hash(password))) return { ok: false, error: "wrong_password" };
  return { ok: true, user: { name: account.name, email: account.email } };
}

/** Local, browser-only accounts kept in this device's storage. */
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
