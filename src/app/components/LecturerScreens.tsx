import React, { useState, useEffect, useRef } from 'react';
import {
  Users, FileText, Upload, BarChart2, MessageSquare,
  CheckCircle, Clock, AlertCircle, Search, X,
  ImageIcon, Video, Send, Paperclip, Plus,
  UserCheck, Award, BookOpen, PenLine, Save,
  Calendar, Link2, MapPin, Radio, Star,
  ExternalLink, Megaphone, Phone, ChevronDown, ChevronLeft, User,
  ThumbsUp, ThumbsDown, Eye, Smile,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { topicsApi, lecturerApi, messagesApi, submissionsApi, profileApi, supervisorRequestsApi, adminApi } from '../../lib/api';
import type { Topic, TopicFormData, StudentRecord, Conversation, Message, Submission, SupervisionRequest } from '../../types';

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
        {(msg as any).type === 'meeting' && (
          <div className="space-y-1">
            <div className={`rounded-lg p-2.5 ${isMine ? 'bg-white/15' : 'bg-[#EEEDFB]'}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className={`w-3.5 h-3.5 ${isMine ? 'text-white' : 'text-[#312DC4]'}`} />
                <span className={`text-xs font-semibold ${isMine ? 'text-white' : 'text-[#312DC4]'}`}>Meeting Scheduled</span>
              </div>
              <p className="text-xs leading-relaxed">{msg.content}</p>
            </div>
          </div>
        )}
        <p className={`text-xs mt-1 ${isMine ? 'text-white/60 text-right' : 'text-gray-400'}`}>{time}</p>
      </div>
    </div>
  );
}


interface MeetingForm {
  platform: 'googlemeet' | 'zoom' | 'teams' | 'physical';
  date: string;
  time: string;
  topic: string;
  link: string;
  location: string;
  sendTo: 'all' | string;
}

const PLATFORM_LABELS: Record<string, string> = {
  googlemeet: 'Google Meet',
  zoom: 'Zoom',
  teams: 'Microsoft Teams',
  physical: 'Physical Meeting',
};

const PLATFORM_ICONS: Record<string, string> = {
  googlemeet: '🎥',
  zoom: '💻',
  teams: '🖥️',
  physical: '📍',
};

// ─── LecturerDashboard ────────────────────────────────────────────────────────
export function LecturerDashboard({ onNavigate }: ScreenProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState({ assignedStudents: 0, activeProjects: 0, pendingReviews: 0, workloadPercent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    lecturerApi.stats().then(setStats).finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Assigned Students', value: stats.assignedStudents, icon: Users,    color: 'text-[#312DC4]',   bg: 'bg-[#EEEDFB]' },
    { label: 'Active Projects',   value: stats.activeProjects,   icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending Reviews',   value: stats.pendingReviews,   icon: Clock,    color: 'text-amber-600',   bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Welcome, {user?.name ?? 'Lecturer'}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{user?.specialization ?? 'Faculty Member'}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg border border-gray-200 p-5 flex items-center gap-4">
            <div className={`w-11 h-11 ${card.bg} rounded-lg flex items-center justify-center shrink-0`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{loading ? '—' : card.value}</p>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-700">Workload Capacity</h3>
          <span className="text-lg font-bold text-[#312DC4]">{loading ? '—' : stats.workloadPercent}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-700 ${stats.workloadPercent >= 90 ? 'bg-red-500' : stats.workloadPercent >= 70 ? 'bg-amber-500' : 'bg-[#312DC4]'}`}
            style={{ width: `${stats.workloadPercent}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">{stats.workloadPercent >= 90 ? 'Near capacity — review workload settings.' : 'Within acceptable range.'}</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'My Profile',          screen: 'my-profile',       icon: UserCheck },
            { label: 'Student Requests',    screen: 'student-requests', icon: Users },
            { label: 'Upload Topic',        screen: 'topic-upload',     icon: Upload },
            { label: 'My Students',         screen: 'view-students',    icon: BookOpen },
            { label: 'Workload',            screen: 'workload',         icon: BarChart2 },
            { label: 'Messages',            screen: 'messages',         icon: MessageSquare },
          ].map((a) => (
            <button
              key={a.screen}
              onClick={() => onNavigate(a.screen)}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-[#C5C3EC] hover:bg-[#EEEDFB] transition-colors"
            >
              <a.icon className="w-5 h-5 text-[#312DC4]" />
              <span className="text-xs font-medium text-gray-700 text-center">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── LecturerProfile ─────────────────────────────────────────────────────────
export function LecturerProfile({ onNavigate: _onNavigate }: ScreenProps) {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.avatarUrl);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setAvatarUrl(user?.avatarUrl); }, [user?.avatarUrl]);
  const [profile, setProfile] = useState({
    title: 'Dr.',
    bio: '',
    specializations: [] as string[],
    awards: [] as string[],
    certifications: [] as string[],
    maxStudents: 8,
    currentLoad: 0,
    requirePlagiarismCheck: true,
    plagiarismThreshold: 20,
    allowStudentsToSeeCapacity: true,
  });
  const [newSpec, setNewSpec] = useState('');

  const SPECIALIZATION_OPTIONS = [
    'Artificial Intelligence', 'Machine Learning', 'Deep Learning',
    'Natural Language Processing', 'Computer Vision', 'Data Science',
    'Big Data Analytics', 'Cloud Computing', 'Cybersecurity',
    'Network Security', 'Blockchain Technology', 'Internet of Things',
    'Embedded Systems', 'Robotics & Automation', 'Human-Computer Interaction',
    'Software Engineering', 'Distributed Systems', 'Database Systems',
    'Computer Graphics', 'Parallel Computing', 'Wireless Communications',
    'Signal Processing', 'Control Systems', 'Digital Electronics',
    'Renewable Energy Systems', 'Biomedical Engineering', 'Bioinformatics',
  ];
  const [newAward, setNewAward] = useState('');
  const [newCert, setNewCert] = useState('');

  // Load profile + actual student count from DB on mount
  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      profileApi.fetchLecturerProfile(user.id),
      lecturerApi.stats(),
    ]).then(([p, stats]) => {
      if (!p) return;
      setProfile(prev => ({
        ...prev,
        title: p.title || prev.title,
        bio: p.bio || prev.bio,
        specializations: p.specializations.length ? p.specializations : prev.specializations,
        awards: p.awards.length ? p.awards : prev.awards,
        certifications: p.certifications.length ? p.certifications : prev.certifications,
        maxStudents: p.maxStudents,
        currentLoad: stats.assignedStudents,
        requirePlagiarismCheck: p.requirePlagiarismCheck,
        plagiarismThreshold: p.plagiarismThreshold,
        allowStudentsToSeeCapacity: p.allowStudentsToSeeCapacity,
      }));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileApi.updateProfile({
        title: profile.title, bio: profile.bio,
        specializations: profile.specializations, awards: profile.awards,
        certifications: profile.certifications,
        capacity: profile.maxStudents,
        allowStudentsToSeeCapacity: profile.allowStudentsToSeeCapacity,
        requirePlagiarismCheck: profile.requirePlagiarismCheck,
        plagiarismThreshold: profile.plagiarismThreshold,
      });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast.success('Profile saved successfully');
    } finally {
      setSaving(false);
    }
  };

  const addToList = (field: 'specializations' | 'awards' | 'certifications', value: string, clear: () => void) => {
    if (!value.trim()) return;
    setProfile(p => ({ ...p, [field]: [...p[field], value.trim()] }));
    clear();
  };

  const removeFromList = (field: 'specializations' | 'awards' | 'certifications', idx: number) => {
    setProfile(p => ({ ...p, [field]: p[field].filter((_, i) => i !== idx) }));
  };

  const titles = ['Prof.', 'Assoc. Prof.', 'Dr.', 'Mr.', 'Mrs.', 'Ms.'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">My Profile</h2>
        <div className="flex items-center gap-2">
          {saved && <span className="text-sm text-emerald-600 font-medium">✓ Profile saved</span>}
          {editing ? (
            <>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-white bg-[#312DC4] hover:bg-[#2724b0] disabled:opacity-60">
                <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50">
                Cancel
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-[#312DC4] border border-[#C5C3EC] bg-[#EEEDFB] hover:bg-[#E3E2F7]">
              <PenLine className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Profile header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start gap-6">
          <div className="relative">
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <div
              onClick={() => editing && avatarInputRef.current?.click()}
              className={`w-20 h-20 rounded-full border-2 border-[#C5C3EC] overflow-hidden flex items-center justify-center text-2xl font-bold text-[#312DC4] bg-[#EEEDFB] ${editing ? 'cursor-pointer' : ''}`}
            >
              {avatarUploading ? (
                <div className="w-5 h-5 border-2 border-[#312DC4] border-t-transparent rounded-full animate-spin" />
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover"
                  onError={() => setAvatarUrl(undefined)} />
              ) : (
                (user?.name ?? 'L').split(' ').map(w => w[0]).join('').slice(0, 2)
              )}
            </div>
            {editing && !avatarUploading && (
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#312DC4] text-white flex items-center justify-center hover:bg-[#2724b0] text-xs shadow"
                title="Upload photo"
              >
                +
              </button>
            )}
          </div>
          {avatarError && (
            <p className="mt-2 text-xs text-red-600">{avatarError}</p>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {editing ? (
                <select value={profile.title} onChange={(e) => setProfile(p => ({ ...p, title: e.target.value }))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4] appearance-none">
                  {titles.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              ) : (
                <span className="text-sm font-medium text-[#312DC4] bg-[#EEEDFB] px-2 py-0.5 rounded">{profile.title}</span>
              )}
              <h3 className="text-lg font-bold text-gray-800">{user?.name ?? 'Faculty Member'}</h3>
            </div>
            <p className="text-sm text-gray-500">{user?.email ?? 'lecturer@university.edu'}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">{(user as any)?.department ?? 'Computer Science'}</span>
              {(() => {
                const open = Math.max(0, profile.maxStudents - profile.currentLoad);
                return (
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${open > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {open > 0 ? `${open} slot${open !== 1 ? 's' : ''} available` : 'No slots available'}
                  </span>
                );
              })()}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Professional Bio</p>
          {editing ? (
            <textarea rows={4} value={profile.bio} onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4] resize-none" />
          ) : (
            <p className="text-sm text-gray-700 leading-relaxed">{profile.bio}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Specializations */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-[#312DC4]" />
            <h3 className="font-semibold text-gray-700">Areas of Specialization</h3>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {profile.specializations.map((s, i) => (
              <span key={i} className="flex items-center gap-1 text-sm font-medium text-[#312DC4] bg-[#EEEDFB] border border-[#C5C3EC] rounded-full px-3 py-1">
                {s}
                {editing && <button onClick={() => removeFromList('specializations', i)} className="ml-1 text-[#312DC4]/60 hover:text-red-500"><X className="w-3 h-3" /></button>}
              </span>
            ))}
          </div>
          {editing && (
            <div className="flex gap-2">
              <select
                value={newSpec}
                onChange={(e) => setNewSpec(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4] appearance-none bg-white"
              >
                <option value="">Select a specialization…</option>
                {SPECIALIZATION_OPTIONS.filter(o => !profile.specializations.includes(o)).map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
              <button
                onClick={() => addToList('specializations', newSpec, () => setNewSpec(''))}
                disabled={!newSpec}
                className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-[#312DC4] hover:bg-[#2724b0] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Awards */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-gray-700">Awards & Recognition</h3>
          </div>
          <ul className="space-y-2 mb-3">
            {profile.awards.map((a, i) => (
              <li key={i} className="flex items-start justify-between gap-2 text-sm">
                <span className="flex items-start gap-2 text-gray-700"><Star className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" /> {a}</span>
                {editing && <button onClick={() => removeFromList('awards', i)} className="text-gray-300 hover:text-red-500 shrink-0"><X className="w-3.5 h-3.5" /></button>}
              </li>
            ))}
          </ul>
          {editing && (
            <div className="flex gap-2">
              <input type="text" value={newAward} onChange={(e) => setNewAward(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { addToList('awards', newAward, () => setNewAward('')); } }}
                placeholder="Add award…"
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4]" />
              <button onClick={() => addToList('awards', newAward, () => setNewAward(''))}
                className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-[#312DC4] hover:bg-[#2724b0]">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Certifications */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <h3 className="font-semibold text-gray-700">Qualifications & Certifications</h3>
          </div>
          <ul className="space-y-2 mb-3">
            {profile.certifications.map((c, i) => (
              <li key={i} className="flex items-start justify-between gap-2 text-sm">
                <span className="flex items-start gap-2 text-gray-700"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> {c}</span>
                {editing && <button onClick={() => removeFromList('certifications', i)} className="text-gray-300 hover:text-red-500 shrink-0"><X className="w-3.5 h-3.5" /></button>}
              </li>
            ))}
          </ul>
          {editing && (
            <div className="flex gap-2">
              <input type="text" value={newCert} onChange={(e) => setNewCert(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { addToList('certifications', newCert, () => setNewCert('')); } }}
                placeholder="Add qualification…"
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4]" />
              <button onClick={() => addToList('certifications', newCert, () => setNewCert(''))}
                className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-[#312DC4] hover:bg-[#2724b0]">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Supervision settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-4 h-4 text-[#312DC4]" />
            <h3 className="font-semibold text-gray-700">Supervision Settings</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maximum students I can supervise</label>
              {editing ? (
                <input type="number" min={1} max={30} value={profile.maxStudents}
                  onChange={(e) => setProfile(p => ({ ...p, maxStudents: Number(e.target.value) }))}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4]" />
              ) : (
                <p className="text-sm font-semibold text-gray-800">{profile.maxStudents} students</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Show capacity to students</p>
                <p className="text-xs text-gray-400">Students can see how many slots are available</p>
              </div>
              <button
                disabled={!editing}
                onClick={() => setProfile(p => ({ ...p, allowStudentsToSeeCapacity: !p.allowStudentsToSeeCapacity }))}
                className={`w-10 h-5.5 rounded-full relative transition-colors ${editing ? '' : 'opacity-60 cursor-not-allowed'} ${profile.allowStudentsToSeeCapacity ? 'bg-[#312DC4]' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${profile.allowStudentsToSeeCapacity ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Require plagiarism check on submissions</p>
                  <p className="text-xs text-gray-400">Students must pass check before submission is accepted</p>
                </div>
                <button
                  disabled={!editing}
                  onClick={() => setProfile(p => ({ ...p, requirePlagiarismCheck: !p.requirePlagiarismCheck }))}
                  className={`w-10 h-5.5 rounded-full relative transition-colors ${editing ? '' : 'opacity-60 cursor-not-allowed'} ${profile.requirePlagiarismCheck ? 'bg-[#312DC4]' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${profile.requirePlagiarismCheck ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
              {profile.requirePlagiarismCheck && (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500">Similarity threshold:</p>
                  {editing ? (
                    <input type="number" min={5} max={50} value={profile.plagiarismThreshold}
                      onChange={(e) => setProfile(p => ({ ...p, plagiarismThreshold: Number(e.target.value) }))}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4]" />
                  ) : (
                    <span className="text-sm font-semibold text-gray-800">{profile.plagiarismThreshold}%</span>
                  )}
                  <p className="text-xs text-gray-400">max similarity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── StudentSupervisionRequests ───────────────────────────────────────────────
export function StudentSupervisionRequests({ onNavigate }: ScreenProps) {
  const [requests, setRequests] = useState<SupervisionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingRequest, setViewingRequest] = useState<SupervisionRequest | null>(null);
  const [denyModal, setDenyModal] = useState<SupervisionRequest | null>(null);
  const [denyReason, setDenyReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supervisorRequestsApi.listForLecturer().then(setRequests).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const pending  = requests.filter(r => r.status === 'pending');
  const admitted = requests.filter(r => r.status === 'accepted');
  const denied   = requests.filter(r => r.status === 'rejected');

  const handleAdmit = async (req: SupervisionRequest) => {
    setProcessing(req.id);
    try {
      await supervisorRequestsApi.admit(req.id, req.studentId);
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'accepted' } : r));
      setViewingRequest(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to admit student.');
    } finally {
      setProcessing(null);
    }
  };

  const handleDeny = async () => {
    if (!denyModal) return;
    setProcessing(denyModal.id);
    try {
      await supervisorRequestsApi.deny(denyModal.id, denyReason);
      setRequests(prev => prev.map(r => r.id === denyModal.id ? { ...r, status: 'rejected', denyReason } : r));
      setDenyModal(null);
      setDenyReason('');
      setViewingRequest(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to deny request.');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Supervision Requests</h2>
        <div className="flex gap-2">
          <span className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">{loading ? '…' : pending.length} pending</span>
          {admitted.length > 0 && <span className="text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">{admitted.length} admitted</span>}
          {denied.length > 0 && <span className="text-xs font-medium bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full">{denied.length} denied</span>}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      )}

      {!loading && pending.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No pending supervision requests.</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-amber-50">
            <p className="text-sm font-medium text-amber-800">Pending Review ({pending.length})</p>
          </div>
          <div className="divide-y divide-gray-100">
            {pending.map((req) => {
              const initials = req.studentName.split(' ').map(w => w[0]).join('').slice(0, 2);
              return (
                <div key={req.id} className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
                  <div className="relative w-10 h-10 rounded-full bg-[#EEEDFB] border border-[#C5C3EC] flex items-center justify-center text-sm font-bold text-[#312DC4] shrink-0 overflow-hidden">
                    {initials ? initials : <User className="w-4 h-4 opacity-60" />}
                    {req.studentAvatarUrl && (
                      <img src={req.studentAvatarUrl} alt={req.studentName} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{req.studentName}</p>
                    <p className="text-xs text-gray-500">{req.studentRegNo}{req.studentDepartment ? ` · ${req.studentDepartment}` : ''}</p>
                    <p className="text-xs text-gray-600 mt-1">Topic: <span className="font-medium text-gray-700">{req.topicInterest}</span></p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(req.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2 sm:hidden">
                      <button onClick={() => setViewingRequest(req)} className="px-2.5 py-1 rounded-md text-xs font-medium text-[#312DC4] border border-[#C5C3EC] bg-[#EEEDFB]">View</button>
                      <button onClick={() => handleAdmit(req)} disabled={processing === req.id} className="px-2.5 py-1 rounded-md text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50">Admit</button>
                      <button onClick={() => { setDenyModal(req); setDenyReason(''); }} disabled={processing === req.id} className="px-2.5 py-1 rounded-md text-xs font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50">Deny</button>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <button onClick={() => setViewingRequest(req)} className="px-3 py-1.5 rounded-md text-xs font-medium text-[#312DC4] border border-[#C5C3EC] bg-[#EEEDFB] hover:bg-[#E3E2F7]">View</button>
                    <button onClick={() => handleAdmit(req)} disabled={processing === req.id} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50">
                      <UserCheck className="w-3.5 h-3.5" /> {processing === req.id ? '…' : 'Admit'}
                    </button>
                    <button onClick={() => { setDenyModal(req); setDenyReason(''); }} disabled={processing === req.id} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50">
                      <X className="w-3.5 h-3.5" /> Deny
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(admitted.length > 0 || denied.length > 0) && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-600">Processed Requests</p>
          </div>
          <div className="divide-y divide-gray-100">
            {[...admitted, ...denied].map((req) => {
              const initials = req.studentName.split(' ').map(w => w[0]).join('').slice(0, 2);
              return (
                <div key={req.id} className="px-5 py-4 flex items-center gap-4">
                  <div className="relative w-9 h-9 rounded-full bg-[#EEEDFB] border border-[#C5C3EC] flex items-center justify-center text-xs font-bold text-[#312DC4] shrink-0 overflow-hidden">
                    {initials ? initials : <User className="w-3.5 h-3.5 opacity-60" />}
                    {req.studentAvatarUrl && (
                      <img src={req.studentAvatarUrl} alt={req.studentName} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700">{req.studentName}</p>
                    <p className="text-xs text-gray-500">{req.studentRegNo}{req.studentDepartment ? ` · ${req.studentDepartment}` : ''}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">Topic: <span className="font-medium text-gray-600">{req.topicInterest}</span></p>
                    {req.status === 'rejected' && req.denyReason && (
                      <p className="text-xs text-red-500 mt-0.5 truncate">Reason: {req.denyReason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {req.status === 'accepted' && (
                      <button
                        onClick={() => onNavigate('messages')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-[#312DC4] border border-[#C5C3EC] bg-[#EEEDFB] hover:bg-[#E3E2F7]"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Message
                      </button>
                    )}
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${req.status === 'accepted' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                      {req.status === 'accepted' ? '✓ Admitted' : '✗ Denied'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail modal */}
      {viewingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#EEEDFB] border border-[#C5C3EC] flex items-center justify-center text-sm font-bold text-[#312DC4] shrink-0 overflow-hidden">
                  {viewingRequest.studentAvatarUrl
                    ? <img src={viewingRequest.studentAvatarUrl} alt={viewingRequest.studentName} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    : viewingRequest.studentName.split(' ').map(w => w[0]).join('').slice(0, 2)
                  }
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{viewingRequest.studentName}</h3>
                  <p className="text-xs text-gray-500">{viewingRequest.studentRegNo}{viewingRequest.studentDepartment ? ` · ${viewingRequest.studentDepartment}` : ''}</p>
                </div>
              </div>
              <button onClick={() => setViewingRequest(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-xs font-medium text-gray-500 mb-1">Topic of Interest</p>
              <p className="text-sm font-medium text-gray-800">{viewingRequest.topicInterest}</p>
            </div>
            <div className="mb-5">
              <p className="text-xs font-medium text-gray-500 mb-1">Student's Message</p>
              <p className="text-sm text-gray-700 leading-relaxed">{viewingRequest.message || '—'}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleAdmit(viewingRequest)} disabled={processing === viewingRequest.id}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50">
                <UserCheck className="w-4 h-4" /> Admit Student
              </button>
              <button onClick={() => { setDenyModal(viewingRequest); setDenyReason(''); setViewingRequest(null); }}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium text-white bg-red-500 hover:bg-red-600">
                <X className="w-4 h-4" /> Deny
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deny modal */}
      {denyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Deny Request</h3>
              <button onClick={() => setDenyModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-3">Denying supervision request from <span className="font-medium text-gray-800">{denyModal.studentName}</span>.</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
              <textarea rows={3} value={denyReason} onChange={(e) => setDenyReason(e.target.value)}
                placeholder="Provide a reason to help the student…"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4] resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleDeny} disabled={processing === denyModal.id}
                className="flex-1 py-2 rounded-md text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50">
                {processing === denyModal.id ? 'Denying…' : 'Confirm Denial'}
              </button>
              <button onClick={() => setDenyModal(null)} className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ProjectTopicUpload ───────────────────────────────────────────────────────
export function ProjectTopicUpload({ onNavigate: _onNavigate }: ScreenProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState<TopicFormData>({ title: '', description: '', department: '', researchArea: '', maxStudents: 5 });

  const DEPARTMENTS = ['Computer Science', 'Software Engineering', 'Information Technology', 'Electrical Engineering', 'Computer Engineering'];
  const RESEARCH_AREAS = ['Artificial Intelligence', 'Blockchain', 'Web Development', 'Internet of Things', 'Cybersecurity', 'Data Science', 'Mobile Computing'];

  useEffect(() => {
    topicsApi.myTopics().then(setTopics).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);
    try {
      const newTopic = await topicsApi.create(form);
      setTopics(prev => [newTopic, ...prev]);
      setForm({ title: '', description: '', department: '', researchArea: '', maxStudents: 5 });
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  const statusCls: Record<string, string> = {
    available:        'bg-emerald-50 text-emerald-700',
    pending_approval: 'bg-amber-50 text-amber-700',
    approved:         'bg-blue-50 text-blue-700',
    rejected:         'bg-red-50 text-red-700',
    full:             'bg-gray-50 text-gray-600',
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Upload Project Topics</h2>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-[#312DC4]" /> Add New Topic</h3>

        {success && (
          <div className="mb-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
            <CheckCircle className="w-4 h-4 shrink-0" /> Topic submitted for approval.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic Title</label>
            <input type="text" required value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Enter topic title" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea required value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3} placeholder="Describe the project topic…"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4] resize-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select required value={form.department} onChange={(e) => setForm(f => ({ ...f, department: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4] appearance-none">
                <option value="">Select…</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Research Area</label>
              <select required value={form.researchArea} onChange={(e) => setForm(f => ({ ...f, researchArea: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4] appearance-none">
                <option value="">Select…</option>
                {RESEARCH_AREAS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
              <input type="number" min={1} max={20} required value={form.maxStudents}
                onChange={(e) => setForm(f => ({ ...f, maxStudents: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4]" />
            </div>
          </div>
          <button type="submit" disabled={submitting}
            className="px-5 py-2 rounded-md text-sm font-medium text-white bg-[#312DC4] hover:bg-[#2724b0] disabled:opacity-60">
            {submitting ? 'Submitting…' : 'Submit Topic'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Your Topics</h3>
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : topics.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">No topics uploaded yet.</p>
        ) : (
          <div className="space-y-3">
            {topics.map((t) => (
              <div key={t.id} className="border border-gray-100 rounded-lg p-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-800">{t.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t.department} · {t.researchArea} · {t.enrolledStudents}/{t.maxStudents} students</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${statusCls[t.status] ?? 'bg-gray-50 text-gray-600'}`}>
                  {t.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ViewAssignedStudents ─────────────────────────────────────────────────────
export function ViewAssignedStudents({ onNavigate }: ScreenProps) {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [reviewing, setReviewing] = useState<{ sub: Submission; studentName: string } | null>(null);
  const [feedback, setFeedback] = useState('');
  const [savingFeedback, setSavingFeedback] = useState(false);

  useEffect(() => {
    const q = search.trim();
    setLoading(true);
    lecturerApi.students(q || undefined).then(setStudents).finally(() => setLoading(false));
  }, [search]);

  const statusBadge: Record<string, string> = {
    pending_review: 'bg-amber-50 text-amber-700',
    up_to_date:     'bg-emerald-50 text-emerald-700',
    overdue:        'bg-red-50 text-red-700',
  };

  const handleSaveFeedback = async () => {
    if (!reviewing || !feedback.trim()) return;
    setSavingFeedback(true);
    try {
      await submissionsApi.review(reviewing.sub.id, feedback, 'reviewed');
      setReviewing(null);
      setFeedback('');
    } finally {
      setSavingFeedback(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">My Students</h2>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or reg. number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4]"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Student</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Topic</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Progress</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Submission</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td></tr>
                ))
                : students.length === 0
                  ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center">
                        <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No students assigned yet.</p>
                        <p className="text-xs text-gray-400 mt-1">Students you admit from Supervision Requests will appear here.</p>
                      </td>
                    </tr>
                  )
                : students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#EEEDFB] border border-[#C5C3EC] flex items-center justify-center text-xs font-bold text-[#312DC4] shrink-0 overflow-hidden">
                          {s.avatarUrl
                            ? <img src={s.avatarUrl} alt={s.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            : s.name.split(' ').map(w => w[0]).join('').slice(0, 2)
                          }
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.regNo} · {s.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs">
                      <p className="truncate">{s.currentTopic}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-100 rounded-full h-1.5">
                          <div className="bg-[#312DC4] h-1.5 rounded-full" style={{ width: `${s.progress}%` }} />
                        </div>
                        <span className="text-xs text-gray-600">{s.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge[s.submissionStatus] ?? 'bg-gray-50 text-gray-600'}`}>
                        {s.submissionStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onNavigate('messages')}
                          className="px-2.5 py-1.5 rounded-md text-xs font-medium text-[#312DC4] border border-[#C5C3EC] bg-[#EEEDFB] hover:bg-[#E3E2F7]"
                          title="Message student"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        {s.submissionStatus === 'pending_review' && (
                          <button
                            onClick={() => {
                              setReviewing({
                                sub: { id: `sub-${s.id}`, projectId: '', studentId: s.id, chapterLabel: 'Latest Chapter', fileName: '', uploadedAt: new Date().toISOString(), status: 'pending_review' },
                                studentName: s.name,
                              });
                              setFeedback('');
                            }}
                            className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-[#312DC4] hover:bg-[#2724b0]"
                          >
                            Review
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {reviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Review — {reviewing.studentName}</h3>
              <button onClick={() => setReviewing(null)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
            </div>
            <textarea
              rows={5}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Enter your feedback for this submission…"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4] resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSaveFeedback}
                disabled={!feedback.trim() || savingFeedback}
                className="flex-1 py-2 rounded-md text-sm font-medium text-white bg-[#312DC4] hover:bg-[#2724b0] disabled:opacity-60"
              >
                {savingFeedback ? 'Saving…' : 'Submit Feedback'}
              </button>
              <button onClick={() => setReviewing(null)} className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SupervisorWorkloadTracking ───────────────────────────────────────────────
export function SupervisorWorkloadTracking({ onNavigate: _onNavigate }: ScreenProps) {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [stats, setStats] = useState({ assignedStudents: 0, activeProjects: 0, pendingReviews: 0, workloadPercent: 0 });
  const [loading, setLoading] = useState(true);
  const [editingCapacity, setEditingCapacity] = useState(false);
  const [maxStudents, setMaxStudents] = useState(15);
  const [tempMax, setTempMax] = useState(15);
  const [savingCapacity, setSavingCapacity] = useState(false);

  useEffect(() => {
    Promise.all([lecturerApi.students(), lecturerApi.stats()])
      .then(([s, st]) => { setStudents(s); setStats(st); })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveCapacity = async () => {
    setSavingCapacity(true);
    try {
      await profileApi.updateProfile({ capacity: tempMax });
      setMaxStudents(tempMax);
      setEditingCapacity(false);
    } finally {
      setSavingCapacity(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Workload Tracking</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Supervision Capacity</h3>
          <div className="flex items-end gap-3 mb-3">
            <span className="text-4xl font-bold text-[#312DC4]">{loading ? '—' : stats.workloadPercent}%</span>
            <span className="text-sm text-gray-500 mb-1">utilised</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all duration-700 ${stats.workloadPercent >= 90 ? 'bg-red-500' : stats.workloadPercent >= 70 ? 'bg-amber-500' : 'bg-[#312DC4]'}`}
              style={{ width: `${stats.workloadPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">{stats.assignedStudents} of {maxStudents} maximum student slots filled.</p>
          <div className="border-t border-gray-100 mt-4 pt-4">
            {editingCapacity ? (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 shrink-0">Max students:</label>
                <input type="number" min={1} max={50} value={tempMax}
                  onChange={(e) => setTempMax(Number(e.target.value))}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4]" />
                <button onClick={handleSaveCapacity} disabled={savingCapacity}
                  className="flex items-center gap-1 px-3 py-1 rounded text-xs font-medium text-white bg-[#312DC4] hover:bg-[#2724b0] disabled:opacity-60">
                  <Save className="w-3 h-3" /> {savingCapacity ? '…' : 'Save'}
                </button>
                <button onClick={() => { setEditingCapacity(false); setTempMax(maxStudents); }}
                  className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
              </div>
            ) : (
              <button onClick={() => { setEditingCapacity(true); setTempMax(maxStudents); }}
                className="flex items-center gap-1.5 text-xs text-[#312DC4] hover:underline">
                <PenLine className="w-3 h-3" /> Edit maximum capacity
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Summary</h3>
          <dl className="space-y-3">
            {[
              { label: 'Assigned Students', value: stats.assignedStudents },
              { label: 'Active Projects',   value: stats.activeProjects },
              { label: 'Pending Reviews',   value: stats.pendingReviews },
              { label: 'Available Slots',   value: Math.max(0, maxStudents - stats.assignedStudents) },
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-sm">
                <dt className="text-gray-500">{row.label}</dt>
                <dd className="font-semibold text-gray-800">{loading ? '—' : row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Student Progress Overview</h3>
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : (
          <div className="space-y-3">
            {students.map((s) => (
              <div key={s.id} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-full bg-[#EEEDFB] flex items-center justify-center text-xs font-bold text-[#312DC4] shrink-0">
                  {s.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{s.name}</p>
                  <p className="text-xs text-gray-400 truncate">{s.currentTopic}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-24 bg-gray-100 rounded-full h-1.5">
                    <div className="bg-[#312DC4] h-1.5 rounded-full" style={{ width: `${s.progress}%` }} />
                  </div>
                  <span className="text-xs text-gray-600 w-8 text-right">{s.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── LecturerMessaging ────────────────────────────────────────────────────────
export function LecturerMessaging({ onNavigate: _onNavigate }: ScreenProps) { // _onNavigate kept for future use
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [viewMode, setViewMode] = useState<'individual' | 'broadcast'>('individual');
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meeting, setMeeting] = useState<MeetingForm>({
    platform: 'googlemeet', date: '', time: '', topic: '', link: '', location: '', sendTo: 'all',
  });
  const [schedulingMeeting, setSchedulingMeeting] = useState(false);
  // New conversation modal
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatStudents, setNewChatStudents] = useState<{ id: string; name: string; regNo: string }[]>([]);
  const [loadingNewChat, setLoadingNewChat] = useState(false);
  const [startingConv, setStartingConv] = useState<string | null>(null);
  // Mobile: 'list' shows sidebar; 'thread' shows the chat pane
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');
  const bottomRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesApi.conversations('lecturer').then((data) => {
      setConversations(data);
      if (data.length > 0) setActiveConvId(data[0].id);
    }).finally(() => setLoadingConvs(false));
  }, []);

  useEffect(() => {
    if (!activeConvId) return;
    setLoadingMsgs(true);
    messagesApi.thread(activeConvId, 'lecturer').then(setMessages).finally(() => setLoadingMsgs(false));
  }, [activeConvId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConv = conversations.find(c => c.id === activeConvId);

  const selectConv = (id: string) => {
    setActiveConvId(id);
    setMobileView('thread');
    setViewMode('individual');
  };

  const sendText = async () => {
    if (!text.trim() || !activeConvId || !user) return;
    setSending(true);
    try {
      const msg = await messagesApi.send(activeConvId, user.id, user.name, text.trim());
      setMessages(prev => [...prev, msg]);
      setText('');
    } finally { setSending(false); }
  };

  const sendMedia = async (file: File, type: 'image' | 'video' | 'file') => {
    if (!activeConvId || !user) return;
    setSending(true);
    setShowAttachMenu(false);
    try {
      const msg = await messagesApi.sendMedia(activeConvId, user.id, user.name, file, type);
      setMessages(prev => [...prev, msg]);
    } finally { setSending(false); }
  };

  const EMOJI_LIST = ['😊','😂','❤️','👍','👋','🙌','🎉','🔥','💪','🤝','📚','📝','✅','⚠️','🕐','📅','💡','🎓','🏆','👏','😎','🙏','💬','📌','🚀'];

  const insertEmoji = (emoji: string) => {
    setText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const sendBroadcast = async () => {
    if (!broadcastText.trim() || !user || conversations.length === 0) return;
    setBroadcastSending(true);
    try {
      await Promise.all(
        conversations.map(conv =>
          messagesApi.send(conv.id, user.id, user.name, broadcastText.trim())
        )
      );
      setBroadcastSuccess(true);
      setBroadcastText('');
      setTimeout(() => setBroadcastSuccess(false), 4000);
    } finally {
      setBroadcastSending(false);
    }
  };

  const openNewChatModal = async () => {
    setShowNewChatModal(true);
    setLoadingNewChat(true);
    try {
      const allStudents = await lecturerApi.students();
      const existingIds = new Set(conversations.map(c => c.participantId));
      const candidates = allStudents
        .filter(s => !existingIds.has(s.id))
        .map(s => ({ id: s.id, name: s.name, regNo: s.regNo }));
      setNewChatStudents(candidates);
    } finally {
      setLoadingNewChat(false);
    }
  };

  const startNewConversation = async (studentId: string, studentName: string) => {
    if (!user) return;
    setStartingConv(studentId);
    try {
      const convId = await messagesApi.getOrCreateConversation(studentId, user.id);
      const initials = studentName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      const existing = conversations.find(c => c.id === convId);
      if (!existing) {
        setConversations(prev => [{
          id: convId, participantId: studentId, participantName: studentName,
          participantInitials: initials, participantSubtitle: 'Student',
          lastMessage: '', lastMessageAt: new Date().toISOString(), unreadCount: 0,
        }, ...prev]);
      }
      setActiveConvId(convId);
      setViewMode('individual');
      setMobileView('thread');
      setShowNewChatModal(false);
    } finally {
      setStartingConv(null);
    }
  };

  const scheduleMeeting = async () => {
    if (!meeting.date || !meeting.time || !meeting.topic || !user) return;
    setSchedulingMeeting(true);
    await new Promise(r => setTimeout(r, 900));

    const platformLabel = PLATFORM_LABELS[meeting.platform];
    const dateStr = new Date(`${meeting.date}T${meeting.time}`).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    const content = `${PLATFORM_ICONS[meeting.platform]} ${platformLabel} — ${meeting.topic}\n📅 ${dateStr}${meeting.link ? `\n🔗 ${meeting.link}` : ''}${meeting.location ? `\n📍 ${meeting.location}` : ''}`;

    if (activeConvId && user && meeting.sendTo !== 'all') {
      const msg: Message = {
        id: `meet-${Date.now()}`, conversationId: activeConvId,
        senderId: user.id, senderName: user.name,
        type: 'text' as any, content, sentAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, msg]);
    }

    setSchedulingMeeting(false);
    setShowMeetingModal(false);
    setMeeting({ platform: 'googlemeet', date: '', time: '', topic: '', link: '', location: '', sendTo: 'all' });
  };

  const platformUrls: Record<string, string> = {
    googlemeet: 'https://meet.google.com/new',
    zoom: 'https://zoom.us/start/videomeeting',
    teams: 'https://teams.microsoft.com',
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Messages</h2>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex h-[calc(100vh-200px)] min-h-[500px]">

        {/* ── Sidebar — full-width on mobile (list view), fixed panel on desktop ── */}
        <div className={`flex flex-col border-r border-gray-200 shrink-0 w-full sm:w-72 ${mobileView === 'thread' ? 'hidden sm:flex' : 'flex'}`}>

          {/* Mode tabs */}
          <div className="flex border-b border-gray-200 shrink-0">
            <button
              onClick={() => { setViewMode('individual'); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${viewMode === 'individual' ? 'text-[#312DC4] border-b-2 border-[#312DC4] bg-[#EEEDFB]/30' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Individual
            </button>
            <button
              onClick={() => setViewMode('broadcast')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${viewMode === 'broadcast' ? 'text-[#312DC4] border-b-2 border-[#312DC4] bg-[#EEEDFB]/30' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Megaphone className="w-3.5 h-3.5" /> Broadcast
            </button>
          </div>

          {viewMode === 'individual' ? (
            <>
              <div className="px-4 py-3 border-b border-gray-100 shrink-0 flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">Student Conversations</p>
                <button
                  onClick={openNewChatModal}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-[#312DC4] text-white hover:bg-[#2724b0] transition-colors text-base font-bold leading-none"
                  title="Start new conversation"
                >
                  +
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loadingConvs
                  ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="p-4"><Skeleton className="h-12 w-full" /></div>)
                  : conversations.length === 0
                    ? <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10 text-gray-400">
                        <MessageSquare className="w-8 h-8 mb-2 text-gray-200" />
                        <p className="text-sm">No student conversations yet.</p>
                        <p className="text-xs mt-1">Admitted students will appear here.</p>
                      </div>
                    : conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => selectConv(conv.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 text-left hover:bg-gray-50 transition-colors ${activeConvId === conv.id ? 'bg-[#EEEDFB]' : ''}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-[#EEEDFB] border border-[#C5C3EC] flex items-center justify-center text-[#312DC4] text-xs font-bold shrink-0">
                          {conv.participantInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-sm font-medium text-gray-800 truncate">{conv.participantName}</p>
                            {conv.unreadCount > 0 && (
                              <span className="min-w-[18px] h-[18px] bg-[#312DC4] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shrink-0">{conv.unreadCount}</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">{conv.participantSubtitle}</p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">{conv.lastMessage}</p>
                        </div>
                      </button>
                    ))
                }
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col p-4 overflow-y-auto">
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">Broadcast to Students</p>
                <p className="text-xs text-gray-400">Send an announcement to all your supervised students at once.</p>
              </div>
              <div className="bg-[#EEEDFB] border border-[#C5C3EC] rounded-lg p-3 mb-3">
                <p className="text-xs font-medium text-[#312DC4] mb-1">Recipients</p>
                {loadingConvs
                  ? <Skeleton className="h-4 w-full mt-1" />
                  : conversations.length === 0
                    ? <p className="text-xs text-gray-400 italic">No supervised students yet.</p>
                    : conversations.map(c => (
                      <p key={c.id} className="text-xs text-gray-600 mt-0.5">• {c.participantName}</p>
                    ))
                }
              </div>
              {broadcastSuccess && (
                <div className="mb-3 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                  <CheckCircle className="w-4 h-4 shrink-0" /> Broadcast sent.
                </div>
              )}
              <textarea
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                rows={5}
                placeholder="Write your announcement…"
                className="flex-1 resize-none px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4] bg-gray-50"
              />
              <button
                onClick={sendBroadcast}
                disabled={!broadcastText.trim() || broadcastSending || conversations.length === 0}
                className="mt-2 flex items-center justify-center gap-2 w-full py-2 rounded-md text-sm font-medium text-white bg-[#312DC4] hover:bg-[#2724b0] disabled:opacity-50"
              >
                <Megaphone className="w-4 h-4" /> {broadcastSending ? 'Sending…' : 'Send to All Students'}
              </button>
            </div>
          )}
        </div>

        {/* ── Thread pane — full-width on mobile (thread view), fills rest on desktop ── */}
        <div className={`flex-1 flex flex-col min-w-0 ${mobileView === 'list' ? 'hidden sm:flex' : 'flex'}`}>
          {viewMode === 'broadcast' ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
              <Megaphone className="w-10 h-10 text-[#312DC4]/20" />
              <p className="text-sm text-gray-400">Compose and send your broadcast in the panel on the left.</p>
            </div>
          ) : activeConv ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0">
                <button onClick={() => setMobileView('list')} className="sm:hidden p-1.5 -ml-1 text-gray-500 hover:bg-gray-100 rounded-lg" aria-label="Back">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-8 h-8 rounded-full bg-[#EEEDFB] border border-[#C5C3EC] flex items-center justify-center text-[#312DC4] text-xs font-bold shrink-0">
                  {activeConv.participantInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{activeConv.participantName}</p>
                  <p className="text-xs text-gray-400 truncate">{activeConv.projectInfo}</p>
                </div>
                <button
                  onClick={() => setShowMeetingModal(true)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[#312DC4] border border-[#C5C3EC] bg-[#EEEDFB] hover:bg-[#E3E2F7] transition-colors shrink-0"
                >
                  <Calendar className="w-3.5 h-3.5" /> Schedule Meeting
                </button>
                {/* Mobile: calendar icon only */}
                <button onClick={() => setShowMeetingModal(true)} className="sm:hidden p-2 text-[#312DC4] hover:bg-[#EEEDFB] rounded-lg" aria-label="Schedule Meeting">
                  <Calendar className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
                {loadingMsgs
                  ? <div className="space-y-3"><Skeleton className="h-12 w-3/5" /><Skeleton className="h-10 w-2/5 ml-auto" /></div>
                  : messages.map((msg) => <ChatBubble key={msg.id} msg={msg} isMine={msg.senderId === user?.id} />)
                }
                <div ref={bottomRef} />
              </div>

              <div className="px-3 py-3 border-t border-gray-100 bg-white shrink-0">
                {showEmojiPicker && (
                  <div className="mb-2 p-2 bg-white border border-gray-200 rounded-xl shadow-md flex flex-wrap gap-1">
                    {['😊','😂','❤️','👍','👋','🙌','🎉','🔥','💪','🤝','📚','📝','✅','⚠️','🕐','📅','💡','🎓','🏆','👏','😎','🙏','💬','📌','🚀'].map(e => (
                      <button key={e} onClick={() => insertEmoji(e)} className="text-lg hover:scale-125 transition-transform leading-none p-0.5">{e}</button>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <div className="relative">
                    <button onClick={() => { setShowAttachMenu(v => !v); setShowEmojiPicker(false); }} className="p-2 text-gray-400 hover:text-[#312DC4] hover:bg-[#EEEDFB] rounded-lg transition-colors">
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
                  <button onClick={() => { setShowEmojiPicker(v => !v); setShowAttachMenu(false); }} className="p-2 text-gray-400 hover:text-[#312DC4] hover:bg-[#EEEDFB] rounded-lg transition-colors">
                    <Smile className="w-5 h-5" />
                  </button>
                  <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) sendMedia(e.target.files[0], 'image'); }} />
                  <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) sendMedia(e.target.files[0], 'video'); }} />
                  <input ref={fileRef} type="file" className="hidden" onChange={(e) => { if (e.target.files?.[0]) sendMedia(e.target.files[0], 'file'); }} />
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(); } }}
                    rows={1}
                    placeholder="Type a message…"
                    className="flex-1 resize-none px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4] bg-gray-50"
                  />
                  <button onClick={sendText} disabled={!text.trim() || sending} className="p-2 bg-[#312DC4] hover:bg-[#2724b0] text-white rounded-lg disabled:opacity-50 transition-colors">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8 text-gray-400">
              <MessageSquare className="w-10 h-10 mb-2 text-gray-200" />
              <p className="text-sm">Select a student to start messaging.</p>
            </div>
          )}
        </div>
      </div>

      {/* Meeting scheduler modal */}
      {showMeetingModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 px-0 sm:px-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl border border-gray-200 shadow-xl w-full max-w-lg sm:max-h-[90vh] overflow-y-auto p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Schedule a Meeting</h3>
              <button onClick={() => setShowMeetingModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Meeting Platform</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['googlemeet', 'zoom', 'teams', 'physical'] as const).map((p) => (
                    <label key={p} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors text-sm ${meeting.platform === p ? 'border-[#312DC4] bg-[#EEEDFB] text-[#312DC4]' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                      <input type="radio" name="platform" value={p} checked={meeting.platform === p} onChange={() => setMeeting(m => ({ ...m, platform: p }))} className="hidden" />
                      <span className="text-base">{PLATFORM_ICONS[p]}</span>
                      <span className="font-medium text-xs sm:text-sm">{PLATFORM_LABELS[p]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={meeting.date} onChange={(e) => setMeeting(m => ({ ...m, date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input type="time" value={meeting.time} onChange={(e) => setMeeting(m => ({ ...m, time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4]" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agenda / Topic</label>
                <input type="text" value={meeting.topic} onChange={(e) => setMeeting(m => ({ ...m, topic: e.target.value }))}
                  placeholder="e.g. Chapter 3 review and feedback"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4]" />
              </div>

              {meeting.platform !== 'physical' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link</label>
                  <div className="flex gap-2">
                    <input type="url" value={meeting.link} onChange={(e) => setMeeting(m => ({ ...m, link: e.target.value }))}
                      placeholder="Paste your link…"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4]" />
                    <a href={platformUrls[meeting.platform]} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-2 rounded-md text-xs font-medium text-[#312DC4] border border-[#C5C3EC] bg-[#EEEDFB] hover:bg-[#E3E2F7] whitespace-nowrap">
                      <ExternalLink className="w-3.5 h-3.5" /> Create
                    </a>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input type="text" value={meeting.location} onChange={(e) => setMeeting(m => ({ ...m, location: e.target.value }))}
                    placeholder="e.g. Room 204, Engineering Block B"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4]" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Send to</label>
                <select value={meeting.sendTo} onChange={(e) => setMeeting(m => ({ ...m, sendTo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4] appearance-none">
                  <option value="all">All my students (broadcast)</option>
                  {conversations.map(c => <option key={c.id} value={c.id}>{c.participantName}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={scheduleMeeting}
                disabled={schedulingMeeting || !meeting.date || !meeting.time || !meeting.topic}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium text-white bg-[#312DC4] hover:bg-[#2724b0] disabled:opacity-50"
              >
                <Calendar className="w-4 h-4" /> {schedulingMeeting ? 'Scheduling…' : 'Send Invite'}
              </button>
              <button onClick={() => setShowMeetingModal(false)} className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Conversation modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Start New Conversation</h3>
              <button onClick={() => setShowNewChatModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            {loadingNewChat ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : newChatStudents.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">All your students already have active conversations.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {newChatStudents.map(s => {
                  const initials = s.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <button
                      key={s.id}
                      onClick={() => startNewConversation(s.id, s.name)}
                      disabled={startingConv === s.id}
                      className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 transition-colors rounded-lg text-left disabled:opacity-60"
                    >
                      <div className="w-9 h-9 rounded-full bg-[#EEEDFB] border border-[#C5C3EC] flex items-center justify-center text-xs font-bold text-[#312DC4] shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.regNo}</p>
                      </div>
                      {startingConv === s.id
                        ? <span className="w-4 h-4 border-2 border-[#312DC4] border-t-transparent rounded-full animate-spin shrink-0" />
                        : <MessageSquare className="w-4 h-4 text-[#312DC4] shrink-0" />
                      }
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SupervisorTopicApproval ──────────────────────────────────────────────────
export function SupervisorTopicApproval({ onNavigate: _onNavigate }: ScreenProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [processed, setProcessed] = useState<Record<string, 'approved' | 'rejected'>>({});
  const [viewingTopic, setViewingTopic] = useState<Topic | null>(null);
  const [rejectModal, setRejectModal] = useState<Topic | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    topicsApi.studentProposalsForSupervisor()
      .then(setTopics)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const pending = topics.filter(t => !processed[t.id]);
  const done    = topics.filter(t => !!processed[t.id]);

  const handleApprove = async (topic: Topic) => {
    setProcessing(topic.id);
    try {
      await topicsApi.approve(topic.id);
      setProcessed(p => ({ ...p, [topic.id]: 'approved' }));
      setViewingTopic(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to approve topic.');
    } finally { setProcessing(null); }
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
    } finally { setProcessing(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Topic Approval</h2>
          <p className="text-sm text-gray-500 mt-0.5">Review and approve project topics proposed by your supervised students.</p>
        </div>
        <div className="flex gap-2">
          <span className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
            {loading ? '…' : pending.length} pending
          </span>
          {done.length > 0 && (
            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{done.length} reviewed</span>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
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
          <p className="text-gray-600 font-medium">No pending topic proposals from your students.</p>
          <p className="text-xs text-gray-400 mt-1">When an admitted student submits a topic proposal, it will appear here for your review.</p>
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
                  <p className="text-sm font-semibold text-gray-800">{topic.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Proposed by <span className="font-medium text-gray-700">{topic.lecturerName}</span>
                    {topic.department ? ` · ${topic.department}` : ''}
                    {topic.researchArea ? ` · ${topic.researchArea}` : ''}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Submitted {new Date(topic.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">{topic.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setViewingTopic(topic)}
                    className="p-2 text-gray-400 hover:text-[#312DC4] hover:bg-[#EEEDFB] rounded-lg transition-colors"
                    title="View full proposal"
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
                  <p className="text-xs text-gray-400">By {topic.lecturerName}</p>
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

      {viewingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-gray-800 pr-4">{viewingTopic.title}</h3>
              <button onClick={() => setViewingTopic(null)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
            </div>
            <dl className="space-y-3 text-sm mb-4">
              <div className="flex gap-2"><dt className="w-28 shrink-0 text-gray-500">Proposed by</dt><dd className="text-gray-800 font-medium">{viewingTopic.lecturerName}</dd></div>
              <div className="flex gap-2"><dt className="w-28 shrink-0 text-gray-500">Department</dt><dd className="text-gray-800">{viewingTopic.department || '—'}</dd></div>
              <div className="flex gap-2"><dt className="w-28 shrink-0 text-gray-500">Research Area</dt><dd className="text-gray-800">{viewingTopic.researchArea || '—'}</dd></div>
              <div className="flex gap-2"><dt className="w-28 shrink-0 text-gray-500">Submitted</dt><dd className="text-gray-800">{new Date(viewingTopic.createdAt).toLocaleString()}</dd></div>
            </dl>
            <div className="bg-gray-50 rounded-lg p-4 mb-5">
              <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-700 leading-relaxed">{viewingTopic.description}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleApprove(viewingTopic)} disabled={processing === viewingTopic.id}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50">
                <ThumbsUp className="w-4 h-4" /> Approve
              </button>
              <button onClick={() => { setRejectModal(viewingTopic); setRejectReason(''); setViewingTopic(null); }}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium text-white bg-red-500 hover:bg-red-600">
                <ThumbsDown className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Reject Topic Proposal</h3>
              <button onClick={() => setRejectModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Rejecting <span className="font-medium text-gray-800">"{rejectModal.title}"</span> proposed by {rejectModal.lecturerName}.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason <span className="text-red-500">*</span></label>
              <textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Provide feedback to help the student refine their proposal…"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#312DC4] resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleReject} disabled={!rejectReason.trim() || processing === rejectModal.id}
                className="flex-1 py-2 rounded-md text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50">
                {processing === rejectModal.id ? 'Rejecting…' : 'Confirm Rejection'}
              </button>
              <button onClick={() => setRejectModal(null)} className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
