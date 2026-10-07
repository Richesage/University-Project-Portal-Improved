import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Users, BookOpen, UserCheck, Download, Search, Upload,
  AlertTriangle, FileText, CheckCircle, Info, Bell,
  ChevronRight, BarChart2, X, Eye, ThumbsUp, ThumbsDown,
  GitBranch, Shield, PenLine, Save, Camera, Megaphone,
  Trash2, Clock, Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApi, profileApi, topicsApi, supervisorRequestsApi, announcementsApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useAppSettings } from '../../context/AppSettingsContext';
import type {
  AdminStats, AppNotification, StudentRecord, SupervisorRecord,
  ReportFilters, ReportRow, Topic, SupervisionRequest, Announcement,
} from '../../types';

interface ScreenProps { onNavigate: (screen: string) => void; }

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-200 animate-pulse rounded ${className}`} />;
}

// ─── AdminDashboard ───────────────────────────────────────────────────────────
export function AdminDashboard({ onNavigate }: ScreenProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminApi.stats(), adminApi.notifications()])
      .then(([s, n]) => { setStats(s); setNotifications(n); })
      .finally(() => setLoading(false));
  }, []);

  const notifIcon: Record<string, React.ElementType> = {
    warning: AlertTriangle,
    info:    Info,
    success: CheckCircle,
    error:   AlertTriangle,
  };
  const notifCls: Record<string, string> = {
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    info:    'bg-blue-50 border-blue-200 text-blue-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    error:   'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Admin Dashboard</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Students',       value: stats?.totalStudents,        icon: Users,        color: 'text-[#312DC4]',   bg: 'bg-[#EEEDFB]' },
          { label: 'Total Lecturers',      value: stats?.totalLecturers,       icon: BookOpen,     color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Approved Topics',      value: stats?.approvedTopics,       icon: CheckCircle,  color: 'text-blue-600',    bg: 'bg-blue-50' },
          { label: 'Pending Topics',       value: stats?.pendingTopics,        icon: FileText,     color: 'text-amber-600',   bg: 'bg-amber-50' },
          { label: 'Allocated %',          value: stats ? `${stats.allocatedPercentage}%` : undefined, icon: UserCheck, color: 'text-[#312DC4]', bg: 'bg-[#EEEDFB]' },
          { label: 'Unallocated Students', value: stats?.unallocatedStudents,  icon: AlertTriangle, color: 'text-red-600',   bg: 'bg-red-50' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-lg border border-gray-200 p-5 flex items-center gap-3">
            <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center shrink-0`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-800">{loading ? '—' : card.value}</p>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-[#312DC4]" />
            <h3 className="font-semibold text-gray-700">System Alerts</h3>
          </div>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No alerts.</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => {
                const Icon = notifIcon[n.type] ?? Info;
                return (
                  <div key={n.id} className={`flex items-start gap-3 border rounded-lg px-3 py-3 ${notifCls[n.type] ?? 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                    <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs opacity-80 mt-0.5">{n.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: 'Review Topic Proposals',  screen: 'topic-approval',        icon: FileText },
              { label: 'Allocate Supervisors',    screen: 'supervisor-allocation', icon: UserCheck },
              { label: 'Generate Reports',        screen: 'report-generation',     icon: BarChart2 },
            ].map((a) => (
              <button
                key={a.screen}
                onClick={() => onNavigate(a.screen)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-[#C5C3EC] hover:bg-[#EEEDFB] transition-colors text-left"
              >
                <a.icon className="w-4 h-4 text-[#312DC4]" />
                <span className="text-sm font-medium text-gray-700">{a.label}</span>
                <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TopicApproval ────────────────────────────────────────────────────────────
export function TopicApproval({ onNavigate: _onNavigate }: ScreenProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [processed, setProcessed] = useState<Record<string, 'approved' | 'rejected'>>({});
  const [viewingTopic, setViewingTopic] = useState<Topic | null>(null);
  const [rejectModal, setRejectModal] = useState<Topic | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    topicsApi.pendingApproval().then(setTopics).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const pending = topics.filter(t => !processed[t.id]);
  const done = topics.filter(t => !!processed[t.id]);

  const handleApprove = async (topic: Topic) => {
    setProcessing(topic.id);
    try {
      await topicsApi.approve(topic.id);
      setProcessed(p => ({ ...p, [topic.id]: 'approved' }));
      setViewingTopic(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to approve topic.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) return;
    setProcessing(rejectModal.id);
    try {
      await topicsApi.reject(rejectModal.id, rejectReason);
      setProcessed(p => ({ ...p, [rejectModal.id]: 'rejected' }));
      setRejectModal(null);
      setRejectReason('');
      setViewingTopic(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reject topic.');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Topic Approval</h2>
        <div className="flex gap-2">
          <span className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">{loading ? '…' : pending.length} pending</span>
          {done.length > 0 && <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{done.length} reviewed</span>}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      )}

      {!loading && pending.length === 0 && done.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No pending topic proposals.</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-amber-50">
            <p className="text-sm font-medium text-amber-800">Pending Review ({pending.length})</p>
          </div>
          <div className="divide-y divide-gray-100">
            {pending.map((topic) => (
              <div key={topic.id} className="p-5 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{topic.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{topic.lecturerName} · {topic.department} · {topic.researchArea}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Submitted {new Date(topic.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">{topic.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setViewingTopic(topic)}
                    className="p-2 text-gray-400 hover:text-[#312DC4] hover:bg-[#EEEDFB] rounded-lg transition-colors"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleApprove(topic)}
                    disabled={processing === topic.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" /> {processing === topic.id ? '…' : 'Approve'}
                  </button>
                  <button
                    onClick={() => { setRejectModal(topic); setRejectReason(''); }}
                    disabled={processing === topic.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {done.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-600">Recently Reviewed</p>
          </div>
          <div className="divide-y divide-gray-100">
            {done.map((topic) => (
              <div key={topic.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{topic.title}</p>
                  <p className="text-xs text-gray-400">{topic.lecturerName} · {topic.department}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                  processed[topic.id] === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                }`}>
                  {processed[topic.id] === 'approved' ? '✓ Approved' : '✗ Rejected'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topic detail modal */}
      {viewingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-gray-800 pr-4">{viewingTopic.title}</h3>
              <button onClick={() => setViewingTopic(null)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
            </div>
            <dl className="space-y-3 text-sm mb-4">
              <div className="flex gap-2"><dt className="w-28 shrink-0 text-gray-500">Submitted by</dt><dd className="text-gray-800 font-medium">{viewingTopic.lecturerName}</dd></div>
              <div className="flex gap-2"><dt className="w-28 shrink-0 text-gray-500">Department</dt><dd className="text-gray-800">{viewingTopic.department || '—'}</dd></div>
              <div className="flex gap-2"><dt className="w-28 shrink-0 text-gray-500">Research Area</dt><dd className="text-gray-800">{viewingTopic.researchArea || '—'}</dd></div>
              <div className="flex gap-2"><dt className="w-28 shrink-0 text-gray-500">Submitted</dt><dd className="text-gray-800">{new Date(viewingTopic.createdAt).toLocaleString()}</dd></div>
            </dl>
            <div className="bg-gray-50 rounded-lg p-4 mb-5">
              <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-700 leading-relaxed">{viewingTopic.description}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleApprove(viewingTopic)}
                disabled={processing === viewingTopic.id}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
              >
                <ThumbsUp className="w-4 h-4" /> Approve
              </button>
              <button
                onClick={() => { setRejectModal(viewingTopic); setViewingTopic(null); setRejectReason(''); }}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium text-white bg-red-500 hover:bg-red-600"
              >
                <ThumbsDown className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Reject Topic</h3>
              <button onClick={() => setRejectModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-3">You are rejecting: <span className="font-medium text-gray-800">"{rejectModal.title}"</span></p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for rejection <span className="text-red-500">*</span></label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Provide feedback to the submitter…"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-red-400 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || processing === rejectModal.id}
                className="flex-1 py-2 rounded-md text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50"
              >
                {processing === rejectModal.id ? 'Rejecting…' : 'Confirm Rejection'}
              </button>
              <button onClick={() => setRejectModal(null)} className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SupervisorAllocation ─────────────────────────────────────────────────────
export function SupervisorAllocation({ onNavigate: _onNavigate }: ScreenProps) {
  const [activeTab, setActiveTab] = useState<'allocate' | 'denied'>('allocate');
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [supervisors, setSupervisors] = useState<SupervisorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [supSearch, setSupSearch] = useState('');
  const [selected, setSelected] = useState<{ studentId: string; supervisorId: string | null }>({ studentId: '', supervisorId: null });
  const [allocating, setAllocating] = useState(false);
  const [allocSuccess, setAllocSuccess] = useState<string | null>(null);
  const [allocError, setAllocError] = useState<string | null>(null);

  // Denied requests (real data)
  const [deniedRequests, setDeniedRequests] = useState<SupervisionRequest[]>([]);
  const [deniedLoading, setDeniedLoading] = useState(false);
  const [resolveModal, setResolveModal] = useState<SupervisionRequest | null>(null);
  const [resolutionType, setResolutionType] = useState<'special_approval' | 'recommend_alternative'>('special_approval');
  const [alternativeSupervisorId, setAlternativeSupervisorId] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolvedIds, setResolvedIds] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([adminApi.unallocatedStudents(), adminApi.supervisors()])
      .then(([s, sup]) => { setStudents(s); setSupervisors(sup); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    adminApi.supervisors(supSearch.trim() || undefined).then(setSupervisors);
  }, [supSearch]);

  // Load denied requests when tab becomes active
  useEffect(() => {
    if (activeTab !== 'denied') return;
    setDeniedLoading(true);
    supervisorRequestsApi.listDenied().then(setDeniedRequests).finally(() => setDeniedLoading(false));
  }, [activeTab]);

  const handleAllocate = async () => {
    if (!selected.studentId || !selected.supervisorId) return;
    setAllocError(null);

    // Frontend slot guard
    const supervisor = supervisors.find(s => s.id === selected.supervisorId);
    if (supervisor && supervisor.currentLoad >= supervisor.maxLoad) {
      setAllocError(`${supervisor.name} is at full capacity (${supervisor.maxLoad}/${supervisor.maxLoad} students).`);
      return;
    }

    setAllocating(true);
    try {
      const studentId = selected.studentId;
      const supervisorId = selected.supervisorId;
      await adminApi.allocate(studentId, supervisorId);
      const studentName = students.find(s => s.id === studentId)?.name ?? 'Student';
      const supName = supervisor?.name ?? 'Supervisor';
      setStudents(prev => prev.filter(s => s.id !== studentId));
      // Update supervisor load count in local state so slots refresh immediately
      setSupervisors(prev => prev.map(s => {
        if (s.id !== supervisorId) return s;
        const newLoad = s.currentLoad + 1;
        return { ...s, currentLoad: newLoad, availability: newLoad >= s.maxLoad ? 'full' : 'available' };
      }));
      setSelected({ studentId: '', supervisorId: null });
      setAllocSuccess(`${studentName} has been allocated to ${supName}.`);
    } catch (e) {
      setAllocError(e instanceof Error ? e.message : 'Allocation failed. Please try again.');
    } finally {
      setAllocating(false);
    }
  };

  const handleResolve = async () => {
    if (!resolveModal) return;
    setResolving(true);
    try {
      await supervisorRequestsApi.resolve(
        resolveModal.id,
        resolutionType,
        resolutionNote,
        resolutionType === 'recommend_alternative' && alternativeSupervisorId ? alternativeSupervisorId : undefined,
      );
      setResolvedIds(prev => [...prev, resolveModal.id]);
      setResolveModal(null);
      setResolutionNote('');
      setAlternativeSupervisorId('');
    } finally {
      setResolving(false);
    }
  };

  const pendingDenied = deniedRequests.filter(r => !resolvedIds.includes(r.id));
  const resolvedDenied = deniedRequests.filter(r => resolvedIds.includes(r.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Supervisor Management</h2>
        {pendingDenied.length > 0 && (
          <span className="flex items-center gap-1 text-xs font-medium bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full">
            <AlertTriangle className="w-3.5 h-3.5" /> {pendingDenied.length} denied request{pendingDenied.length !== 1 ? 's' : ''} need resolution
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'allocate', label: 'Allocate Supervisors' },
          { id: 'denied',   label: `Denied Request Resolution${pendingDenied.length > 0 ? ` (${pendingDenied.length})` : ''}` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'allocate' | 'denied')}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-[#312DC4] text-[#312DC4]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'allocate' && (
        <>
          {allocSuccess && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
              <CheckCircle className="w-4 h-4 shrink-0" /> {allocSuccess}
            </div>
          )}
          {allocError && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {allocError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Unallocated students */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-700 mb-1">Unallocated Students</h3>
              <p className="text-xs text-gray-400 mb-4">
                Students without an assigned supervisor. Students admitted by a lecturer via supervision requests are excluded automatically.
              </p>
              {loading ? (
                <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : students.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">All students are allocated!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {students.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setSelected(prev => ({ ...prev, studentId: s.id })); setAllocError(null); }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                        selected.studentId === s.id
                          ? 'border-[#312DC4] bg-[#EEEDFB]'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                        {s.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-400 truncate">{s.regNo}{s.department ? ` · ${s.department}` : ''}</p>
                        {s.currentTopic && s.currentTopic !== 'No topic yet' && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">{s.currentTopic}</p>
                        )}
                      </div>
                      {selected.studentId === s.id && (
                        <span className="w-2 h-2 rounded-full bg-[#312DC4] shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Supervisors */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-700 mb-1">Available Supervisors</h3>
              <p className="text-xs text-gray-400 mb-3">Full supervisors cannot be selected. Slot counts update after each allocation.</p>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search supervisors…"
                  value={supSearch}
                  onChange={(e) => setSupSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4]"
                />
              </div>
              {loading ? (
                <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {supervisors.map((sup) => {
                    const remaining = Math.max(0, sup.maxLoad - sup.currentLoad);
                    const isFull = remaining === 0;
                    return (
                      <button
                        key={sup.id}
                        disabled={isFull}
                        onClick={() => { setSelected(prev => ({ ...prev, supervisorId: sup.id })); setAllocError(null); }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                          selected.supervisorId === sup.id
                            ? 'border-[#312DC4] bg-[#EEEDFB]'
                            : isFull
                              ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-[#EEEDFB] flex items-center justify-center text-xs font-bold text-[#312DC4] shrink-0">
                          {sup.name.split(' ').filter(w => w !== 'Dr.' && w !== 'Prof.').map(w => w[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">{sup.name}</p>
                          <p className="text-xs text-gray-400 truncate">{sup.specialization}</p>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <div className="flex items-center gap-1.5 justify-end mb-0.5">
                            <div className="w-16 bg-gray-100 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${isFull ? 'bg-red-400' : sup.currentLoad / sup.maxLoad >= 0.8 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min((sup.currentLoad / sup.maxLoad) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-600 w-8">{sup.currentLoad}/{sup.maxLoad}</span>
                          </div>
                          <span className={`text-xs font-medium ${isFull ? 'text-red-500' : remaining <= 2 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {isFull ? 'Full' : `${remaining} slot${remaining !== 1 ? 's' : ''} left`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            {selected.studentId && selected.supervisorId ? (
              <p className="text-xs text-gray-500">
                Allocating <span className="font-medium text-gray-700">{students.find(s => s.id === selected.studentId)?.name}</span> to{' '}
                <span className="font-medium text-gray-700">{supervisors.find(s => s.id === selected.supervisorId)?.name}</span>
              </p>
            ) : (
              <p className="text-xs text-gray-400">Select a student and a supervisor to proceed.</p>
            )}
            <button
              onClick={handleAllocate}
              disabled={!selected.studentId || !selected.supervisorId || allocating}
              className="px-6 py-2.5 rounded-md text-sm font-medium text-white bg-[#312DC4] hover:bg-[#2724b0] disabled:opacity-50 shrink-0"
            >
              {allocating ? 'Allocating…' : 'Confirm Allocation'}
            </button>
          </div>
        </>
      )}

      {activeTab === 'denied' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">These students had their preferred supervisor request denied. You can grant a <strong>special approval</strong> to override the denial, or <strong>recommend an alternative</strong> supervisor.</p>
          </div>

          {deniedLoading && (
            <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
          )}

          {!deniedLoading && pendingDenied.length === 0 && resolvedDenied.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
              <Shield className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No denied requests to resolve.</p>
            </div>
          )}

          {pendingDenied.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-red-50">
                <p className="text-sm font-medium text-red-800">Awaiting Resolution ({pendingDenied.length})</p>
              </div>
              <div className="divide-y divide-gray-100">
                {pendingDenied.map((req) => (
                  <div key={req.id} className="p-5 flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                      {req.studentName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{req.studentName}</p>
                      <p className="text-xs text-gray-500">{req.studentRegNo} · {req.studentDepartment}</p>
                      <p className="text-xs text-gray-600 mt-1">Requested: <span className="font-medium">{req.lecturerName}</span></p>
                      <p className="text-xs text-gray-500">Topic interest: {req.topicInterest}</p>
                      {req.denyReason && (
                        <div className="mt-1.5 inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                          <X className="w-3 h-3" /> Denied: {req.denyReason}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => { setResolveModal(req); setResolutionType('special_approval'); setResolutionNote(''); setAlternativeSupervisorId(''); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-[#312DC4] hover:bg-[#2724b0] shrink-0"
                    >
                      <GitBranch className="w-3.5 h-3.5" /> Resolve
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resolvedDenied.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
              </div>
              <div className="divide-y divide-gray-100">
                {resolvedDenied.map((req) => (
                  <div key={req.id} className="px-5 py-4 flex items-center justify-between gap-4 opacity-70">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{req.studentName} <span className="text-gray-400 font-normal">({req.studentRegNo})</span></p>
                      <p className="text-xs text-gray-400">Was denied: {req.lecturerName}</p>
                    </div>
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">✓ Resolved</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resolution modal */}
      {resolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Resolve Denied Request</h3>
              <button onClick={() => setResolveModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-5 text-sm">
              <p className="font-medium text-gray-800">{resolveModal.studentName} <span className="text-gray-500 font-normal">({resolveModal.studentRegNo})</span></p>
              <p className="text-gray-500 text-xs mt-0.5">Requested supervisor: <span className="text-gray-700 font-medium">{resolveModal.lecturerName}</span></p>
              {resolveModal.denyReason && <p className="text-gray-500 text-xs mt-0.5">Denial reason: <span className="text-red-600">{resolveModal.denyReason}</span></p>}
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Resolution type</p>
              <div className="space-y-2">
                <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${resolutionType === 'special_approval' ? 'border-[#312DC4] bg-[#EEEDFB]' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="radio" name="resType" value="special_approval" checked={resolutionType === 'special_approval'} onChange={() => setResolutionType('special_approval')} className="mt-0.5 accent-[#312DC4]" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Special Approval</p>
                    <p className="text-xs text-gray-500">Override the denial and assign the student to their preferred supervisor ({resolveModal.lecturerName}), even if at capacity.</p>
                  </div>
                </label>
                <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${resolutionType === 'recommend_alternative' ? 'border-[#312DC4] bg-[#EEEDFB]' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="radio" name="resType" value="recommend_alternative" checked={resolutionType === 'recommend_alternative'} onChange={() => setResolutionType('recommend_alternative')} className="mt-0.5 accent-[#312DC4]" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Recommend Alternative</p>
                    <p className="text-xs text-gray-500">Assign the student to a different available supervisor and notify them with a recommendation note.</p>
                  </div>
                </label>
              </div>
            </div>

            {resolutionType === 'recommend_alternative' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Alternative Supervisor</label>
                <select
                  value={alternativeSupervisorId}
                  onChange={(e) => setAlternativeSupervisorId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4] appearance-none"
                >
                  <option value="">Choose a supervisor…</option>
                  {supervisors.filter(s => s.availability === 'available' && s.id !== resolveModal.lecturerId).map(s => (
                    <option key={s.id} value={s.id}>{s.name} — {s.specialization} ({s.currentLoad}/{s.maxLoad})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin note to student</label>
              <textarea
                rows={3}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Explain the resolution to the student…"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4] resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleResolve}
                disabled={resolving || !resolutionNote.trim() || (resolutionType === 'recommend_alternative' && !alternativeSupervisorId)}
                className="flex-1 py-2 rounded-md text-sm font-medium text-white bg-[#312DC4] hover:bg-[#2724b0] disabled:opacity-50"
              >
                {resolving ? 'Processing…' : 'Confirm Resolution'}
              </button>
              <button onClick={() => setResolveModal(null)} className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ReportGeneration ─────────────────────────────────────────────────────────
export function ReportGeneration({ onNavigate: _onNavigate }: ScreenProps) {
  const [filters, setFilters] = useState<ReportFilters>({ department: '', supervisorId: '', status: '', dateFrom: '', dateTo: '' });
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [supervisors, setSupervisors] = useState<SupervisorRecord[]>([]);

  useEffect(() => {
    adminApi.supervisors().then(setSupervisors);
  }, []);

  const DEPARTMENTS = ['Computer Science', 'Software Engineering', 'Information Technology', 'Electrical Engineering'];
  const STATUSES = ['active', 'completed', 'suspended'];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const data = await adminApi.generateReport(filters);
      setRows(data);
      setGenerated(true);
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    setExporting(true);
    try {
      const { url } = await adminApi.exportReport(filters, format);
      if (url && url !== '#') {
        const a = document.createElement('a');
        a.href = url;
        a.download = `report.${format === 'excel' ? 'csv' : 'txt'}`;
        a.click();
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Report Generation</h2>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Filter Report</h3>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select value={filters.department} onChange={(e) => setFilters(f => ({ ...f, department: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4] appearance-none">
                <option value="">All Departments</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor</label>
              <select value={filters.supervisorId} onChange={(e) => setFilters(f => ({ ...f, supervisorId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4] appearance-none">
                <option value="">All Supervisors</option>
                {supervisors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Status</label>
              <select value={filters.status} onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4] appearance-none">
                <option value="">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
              <input type="date" value={filters.dateFrom} onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
              <input type="date" value={filters.dateTo} onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4]" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={generating}
              className="px-5 py-2 rounded-md text-sm font-medium text-white bg-[#312DC4] hover:bg-[#2724b0] disabled:opacity-60">
              {generating ? 'Generating…' : 'Generate Report'}
            </button>
            {generated && (
              <>
                <button type="button" onClick={() => handleExport('pdf')} disabled={exporting}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-[#312DC4] border border-[#C5C3EC] bg-[#EEEDFB] hover:bg-[#E3E2F7] disabled:opacity-60">
                  <Download className="w-4 h-4" /> PDF
                </button>
                <button type="button" onClick={() => handleExport('excel')} disabled={exporting}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-60">
                  <Download className="w-4 h-4" /> Excel / CSV
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      {generated && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">Results ({rows.length} records)</h3>
          </div>
          {rows.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-10">No records match the selected filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['Student', 'Reg. No.', 'Department', 'Topic', 'Supervisor', 'Progress', 'Status'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{row.studentName}</td>
                      <td className="px-4 py-3 text-gray-500">{row.regNo}</td>
                      <td className="px-4 py-3 text-gray-600">{row.department}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs"><p className="truncate">{row.topic}</p></td>
                      <td className="px-4 py-3 text-gray-600">{row.supervisor}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-100 rounded-full h-1.5">
                            <div className="bg-[#312DC4] h-1.5 rounded-full" style={{ width: `${row.progress}%` }} />
                          </div>
                          <span className="text-xs text-gray-600">{row.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full capitalize">{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── AdminProfile ─────────────────────────────────────────────────────────────
export function AdminProfile({ onNavigate: _onNavigate }: ScreenProps) {
  const { user, updateUser } = useAuth();
  const { appTitle, logoUrl: currentLogoUrl, updateAppTitle, updateAppLogo } = useAppSettings();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.avatarUrl);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Branding state
  const [brandTitle, setBrandTitle] = useState(appTitle);
  const [logoUploading, setLogoUploading] = useState(false);
  const [brandSaving, setBrandSaving] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setAvatarUrl(user?.avatarUrl); }, [user?.avatarUrl]);
  useEffect(() => { setBrandTitle(appTitle); }, [appTitle]);

  const [form, setForm] = useState({
    name: user?.name ?? '',
    department: user?.department ?? '',
    phone: '',
    bio: '',
    title: '',
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setAvatarError(null);
    try {
      const url = await profileApi.uploadAvatar(file);
      setAvatarUrl(url);
      updateUser({ avatarUrl: url });
      toast.success('Profile photo updated');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      setAvatarError(msg);
      toast.error('Photo upload failed', { description: msg });
    } finally { setAvatarUploading(false); }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      await updateAppLogo(file);
      toast.success('App logo updated');
    } catch (err) {
      toast.error('Logo upload failed', { description: err instanceof Error ? err.message : 'Try again.' });
    } finally { setLogoUploading(false); }
  };

  const handleSaveBranding = async () => {
    setBrandSaving(true);
    try {
      await updateAppTitle(brandTitle);
      toast.success('Branding saved');
    } catch {
      toast.error('Failed to save branding');
    } finally { setBrandSaving(false); }
  };

  const handleEdit = () => {
    setForm({ name: user?.name ?? '', department: user?.department ?? '', phone: '', bio: '', title: '' });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileApi.updateProfile({ name: form.name, department: form.department, bio: form.bio });
      updateUser({ name: form.name, department: form.department });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast.success('Profile saved successfully');
    } finally { setSaving(false); }
  };

  const initials = (user?.name ?? 'A').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">My Profile</h2>
        <div className="flex items-center gap-2">
          {saved && <span className="text-sm text-emerald-600 font-medium">✓ Saved</span>}
          {editing ? (
            <>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-white bg-[#312DC4] hover:bg-[#2724b0] disabled:opacity-60">
                <Save className="w-4 h-4" />{saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50">
                Cancel
              </button>
            </>
          ) : (
            <button onClick={handleEdit}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-[#312DC4] border border-[#C5C3EC] bg-[#EEEDFB] hover:bg-[#E3E2F7]">
              <PenLine className="w-4 h-4" />Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <div
              onClick={() => editing && avatarInputRef.current?.click()}
              className={`w-20 h-20 rounded-full border-2 border-[#C5C3EC] overflow-hidden flex items-center justify-center text-2xl font-bold text-[#312DC4] bg-[#EEEDFB] ${editing ? 'cursor-pointer' : ''}`}
            >
              {avatarUploading ? (
                <div className="w-5 h-5 border-2 border-[#312DC4] border-t-transparent rounded-full animate-spin" />
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : initials}
            </div>
            {editing && !avatarUploading && (
              <button onClick={() => avatarInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#312DC4] text-white flex items-center justify-center hover:bg-[#2724b0] shadow"
                title="Change photo">
                <Camera className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-lg">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="mt-1 inline-block text-xs bg-[#EEEDFB] text-[#312DC4] px-2.5 py-0.5 rounded-full font-medium capitalize">{user?.role}</span>
            {avatarError && <p className="mt-1.5 text-xs text-red-600">{avatarError}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Full Name</label>
            {editing ? (
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Your full name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4]" />
            ) : <p className="text-sm text-gray-800">{user?.name || '—'}</p>}
          </div>

          {/* Staff ID — read-only */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Staff ID</label>
            <p className="text-sm text-gray-800">{user?.staffId || '—'}</p>
            {editing && <p className="text-xs text-gray-400 mt-0.5">Contact IT to update Staff ID</p>}
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Department / Unit</label>
            {editing ? (
              <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                placeholder="e.g. Academic Registry"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4]" />
            ) : <p className="text-sm text-gray-800">{user?.department || '—'}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Phone Number</label>
            {editing ? (
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="e.g. +234 800 000 0000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4]" />
            ) : <p className="text-sm text-gray-800">{form.phone || '—'}</p>}
          </div>

          {/* Email — read-only */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email Address</label>
            <p className="text-sm text-gray-800">{user?.email || '—'}</p>
            {editing && <p className="text-xs text-gray-400 mt-0.5">Contact support to change email</p>}
          </div>

          {/* Job Title */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Job Title / Role</label>
            {editing ? (
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Academic Coordinator"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4]" />
            ) : <p className="text-sm text-gray-800">{form.title || '—'}</p>}
          </div>

          {/* Bio */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Bio / About</label>
            {editing ? (
              <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                rows={3} placeholder="A short introduction about your role and responsibilities…"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4] resize-none" />
            ) : <p className="text-sm text-gray-800 leading-relaxed">{form.bio || '—'}</p>}
          </div>
        </div>
      </div>

      {/* ── App Branding ── */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
          <BookOpen className="w-4 h-4 text-[#312DC4]" />
          <h3 className="font-semibold text-gray-700">App Branding</h3>
          <span className="text-xs text-gray-400 ml-auto">Visible to all users</span>
        </div>

        {/* Logo */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">App Logo</label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
              {logoUploading ? (
                <div className="w-5 h-5 border-2 border-[#312DC4] border-t-transparent rounded-full animate-spin" />
              ) : currentLogoUrl ? (
                <img src={currentLogoUrl} alt="app logo" className="w-full h-full object-contain p-1" />
              ) : (
                <BookOpen className="w-6 h-6 text-gray-300" />
              )}
            </div>
            <div className="space-y-1.5">
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={logoUploading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-[#312DC4] border border-[#C5C3EC] bg-[#EEEDFB] hover:bg-[#E3E2F7] disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                {logoUploading ? 'Uploading…' : 'Upload Logo'}
              </button>
              <p className="text-xs text-gray-400">PNG, JPG or SVG — square recommended</p>
            </div>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Portal Name</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={brandTitle}
              onChange={e => setBrandTitle(e.target.value)}
              placeholder="e.g. UniManage Portal"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4]"
            />
            <button
              onClick={handleSaveBranding}
              disabled={brandSaving || brandTitle === appTitle}
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-[#312DC4] hover:bg-[#2724b0] disabled:opacity-40"
            >
              {brandSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Shown in the header and browser tab for all users.</p>
        </div>
      </div>
    </div>
  );
}

// ─── AdminAnnouncements ───────────────────────────────────────────────────────
export function AdminAnnouncements({ onNavigate: _onNavigate }: ScreenProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Create form
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<Announcement['type']>('info');
  const [expiresAt, setExpiresAt] = useState('');
  const [creating, setCreating] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(() => {
    announcementsApi.list().then(setAnnouncements).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setCreating(true);
    try {
      await announcementsApi.create({ title: title.trim(), body: body.trim(), type, expiresAt: expiresAt || undefined });
      toast.success('Announcement published to all users');
      setTitle(''); setBody(''); setType('info'); setExpiresAt('');
      setFormOpen(false);
      load();
    } catch (e) {
      toast.error('Failed to publish', { description: e instanceof Error ? e.message : 'Try again.' });
    } finally { setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await announcementsApi.remove(id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      toast.success('Announcement removed');
    } catch {
      toast.error('Failed to remove');
    } finally { setDeleting(null); }
  };

  const typeConfig: Record<Announcement['type'], { label: string; cls: string; bg: string }> = {
    info:    { label: 'Info',    cls: 'text-blue-700 bg-blue-50 border-blue-200',    bg: 'bg-blue-50' },
    warning: { label: 'Warning', cls: 'text-amber-700 bg-amber-50 border-amber-200', bg: 'bg-amber-50' },
    success: { label: 'Success', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200', bg: 'bg-emerald-50' },
    urgent:  { label: 'Urgent',  cls: 'text-red-700 bg-red-50 border-red-200',       bg: 'bg-red-50' },
  };

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 60_000) return 'just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Announcements</h2>
          <p className="text-sm text-gray-500 mt-0.5">Broadcast messages visible to all students and lecturers.</p>
        </div>
        <button
          onClick={() => setFormOpen(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-[#312DC4] hover:bg-[#2724b0] transition-colors"
        >
          <Plus className="w-4 h-4" />
          {formOpen ? 'Cancel' : 'New Announcement'}
        </button>
      </div>

      {/* ── Create form ── */}
      {formOpen && (
        <div className="bg-white rounded-lg border border-[#C5C3EC] shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
            <Megaphone className="w-4 h-4 text-[#312DC4]" />
            <h3 className="font-semibold text-gray-700 text-sm">Create Announcement</h3>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Title</label>
                <input
                  required value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Submission Deadline Extended"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Type</label>
                <select value={type} onChange={e => setType(e.target.value as Announcement['type'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4] appearance-none">
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Message Body</label>
              <textarea
                required value={body} onChange={e => setBody(e.target.value)}
                rows={3} placeholder="Write the announcement content here…"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4] resize-none"
              />
            </div>

            <div className="flex items-end gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Expires On (optional)</label>
                <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4]" />
              </div>
              <button type="submit" disabled={creating}
                className="px-5 py-2 rounded-md text-sm font-medium text-white bg-[#312DC4] hover:bg-[#2724b0] disabled:opacity-60">
                {creating ? 'Publishing…' : 'Publish Announcement'}
              </button>
            </div>

            {/* Preview */}
            {(title || body) && (
              <div className={`mt-2 rounded-lg border px-4 py-3 flex items-start gap-3 ${typeConfig[type].cls}`}>
                <Megaphone className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{title || 'Announcement title'}</p>
                  {body && <p className="text-xs opacity-80 mt-0.5 leading-relaxed">{body}</p>}
                  <p className="text-xs opacity-60 mt-1">Preview — will appear to all users</p>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* ── Existing announcements ── */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-700 text-sm">Published Announcements</h3>
          <span className="text-xs text-gray-400">{announcements.length} total</span>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-14">
            <Megaphone className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">No announcements yet</p>
            <p className="text-xs text-gray-400 mt-1">Click "New Announcement" to publish your first one.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {announcements.map(ann => {
              const cfg = typeConfig[ann.type];
              return (
                <div key={ann.id} className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50/50">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg}`}>
                    <Megaphone className={`w-4 h-4 ${cfg.cls.split(' ')[0]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-800 truncate">{ann.title}</p>
                      <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{ann.body}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" /> {fmtDate(ann.createdAt)}
                      </span>
                      {ann.expiresAt && (
                        <span className="text-xs text-amber-600">Expires {new Date(ann.expiresAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(ann.id)}
                    disabled={deleting === ann.id}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 shrink-0"
                    title="Remove announcement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
