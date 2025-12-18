import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  Menu, 
  X,
  Ship,
  LogOut,
  UserPlus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', permission: 'view_dashboard' },
  { icon: Users, label: 'All Employees', path: '/employees', permission: 'view_employees' },
  { icon: FileText, label: 'Documents', path: '/documents', permission: 'view_documents' },
  { icon: Settings, label: 'Settings', path: '/settings', permission: 'view_settings' },
  { icon: UserPlus, label: 'Add Captain', path: '/add-captain', permission: 'edit_employees' },
];

interface GlassSidebarProps {
  onWidthChange?: (width: number) => void;
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
}

const GlassSidebar = ({ onWidthChange, isMobileOpen, onMobileToggle }: GlassSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();

  useEffect(() => {
    if (onWidthChange) {
      onWidthChange(isCollapsed ? 80 : 280);
    }
  }, [isCollapsed, onWidthChange]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredMenuItems = menuItems.filter(item => 
    !item.permission || hasPermission(item.permission as any)
  );

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={onMobileToggle}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                "fixed left-0 top-0 h-full z-50 glass-dark w-[280px] lg:hidden flex flex-col",
                "border-r border-white/10"
              )}
            >
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <Ship className="w-8 h-8 text-emerald-400" />
                  <span className="text-xl font-bold text-white tracking-wide">
                    Global Shipping
                  </span>
                </div>
                <button
                  onClick={onMobileToggle}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {filteredMenuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onMobileToggle}
                      className="relative block"
                    >
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                          "text-white/70 hover:text-white hover:bg-white/10",
                          isActive && "text-white"
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeTabMobile"
                            className="absolute inset-0 bg-emerald-500/20 rounded-lg"
                            initial={false}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          />
                        )}
                        <Icon className={cn(
                          "w-5 h-5 relative z-10",
                          isActive && "text-emerald-400"
                        )} />
                        <span className="relative z-10 font-medium">{item.label}</span>
                      </motion.div>
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Footer */}
              <div className="p-4 border-t border-white/10 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-white flex-shrink-0">
                    {user?.fullName.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.fullName || 'Admin User'}
                    </p>
                    <p className="text-xs text-white/60 truncate">
                      {user?.role === 'admin' ? 'HR Director' : 'User'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 80 : 280,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          "hidden lg:flex fixed left-0 top-0 h-full z-50 glass-dark",
          "border-r border-white/10 flex-col"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-white/10">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3"
              >
                <Ship className="w-6 h-6 lg:w-8 lg:h-8 text-emerald-400" />
                <span className="text-lg lg:text-xl font-bold text-white tracking-wide">
                  Global Cargo
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative block"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-all",
                    "text-white/70 hover:text-white hover:bg-white/10",
                    isActive && "text-white"
                  )}
                >
                  {/* Active indicator glow */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-emerald-500/20 rounded-lg"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  
                  <Icon className={cn(
                    "w-5 h-5 relative z-10 flex-shrink-0",
                    isActive && "text-emerald-400"
                  )} />
                  
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="relative z-10 font-medium text-sm lg:text-base"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Footer User Info */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-white text-sm lg:text-base flex-shrink-0">
                    {user?.fullName.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs lg:text-sm font-medium text-white truncate">
                      {user?.fullName || 'Admin User'}
                    </p>
                    <p className="text-[10px] lg:text-xs text-white/60 truncate">
                      {user?.role === 'admin' ? 'HR Director' : 'User'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-xs lg:text-sm font-medium">Logout</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </>
  );
};

export default GlassSidebar;
