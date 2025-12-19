import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, UserPlus, Shield, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import type { User, Permission } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';

const PERMISSIONS: { key: Permission; label: string; description: string }[] = [
  { key: 'view_dashboard', label: 'View Dashboard', description: 'Access to dashboard overview' },
  { key: 'view_employees', label: 'View Employees', description: 'View employee list and profiles' },
  { key: 'edit_employees', label: 'Edit Employees', description: 'Modify employee information' },
  { key: 'view_documents', label: 'View Documents', description: 'Access document library' },
  { key: 'manage_documents', label: 'Manage Documents', description: 'Upload and manage documents' },
  { key: 'view_settings', label: 'View Settings', description: 'Access settings page' },
  { key: 'manage_users', label: 'Manage Users', description: 'Add and edit users' },
  { key: 'manage_settings', label: 'Manage Settings', description: 'Modify system settings' },
];

const UserManagement = () => {
  const { users, reloadUsers } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    permissions: [] as Permission[],
  });

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        password: '',
        permissions: user.permissions,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        fullName: '',
        password: '',
        permissions: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      fullName: '',
      password: '',
      permissions: [],
    });
  };

  const handleTogglePermission = (permission: Permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleSave = async () => {
    if (!formData.username || !formData.email || !formData.fullName) {
      showWarning('Please fill in all required fields');
      return;
    }

    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, {
          username: formData.username,
          email: formData.email,
          fullName: formData.fullName,
          password: formData.password || undefined,
          permissions: formData.permissions,
          isActive: editingUser.isActive,
        });
      } else {
        if (!formData.password) {
          showWarning('Please enter a password for new users');
          return;
        }
        await api.post('/users', {
          username: formData.username,
          email: formData.email,
          fullName: formData.fullName,
          password: formData.password,
          permissions: formData.permissions,
        });
      }
      await reloadUsers();
      handleCloseDialog();
      showSuccess(editingUser ? 'User updated successfully!' : 'User added successfully!');
    } catch (err: any) {
      showError(err.message || 'Failed to save user');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.del(`/users/${userId}`);
      await reloadUsers();
      showSuccess('User deleted successfully!');
    } catch (err: any) {
      showError(err.message || 'Failed to delete user');
    }
  };

  const handleToggleActive = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    try {
      await api.put(`/users/${userId}`, {
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        permissions: user.permissions,
        isActive: !user.isActive,
      });
      await reloadUsers();
      showSuccess(`User ${!user.isActive ? 'activated' : 'deactivated'} successfully!`);
    } catch (err: any) {
      showError(err.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
            User Management
          </h2>
          <p className="text-sm text-slate-600">
            Manage system users and their access permissions
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="gap-2 bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto"
        >
          <UserPlus className="w-4 h-4" />
          Add New User
        </Button>
      </div>

      {/* Users List */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700">
                  User
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700">
                  Role
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden sm:table-cell">
                  Permissions
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden lg:table-cell">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-3 text-right text-xs sm:text-sm font-semibold text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-900 truncate">
                          {user.fullName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <Badge variant={user.role === 'admin' ? 'active' : 'secondary'}>
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </Badge>
                  </td>
                  <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {user.permissions.slice(0, 3).map((perm) => (
                        <span
                          key={perm}
                          className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded"
                        >
                          {PERMISSIONS.find(p => p.key === perm)?.label.split(' ')[0]}
                        </span>
                      ))}
                      {user.permissions.length > 3 && (
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                          +{user.permissions.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 hidden lg:table-cell">
                    <Badge variant={user.isActive ? 'available' : 'secondary'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(user)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {user.role !== 'admin' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Update user information and permissions'
                : 'Create a new user account with selected permissions'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Username *
                </label>
                <Input
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="Enter username"
                  disabled={!!editingUser}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Email *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Enter email"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Full Name *
                </label>
                <Input
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  {editingUser ? 'New Password (optional)' : 'Password *'}
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Enter password"
                />
              </div>
            </div>

            {/* Permissions */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-3 block">
                Permissions
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-2 border border-slate-200 rounded-lg">
                {PERMISSIONS.map((permission) => (
                  <label
                    key={permission.key}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(permission.key)}
                      onChange={() => handleTogglePermission(permission.key)}
                      className="mt-1 accent-emerald-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {permission.label}
                      </p>
                      <p className="text-xs text-slate-500">
                        {permission.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600">
              {editingUser ? 'Update User' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;

