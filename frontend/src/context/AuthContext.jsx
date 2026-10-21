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
        systemRole: 'ADMIN',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
      };
    } catch (e) {
      return null;
    }
  });

  const [availableUsers, setAvailableUsers] = useState([]);

  useEffect(() => {
    // Fetch available demo users for the role switcher
    fetchApi('/auth/demo-users')
      .then(users => {
        if (Array.isArray(users)) setAvailableUsers(users);
      })
      .catch(() => {});
  }, []);

  const login = async (email, password) => {
    const res = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (res.token) {
      localStorage.setItem('sdlc_user_token', res.token);
    }
    if (res.user) {
      setUser(res.user);
      localStorage.setItem('sdlc_user_session', JSON.stringify(res.user));
    }
    return res;
  };

  const switchUser = (newUser) => {
    setUser(newUser);
    localStorage.setItem('sdlc_user_session', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sdlc_user_session');
    localStorage.removeItem('sdlc_user_token');
  };

  const changePassword = async (currentPassword, newPassword) => {
    return await fetchApi('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ userId: user?.id, currentPassword, newPassword })
    });
  };

  return (
    <AuthContext.Provider value={{ user, setUser: switchUser, availableUsers, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
