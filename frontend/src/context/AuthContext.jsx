import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sdlc_user_session');
      return saved ? JSON.parse(saved) : {
        id: 'usr-pm-01',
        email: 'john.pm@bankgov.com',
        name: 'John Smith',
        role: 'Project Manager',
        title: 'Senior Project Manager',
        systemRole: 'ADMIN'
      };
    } catch(e) {
      return null;
    }
  });

  const login = async (email, password) => {
    const res = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.user) {
      setUser(res.user);
      localStorage.setItem('sdlc_user_session', JSON.stringify(res.user));
    }
    return res;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sdlc_user_session');
  };

  const changePassword = async (currentPassword, newPassword) => {
    const res = await fetchApi('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ userId: user?.id, currentPassword, newPassword })
    });
    return res;
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
