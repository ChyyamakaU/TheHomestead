import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout, register as apiRegister, getMe } from '../api/auth';

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
 *   user           — safe user object or null
 *   isAuthenticated — boolean
 *   isAdmin        — admin or superadmin
 *   isTenant       — tenant role
 *   loading        — true while checking session on mount
 *   login(email, password) → Promise
 *   register(data)         → Promise
 *   logout()               → Promise
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

  const logout = useCallback(async () => {
    try { await apiLogout(); } catch { /* clear state regardless */ }
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
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
