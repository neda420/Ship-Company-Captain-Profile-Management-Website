import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, LoginCredentials, Permission } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  users: User[];
  reloadUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reloadUsers = async () => {
    try {
      const data = await api.get<User[]>('/users');
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users', err);
    }
  };

  // Verify token and load user on mount
  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('currentUser');

      // If no token or user, clear everything
      if (!token || !storedUser) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        // Verify token is still valid by calling the verify endpoint
        const response = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // If token is invalid, clear storage
        if (!response.ok) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Token is valid, get fresh user data from server
        const data = await response.json();
        setUser(data.user);

        // Update localStorage with fresh user data
        localStorage.setItem('currentUser', JSON.stringify(data.user));

        // Load users list if admin
        if (data.user.role === 'admin') {
          await reloadUsers();
        }
      } catch (error) {
        // Network error or invalid token - clear storage
        console.error('Auth verification failed:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      const data = await api.post<{ token: string; user: User }>('/auth/login', credentials);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      setUser(data.user);
      // Load users list if admin
      if (data.user.role === 'admin') {
        await reloadUsers();
      }
      return true;
    } catch (err) {
      console.error('Login error', err);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions.includes(permission);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    hasPermission,
    isAuthenticated: !!user,
    isLoading,
    users,
    reloadUsers,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
