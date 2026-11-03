import { createContext, useContext } from 'react';
import { login as apiLogin, logout as apiLogout, getMe } from '../api/auth';

const AuthContext = createContext(null);

export { AuthContext };

/**
 * Convenience hook to access the auth context.
 * @returns {{ user, isAuthenticated, isAdmin, login, logout, loading }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

/**
 * AuthProvider component — manages authentication state.
 *
 * On mount it calls GET /api/auth/me to check whether the HTTP-only JWT
 * cookie is still valid. If so, the user object is populated and the
 * admin routes become accessible.
 *
 * login() calls the login API; on success it sets the user.
 * logout() calls the logout API; on success it clears the user.
 */
import { useState, useEffect, useCallback } from 'react';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if the session cookie is valid on initial load
  useEffect(() => {
    let active = true;
    getMe()
      .then((data) => {
        if (active) setUser(data.user);
      })
      .catch(() => {
        // 401 or network error — not authenticated
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await apiLogin({ email, password });
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Even if the API call fails, clear local state
    }
    setUser(null);
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
    isSuperadmin: user?.role === 'superadmin',
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
