'use client';
import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [team, setTeam] = useState(null); // Cache for team members
  const [teamLoading, setTeamLoading] = useState(false);

  const DEFAULT_THEME = '#ea580c';

  // Apply Brand Theme
  const applyTheme = (color) => {
    const themeColor = color || DEFAULT_THEME;
    const root = document.documentElement;
    root.style.setProperty('--primary-base', themeColor);
    root.style.setProperty('--primary-hover', themeColor + 'dd');
    root.style.setProperty('--primary-shadow', `${themeColor}33`);
  };

  useEffect(() => {
    if (user?.companyId?.themeColor) {
      applyTheme(user.companyId.themeColor);
    } else {
      applyTheme(DEFAULT_THEME);
    }
  }, [user]);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await API.get('/auth/getMe');
        if (response.data.status === 'success') {
          setUser(response.data.data.user);
        }
      } catch (err) {
        // Not logged in or session expired
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await API.post('/auth/login', {
        email,
        password,
      });

      if (response.data.status === 'password-reset-required') {
          return 'password-reset-required';
      }

      const { data } = response.data;
      
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      throw err;
    }
  };

  const fetchTeam = async (force = false) => {
    if (team && !force) return team;
    setTeamLoading(true);
    try {
      const res = await API.get('/users/company-users');
      const users = res.data.data.users || [];
      setTeam(users);
      return users;
    } catch (err) {
      console.error('Failed to fetch team members', err);
      return [];
    } finally {
      setTeamLoading(false);
    }
  };

  const fetchTeamStats = async (year) => {
    setTeamLoading(true);
    try {
      const res = await API.get(`/sales/team-stats${year ? `?year=${year}` : ''}`);
      const stats = res.data.data.teamStats || [];
      // Optionally update team cache if you want performance data globally
      // setTeam(stats); 
      return stats;
    } catch (err) {
      console.error('Failed to fetch team performance stats', err);
      return [];
    } finally {
      setTeamLoading(false);
    }
  };

  const logout = async () => {
    try {
      await API.get('/auth/logout');
      setUser(null);
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, setUser, login, logout, 
      loading, error, 
      team, fetchTeam, fetchTeamStats, teamLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
