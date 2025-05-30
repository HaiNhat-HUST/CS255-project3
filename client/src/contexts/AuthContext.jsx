// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api'; // Your API service

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null); // { _id, username, email, userPublicKey, token }
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Effect to check auth status on app load (e.g., from localStorage token)
  useEffect(() => {
    const loadUserFromToken = async () => {
      const token = localStorage.getItem('userToken'); // Or however you store it
      if (token) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await api.get('/auth/me'); // Fetch user profile
          setUserInfo({ ...response.data, token });
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Failed to load user from token", error);
          localStorage.removeItem('userToken');
        }
      }
      setLoadingAuth(false);
    };
    loadUserFromToken();
  }, []);

  const login = (userData) => { // userData includes token, _id, username, email, userPublicKey
    localStorage.setItem('userToken', userData.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
    setUserInfo(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('userToken');
    delete api.defaults.headers.common['Authorization'];
    setUserInfo(null);
    setIsAuthenticated(false);
    // keyManager.clearSessionKeys(); // Important: Clear any in-memory crypto keys
  };

  const updateUserProfile = (updatedFields) => {
    setUserInfo(prev => ({ ...prev, ...updatedFields }));
  };


  return (
    <AuthContext.Provider value={{ userInfo, isAuthenticated, loadingAuth, login, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);