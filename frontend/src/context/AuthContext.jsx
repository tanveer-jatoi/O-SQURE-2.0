import { createContext, useCallback, useEffect, useState } from 'react';
import {
  axiosClient,
  setAccessToken,
  setOnSessionExpired,
} from '../api/axiosClient.js';

export const AuthContext = createContext(null);

export function getRoleHomePath(role) {
  switch (role) {
    case 'superadmin':
      return '/superadmin';
    case 'admin':
      return '/admin';
    case 'teacher':
      return '/teacher';
    case 'student':
      return '/student';
    default:
      return '/login';
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  // Attempt silent session restoration via HttpOnly refresh cookie on boot
  useEffect(() => {
    setOnSessionExpired(clearSession);

    let isMounted = true;
    async function bootstrapSession() {
      try {
        const refreshRes = await axiosClient.post('/auth/refresh');
        const token = refreshRes.data?.data?.accessToken;
        if (token) {
          setAccessToken(token);
          const meRes = await axiosClient.get('/auth/me');
          if (isMounted) {
            setUser(meRes.data?.data?.user || null);
          }
        }
      } catch {
        if (isMounted) {
          clearSession();
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    bootstrapSession();
    return () => {
      isMounted = false;
    };
  }, [clearSession]);

  const login = useCallback(async (identifier, password) => {
    const res = await axiosClient.post('/auth/login', { identifier, password });
    const { accessToken, user: loggedInUser } = res.data.data;
    setAccessToken(accessToken);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await axiosClient.post('/auth/logout');
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const hasPermission = useCallback(
    (code) => {
      if (!user) return false;
      if (user.role === 'superadmin') return true;
      return Array.isArray(user.permissions) && user.permissions.includes(code);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isInitializing,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
