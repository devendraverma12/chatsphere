import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Configure Axios default base URL
axios.defaults.baseURL = import.meta.env.PROD ? '/' : 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set default bearer authorization token
  const setAuthHeader = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  useEffect(() => {
    const initAuth = () => {
      const stored = localStorage.getItem('userInfo');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          setAuthHeader(parsed.token);
        } catch (e) {
          console.error('Failed parsing userInfo from localstorage:', e);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // Clear session if backend returns 401 (e.g. database cleared / user deleted)
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          console.warn('Session expired or user deleted from DB. Redirecting to login.');
          setUser(null);
          setAuthHeader(null);
          localStorage.removeItem('userInfo');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/login', { email, password });
      setUser(data);
      setAuthHeader(data.token);
      localStorage.setItem('userInfo', JSON.stringify(data));
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      throw error.response?.data?.message || 'Login failed';
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/register', { name, email, password });
      setUser(data);
      setAuthHeader(data.token);
      localStorage.setItem('userInfo', JSON.stringify(data));
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      throw error.response?.data?.message || 'Registration failed';
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (e) {
      console.warn('Backend logout status update failed', e.message);
    }
    setUser(null);
    setAuthHeader(null);
    localStorage.removeItem('userInfo');
  };

  const updateProfile = async (profileData) => {
    try {
      const { data } = await axios.put('/api/auth/profile', profileData);
      const merged = { ...user, ...data };
      setUser(merged);
      localStorage.setItem('userInfo', JSON.stringify(merged));
      return merged;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to update profile settings';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
