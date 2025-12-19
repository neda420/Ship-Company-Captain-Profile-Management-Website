import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings as SettingsIcon, Bell, Shield, Users, Lock, Mail, Globe, Save, Check, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import UserManagement from '../components/UserManagement';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';

const Settings = () => {
  const { hasPermission, user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [companyName, setCompanyName] = useState('Global Cargo Shipping Company');
  const [email, setEmail] = useState('admin@globalcargoshipping.com');
  const [timezone, setTimezone] = useState('UTC');
  const [language, setLanguage] = useState('en');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState('');

  // Load settings from database on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const settings = await api.get<{
          company_name?: string;
          company_email?: string;
          timezone?: string;
          language?: string;
          date_format?: string;
        }>('/settings');
        
        if (settings.company_name) setCompanyName(settings.company_name);
        if (settings.company_email) setEmail(settings.company_email);
        if (settings.timezone) setTimezone(settings.timezone);
        if (settings.language) setLanguage(settings.language);
        if (settings.date_format) setDateFormat(settings.date_format);
      } catch (err: any) {
        console.error('Failed to load settings:', err);
        setError('Failed to load settings. Using defaults.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);
  
  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setError('');
      
      await api.put('/settings', {
        company_name: companyName,
        company_email: email,
        timezone: timezone,
        language: language,
        date_format: dateFormat,
      });
      
      setSaveSuccess(true);
      showSuccess('Settings saved successfully!');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setError(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    try {
      setIsChangingPassword(true);
      setError('');
      
      await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      showSuccess('Password updated successfully!');
      setShowPasswordDialog(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      console.error('Failed to change password:', err);
      setError(err.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
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
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            )}
            {!isLoading && (
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

                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
                  >
                    {error}
                  </motion.div>
                )}
                
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={handleSaveSettings}
                    disabled={isLoading || isSaving}
                    className="bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto" 
                    size="sm"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
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
            )}
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
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Current Password
              </label>
              <Input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => {
                  setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }));
                  setError('');
                }}
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
                onChange={(e) => {
                  setPasswordData(prev => ({ ...prev, newPassword: e.target.value }));
                  setError('');
                }}
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
                onChange={(e) => {
                  setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }));
                  setError('');
                }}
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowPasswordDialog(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setError('');
              }}
              disabled={isChangingPassword}
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePasswordChange} 
              disabled={isChangingPassword}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
