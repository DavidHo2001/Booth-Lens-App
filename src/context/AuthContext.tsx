import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {login as loginApi, LoginPayload, logout as logoutApi} from '../api/auth';
import {getMe} from '../api/user';
import {MeResponse} from '../types/api';
import {clearToken, getToken, setToken} from '../storage/tokenStorage';

type AuthContextType = {
  initializing: boolean;
  token: string | null;
  me: MeResponse | null;
  login: (payload: LoginPayload) => Promise<void>;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [initializing, setInitializing] = useState(true);
  const [token, setTokenState] = useState<string | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);

  const logout = useCallback(async () => {
    await logoutApi(token);
    await clearToken();
    setTokenState(null);
    setMe(null);
  }, [token]);

  const refreshMe = useCallback(async () => {
    if (!token) {
      setMe(null);
      return;
    }
    try {
      const data = await getMe(token);
      setMe(data);
    } catch (error) {
      await logout();
      throw error;
    }
  }, [token, logout]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const result = await loginApi(payload);
      await setToken(result.token);
      setTokenState(result.token);
      const meData = await getMe(result.token);
      setMe(meData);
    },
    [],
  );

  useEffect(() => {
    async function bootstrap() {
      try {
        const storedToken = await getToken();
        if (!storedToken) {
          setInitializing(false);
          return;
        }
        setTokenState(storedToken);
        const meData = await getMe(storedToken);
        setMe(meData);
      } catch {
        await clearToken();
        setTokenState(null);
        setMe(null);
      } finally {
        setInitializing(false);
      }
    }

    bootstrap();
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      initializing,
      token,
      me,
      login,
      refreshMe,
      logout,
    }),
    [initializing, token, me, login, refreshMe, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}

