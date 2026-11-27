import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { account, ensureAppwriteConfig } from '../lib/appwrite';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      ensureAppwriteConfig();
      setUser(await account.get());
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const loginStudent = useCallback(async (studentId, password) => {
    ensureAppwriteConfig();
    const normalizedId = studentId.trim().toLowerCase();
    if (!normalizedId) throw new Error('Enter your Student ID.');
    await account.deleteSession('current').catch(() => {});
    await account.createEmailPasswordSession(`${normalizedId}@exam.local`, password);
    const nextUser = await account.get();
    setUser(nextUser);
    return nextUser;
  }, []);

  const loginAdmin = useCallback(async (email, password) => {
    ensureAppwriteConfig();
    await account.deleteSession('current').catch(() => {});
    await account.createEmailPasswordSession(email.trim(), password);
    const nextUser = await account.get();
    if (!nextUser.labels?.includes('admin')) {
      await account.deleteSession('current').catch(() => {});
      setUser(null);
      throw new Error('This account does not have the admin label.');
    }
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    await account.deleteSession('current').catch(() => {});
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, refresh, loginStudent, loginAdmin, logout }), [user, loading, refresh, loginStudent, loginAdmin, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
