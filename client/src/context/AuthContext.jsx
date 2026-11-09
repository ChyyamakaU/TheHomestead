import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout, register as apiRegister, getMe, googleCallback as apiGoogleCallback } from '../api/auth';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export { AuthContext };

/**
 * useAuth — convenience hook to access the auth context.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

/**
 * AuthProvider — manages authentication state for all roles.
 *
 * On mount: calls GET /api/auth/me to restore session from the HTTP-only cookie.
 * Exposes:
 *   user              — safe user object or null
 *   isAuthenticated   — boolean
 *   isAdmin           — admin or superadmin
 *   isTenant          — tenant role
 *   loading           — true while checking session on mount
 *   login(email, password)  → Promise
 *   register(data)          → Promise
 *   loginWithGoogle()       → Promise — initiates Google OAuth via Supabase
 *   logout()                → Promise
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getMe()
      .then((data) => { if (active) setUser(data.user); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await apiLogin({ email, password });
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (formData) => {
    const data = await apiRegister(formData);
    setUser(data.user);
    return data;
  }, []);

  /**
   * loginWithGoogle — redirect to Google via Supabase OAuth.
   * After Google redirects back, /auth/callback completes the flow
   * by calling apiGoogleCallback, which is also exposed here for
   * use by the AuthCallbackPage.
   */
  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  }, []);

  /**
   * completeGoogleLogin — called by AuthCallbackPage after Supabase
   * sets the session. Sends the access token to the Express backend
   * to get a JWT cookie, then updates auth state.
   */
  const completeGoogleLogin = useCallback(async (accessToken) => {
    const data = await apiGoogleCallback(accessToken);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try { await apiLogout(); } catch { /* clear state regardless */ }
    // Also sign out of Supabase session (best-effort)
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
    setUser(null);
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
    isSuperadmin: user?.role === 'superadmin',
    isTenant: user?.role === 'tenant',
    loading,
    login,
    register,
    loginWithGoogle,
    completeGoogleLogin,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
