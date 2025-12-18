import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings as SettingsIcon, Bell, Shield, Users, Lock, Mail, Globe, Save, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import UserManagement from '../components/UserManagement';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { hasPermission, user } = useAuth();
  const [companyName, setCompanyName] = useState('Global Cargo Shipping Company');
  const [email, setEmail] = useState('admin@globalcargoshipping.com');
  const [timezone, setTimezone] = useState('UTC');
  const [language, setLanguage] = useState('en');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [notifications, setNotifications] = useState({
    email: true,
    documentExpiry: true,
    documentExpiringSoon: true,
    newEmployee: false,
  });
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const handleSaveSettings = () => {
    // In a real app, this would save to backend
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }
    // In a real app, this would update password
    alert('Password updated successfully!');
    setShowPasswordDialog(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4 sm:space-y-6"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-1 sm:mb-2">
            Settings
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Manage your account and application preferences
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-4 sm:space-y-6">
          <TabsList className="glass rounded-lg p-1 h-auto w-full sm:w-auto overflow-x-auto">
            <TabsTrigger value="general" className="px-3 sm:px-6 py-2 text-xs sm:text-sm">
              General
            </TabsTrigger>
            {hasPermission('manage_users') && (
              <TabsTrigger value="users" className="px-3 sm:px-6 py-2 text-xs sm:text-sm">
                Users
              </TabsTrigger>
            )}
          </TabsList>

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* General Settings */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="lg:col-span-2 glass rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-6"
              >
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <SettingsIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">General Settings</h2>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2 block flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Company Name
                    </label>
                    <Input 
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base" 
                    />
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2 block flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </label>
                    <Input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base" 
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2 block">
                        Timezone
                      </label>
                      <select 
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                        <option value="EST">EST (Eastern Standard Time)</option>
                        <option value="PST">PST (Pacific Standard Time)</option>
                        <option value="GMT">GMT (Greenwich Mean Time)</option>
                        <option value="CET">CET (Central European Time)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2 block">
                        Language
                      </label>
                      <select 
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2 block">
                      Date Format
                    </label>
                    <select 
                      value={dateFormat}
                      onChange={(e) => setDateFormat(e.target.value)}
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button 
                    onClick={handleSaveSettings}
                    className="bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto" 
                    size="sm"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  {saveSuccess && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 text-emerald-600 text-sm"
                    >
                      <Check className="w-4 h-4" />
                      Settings saved
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Quick Actions */}
              <div className="space-y-4 sm:space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="glass rounded-xl p-4 sm:p-6"
                >
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <Bell className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">Notifications</h3>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-xs sm:text-sm">
                      <input
                        type="checkbox"
                        checked={notifications.email}
                        onChange={(e) => setNotifications(prev => ({ ...prev, email: e.target.checked }))}
                        className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>Email Notifications</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs sm:text-sm">
                      <input
                        type="checkbox"
                        checked={notifications.documentExpiry}
                        onChange={(e) => setNotifications(prev => ({ ...prev, documentExpiry: e.target.checked }))}
                        className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>Document Expiry Alerts</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs sm:text-sm">
                      <input
                        type="checkbox"
                        checked={notifications.documentExpiringSoon}
                        onChange={(e) => setNotifications(prev => ({ ...prev, documentExpiringSoon: e.target.checked }))}
                        className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>Expiring Soon Warnings</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs sm:text-sm">
                      <input
                        type="checkbox"
                        checked={notifications.newEmployee}
                        onChange={(e) => setNotifications(prev => ({ ...prev, newEmployee: e.target.checked }))}
                        className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>New Employee Notifications</span>
                    </label>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="glass rounded-xl p-4 sm:p-6"
                >
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <Shield className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">Security</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 mb-3 sm:mb-4">
                    Update your password and security settings
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full text-xs sm:text-sm" 
                    size="sm"
                    onClick={() => setShowPasswordDialog(true)}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                  {user && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="text-xs text-slate-500 mb-1">Logged in as:</p>
                      <p className="text-sm font-medium text-slate-900">{user.fullName}</p>
                      <p className="text-xs text-slate-600">{user.email}</p>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </TabsContent>

          {/* User Management Tab */}
          {hasPermission('manage_users') && (
            <TabsContent value="users" className="space-y-4 sm:space-y-6">
              <UserManagement />
            </TabsContent>
          )}
        </Tabs>
      </motion.div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Change Password
            </DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Current Password
              </label>
              <Input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                New Password
              </label>
              <Input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full"
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Confirm New Password
              </label>
              <Input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPasswordDialog(false);
              setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }}>
              Cancel
            </Button>
            <Button onClick={handlePasswordChange} className="bg-emerald-500 hover:bg-emerald-600">
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
