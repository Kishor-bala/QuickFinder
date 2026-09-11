import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('qf_token'));
  const [loading, setLoading] = useState(true);

  // Check current user on init & check every 10 seconds for automatic logout if deleted in Firebase
  useEffect(() => {
    let isMounted = true;

    const checkUserStatus = async () => {
      const storedToken = localStorage.getItem('qf_token');
      if (!storedToken) {
        if (isMounted) setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (isMounted && res.data?.user) {
          setUser(res.data.user);
          setLoading(false);
        }
      } catch (err) {
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          console.warn('[Auth] Account deleted or deactivated. Automatically logging out...');
          localStorage.removeItem('qf_token');
          localStorage.removeItem('qf_user');
          if (isMounted) {
            setUser(null);
            setToken(null);
            setLoading(false);
          }
        } else if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkUserStatus();

    // Every 10 seconds, verify user status with backend & Firebase DB
    const intervalId = setInterval(checkUserStatus, 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [token]);

  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem('qf_token', receivedToken);
    localStorage.setItem('qf_user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const { token: receivedToken, user: receivedUser, emailVerificationLink } = res.data;
    localStorage.setItem('qf_token', receivedToken);
    localStorage.setItem('qf_user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    return { user: receivedUser, emailVerificationLink };
  };

  const loginWithFirebase = async (idToken, phone = null, options = {}) => {
    const payload = typeof phone === 'object' && phone !== null
      ? { idToken, ...phone }
      : { idToken, phone, ...options };
    const res = await api.post('/auth/firebase', payload);
    if (res.data?.requirePhone || res.data?.requireRegistration) {
      return res.data;
    }
    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem('qf_token', receivedToken);
    localStorage.setItem('qf_user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const logout = () => {
    localStorage.removeItem('qf_token');
    localStorage.removeItem('qf_user');
    setUser(null);
    setToken(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('qf_user', JSON.stringify(updatedUser));
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin,
        login,
        loginWithFirebase,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
