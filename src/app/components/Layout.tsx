import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell, LogOut, User, BookOpen, Menu, X,
  LayoutDashboard, FileText, List, Users, BarChart,
  ClipboardList, MessageSquare, UserCheck, Star,
  ChevronLeft, ChevronRight, Megaphone, GitBranch,
  AlertTriangle, CheckCircle, Info, Upload, UserPlus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppSettings } from '../../context/AppSettingsContext';
import { activityFeedApi, announcementsApi } from '../../lib/api';
import type { UserRole, ActivityItem, Announcement } from '../../types';

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
        { id: 'announcements',         label: 'Announcements',        icon: Megaphone },
        { id: 'report-generation',     label: 'Reports',              icon: ClipboardList },
        { id: 'my-profile',            label: 'My Profile',           icon: User },
      ];
    default:
      return [];
  }
}

// ── Relative time helper ──────────────────────────────────────────────────────
function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)       return 'just now';
  if (diff < 3_600_000)    return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000)   return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

// ── Category icon/colour map ──────────────────────────────────────────────────
function activityIcon(category: ActivityItem['category']) {
  switch (category) {
    case 'supervision':   return { icon: UserCheck,    cls: 'text-[#312DC4] bg-[#EEEDFB]' };
    case 'topic':         return { icon: FileText,     cls: 'text-amber-600 bg-amber-50' };
    case 'student':       return { icon: UserPlus,     cls: 'text-emerald-600 bg-emerald-50' };
    case 'allocation':    return { icon: GitBranch,    cls: 'text-blue-600 bg-blue-50' };
    case 'submission':    return { icon: Upload,       cls: 'text-purple-600 bg-purple-50' };
    case 'announcement':  return { icon: Megaphone,    cls: 'text-orange-600 bg-orange-50' };
    default:              return { icon: Info,         cls: 'text-gray-500 bg-gray-100' };
  }
}

// ── Announcement banner colours ───────────────────────────────────────────────
const annCls: Record<Announcement['type'], string> = {
  info:    'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  urgent:  'bg-red-50 border-red-200 text-red-800',
};

function getDismissedKey(userId: string) { return `dismissed_ann_${userId}`; }
function getDismissed(userId: string): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(getDismissedKey(userId)) ?? '[]')); }
  catch { return new Set(); }
}
function saveDismissed(userId: string, ids: Set<string>) {
  localStorage.setItem(getDismissedKey(userId), JSON.stringify([...ids]));
}

