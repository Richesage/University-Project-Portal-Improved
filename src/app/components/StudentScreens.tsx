import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText, BarChart2, MessageSquare, Upload, CheckCircle,
  Clock, AlertCircle, Send, Paperclip, ImageIcon, Video,
  X, ChevronRight, ChevronDown, ChevronLeft, Star, Search, UserCheck, Award,
  BookOpen, Shield, AlertTriangle, ExternalLink, Filter,
  User, PenLine, Save, Camera, Smile,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { projectApi, topicsApi, submissionsApi, messagesApi, profileApi, supervisorRequestsApi, adminApi } from '../../lib/api';
import type { Project, Topic, Submission, Conversation, Message, TopicFilters, SupervisorRecord, SupervisionRequest } from '../../types';

interface ScreenProps { onNavigate: (screen: string) => void; }

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-200 animate-pulse rounded ${className}`} />;
}

function ChatBubble({ msg, isMine }: { msg: Message; isMine: boolean }) {
  const time = new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-2 shadow-sm ${
        isMine ? 'bg-[#312DC4] text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
      }`}>
        {msg.type === 'text' && <p className="text-sm leading-relaxed">{msg.content}</p>}
        {msg.type === 'image' && (
          <div className="space-y-1">
            <div className="w-48 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
              <ImageIcon className={`w-8 h-8 ${isMine ? 'text-white/60' : 'text-gray-400'}`} />
            </div>
            <p className="text-xs opacity-80">{msg.content}</p>
          </div>
        )}
        {msg.type === 'video' && (
          <div className="space-y-1">
            <div className="w-48 h-32 bg-gray-800 rounded-lg flex items-center justify-center">
              <Video className="w-8 h-8 text-white/60" />
            </div>
            <p className={`text-xs ${isMine ? 'opacity-80' : 'text-gray-500'}`}>{msg.content}</p>
          </div>
        )}
        {msg.type === 'file' && (
          <div className={`flex items-center gap-2.5 px-1 py-0.5 rounded-lg ${isMine ? 'bg-white/15' : 'bg-gray-50 border border-gray-100'}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isMine ? 'bg-white/20' : 'bg-[#EEEDFB]'}`}>
              <FileText className={`w-4 h-4 ${isMine ? 'text-white' : 'text-[#312DC4]'}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate max-w-[160px]">{msg.content}</p>
              <p className={`text-[10px] ${isMine ? 'text-white/60' : 'text-gray-400'}`}>File attachment</p>
            </div>
          </div>
        )}
        <p className={`text-xs mt-1 ${isMine ? 'text-white/60 text-right' : 'text-gray-400'}`}>{time}</p>
      </div>
    </div>
  );
}


// ─── Mock plagiarism check ─────────────────────────────────────────────────────
async function checkPlagiarism(fileName: string): Promise<{ score: number; verdict: 'clear' | 'warning' | 'flagged'; sources: string[] }> {
  await new Promise(r => setTimeout(r, 2800));
  const seed = Array.from(fileName).reduce((a, c) => a + c.charCodeAt(0), 0);
  const score = ((seed * 7 + 13) % 35);
  return {
    score,
    verdict: score < 15 ? 'clear' : score < 25 ? 'warning' : 'flagged',
    sources: score > 8 ? [
      'doi.org/10.1016/j.techreport.2024.01.023',
      'scholar.google.com/citations?q=related-research-2023',
    ] : [],
  };
}

// ─── StudentDashboard ─────────────────────────────────────────────────────────
export function StudentDashboard({ onNavigate }: ScreenProps) {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [submissionCount, setSubmissionCount] = useState<number | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<number | null>(null);
  const [requests, setRequests] = useState<SupervisionRequest[]>([]);

  useEffect(() => {
    projectApi.current().then(setProject).finally(() => setLoading(false));
    submissionsApi.list().then(list => setSubmissionCount(list.length)).catch(() => {});
    supervisorRequestsApi.listForStudent().then(setRequests).catch(() => {});
    messagesApi.conversations('student')
      .then(convs => setUnreadMessages(convs.reduce((n, c) => n + (c.unreadCount ?? 0), 0)))
      .catch(() => setUnreadMessages(0));
  }, []);

  const approvalStatusConfig: Record<string, { label: string; cls: string }> = {
    approved:        { label: 'Supervisor Approved',   cls: 'text-emerald-700 bg-emerald-50' },
    pending:         { label: 'Awaiting Approval',     cls: 'text-amber-700 bg-amber-50' },
    pending_review:  { label: 'Under Review',          cls: 'text-amber-700 bg-amber-50' },
    rejected:        { label: 'Revision Requested',    cls: 'text-red-700 bg-red-50' },
  };

  const latestRequest = requests.find(r => r.status === 'accepted') ?? requests[0];

  const cards = [
    {
      label: 'Overall Progress', value: loading ? '—' : `${project?.overallProgress ?? 0}%`,
      icon: BarChart2, color: 'text-[#312DC4]', bg: 'bg-[#EEEDFB]', screen: 'progress',
    },
    {
      label: 'Submissions', value: submissionCount === null ? '—' : String(submissionCount),
      icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50', screen: 'submission',
    },
    {
      label: 'Messages', value: unreadMessages === null ? '—' : String(unreadMessages),
      icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50', screen: 'messages',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Welcome back, {user?.name?.split(' ')[0] ?? 'Student'}</h2>
        <p className="text-sm text-gray-500 mt-0.5">Here is an overview of your project progress.</p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <button
            key={card.label}
            onClick={() => onNavigate(card.screen)}
            className="bg-white rounded-lg border border-gray-200 p-5 flex items-center gap-4 hover:border-[#C5C3EC] hover:shadow-sm transition-all text-left"
          >
            <div className={`w-11 h-11 ${card.bg} rounded-lg flex items-center justify-center shrink-0`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{card.value}</p>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Current Project ── */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">Current Project</h3>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-2 w-full" />
            </div>
          ) : project ? (
            <div className="space-y-4">
              <div>
                <p className="font-medium text-gray-800">{project.topicTitle || 'Topic not yet assigned'}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Supervisor: <span className="font-medium text-gray-700">{project.supervisorName || 'Not assigned'}</span>
                </p>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-semibold text-[#312DC4]">{project.overallProgress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-[#312DC4] h-2 rounded-full transition-all duration-500" style={{ width: `${project.overallProgress}%` }} />
                </div>
              </div>
              {project.supervisorApprovalStatus && (() => {
                const cfg = approvalStatusConfig[project.supervisorApprovalStatus] ?? { label: project.supervisorApprovalStatus, cls: 'text-gray-600 bg-gray-50' };
                return (
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.cls}`}>
                    <CheckCircle className="w-3 h-3" /> {cfg.label}
                  </span>
                );
              })()}
              <button onClick={() => onNavigate('progress')} className="text-xs text-[#312DC4] hover:underline font-medium">
                View full progress →
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <BarChart2 className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No active project yet.</p>
              <button onClick={() => onNavigate('find-supervisor')} className="mt-3 text-sm font-medium text-[#312DC4] hover:underline">
                Find a supervisor to get started →
              </button>
            </div>
          )}
        </div>

        {/* ── Supervision Status ── */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700 text-sm">Supervision Status</h3>
            <button onClick={() => onNavigate('my-requests')} className="text-xs text-[#312DC4] hover:underline font-medium">View all</button>
          </div>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : latestRequest ? (
            <div className="space-y-3">
              <div className={`rounded-lg border p-4 ${
                latestRequest.status === 'accepted' ? 'border-emerald-200 bg-emerald-50' :
                latestRequest.status === 'rejected' ? 'border-red-200 bg-red-50' :
                'border-amber-200 bg-amber-50'
              }`}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-800">{latestRequest.lecturerName}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    latestRequest.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                    latestRequest.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {latestRequest.status === 'accepted' ? 'Admitted' :
                     latestRequest.status === 'rejected' ? 'Declined' : 'Pending'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 truncate">{latestRequest.topicInterest}</p>
                {latestRequest.status === 'rejected' && latestRequest.denyReason && (
                  <p className="text-xs text-red-600 mt-1.5 line-clamp-2">Reason: {latestRequest.denyReason}</p>
                )}
              </div>
              {requests.length > 1 && (
                <p className="text-xs text-gray-400">{requests.length - 1} other request{requests.length > 2 ? 's' : ''} — <button onClick={() => onNavigate('my-requests')} className="text-[#312DC4] hover:underline">see all</button></p>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <UserCheck className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No supervision requests yet.</p>
              <button onClick={() => onNavigate('find-supervisor')} className="mt-3 text-xs font-medium text-[#312DC4] hover:underline">
                Find a supervisor →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-700 text-sm mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Find a Supervisor',       screen: 'find-supervisor',  icon: Search },
            { label: 'My Requests',             screen: 'my-requests',      icon: UserCheck },
            { label: 'Browse Topics',           screen: 'topic-selection',  icon: Star },
            { label: 'Submit Chapter',          screen: 'submission',       icon: Upload },
            { label: 'View Progress',           screen: 'progress',         icon: BarChart2 },
            { label: 'Messages',                screen: 'messages',         icon: MessageSquare },
          ].map((a) => (
            <button
              key={a.screen}
              onClick={() => onNavigate(a.screen)}
              className="flex items-center gap-3 p-3.5 rounded-lg border border-gray-200 hover:border-[#C5C3EC] hover:bg-[#EEEDFB] transition-colors text-left"
            >
              <a.icon className="w-4 h-4 text-[#312DC4] shrink-0" />
              <span className="text-sm font-medium text-gray-700">{a.label}</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 ml-auto shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── FindSupervisor ───────────────────────────────────────────────────────────
export function FindSupervisor({ onNavigate: _onNavigate }: ScreenProps) {
  const [supervisors, setSupervisors] = useState<SupervisorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [selectedSup, setSelectedSup] = useState<SupervisorRecord | null>(null);
  const [requestModal, setRequestModal] = useState<SupervisorRecord | null>(null);
  const [requestNote, setRequestNote] = useState('');
  const [requestTopic, setRequestTopic] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sentRequests, setSentRequests] = useState<string[]>([]);

  useEffect(() => {
    adminApi.supervisors().then(setSupervisors).finally(() => setLoading(false));
  }, []);

  const allAreas = [...new Set(supervisors.flatMap(s => s.specializations ?? [s.specialization].filter(Boolean)))].sort();

  const filtered = supervisors.filter(s => {
    const q = search.toLowerCase();
    const specs = s.specializations?.length ? s.specializations : [s.specialization];
    const matchSearch = !q || s.name.toLowerCase().includes(q) || specs.some(sp => sp.toLowerCase().includes(q));
    const matchArea = !filterArea || specs.includes(filterArea);
    return matchSearch && matchArea;
  });

  const handleSendRequest = async () => {
    if (!requestModal || !requestTopic.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await supervisorRequestsApi.send(requestModal.id, requestTopic.trim(), requestNote.trim());
      setSentRequests(prev => [...prev, requestModal.id]);
      setRequestModal(null);
      setRequestNote('');
      setRequestTopic('');
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Failed to send request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openSlots = (s: SupervisorRecord) => Math.max(0, s.maxLoad - s.currentLoad);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Find a Supervisor</h2>
        <p className="text-sm text-gray-500 mt-0.5">Browse available supervisors and send a supervision request.</p>
      </div>

      {sentRequests.length > 0 && (
        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-emerald-800">Request{sentRequests.length !== 1 ? 's' : ''} sent!</p>
            <p className="text-sm text-emerald-700 mt-0.5">Your supervisor request has been submitted. You will be notified once the lecturer reviews it.</p>
          </div>
        </div>
      )}

      {/* Search & filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or specialization…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4]"
            />
          </div>
          <select value={filterArea} onChange={(e) => setFilterArea(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4] appearance-none">
            <option value="">All Specializations</option>
            {allAreas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* Supervisor grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
          <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No supervisors found. Try adjusting your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((sup) => {
            const slots = openSlots(sup);
            const requested = sentRequests.includes(sup.id);
            const specs = sup.specializations?.length ? sup.specializations : [sup.specialization].filter(Boolean);
            return (
              <div key={sup.id} className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-12 h-12 rounded-full bg-[#EEEDFB] border border-[#C5C3EC] flex items-center justify-center text-sm font-bold text-[#312DC4] shrink-0 overflow-hidden">
                    {sup.avatarUrl
                      ? <img src={sup.avatarUrl} alt={sup.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      : sup.name.split(' ').filter(w => w !== 'Dr.' && w !== 'Prof.').map(w => w[0]).join('').slice(0, 2)
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {sup.title && <span className="text-xs text-[#312DC4] font-medium bg-[#EEEDFB] px-1.5 py-0.5 rounded">{sup.title}</span>}
                      <p className="text-sm font-semibold text-gray-800">{sup.name}</p>
                    </div>
                    <p className="text-xs text-gray-500">{sup.specialization}</p>
                    {sup.department && <p className="text-xs text-gray-400 mt-0.5">{sup.department}</p>}
                    {sup.rating !== undefined && (
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star
                            key={n}
                            className={`w-3 h-3 ${n <= Math.round(sup.rating!) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                          />
                        ))}
                        <span className="text-xs text-gray-500 ml-0.5">{sup.rating.toFixed(1)}{sup.ratingCount ? ` (${sup.ratingCount})` : ''}</span>
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${slots > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-500'}`}>
                    {slots > 0 ? `${slots} slot${slots !== 1 ? 's' : ''}` : 'Full'}
                  </span>
                </div>

                {sup.bio && <p className="text-xs text-gray-600 leading-relaxed mb-3 line-clamp-2">{sup.bio}</p>}

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {specs.map((s) => (
                    <span key={s} className="text-xs font-medium text-[#312DC4] bg-[#EEEDFB] border border-[#C5C3EC] rounded-full px-2 py-0.5">{s}</span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedSup(sup)}
                    className="flex-1 py-2 rounded-md text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    View Profile
                  </button>
                  {requested ? (
                    <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200">
                      <CheckCircle className="w-4 h-4" /> Requested
                    </div>
                  ) : (
                    <button
                      disabled={slots === 0}
                      onClick={() => { setRequestModal(sup); setRequestNote(''); setRequestTopic(''); setSubmitError(null); }}
                      className="flex-1 py-2 rounded-md text-sm font-medium text-white bg-[#312DC4] hover:bg-[#2724b0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Request Supervision
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full profile modal */}
      {selectedSup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-xl overflow-y-auto max-h-full p-6">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-[#EEEDFB] border border-[#C5C3EC] flex items-center justify-center text-lg font-bold text-[#312DC4] shrink-0 overflow-hidden">
                  {selectedSup.avatarUrl
                    ? <img src={selectedSup.avatarUrl} alt={selectedSup.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    : selectedSup.name.split(' ').filter(w => w !== 'Dr.' && w !== 'Prof.').map(w => w[0]).join('').slice(0, 2)
                  }
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedSup.title && <span className="text-xs text-[#312DC4] font-medium bg-[#EEEDFB] px-1.5 py-0.5 rounded">{selectedSup.title}</span>}
                    <h3 className="text-lg font-bold text-gray-800">{selectedSup.name}</h3>
                  </div>
                  <p className="text-sm text-gray-500">{selectedSup.specialization}</p>
                  {selectedSup.department && <p className="text-xs text-gray-400 mt-0.5">{selectedSup.department}</p>}
                  {selectedSup.rating !== undefined && (
                    <div className="flex items-center gap-1 mt-1.5">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star
                          key={n}
                          className={`w-3.5 h-3.5 ${n <= Math.round(selectedSup.rating!) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                        />
                      ))}
                      <span className="text-sm font-medium text-gray-700 ml-1">{selectedSup.rating.toFixed(1)}</span>
                      {selectedSup.ratingCount && <span className="text-xs text-gray-400">({selectedSup.ratingCount} ratings)</span>}
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedSup(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="space-y-5">
              {selectedSup.bio && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Professional Bio</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedSup.bio}</p>
                </div>
              )}

              {(selectedSup.specializations?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Areas of Specialization</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSup.specializations!.map(s => (
                      <span key={s} className="text-sm font-medium text-[#312DC4] bg-[#EEEDFB] border border-[#C5C3EC] rounded-full px-3 py-1">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {(selectedSup.awards?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Awards & Recognition</p>
                  <ul className="space-y-1.5">
                    {selectedSup.awards!.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0 mt-0.5" /> {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(selectedSup.certifications?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Qualifications</p>
                  <ul className="space-y-1.5">
                    {selectedSup.certifications!.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Supervision capacity: <span className="font-semibold text-gray-800">{openSlots(selectedSup)} of {selectedSup.maxLoad} slots available</span></p>
                </div>
                {sentRequests.includes(selectedSup.id) ? (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md">
                    <CheckCircle className="w-4 h-4" /> Requested
                  </span>
                ) : (
                  <button
                    disabled={openSlots(selectedSup) === 0}
                    onClick={() => { setRequestModal(selectedSup); setSelectedSup(null); setRequestNote(''); setRequestTopic(''); setSubmitError(null); }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-white bg-[#312DC4] hover:bg-[#2724b0] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <UserCheck className="w-4 h-4" /> Request Supervision
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request modal */}
      {requestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Request Supervision</h3>
              <button onClick={() => setRequestModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              You are requesting supervision from <span className="font-medium text-gray-800">{requestModal.title ? `${requestModal.title} ` : ''}{requestModal.name}</span>.
            </p>
            {submitError && (
              <div className="mb-3 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {submitError}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your topic of interest <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={requestTopic}
                  onChange={(e) => setRequestTopic(e.target.value)}
                  placeholder="Briefly describe your project idea…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message to supervisor <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  rows={4}
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder="Introduce yourself and explain why you are interested in working with this supervisor…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4] resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleSendRequest}
                disabled={submitting || !requestTopic.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium text-white bg-[#312DC4] hover:bg-[#2724b0] disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4" /> {submitting ? 'Sending…' : 'Send Request'}
              </button>
              <button onClick={() => setRequestModal(null)} className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ProjectTopicSelection ────────────────────────────────────────────────────
export function ProjectTopicSelection({ onNavigate: _onNavigate }: ScreenProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TopicFilters>({ search: '', department: '', researchArea: '' });
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selecting, setSelecting] = useState(false);

  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalDesc, setProposalDesc] = useState('');
  const [proposalFile, setProposalFile] = useState<File | null>(null);
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [proposalSuccess, setProposalSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchTopics = useCallback(() => {
    setLoading(true);
    topicsApi.list(filters).then(setTopics).finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { fetchTopics(); }, [fetchTopics]);

  const handleSelect = async (topic: Topic) => {
    setSelecting(true);
    try {
      await topicsApi.select(topic.id);
      setSelectedTopic(topic);
    } finally {
      setSelecting(false);
    }
  };

  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProposal(true);
    try {
      await topicsApi.propose({ title: proposalTitle, description: proposalDesc, file: proposalFile });
      setProposalSuccess(true);
      setProposalTitle(''); setProposalDesc(''); setProposalFile(null);
    } finally {
      setSubmittingProposal(false);
    }
  };

  const departments = [...new Set(topics.map(t => t.department))];
  const researchAreas = [...new Set(topics.map(t => t.researchArea))];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Project Topics</h2>

      {selectedTopic && (
        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-emerald-800">Topic selected successfully!</p>
            <p className="text-sm text-emerald-700 mt-0.5">"{selectedTopic.title}" has been registered.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Search topics or lecturers…"
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4]"
          />
          <select
            value={filters.department}
            onChange={(e) => setFilters(f => ({ ...f, department: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4] appearance-none"
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={filters.researchArea}
            onChange={(e) => setFilters(f => ({ ...f, researchArea: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4] appearance-none"
          >
            <option value="">All Research Areas</option>
            {researchAreas.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Topic Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Lecturer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Specialization</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Slots</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td></tr>
                ))
                : topics.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <Filter className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-500">No topics match your filters</p>
                      <button
                        onClick={() => setFilters({ search: '', department: '', researchArea: '' })}
                        className="mt-2 text-xs text-[#312DC4] hover:underline font-medium"
                      >
                        Clear all filters
                      </button>
                    </td>
                  </tr>
                )
                : topics.map((topic) => {
                  const statusConfig: Record<string, { label: string; cls: string }> = {
                    available:        { label: 'Available',        cls: 'bg-emerald-50 text-emerald-700' },
                    full:             { label: 'Full',             cls: 'bg-red-50 text-red-700' },
                    pending_approval: { label: 'Pending Approval', cls: 'bg-amber-50 text-amber-700' },
                    approved:         { label: 'Approved',         cls: 'bg-blue-50 text-blue-700' },
                    rejected:         { label: 'Rejected',         cls: 'bg-red-50 text-red-700' },
                  };
                  const sc = statusConfig[topic.status] ?? { label: topic.status, cls: 'bg-gray-50 text-gray-600' };
                  return (
                    <tr key={topic.id} className={`hover:bg-gray-50 ${selectedTopic?.id === topic.id ? 'bg-emerald-50/40' : ''}`}>
                      <td className="px-4 py-3 font-medium text-gray-800 max-w-xs">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate">{topic.title}</p>
                          {selectedTopic?.id === topic.id && (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{topic.department}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{topic.lecturerName}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block text-xs font-medium text-[#312DC4] bg-[#EEEDFB] border border-[#C5C3EC] rounded-full px-2 py-0.5">
                          {topic.specialization}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{topic.enrolledStudents}/{topic.maxStudents}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sc.cls}`}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {selectedTopic?.id === topic.id ? (
                          <span className="text-xs text-emerald-600 font-medium">Selected</span>
                        ) : (
                          <button
                            disabled={topic.status !== 'available' || selecting}
                            onClick={() => handleSelect(topic)}
                            className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-[#312DC4] hover:bg-[#2724b0] disabled:opacity-40"
                          >
                            Select
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Propose own topic */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Propose Your Own Topic</h3>

        {proposalSuccess && (
          <div className="mb-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
            <CheckCircle className="w-4 h-4 shrink-0" /> Proposal submitted! Your supervisor will review it shortly.
          </div>
        )}

        <form onSubmit={handlePropose} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Title</label>
            <input type="text" required value={proposalTitle} onChange={(e) => setProposalTitle(e.target.value)}
              placeholder="Enter your proposed topic title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brief Description</label>
            <textarea required value={proposalDesc} onChange={(e) => setProposalDesc(e.target.value)}
              rows={3} placeholder="Describe your project idea…"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4] resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attach Proposal (optional)</label>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setProposalFile(e.target.files?.[0] ?? null)} />
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50">
                <Upload className="w-4 h-4" /> Choose File
              </button>
              {proposalFile && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{proposalFile.name}</span>
                  <button type="button" onClick={() => setProposalFile(null)}><X className="w-3 h-3 text-gray-400 hover:text-red-500" /></button>
                </div>
              )}
            </div>
          </div>
          <button type="submit" disabled={submittingProposal}
            className="px-5 py-2 rounded-md text-sm font-medium text-white bg-[#312DC4] hover:bg-[#2724b0] disabled:opacity-60">
            {submittingProposal ? 'Submitting…' : 'Submit Proposal'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── SubmissionAndFeedback ────────────────────────────────────────────────────
export function SubmissionAndFeedback({ onNavigate }: ScreenProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasProject, setHasProject] = useState<boolean | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [chapterLabel, setChapterLabel] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const plagiarismRequired = true;
  const plagiarismThreshold = 20;
  const [plagCheck, setPlagCheck] = useState<{
    status: 'idle' | 'checking' | 'done';
    score?: number;
    verdict?: 'clear' | 'warning' | 'flagged';
    sources?: string[];
  }>({ status: 'idle' });

  useEffect(() => {
    Promise.all([
      projectApi.current(),
      submissionsApi.list(),
    ]).then(([proj, subs]) => {
      setHasProject(!!proj);
      setSubmissions(subs);
    }).finally(() => setLoading(false));
  }, []);

  const handleFileChange = (f: File | null) => {
    setFile(f);
    setPlagCheck({ status: 'idle' });
  };

  const handleRunPlagiarismCheck = async () => {
    if (!file) return;
    setPlagCheck({ status: 'checking' });
    const result = await checkPlagiarism(file.name);
    setPlagCheck({ status: 'done', ...result });
  };

  const canSubmit = !plagiarismRequired
    || (plagCheck.status === 'done' && (plagCheck.verdict === 'clear' || (plagCheck.verdict === 'warning' && plagCheck.score! < plagiarismThreshold)));

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !canSubmit) return;
    setUploading(true);
    setUploadSuccess(false);
    setUploadError(null);
    try {
      const newSub = await submissionsApi.upload(file, chapterLabel);
      setSubmissions(prev => [newSub, ...prev]);
      setFile(null);
      setChapterLabel('');
      setPlagCheck({ status: 'idle' });
      setUploadSuccess(true);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const statusConfig: Record<Submission['status'], { label: string; cls: string; icon: React.ElementType }> = {
    pending_review: { label: 'Pending Review', cls: 'bg-amber-50 text-amber-700',      icon: Clock },
    reviewed:       { label: 'Reviewed',        cls: 'bg-blue-50 text-blue-700',        icon: CheckCircle },
    approved:       { label: 'Approved',         cls: 'bg-emerald-50 text-emerald-700', icon: CheckCircle },
    rejected:       { label: 'Rejected',         cls: 'bg-red-50 text-red-700',         icon: AlertCircle },
  };

  const plagVerdictConfig = {
    clear:   { label: 'Clear', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle, bar: 'bg-emerald-500' },
    warning: { label: 'Similarity Detected', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle, bar: 'bg-amber-500' },
    flagged: { label: 'High Similarity — Blocked', cls: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle, bar: 'bg-red-500' },
  };

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Submissions & Feedback</h2>

      {/* No-project guard */}
      {hasProject === false && (
        <div className="flex items-start gap-4 bg-amber-50 border border-amber-200 rounded-lg p-5">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-amber-800">No active project yet</p>
            <p className="text-sm text-amber-700 mt-1">You need to enrol in a project topic before you can submit files. Once your topic is approved and assigned, this form will become available.</p>
            <button onClick={() => onNavigate('topic-selection')}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-amber-800 underline underline-offset-2 hover:text-amber-900">
              Go to Project Topics →
            </button>
          </div>
        </div>
      )}

      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${hasProject === false ? 'opacity-50 pointer-events-none select-none' : ''}`}>
        <h3 className="font-semibold text-gray-700 mb-4">Upload New Submission</h3>

        {uploadError && (
          <div className="mb-4 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{uploadError}
          </div>
        )}

        {plagiarismRequired && (
          <div className="mb-4 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Plagiarism check required</p>
              <p className="text-xs text-blue-600 mt-0.5">Your supervisor requires all submissions to pass a plagiarism check (max {plagiarismThreshold}% similarity) before they are accepted.</p>
            </div>
          </div>
        )}

        {uploadSuccess && (
          <div className="mb-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
            <CheckCircle className="w-4 h-4 shrink-0" /> File uploaded successfully and sent for review.
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chapter / Document Label</label>
            <input type="text" required value={chapterLabel} onChange={(e) => setChapterLabel(e.target.value)}
              placeholder="e.g. Chapter 3: Methodology"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4]" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document File</label>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)} />
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center cursor-pointer hover:border-[#C5C3EC] hover:bg-[#EEEDFB]/30 transition-colors"
            >
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                  <FileText className="w-5 h-5 text-[#312DC4]" />
                  <span>{file.name}</span>
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleFileChange(null); }}>
                    <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Click to browse, or drag & drop</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX (max 20 MB)</p>
                </>
              )}
            </div>
          </div>

          {/* Plagiarism check section */}
          {plagiarismRequired && file && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#312DC4]" />
                  <p className="text-sm font-medium text-gray-700">Plagiarism Check</p>
                </div>
                {plagCheck.status !== 'done' && (
                  <button
                    type="button"
                    onClick={handleRunPlagiarismCheck}
                    disabled={plagCheck.status === 'checking'}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-[#312DC4] hover:bg-[#2724b0] disabled:opacity-60"
                  >
                    {plagCheck.status === 'checking' ? (
                      <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Checking…</>
                    ) : 'Run Check'}
                  </button>
                )}
              </div>

              {plagCheck.status === 'checking' && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="h-2 bg-[#312DC4] rounded-full animate-pulse w-2/3" />
                  </div>
                  <p className="text-xs text-gray-500">Analysing document against known sources…</p>
                </div>
              )}

              {plagCheck.status === 'done' && plagCheck.verdict && (
                <div className="space-y-2">
                  <div className={`flex items-start gap-3 border rounded-lg px-3 py-2.5 ${plagVerdictConfig[plagCheck.verdict].cls}`}>
                    {React.createElement(plagVerdictConfig[plagCheck.verdict].icon, { className: 'w-4 h-4 shrink-0 mt-0.5' })}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{plagVerdictConfig[plagCheck.verdict].label}</p>
                      <p className="text-xs opacity-80 mt-0.5">Similarity score: {plagCheck.score}% (threshold: {plagiarismThreshold}%)</p>
                    </div>
                    <span className="text-lg font-bold tabular-nums">{plagCheck.score}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${plagVerdictConfig[plagCheck.verdict].bar}`}
                        style={{ width: `${Math.min(plagCheck.score!, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{plagiarismThreshold}%</span>
                    <div className="w-0.5 h-3 bg-gray-300 rounded" />
                  </div>
                  {plagCheck.sources && plagCheck.sources.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">Matched sources:</p>
                      <ul className="space-y-1">
                        {plagCheck.sources.map((s, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-center gap-1.5">
                            <ExternalLink className="w-3 h-3 text-gray-400" /> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {plagCheck.verdict === 'flagged' && (
                    <p className="text-xs text-red-600 font-medium">This document cannot be submitted. Please revise it to reduce similarity below {plagiarismThreshold}%.</p>
                  )}
                  {plagCheck.verdict !== 'flagged' && (
                    <button type="button" onClick={handleRunPlagiarismCheck}
                      className="text-xs text-[#312DC4] hover:underline">Re-check with updated file</button>
                  )}
                </div>
              )}

              {plagCheck.status === 'idle' && (
                <p className="text-xs text-gray-400">Run the plagiarism check before submitting. Submissions with high similarity will be rejected.</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={!file || uploading || (plagiarismRequired && !canSubmit)}
            className="px-5 py-2 rounded-md text-sm font-medium text-white bg-[#312DC4] hover:bg-[#2724b0] disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : plagiarismRequired && plagCheck.status !== 'done' ? 'Run Plagiarism Check First' : 'Submit for Review'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Submission History</h3>
        {submissions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">No submissions yet.</p>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub) => {
              const cfg = statusConfig[sub.status];
              const Icon = cfg.icon;
              return (
                <div key={sub.id} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-[#312DC4] shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{sub.chapterLabel}</p>
                        <p className="text-xs text-gray-400">{sub.fileName} · {sub.fileSize} · {new Date(sub.uploadedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${cfg.cls}`}>
                      <Icon className="w-3 h-3" /> {cfg.label}
                    </span>
                  </div>
                  {sub.feedback && (
                    <div className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-md p-3 border-l-2 border-[#312DC4]">
                      <p className="text-xs font-medium text-gray-500 mb-1">Supervisor Feedback</p>
                      {sub.feedback}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ProgressTracking ─────────────────────────────────────────────────────────
export function ProgressTracking({ onNavigate: _onNavigate }: ScreenProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectApi.current().then(setProject).finally(() => setLoading(false));
  }, []);

  const milestoneConfig = {
    completed:   { cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    in_progress: { cls: 'bg-[#EEEDFB] text-[#312DC4] border-[#C5C3EC]',      dot: 'bg-[#312DC4]' },
    pending:     { cls: 'bg-gray-50 text-gray-500 border-gray-200',           dot: 'bg-gray-300' },
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Progress Tracking</h2>

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3 w-full" />
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : !project ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-sm text-gray-500">
          No active project found.
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-700">Overall Progress</h3>
              <span className="text-2xl font-bold text-[#312DC4]">{project.overallProgress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div className="bg-[#312DC4] h-3 rounded-full transition-all duration-700" style={{ width: `${project.overallProgress}%` }} />
            </div>
            <p className="text-sm text-gray-500 mt-2">{project.topicTitle}</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Milestones</h3>
            <div className="space-y-3">
              {project.milestones.map((m) => {
                const cfg = milestoneConfig[m.status];
                return (
                  <div key={m.id} className={`flex items-center gap-4 border rounded-lg px-4 py-3 ${cfg.cls}`}>
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{m.label}</p>
                      {m.dueDate && <p className="text-xs opacity-70">Due {new Date(m.dueDate).toLocaleDateString()}</p>}
                    </div>
                    <div className="w-24">
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="opacity-70">Progress</span>
                        <span className="font-medium">{m.percentage}%</span>
                      </div>
                      <div className="w-full bg-white/50 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${cfg.dot}`} style={{ width: `${m.percentage}%` }} />
                      </div>
                    </div>
                    <span className="text-xs font-medium capitalize opacity-80 shrink-0">
                      {m.status.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Shared ConvItem helper ────────────────────────────────────────────────────
function ConvItem({ conv, active, onClick }: { conv: Conversation; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 text-left hover:bg-gray-50 transition-colors ${active ? 'bg-[#EEEDFB]' : ''}`}
    >
      <div className="w-10 h-10 rounded-full bg-[#312DC4] flex items-center justify-center text-white text-xs font-bold shrink-0">
        {conv.participantInitials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className="text-sm font-medium text-gray-800 truncate">{conv.participantName}</p>
          {conv.unreadCount > 0 && (
            <span className="min-w-[18px] h-[18px] bg-[#312DC4] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shrink-0">
              {conv.unreadCount}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">{conv.participantSubtitle}</p>
        <p className="text-xs text-gray-400 truncate mt-0.5">{conv.lastMessage}</p>
      </div>
    </button>
  );
}

// ─── Shared ChatInput helper ───────────────────────────────────────────────────
const EMOJI_LIST = ['😊','😂','❤️','👍','👋','🙌','🎉','🔥','💪','🤝','📚','📝','✅','⚠️','🕐','📅','💡','🎓','🏆','👏','😎','🙏','💬','📌','🚀'];

function ChatInput({ text, setText, sending, onSend, onAttach, showAttachMenu, setShowAttachMenu, imageRef, videoRef, sendMedia, activeConvId, user }: {
  text: string; setText: (v: string) => void; sending: boolean; onSend: () => void;
  onAttach: () => void; showAttachMenu: boolean; setShowAttachMenu: (v: boolean | ((v: boolean) => boolean)) => void;
  imageRef: React.RefObject<HTMLInputElement>; videoRef: React.RefObject<HTMLInputElement>;
  sendMedia: (file: File, type: 'image' | 'video' | 'file') => void;
  activeConvId: string | null; user: { id: string; name: string } | null;
}) {
  const [showEmoji, setShowEmoji] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="px-3 py-3 border-t border-gray-100 bg-white">
      {showEmoji && (
        <div className="mb-2 p-2 bg-white border border-gray-200 rounded-xl shadow-md flex flex-wrap gap-1">
          {EMOJI_LIST.map(e => (
            <button key={e} onClick={() => { setText(text + e); setShowEmoji(false); }} className="text-lg hover:scale-125 transition-transform leading-none p-0.5">{e}</button>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <div className="relative">
          <button onClick={() => { onAttach(); setShowEmoji(false); }} className="p-2 text-gray-400 hover:text-[#312DC4] hover:bg-[#EEEDFB] rounded-lg transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          {showAttachMenu && (
            <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-36 z-20">
              <button onClick={() => { imageRef.current?.click(); setShowAttachMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <ImageIcon className="w-4 h-4 text-[#312DC4]" /> Image
              </button>
              <button onClick={() => { videoRef.current?.click(); setShowAttachMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <Video className="w-4 h-4 text-[#312DC4]" /> Video
              </button>
              <button onClick={() => { fileRef.current?.click(); setShowAttachMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <FileText className="w-4 h-4 text-[#312DC4]" /> File
              </button>
            </div>
          )}
        </div>
        <button onClick={() => { setShowEmoji(v => !v); setShowAttachMenu(false); }} className="p-2 text-gray-400 hover:text-[#312DC4] hover:bg-[#EEEDFB] rounded-lg transition-colors">
          <Smile className="w-5 h-5" />
        </button>
        <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) sendMedia(e.target.files[0], 'image'); }} />
        <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) sendMedia(e.target.files[0], 'video'); }} />
        <input ref={fileRef} type="file" className="hidden" onChange={(e) => { if (e.target.files?.[0]) sendMedia(e.target.files[0], 'file'); }} />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          rows={1}
          placeholder="Type a message…"
          className="flex-1 resize-none px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4] bg-gray-50"
        />
        <button onClick={onSend} disabled={!text.trim() || sending} className="p-2 bg-[#312DC4] hover:bg-[#2724b0] text-white rounded-lg disabled:opacity-50 transition-colors">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ─── StudentMessaging ─────────────────────────────────────────────────────────
export function StudentMessaging({ onNavigate: _onNavigate }: ScreenProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  // Mobile: track whether thread pane is open
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');
  const bottomRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesApi.conversations('student').then((data) => {
      setConversations(data);
      if (data.length > 0 && !activeConvId) {
        setActiveConvId(data[0].id);
        // On desktop, auto-select first; on mobile stay on list
      }
    }).finally(() => setLoadingConvs(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeConvId) return;
    setLoadingMsgs(true);
    messagesApi.thread(activeConvId, 'student').then(setMessages).finally(() => setLoadingMsgs(false));
  }, [activeConvId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConv = conversations.find(c => c.id === activeConvId);

  const selectConv = (id: string) => {
    setActiveConvId(id);
    setMobileView('thread');
  };

  const sendText = async () => {
    if (!text.trim() || !activeConvId || !user) return;
    setSending(true);
    try {
      const msg = await messagesApi.send(activeConvId, user.id, user.name, text.trim());
      setMessages(prev => [...prev, msg]);
      setText('');
    } finally {
      setSending(false);
    }
  };

  const sendMedia = async (file: File, type: 'image' | 'video' | 'file') => {
    if (!activeConvId || !user) return;
    setSending(true);
    setShowAttachMenu(false);
    try {
      const msg = await messagesApi.sendMedia(activeConvId, user.id, user.name, file, type);
      setMessages(prev => [...prev, msg]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Messages</h2>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex h-[calc(100vh-200px)] min-h-[500px]">

        {/* Conversation list — full width on mobile (when in list view), fixed panel on desktop */}
        <div className={`flex flex-col border-r border-gray-200 shrink-0 w-full sm:w-72 ${mobileView === 'thread' ? 'hidden sm:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
            <p className="text-sm font-semibold text-gray-700">Conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingConvs
              ? Array.from({ length: 2 }).map((_, i) => <div key={i} className="p-4"><Skeleton className="h-12 w-full" /></div>)
              : conversations.length === 0
                ? <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10 text-gray-400">
                    <MessageSquare className="w-8 h-8 mb-2 text-gray-200" />
                    <p className="text-sm">No conversations yet.</p>
                    <p className="text-xs mt-1">Your supervisor will appear here once assigned.</p>
                  </div>
                : conversations.map((conv) => (
                  <ConvItem key={conv.id} conv={conv} active={activeConvId === conv.id} onClick={() => selectConv(conv.id)} />
                ))
            }
          </div>
        </div>

        {/* Thread pane — full width on mobile (when in thread view), fills rest on desktop */}
        <div className={`flex-1 flex flex-col min-w-0 ${mobileView === 'list' ? 'hidden sm:flex' : 'flex'}`}>
          {activeConv ? (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0">
                {/* Back button — mobile only */}
                <button
                  onClick={() => setMobileView('list')}
                  className="sm:hidden p-1.5 -ml-1 text-gray-500 hover:bg-gray-100 rounded-lg"
                  aria-label="Back to conversations"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-8 h-8 rounded-full bg-[#312DC4] flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {activeConv.participantInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{activeConv.participantName}</p>
                  <p className="text-xs text-gray-400 truncate">{activeConv.participantSubtitle}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
                {loadingMsgs
                  ? <div className="space-y-3"><Skeleton className="h-12 w-3/5" /><Skeleton className="h-10 w-2/5 ml-auto" /></div>
                  : messages.map((msg) => <ChatBubble key={msg.id} msg={msg} isMine={msg.senderId === user?.id} />)
                }
                <div ref={bottomRef} />
              </div>

              <ChatInput
                text={text} setText={setText} sending={sending} onSend={sendText}
                onAttach={() => setShowAttachMenu(v => !v)} showAttachMenu={showAttachMenu} setShowAttachMenu={setShowAttachMenu}
                imageRef={imageRef} videoRef={videoRef} sendMedia={sendMedia}
                activeConvId={activeConvId} user={user}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8 text-gray-400">
              <MessageSquare className="w-10 h-10 mb-2 text-gray-200" />
              <p className="text-sm">Select a conversation to start messaging.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── StudentProfile ───────────────────────────────────────────────────────────
// ─── MyRequests ───────────────────────────────────────────────────────────────
export function MyRequests({ onNavigate }: ScreenProps) {
  const [requests, setRequests] = useState<SupervisionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supervisorRequestsApi.listForStudent().then(setRequests).finally(() => setLoading(false));
  }, []);

  const statusConfig: Record<SupervisionRequest['status'], { label: string; className: string }> = {
    pending:  { label: 'Pending',  className: 'bg-amber-50 text-amber-700 border-amber-200' },
    accepted: { label: 'Accepted', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    rejected: { label: 'Declined', className: 'bg-red-50 text-red-600 border-red-200' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">My Supervision Requests</h2>
          <p className="text-sm text-gray-500 mt-0.5">Track the status of requests you have sent to supervisors.</p>
        </div>
        <button
          onClick={() => onNavigate('find-supervisor')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-white bg-[#312DC4] hover:bg-[#2724b0]"
        >
          <Search className="w-4 h-4" /> Find Supervisor
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <UserCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">No requests sent yet</p>
          <p className="text-sm text-gray-500 mt-1">Browse available supervisors and send a request to get started.</p>
          <button
            onClick={() => onNavigate('find-supervisor')}
            className="mt-4 px-4 py-2 rounded-md text-sm font-medium text-white bg-[#312DC4] hover:bg-[#2724b0]"
          >
            Find a Supervisor
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const cfg = statusConfig[req.status];
            return (
              <div key={req.id} className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-800">{req.lecturerName}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.className}`}>{cfg.label}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium text-gray-700">Topic: </span>{req.topicInterest}
                    </p>
                    {req.message && (
                      <p className="text-xs text-gray-500 italic line-clamp-2">"{req.message}"</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>

                {req.status === 'rejected' && req.denyReason && (
                  <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-red-700">Reason for decline</p>
                      <p className="text-xs text-red-600 mt-0.5">{req.denyReason}</p>
                    </div>
                  </div>
                )}

                {req.status === 'accepted' && (
                  <div className="mt-3 flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-700">Your request was accepted. Check your messages for further instructions from your supervisor.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function StudentProfile({ onNavigate: _onNavigate }: ScreenProps) {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.avatarUrl);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setAvatarUrl(user?.avatarUrl); }, [user?.avatarUrl]);

  const [form, setForm] = useState({
    name: user?.name ?? '',
    department: user?.department ?? '',
    phone: '',
    level: '',
    bio: '',
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
      const msg = err instanceof Error ? err.message : 'Upload failed. Check storage bucket permissions.';
      setAvatarError(msg);
      toast.error('Photo upload failed', { description: msg });
    } finally { setAvatarUploading(false); }
  };

  const handleEdit = () => {
    setForm({ name: user?.name ?? '', department: user?.department ?? '', phone: '', level: '', bio: '' });
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

  const initials = (user?.name ?? 'S').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const field = (label: string, value: React.ReactNode, editNode: React.ReactNode, span?: boolean) => (
    <div className={span ? 'sm:col-span-2' : ''}>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      {editing ? editNode : <p className="text-sm text-gray-800">{value || '—'}</p>}
    </div>
  );

  const inp = (key: keyof typeof form, placeholder?: string, type = 'text') => (
    <input
      type={type}
      value={form[key]}
      placeholder={placeholder}
      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4]"
    />
  );

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
        {/* ── Avatar ── */}
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
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" onError={() => setAvatarUrl(undefined)} />
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

        {/* ── Fields ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {field('Full Name', user?.name, inp('name', 'Your full name'))}

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Matric Number</label>
            <p className="text-sm text-gray-800">{user?.matricNumber || '—'}</p>
            {editing && <p className="text-xs text-gray-400 mt-0.5">Cannot be changed — contact admin</p>}
          </div>

          {field('Department / Faculty', user?.department, inp('department', 'e.g. Computer Science'))}

          {field('Level / Year of Study', form.level || '—', (
            <select
              value={form.level}
              onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4] appearance-none"
            >
              <option value="">Select level</option>
              {['100', '200', '300', '400', '500', 'Postgraduate'].map(l => (
                <option key={l} value={l}>{l} Level</option>
              ))}
            </select>
          ))}

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email Address</label>
            <p className="text-sm text-gray-800">{user?.email || '—'}</p>
            {editing && <p className="text-xs text-gray-400 mt-0.5">Contact support to change email</p>}
          </div>

          {field('Phone Number', form.phone || '—', inp('phone', 'e.g. +234 800 000 0000', 'tel'))}

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Bio / About</label>
            {editing ? (
              <textarea
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                rows={3}
                placeholder="A short introduction about yourself, your interests, and research goals…"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4] resize-none"
              />
            ) : (
              <p className="text-sm text-gray-800 leading-relaxed">{form.bio || '—'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
