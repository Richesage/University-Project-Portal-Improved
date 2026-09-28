import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell, LogOut, User, BookOpen, Menu, X,
  LayoutDashboard, FileText, List, Users, BarChart,
  ClipboardList, MessageSquare, UserCheck, Star,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppSettings } from '../../context/AppSettingsContext';
import { adminApi } from '../../lib/api';
import type { UserRole } from '../../types';

interface LayoutProps {
  role: UserRole;
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

function getNavItems(role: UserRole) {
  switch (role) {
    case 'student':
      return [
        { id: 'dashboard',        label: 'Dashboard',              icon: LayoutDashboard },
        { id: 'find-supervisor',  label: 'Find Supervisor',        icon: Star },
        { id: 'my-requests',      label: 'My Requests',            icon: UserCheck },
        { id: 'topic-selection',  label: 'Project Topics',         icon: List },
        { id: 'submission',       label: 'Submissions',            icon: FileText },
        { id: 'progress',         label: 'Progress Tracking',      icon: BarChart },
        { id: 'messages',         label: 'Messages',               icon: MessageSquare },
        { id: 'my-profile',       label: 'My Profile',             icon: User },
      ];
    case 'lecturer':
      return [
        { id: 'dashboard',        label: 'Dashboard',              icon: LayoutDashboard },
        { id: 'my-profile',       label: 'My Profile',             icon: User },
        { id: 'student-requests', label: 'Supervision Requests',   icon: UserCheck },
        { id: 'topic-approval',   label: 'Topic Approval',         icon: ClipboardList },
        { id: 'topic-upload',     label: 'Upload Topics',          icon: FileText },
        { id: 'view-students',    label: 'My Students',            icon: Users },
        { id: 'workload',         label: 'Workload Tracking',      icon: BarChart },
        { id: 'messages',         label: 'Messages',               icon: MessageSquare },
      ];
    case 'admin':
      return [
        { id: 'dashboard',             label: 'Dashboard',            icon: LayoutDashboard },
        { id: 'topic-approval',        label: 'Topic Approval',       icon: FileText },
        { id: 'supervisor-allocation', label: 'Allocate Supervisors', icon: Users },
        { id: 'report-generation',     label: 'Reports',              icon: ClipboardList },
        { id: 'my-profile',            label: 'My Profile',           icon: User },
      ];
    default:
      return [];
  }
}

export function Layout({ role, currentScreen, onNavigate, onLogout, children }: LayoutProps) {
  const { user } = useAuth();
  const { appTitle, logoUrl } = useAppSettings();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  const refreshNotifCount = useCallback(async () => {
    if (!user || role !== 'student') return;
    try {
      const count = await adminApi.unreadRequestNotifications();
      setNotifCount(count);
    } catch { /* silent */ }
  }, [user, role]);

  useEffect(() => {
    refreshNotifCount();
    const interval = setInterval(refreshNotifCount, 30_000);
    return () => clearInterval(interval);
  }, [refreshNotifCount]);

  const navItems = getNavItems(role);
  const displayName = user?.name ?? (role.charAt(0).toUpperCase() + role.slice(1) + ' User');
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  const handleNavigate = (id: string) => {
    onNavigate(id);
    setDrawerOpen(false);
  };

  // Close drawer when resizing to desktop
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const close = () => { if (mq.matches) setDrawerOpen(false); };
    mq.addEventListener('change', close);
    return () => mq.removeEventListener('change', close);
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const Logo = () => logoUrl
    ? <img src={logoUrl} alt="logo" className="h-8 w-8 object-contain rounded-md" />
    : <div className="w-8 h-8 bg-[#EEEDFB] rounded-md flex items-center justify-center shrink-0"><BookOpen className="w-5 h-5 text-[#312DC4]" /></div>;

  const NavList = () => (
    <nav className="flex-1 overflow-y-auto py-2">
      {/* Collapse toggle — desktop only, hidden on mobile */}
      <div className="hidden lg:flex px-2 mb-1">
        <button
          onClick={() => setSidebarCollapsed(v => !v)}
          title={sidebarCollapsed ? 'Expand menu' : 'Collapse menu'}
          className={`w-full flex items-center py-2 px-3 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors ${sidebarCollapsed ? 'justify-center' : 'justify-end'}`}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <div className="px-2 space-y-0.5">
        {navItems.map((item) => {
          const active = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              title={item.label}
              className={[
                'w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-colors py-2.5 px-3 text-left',
                sidebarCollapsed ? 'lg:justify-center lg:px-2' : '',
                active ? 'bg-[#EEEDFB] text-[#312DC4]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800',
              ].join(' ')}
            >
              <item.icon className={`w-5 h-5 shrink-0 ${active ? 'text-[#312DC4]' : 'text-gray-400'}`} />
              <span className={`flex-1 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
              {active && <span className={`w-1.5 h-1.5 rounded-full bg-[#312DC4] shrink-0 ${sidebarCollapsed ? 'lg:hidden' : ''}`} />}
            </button>
          );
        })}
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Header ── */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-3">
          {/* Hamburger — mobile only */}
          <button
            className="lg:hidden p-2 -ml-1 text-gray-500 hover:bg-gray-100 rounded-lg"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Logo />
          <span className="font-semibold text-base text-gray-800 hidden sm:block truncate max-w-[160px]">{appTitle}</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-3">
          <button
            onClick={() => { onNavigate('my-requests'); setNotifCount(0); adminApi.markRequestNotificationsSeen(); }}
            className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {notifCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            ) : (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#312DC4] rounded-full" />
            )}
          </button>

          <div className="flex items-center gap-2 border-l border-gray-200 pl-2 sm:pl-3">
            <button
              onClick={() => handleNavigate('my-profile')}
              className="w-8 h-8 bg-[#EEEDFB] rounded-full overflow-hidden flex items-center justify-center shrink-0 focus:outline-none focus:ring-2 focus:ring-[#312DC4]"
            >
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-xs font-semibold text-[#312DC4]">{initials}</span>
              }
            </button>
            <div className="hidden sm:block text-sm leading-tight">
              <p className="font-medium text-gray-700 truncate max-w-[120px]">{displayName}</p>
              <p className="text-xs text-gray-400 capitalize">{role}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Mobile overlay ── */}
        <div
          className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setDrawerOpen(false)}
        />

        {/* ── Sidebar / Drawer ── */}
        <aside className={[
          'fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 flex flex-col shadow-xl',
          'transition-all duration-300 ease-in-out',
          drawerOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:static lg:shadow-none lg:translate-x-0 lg:z-auto lg:flex',
          'w-72',
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-64',
        ].join(' ')}>
          {/* Drawer top — mobile only */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 lg:hidden">
            <div className="flex items-center gap-2.5">
              <Logo />
              <span className="font-semibold text-gray-800 truncate">{appTitle}</span>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User card — mobile only */}
          <div className="flex items-center gap-3 mx-3 mt-3 mb-1 p-3 bg-[#EEEDFB]/60 rounded-xl lg:hidden">
            <div className="w-10 h-10 bg-[#EEEDFB] rounded-full overflow-hidden flex items-center justify-center border border-[#C5C3EC] shrink-0">
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-sm font-bold text-[#312DC4]">{initials}</span>
              }
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
              <p className="text-xs text-gray-500 capitalize">{role}</p>
            </div>
          </div>

          <NavList />

          {/* Sign-out at bottom of drawer — mobile only */}
          <div className="p-3 border-t border-gray-100 lg:hidden">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-10 min-w-0 transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
