import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { authApi, IS_MOCK } from '../lib/api';
import type { AuthUser, LoginPayload, RegisterPayload, UserRole } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (patch: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Mock-mode persistence (no Supabase) ──────────────────────────────────────
const USER_KEY = 'upp_user';

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

// ── Profile loader ────────────────────────────────────────────────────────────
async function fetchProfile(userId: string): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role as UserRole,
    department: data.department ?? undefined,
    matricNumber: data.matric_number ?? undefined,
    staffId: data.staff_id ?? undefined,
    specialization: data.specialization ?? undefined,
    avatarUrl: data.avatar_url ?? undefined,
  };
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(IS_MOCK ? readStoredUser() : null);
  const [loading, setLoading] = useState(!IS_MOCK); // Supabase needs a tick to restore session
  const [error, setError] = useState<string | null>(null);

  // ── Supabase session listener ─────────────────────────────────────────────
  useEffect(() => {
    if (IS_MOCK) return;

    // Restore existing session on mount.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
      }
      setLoading(false);
    });

    // Keep auth state in sync across tabs and after token refresh.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        return;
      }
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────
  const login = useCallback(async (payload: LoginPayload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login(payload);
      if (IS_MOCK) {
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        setUser(res.user);
      }
      // In Supabase mode, onAuthStateChange fires automatically.
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Login failed. Please try again.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.register(payload);
      if (IS_MOCK) {
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        setUser(res.user);
      }
      // In Supabase mode, onAuthStateChange fires automatically.
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Registration failed. Please try again.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    if (IS_MOCK) {
      localStorage.removeItem(USER_KEY);
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
    // onAuthStateChange → SIGNED_OUT will setUser(null).
  }, []);

  const refreshUser = useCallback(async () => {
    if (IS_MOCK) return;
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const profile = await fetchProfile(authUser.id);
      setUser(profile);
    }
  }, []);

  // Immediately patches the in-memory user — no DB round-trip, instant everywhere.
  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setUser(prev => prev ? { ...prev, ...patch } : null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, clearError, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

const AUTH_FALLBACK: AuthContextValue = {
  user: null,
  loading: false,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  clearError: () => {},
  refreshUser: async () => {},
  updateUser: () => {},
};

export function useAuth() {
  return useContext(AuthContext) ?? AUTH_FALLBACK;
}

export function useRefreshUser() {
  return useAuth().refreshUser;
}

/** Convenience helper — returns the authenticated user's role or null. */
export function useRole(): UserRole | null {
  const { user } = useAuth();
  return user?.role ?? null;
}
