import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, LoginCredentials, Permission } from '../types';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  isAuthenticated: boolean;
  users: User[];
  setUsers: (users: User[]) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default admin user (in production, this would come from a backend)
const DEFAULT_ADMIN: User = {
  id: '1',
  username: 'admin',
  email: 'admin@globalcargoshipping.com',
  fullName: 'Admin User',
  role: 'admin',
  permissions: [
    'view_dashboard',
    'view_employees',
    'edit_employees',
    'view_documents',
    'manage_documents',
    'view_settings',
    'manage_users',
    'manage_settings',
  ],
  avatarUrl: undefined,
  createdAt: new Date().toISOString(),
  isActive: true,
};

// Default password (in production, this would be hashed and stored securely)
const ADMIN_PASSWORD = 'admin123';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([DEFAULT_ADMIN]);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const storedUsers = localStorage.getItem('users');
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      // Initialize with default admin
      localStorage.setItem('users', JSON.stringify([DEFAULT_ADMIN]));
    }
  }, []);

  // Save users to localStorage whenever it changes
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('users', JSON.stringify(users));
    }
  }, [users]);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const foundUser = users.find(
      u => u.username === credentials.username && u.isActive
    );

    if (!foundUser) {
      return false;
    }

    // Check password (in production, this would be hashed)
    if (foundUser.role === 'admin' && credentials.password !== ADMIN_PASSWORD) {
      return false;
    }

    // For non-admin users, you'd check their password from a secure store
    // For now, we'll allow any password for demo purposes (NOT FOR PRODUCTION)
    if (foundUser.role !== 'admin') {
      // In production, verify password hash here
      // For demo, we'll check if password exists in user object (not secure!)
      const userPassword = (foundUser as any).password;
      if (userPassword && credentials.password !== userPassword) {
        return false;
      }
    }

    setUser(foundUser);
    localStorage.setItem('currentUser', JSON.stringify(foundUser));
    
    // Update last login
    const updatedUser = { ...foundUser, lastLogin: new Date().toISOString() };
    const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(updatedUsers);
    
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
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
    users,
    setUsers,
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