export function Layout({ role, currentScreen, onNavigate, onLogout, children }: LayoutProps) {
  const { user } = useAuth();
  const { appTitle, logoUrl } = useAppSettings();
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ── Bell dropdown state ──
  const [bellOpen, setBellOpen]       = useState(false);
  const [feed, setFeed]               = useState<ActivityItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [unread, setUnread]           = useState(0);
  const bellRef = useRef<HTMLDivElement>(null);

  // ── Announcement banners ──
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed]         = useState<Set<string>>(new Set());

  const navItems = getNavItems(role);
  const displayName = user?.name ?? (role.charAt(0).toUpperCase() + role.slice(1) + ' User');
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  // Load unread count on mount and poll
  const refreshUnread = useCallback(async () => {
    try { setUnread(await activityFeedApi.unreadCount()); } catch { /* silent */ }
  }, []);

  useEffect(() => {
    refreshUnread();
    const iv = setInterval(refreshUnread, 30_000);
    return () => clearInterval(iv);
  }, [refreshUnread]);

  // Load announcements for non-admin roles (students/lecturers see banners)
  useEffect(() => {
    if (!user || role === 'admin') return;
    const dismissed = getDismissed(user.id);
    setDismissed(dismissed);
    announcementsApi.list().then(all => {
      setAnnouncements(all.filter(a => !dismissed.has(a.id)));
    }).catch(() => {});
  }, [user, role]);

  // Open bell → load feed + mark read
  const handleBellClick = async () => {
    if (bellOpen) { setBellOpen(false); return; }
    setBellOpen(true);
    setFeedLoading(true);
    try {
      const items = await activityFeedApi.list(15);
      setFeed(items);
      await activityFeedApi.markAllRead();
      setUnread(0);
    } catch { /* silent */ }
    finally { setFeedLoading(false); }
  };

  // Click-outside closes bell dropdown
  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bellOpen]);

  const handleDismissAnnouncement = (id: string) => {
    if (!user) return;
    const next = new Set(dismissed).add(id);
    setDismissed(next);
    saveDismissed(user.id, next);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const handleNavigate = (id: string) => {
    onNavigate(id);
    setDrawerOpen(false);
    setBellOpen(false);
  };

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  // Close drawer on desktop resize
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const close = () => { if (mq.matches) setDrawerOpen(false); };
    mq.addEventListener('change', close);
    return () => mq.removeEventListener('change', close);
  }, []);

  const Logo = () => logoUrl
    ? <img src={logoUrl} alt="logo" className="h-8 w-8 object-contain rounded-md" />
    : <div className="w-8 h-8 bg-[#EEEDFB] rounded-md flex items-center justify-center shrink-0"><BookOpen className="w-5 h-5 text-[#312DC4]" /></div>;

  const NavList = () => (
    <nav className="flex-1 overflow-y-auto py-2">
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

          {/* ── Bell (activity dropdown) ── */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={handleBellClick}
              className={`relative p-2 rounded-full transition-colors ${bellOpen ? 'bg-[#EEEDFB] text-[#312DC4]' : 'text-gray-500 hover:bg-gray-100'}`}
              title="Activity feed"
              aria-expanded={bellOpen}
            >
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
              {unread === 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#312DC4] rounded-full" />}
            </button>

            {/* ── Dropdown panel ── */}
            {bellOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/60">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {role === 'admin' ? 'System Activity' : 'Notifications'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {role === 'admin' ? 'Recent events across the portal' : 'Your recent updates'}
                    </p>
                  </div>
                  <button onClick={() => setBellOpen(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Feed items */}
                <div className="max-h-[420px] overflow-y-auto">
                  {feedLoading ? (
                    <div className="divide-y divide-gray-50">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-start gap-3 px-4 py-3.5">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3 bg-gray-100 animate-pulse rounded w-3/4" />
                            <div className="h-2.5 bg-gray-100 animate-pulse rounded w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : feed.length === 0 ? (
                    <div className="text-center py-10">
                      <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No recent activity</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {feed.map(item => {
                        const { icon: Icon, cls } = activityIcon(item.category);
                        return (
                          <button
                            key={item.id}
                            onClick={() => item.navigateTo ? handleNavigate(item.navigateTo) : undefined}
                            className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors ${item.navigateTo ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'} ${!item.read ? 'bg-[#EEEDFB]/30' : ''}`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${cls}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                                {!item.read && <span className="w-1.5 h-1.5 rounded-full bg-[#312DC4] shrink-0" />}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                              <p className="text-xs text-gray-400 mt-1">{relTime(item.timestamp)}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {role === 'admin' && (
                  <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/60">
                    <button
                      onClick={() => handleNavigate('announcements')}
                      className="flex items-center gap-1.5 text-xs font-medium text-[#312DC4] hover:underline"
                    >
                      <Megaphone className="w-3.5 h-3.5" /> Create Announcement
                    </button>
                  </div>
                )}
                {role !== 'admin' && (
                  <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/60">
                    <button
                      onClick={() => handleNavigate('my-requests')}
                      className="text-xs font-medium text-[#312DC4] hover:underline"
                    >
                      View all requests →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

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
          <div className="flex items-center justify-between p-4 border-b border-gray-100 lg:hidden">
            <div className="flex items-center gap-2.5">
              <Logo />
              <span className="font-semibold text-gray-800 truncate">{appTitle}</span>
            </div>
            <button onClick={() => setDrawerOpen(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

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
        <main className="flex-1 overflow-y-auto min-w-0 transition-all duration-300">
          {/* ── Announcement banners (students + lecturers only) ── */}
          {announcements.length > 0 && (
            <div className="sticky top-0 z-20 space-y-0">
              {announcements.slice(0, 3).map(ann => (
                <div
                  key={ann.id}
                  className={`flex items-start gap-3 px-4 sm:px-6 py-2.5 border-b ${annCls[ann.type]}`}
                >
                  <Megaphone className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold">{ann.title}</span>
                    <span className="text-sm opacity-80 ml-2">{ann.body}</span>
                  </div>
                  <button
                    onClick={() => handleDismissAnnouncement(ann.id)}
                    className="p-1 rounded hover:bg-black/10 transition-colors shrink-0"
                    aria-label="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="p-4 sm:p-6 lg:p-8 pb-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
