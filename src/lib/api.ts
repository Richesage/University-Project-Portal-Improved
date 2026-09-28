/**
 * Centralised API layer — Supabase edition.
 *
 * Add to your .env file:
 *   VITE_SUPABASE_URL=https://<project>.supabase.co
 *   VITE_SUPABASE_ANON_KEY=<anon key>
 *
 * When those variables are absent the module operates in mock mode —
 * every function resolves with realistic data after a short delay.
 */

import { supabase, uploadFile } from './supabase';
import {
  MOCK_AUTH,
  MOCK_TOPICS, MOCK_LECTURER_TOPICS,
  MOCK_PROJECT, MOCK_SUBMISSIONS,
  MOCK_STUDENT_CONVERSATIONS, MOCK_STUDENT_MESSAGES,
  MOCK_LECTURER_CONVERSATIONS, MOCK_LECTURER_MESSAGES,
  MOCK_LECTURER_STATS, MOCK_ASSIGNED_STUDENTS,
  MOCK_ADMIN_STATS, MOCK_NOTIFICATIONS,
  MOCK_UNALLOCATED_STUDENTS, MOCK_SUPERVISORS, MOCK_REPORT_ROWS,
  MOCK_LECTURER_SUPERVISION_REQUESTS,
} from './mockData';

import type {
  AuthResponse, LoginPayload, RegisterPayload,
  Topic, TopicFormData, TopicFilters, Project,
  Submission, Message, Conversation, MessageType,
  LecturerStats, LecturerProfile, StudentRecord, SupervisorRecord,
  AdminStats, AppNotification, ReportFilters, ReportRow,
  SupervisionRequest,
} from '../types';

// ─── Mode flag ────────────────────────────────────────────────────────────────

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  'https://rnxuskcfwcpltmwvevpa.supabase.co';
export const IS_MOCK = !SUPABASE_URL;

function pause(ms = 500) { return new Promise<void>((r) => setTimeout(r, ms)); }

async function getAuthUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Session expired. Please sign in again.');
  return user.id;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export const profileApi = {
  uploadAvatar: async (file: File): Promise<string> => {
    if (IS_MOCK) return URL.createObjectURL(file);
    const userId = await getAuthUserId();
    const ext = file.name.split('.').pop() ?? 'jpg';
    // Fixed path so only one avatar file is kept per user (upsert overwrites it).
    const path = `${userId}/avatar.${ext}`;
    const baseUrl = await uploadFile('avatars', path, file);
    // Append timestamp to bust the browser cache — the stored URL will differ
    // each upload even though the underlying file path stays the same.
    const url = `${baseUrl}?t=${Date.now()}`;
    const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId);
    if (error) throw new Error(`Failed to save avatar: ${error.message}`);
    return url;
  },

  updateProfile: async (updates: {
    name?: string;
    department?: string;
    specialization?: string;
    bio?: string;
    title?: string;
    awards?: string[];
    certifications?: string[];
    specializations?: string[];
    capacity?: number;
    allowStudentsToSeeCapacity?: boolean;
    requirePlagiarismCheck?: boolean;
    plagiarismThreshold?: number;
  }): Promise<void> => {
    if (IS_MOCK) return;
    const userId = await getAuthUserId();
    // Map camelCase → snake_case for DB columns
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined)                     dbUpdates.name = updates.name;
    if (updates.department !== undefined)               dbUpdates.department = updates.department;
    if (updates.specialization !== undefined)           dbUpdates.specialization = updates.specialization;
    if (updates.bio !== undefined)                      dbUpdates.bio = updates.bio;
    if (updates.title !== undefined)                    dbUpdates.title = updates.title;
    if (updates.awards !== undefined)                   dbUpdates.awards = updates.awards;
    if (updates.certifications !== undefined)           dbUpdates.certifications = updates.certifications;
    if (updates.specializations !== undefined)          dbUpdates.specializations = updates.specializations;
    if (updates.capacity !== undefined)                 dbUpdates.capacity = updates.capacity;
    if (updates.allowStudentsToSeeCapacity !== undefined) dbUpdates.allow_students_see_capacity = updates.allowStudentsToSeeCapacity;
    if (updates.requirePlagiarismCheck !== undefined)   dbUpdates.require_plagiarism_check = updates.requirePlagiarismCheck;
    if (updates.plagiarismThreshold !== undefined)      dbUpdates.plagiarism_threshold = updates.plagiarismThreshold;
    await supabase.from('profiles').update(dbUpdates).eq('id', userId);
  },

  fetchLecturerProfile: async (userId: string): Promise<LecturerProfile | null> => {
    if (IS_MOCK) return null;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error || !data) return null;
    return {
      title: data.title ?? 'Dr.',
      bio: data.bio ?? '',
      specializations: data.specializations ?? [],
      awards: data.awards ?? [],
      certifications: data.certifications ?? [],
      maxStudents: data.capacity ?? 5,
      allowStudentsToSeeCapacity: data.allow_students_see_capacity ?? true,
      requirePlagiarismCheck: data.require_plagiarism_check ?? true,
      plagiarismThreshold: data.plagiarism_threshold ?? 20,
    };
  },
};

// ─── Supervision Requests ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToRequest(row: Record<string, any>): SupervisionRequest {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student?.name ?? '',
    studentRegNo: row.student?.matric_number ?? '',
    studentDepartment: row.student?.department ?? '',
    studentAvatarUrl: row.student?.avatar_url ?? undefined,
    lecturerId: row.lecturer_id,
    lecturerName: row.lecturer?.name ?? '',
    topicInterest: row.topic_interest ?? '',
    message: row.message ?? '',
    status: row.status,
    denyReason: row.deny_reason ?? undefined,
    adminNote: row.admin_note ?? undefined,
    resolutionType: row.resolution_type ?? undefined,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at ?? undefined,
  };
}

export const supervisorRequestsApi = {
  /** Student sends a supervision request to a lecturer. */
  send: async (lecturerId: string, topicInterest: string, note: string): Promise<void> => {
    if (IS_MOCK) { await pause(800); return; }
    const userId = await getAuthUserId();
    const { error } = await supabase.from('supervisor_requests').insert({
      student_id: userId,
      lecturer_id: lecturerId,
      topic_interest: topicInterest,
      message: note,
      status: 'pending',
    });
    if (error) throw new Error(error.message);
  },

  /** Student lists their own supervision requests. */
  listForStudent: async (): Promise<SupervisionRequest[]> => {
    if (IS_MOCK) { await pause(400); return []; }
    const userId = await getAuthUserId();
    const { data, error } = await supabase
      .from('supervisor_requests')
      .select(`*, student:profiles!supervisor_requests_student_id_fkey(name, matric_number, department, avatar_url), lecturer:profiles!supervisor_requests_lecturer_id_fkey(name)`)
      .eq('student_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToRequest);
  },

  /** Lecturer lists incoming requests. */
  listForLecturer: async (): Promise<SupervisionRequest[]> => {
    if (IS_MOCK) { await pause(400); return MOCK_LECTURER_SUPERVISION_REQUESTS; }
    const userId = await getAuthUserId();
    const { data, error } = await supabase
      .from('supervisor_requests')
      .select(`*, student:profiles!supervisor_requests_student_id_fkey(name, matric_number, department, avatar_url), lecturer:profiles!supervisor_requests_lecturer_id_fkey(name)`)
      .eq('lecturer_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToRequest);
  },

  /** Lecturer admits a request — also assigns them as supervisor on the project and creates a conversation. */
  admit: async (requestId: string, studentId: string): Promise<void> => {
    if (IS_MOCK) { await pause(700); return; }
    const userId = await getAuthUserId();

    const { error } = await supabase
      .from('supervisor_requests')
      .update({ status: 'accepted', resolved_at: new Date().toISOString() })
      .eq('id', requestId);
    if (error) throw new Error(error.message);

    // Check if the student already has a project; update or create one.
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('student_id', studentId)
      .maybeSingle();

    if (existingProject) {
      await supabase
        .from('projects')
        .update({ supervisor_id: userId, supervisor_approval_status: 'approved' })
        .eq('id', existingProject.id);
    } else {
      await supabase.from('projects').insert({
        student_id: studentId,
        supervisor_id: userId,
        status: 'active',
        overall_progress: 0,
        supervisor_approval_status: 'approved',
      });
    }

    // Auto-create a conversation between lecturer and student so messaging is immediately available.
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('student_id', studentId)
      .eq('lecturer_id', userId)
      .maybeSingle();
    if (!existingConv) {
      await supabase.from('conversations').insert({ student_id: studentId, lecturer_id: userId });
    }
  },

  /** Lecturer denies a request with a reason. */
  deny: async (requestId: string, reason: string): Promise<void> => {
    if (IS_MOCK) { await pause(700); return; }
    const { error } = await supabase
      .from('supervisor_requests')
      .update({ status: 'rejected', deny_reason: reason, resolved_at: new Date().toISOString() })
      .eq('id', requestId);
    if (error) throw new Error(error.message);
  },

  /** Admin lists all denied requests for resolution. */
  listDenied: async (): Promise<SupervisionRequest[]> => {
    if (IS_MOCK) { await pause(400); return []; }
    const { data, error } = await supabase
      .from('supervisor_requests')
      .select(`*, student:profiles!supervisor_requests_student_id_fkey(name, matric_number, department, avatar_url), lecturer:profiles!supervisor_requests_lecturer_id_fkey(name)`)
      .eq('status', 'rejected')
      .is('resolved_at', null)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToRequest);
  },

  /** Admin resolves a denied request (special approval or recommend alternative). */
  resolve: async (
    requestId: string,
    resolutionType: 'special_approval' | 'recommend_alternative',
    adminNote: string,
    alternativeSupervisorId?: string,
  ): Promise<void> => {
    if (IS_MOCK) { await pause(900); return; }
    const updates: Record<string, unknown> = {
      resolution_type: resolutionType,
      admin_note: adminNote,
      resolved_at: new Date().toISOString(),
    };
    if (resolutionType === 'special_approval') {
      updates.status = 'accepted';
    }
    const { error } = await supabase.from('supervisor_requests').update(updates).eq('id', requestId);
    if (error) throw new Error(error.message);

    // If special approval, assign the alternative supervisor if provided.
    if (resolutionType === 'special_approval' && alternativeSupervisorId) {
      const { data: req } = await supabase.from('supervisor_requests').select('student_id').eq('id', requestId).single();
      if (req) {
        await supabase.from('projects')
          .update({ supervisor_id: alternativeSupervisorId, supervisor_approval_status: 'approved' })
          .eq('student_id', req.student_id);
      }
    }
  },
};

// ─── Row → domain mappers ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTopic(row: Record<string, any>): Topic {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    lecturerId: row.lecturer_id,
    lecturerName: row.lecturer?.name ?? 'Unknown',
    specialization: row.lecturer?.specialization ?? '',
    department: row.department,
    researchArea: row.research_area,
    maxStudents: row.max_students,
    enrolledStudents: row.enrolled_students,
    status: row.status,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProject(row: Record<string, any>): Project {
  return {
    id: row.id,
    studentId: row.student_id,
    topicId: row.topic_id,
    topicTitle: row.topic?.title ?? '',
    supervisorId: row.supervisor_id,
    supervisorName: row.supervisor?.name ?? '',
    supervisorSpecialization: row.supervisor?.specialization,
    status: row.status,
    overallProgress: row.overall_progress,
    supervisorApprovalStatus: row.supervisor_approval_status,
    milestones: (row.milestones ?? []).map((m: Record<string, unknown>) => ({
      id: m.id,
      label: m.label,
      status: m.status,
      percentage: m.percentage,
      dueDate: m.due_date,
    })),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSubmission(row: Record<string, any>): Submission {
  return {
    id: row.id,
    projectId: row.project_id,
    studentId: row.student_id,
    studentName: row.student?.name,
    chapterLabel: row.chapter_label,
    fileName: row.file_name,
    fileSize: row.file_size,
    uploadedAt: row.uploaded_at,
    status: row.status,
    feedback: row.feedback,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToMessage(row: Record<string, any>): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    senderName: row.sender?.name ?? '',
    type: row.type,
    content: row.content,
    mediaUrl: row.media_url,
    sentAt: row.sent_at,
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    if (IS_MOCK) {
      await pause(600);
      return MOCK_AUTH[payload._mockRole ?? 'student'];
    }

    let email = payload.identifier;

    // ID-based login: derive the same sanitized email used at registration.
    if (payload.identifierType === 'id') {
      const sanitized = payload.identifier.replace(/[^a-zA-Z0-9._+-]/g, '_');
      email = `${sanitized}@unimanage.internal`;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: payload.password,
    });
    if (error) throw new Error(error.message);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    if (profileError) throw new Error(profileError.message);

    return {
      token: data.session.access_token,
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        department: profile.department,
        matricNumber: profile.matric_number,
        staffId: profile.staff_id,
        specialization: profile.specialization,
      },
    };
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    if (IS_MOCK) {
      await pause(800);
      return MOCK_AUTH[payload.role];
    }

    // When registering by ID, synthesise a valid internal email address.
    // Strip any characters that are illegal in the local part of an email.
    const sanitized = payload.identifier.replace(/[^a-zA-Z0-9._+-]/g, '_');
    const email =
      payload.identifierType === 'email'
        ? payload.identifier
        : `${sanitized}@unimanage.internal`;

    const meta: Record<string, string | undefined> = {
      name: payload.name,
      role: payload.role,
      department: payload.department,
    };
    if (payload.identifierType === 'id') {
      if (payload.role === 'student') meta.matric_number = payload.identifier;
      else meta.staff_id = payload.identifier;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: payload.password,
      options: { data: meta },
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Sign-up failed. Please try again.');

    // Build AuthUser directly from the payload — avoids a race condition where
    // the profile trigger hasn't fired yet at the time we'd query the DB.
    return {
      token: data.session?.access_token ?? '',
      user: {
        id: data.user.id,
        name: payload.name,
        email: payload.identifierType === 'email' ? payload.identifier : data.user.email ?? '',
        role: payload.role,
        department: payload.department,
        matricNumber: payload.role === 'student' && payload.identifierType === 'id' ? payload.identifier : undefined,
        staffId: payload.role !== 'student' && payload.identifierType === 'id' ? payload.identifier : undefined,
      },
    };
  },

  logout: async (): Promise<void> => {
    if (IS_MOCK) return;
    await supabase.auth.signOut();
  },
};

// ─── Topics ───────────────────────────────────────────────────────────────────

export const topicsApi = {
  list: async (filters?: Partial<TopicFilters>): Promise<Topic[]> => {
    if (IS_MOCK) {
      await pause(400);
      let topics = [...MOCK_TOPICS];
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        topics = topics.filter(t =>
          t.title.toLowerCase().includes(q) ||
          t.lecturerName.toLowerCase().includes(q) ||
          t.specialization.toLowerCase().includes(q)
        );
      }
      if (filters?.department) topics = topics.filter(t => t.department === filters.department);
      if (filters?.researchArea) topics = topics.filter(t => t.researchArea === filters.researchArea);
      return topics;
    }

    let query = supabase
      .from('topics')
      .select('*, lecturer:profiles!topics_lecturer_id_fkey(name, specialization)')
      .in('status', ['available', 'full', 'approved']);

    if (filters?.search) query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    if (filters?.department) query = query.eq('department', filters.department);
    if (filters?.researchArea) query = query.eq('research_area', filters.researchArea);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToTopic);
  },

  myTopics: async (): Promise<Topic[]> => {
    if (IS_MOCK) { await pause(400); return MOCK_LECTURER_TOPICS; }
    const userId = await getAuthUserId();
    const { data, error } = await supabase
      .from('topics')
      .select('*, lecturer:profiles!topics_lecturer_id_fkey(name, specialization)')
      .eq('lecturer_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToTopic);
  },

  create: async (formData: TopicFormData): Promise<Topic> => {
    if (IS_MOCK) {
      await pause(600);
      return {
        ...formData, id: `top-${Date.now()}`,
        lecturerId: 'lec-001', lecturerName: 'Dr. Amina Yusuf',
        specialization: 'Machine Learning & AI',
        enrolledStudents: 0, status: 'pending_approval', createdAt: new Date().toISOString(),
      };
    }
    const userId = await getAuthUserId();
    const { data, error } = await supabase
      .from('topics')
      .insert({
        title: formData.title,
        description: formData.description,
        lecturer_id: userId,
        department: formData.department,
        research_area: formData.researchArea,
        max_students: formData.maxStudents,
      })
      .select('*, lecturer:profiles!topics_lecturer_id_fkey(name, specialization)')
      .single();
    if (error) throw new Error(error.message);
    return rowToTopic(data);
  },

  select: async (topicId: string): Promise<void> => {
    if (IS_MOCK) { await pause(500); return; }
    const userId = await getAuthUserId();

    // Enroll the student by creating a project row.
    const { error } = await supabase.from('projects').insert({
      student_id: userId,
      topic_id: topicId,
      status: 'active',
    });
    if (error) throw new Error(error.message);

    // Bump enrolled_students on the topic.
    await supabase.rpc('increment_enrolled_students', { topic_id: topicId });
  },

  propose: async (data: { title: string; description: string; file?: File | null }): Promise<void> => {
    if (IS_MOCK) { await pause(700); return; }
    const userId = await getAuthUserId();

    let fileUrl: string | undefined;
    if (data.file) {
      fileUrl = await uploadFile(
        'project-files',
        `proposals/${userId}/${Date.now()}_${data.file.name}`,
        data.file
      );
    }

    // lecturer_id is null for student proposals; proposed_by tracks the student.
    const { error } = await supabase.from('topics').insert({
      title: data.title,
      description: data.description,
      lecturer_id: null,
      proposed_by: userId,
      department: '',
      research_area: '',
      max_students: 1,
      status: 'pending_approval',
      admin_note: fileUrl ? `File: ${fileUrl}` : null,
    });
    if (error) throw new Error(error.message);
  },

  approve: async (topicId: string, adminNote?: string): Promise<void> => {
    if (IS_MOCK) { await pause(400); return; }
    const { error } = await supabase
      .from('topics')
      .update({ status: 'approved', admin_note: adminNote ?? null })
      .eq('id', topicId);
    if (error) throw new Error(error.message);
  },

  reject: async (topicId: string, reason: string): Promise<void> => {
    if (IS_MOCK) { await pause(400); return; }
    const { error } = await supabase
      .from('topics')
      .update({ status: 'rejected', admin_note: reason })
      .eq('id', topicId);
    if (error) throw new Error(error.message);
  },

  pendingApproval: async (): Promise<Topic[]> => {
    if (IS_MOCK) { await pause(400); return []; }
    const { data, error } = await supabase
      .from('topics')
      .select('*, lecturer:profiles!topics_lecturer_id_fkey(name, specialization), proposer:profiles!topics_proposed_by_fkey(name)')
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(row => ({
      ...rowToTopic(row),
      lecturerName: row.lecturer?.name ?? row.proposer?.name ?? 'Student Proposal',
    }));
  },

  /** Fetch pending topic proposals from the lecturer's own supervised students. */
  studentProposalsForSupervisor: async (): Promise<Topic[]> => {
    if (IS_MOCK) {
      await pause(400);
      return [
        {
          id: 'sp-001', title: 'AI-Powered Crop Disease Detection Using CNNs',
          description: 'A mobile-based system that uses convolutional neural networks to identify crop diseases from field photographs, helping smallholder farmers take early corrective action.',
          lecturerId: '', lecturerName: 'Alex Johnson', specialization: 'Artificial Intelligence',
          department: 'Computer Science', researchArea: 'Artificial Intelligence',
          maxStudents: 1, enrolledStudents: 0, status: 'pending_approval', createdAt: '2024-01-15T09:00:00Z',
        },
        {
          id: 'sp-002', title: 'Blockchain-Based Student Certificate Verification',
          description: 'An immutable ledger system for issuing and verifying academic certificates to prevent forgery, with a public lookup portal for employers and institutions.',
          lecturerId: '', lecturerName: 'David Musa', specialization: 'Blockchain',
          department: 'Computer Science', researchArea: 'Blockchain',
          maxStudents: 1, enrolledStudents: 0, status: 'pending_approval', createdAt: '2024-01-14T11:00:00Z',
        },
      ];
    }
    const userId = await getAuthUserId();
    const { data: projects } = await supabase
      .from('projects')
      .select('student_id')
      .eq('supervisor_id', userId);
    const studentIds = (projects ?? []).map((p: { student_id: string }) => p.student_id);
    if (studentIds.length === 0) return [];
    const { data, error } = await supabase
      .from('topics')
      .select('*, proposer:profiles!topics_proposed_by_fkey(name, matric_number, department)')
      .eq('status', 'pending_approval')
      .in('proposed_by', studentIds)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(row => ({
      ...rowToTopic(row),
      lecturerName: row.proposer?.name ?? 'Student',
    }));
  },
};

// ─── Project (student) ────────────────────────────────────────────────────────

export const projectApi = {
  current: async (): Promise<Project | null> => {
    if (IS_MOCK) { await pause(400); return MOCK_PROJECT; }
    const userId = await getAuthUserId();
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        topic:topics(title),
        supervisor:profiles!projects_supervisor_id_fkey(name, specialization),
        milestones(*)
      `)
      .eq('student_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data ? rowToProject(data) : null;
  },

  updateProgress: async (projectId: string, progress: number): Promise<void> => {
    if (IS_MOCK) { await pause(400); return; }
    const { error } = await supabase
      .from('projects')
      .update({ overall_progress: progress })
      .eq('id', projectId);
    if (error) throw new Error(error.message);
  },
};

// ─── Submissions ──────────────────────────────────────────────────────────────

export const submissionsApi = {
  list: async (): Promise<Submission[]> => {
    if (IS_MOCK) { await pause(400); return MOCK_SUBMISSIONS; }
    const userId = await getAuthUserId();
    const { data, error } = await supabase
      .from('submissions')
      .select('*, student:profiles!submissions_student_id_fkey(name)')
      .eq('student_id', userId)
      .order('uploaded_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToSubmission);
  },

  listForSupervisor: async (): Promise<Submission[]> => {
    if (IS_MOCK) { await pause(400); return MOCK_SUBMISSIONS; }
    const userId = await getAuthUserId();
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        student:profiles!submissions_student_id_fkey(name),
        project:projects!submissions_project_id_fkey(supervisor_id)
      `)
      .eq('project.supervisor_id', userId)
      .order('uploaded_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToSubmission);
  },

  upload: async (file: File, chapterLabel: string): Promise<Submission> => {
    if (IS_MOCK) {
      await pause(800);
      return {
        id: `sub-${Date.now()}`, projectId: 'proj-001', studentId: 'stu-001',
        chapterLabel, fileName: file.name,
        fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        uploadedAt: new Date().toISOString(), status: 'pending_review',
      };
    }

    const userId = await getAuthUserId();

    // Find the student's active project.
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('student_id', userId)
      .single();
    if (projectError || !project) {
      throw new Error('You need to select a project topic before submitting files. Go to Project Topics to enrol first.');
    }

    const fileUrl = await uploadFile(
      'project-files',
      `submissions/${project.id}/${Date.now()}_${file.name}`,
      file
    );

    const { data, error } = await supabase
      .from('submissions')
      .insert({
        project_id: project.id,
        student_id: userId,
        chapter_label: chapterLabel,
        file_name: file.name,
        file_url: fileUrl,
        file_size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      })
      .select('*, student:profiles!submissions_student_id_fkey(name)')
      .single();
    if (error) throw new Error(error.message);
    return rowToSubmission(data);
  },

  review: async (submissionId: string, feedback: string, status: string): Promise<Submission> => {
    if (IS_MOCK) {
      await pause(500);
      return { ...MOCK_SUBMISSIONS[0], id: submissionId, feedback, status: status as Submission['status'] };
    }
    const { data, error } = await supabase
      .from('submissions')
      .update({ feedback, status })
      .eq('id', submissionId)
      .select('*, student:profiles!submissions_student_id_fkey(name)')
      .single();
    if (error) throw new Error(error.message);
    return rowToSubmission(data);
  },
};

// ─── Messages ─────────────────────────────────────────────────────────────────

export const messagesApi = {
  conversations: async (role: 'student' | 'lecturer'): Promise<Conversation[]> => {
    if (IS_MOCK) {
      await pause(400);
      return role === 'student' ? MOCK_STUDENT_CONVERSATIONS : MOCK_LECTURER_CONVERSATIONS;
    }

    const userId = await getAuthUserId();
    const field = role === 'student' ? 'student_id' : 'lecturer_id';
    const otherField = role === 'student' ? 'lecturer_id' : 'student_id';
    const otherAlias = role === 'student' ? 'lecturer' : 'student';

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        ${otherAlias}:profiles!conversations_${otherField}_fkey(id, name, role),
        messages(content, sent_at, sender_id)
      `)
      .eq(field, userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data ?? []).map(row => {
      const other = row[otherAlias] as { id: string; name: string; role: string };
      const msgs = (row.messages ?? []) as { content: string; sent_at: string; sender_id: string }[];
      msgs.sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
      const last = msgs[0];
      const initials = other.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
      return {
        id: row.id,
        participantId: other.id,
        participantName: other.name,
        participantInitials: initials,
        participantSubtitle: other.role,
        lastMessage: last?.content ?? '',
        lastMessageAt: last?.sent_at ?? row.created_at,
        unreadCount: 0,
      } as Conversation;
    });
  },

  thread: async (conversationId: string, role: 'student' | 'lecturer'): Promise<Message[]> => {
    if (IS_MOCK) {
      await pause(300);
      const map = role === 'student' ? MOCK_STUDENT_MESSAGES : MOCK_LECTURER_MESSAGES;
      return map[conversationId] ?? [];
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(name)')
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToMessage);
  },

  send: async (
    conversationId: string,
    senderId: string,
    senderName: string,
    content: string,
    type: MessageType = 'text'
  ): Promise<Message> => {
    if (IS_MOCK) {
      await pause(300);
      return { id: `msg-${Date.now()}`, conversationId, senderId, senderName, type, content, sentAt: new Date().toISOString() };
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, type, content })
      .select('*, sender:profiles!messages_sender_id_fkey(name)')
      .single();
    if (error) throw new Error(error.message);
    return rowToMessage(data);
  },

  sendMedia: async (
    conversationId: string,
    senderId: string,
    senderName: string,
    file: File,
    type: 'image' | 'video' | 'file'
  ): Promise<Message> => {
    if (IS_MOCK) {
      await pause(600);
      return { id: `msg-${Date.now()}`, conversationId, senderId, senderName, type, content: file.name, sentAt: new Date().toISOString() };
    }

    const mediaUrl = await uploadFile(
      'project-files',
      `messages/${conversationId}/${Date.now()}_${file.name}`,
      file
    );

    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, type, content: file.name, media_url: mediaUrl })
      .select('*, sender:profiles!messages_sender_id_fkey(name)')
      .single();
    if (error) throw new Error(error.message);
    return rowToMessage(data);
  },

  getOrCreateConversation: async (studentId: string, lecturerId: string): Promise<string> => {
    if (IS_MOCK) { return 'conv-mock'; }
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('student_id', studentId)
      .eq('lecturer_id', lecturerId)
      .single();
    if (existing) return existing.id;

    const { data, error } = await supabase
      .from('conversations')
      .insert({ student_id: studentId, lecturer_id: lecturerId })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    return data.id;
  },
};

// ─── Lecturer ─────────────────────────────────────────────────────────────────

export const lecturerApi = {
  stats: async (): Promise<LecturerStats> => {
    if (IS_MOCK) { await pause(400); return MOCK_LECTURER_STATS; }
    const userId = await getAuthUserId();

    // Fetch project IDs first so we can use them in the submissions query.
    const { data: supervisedProjects } = await supabase
      .from('projects')
      .select('id, status')
      .eq('supervisor_id', userId);

    const projectIds = (supervisedProjects ?? []).map(p => p.id);
    const activeCount = (supervisedProjects ?? []).filter(p => p.status === 'active').length;

    const { count: reviews } = projectIds.length > 0
      ? await supabase.from('submissions').select('id', { count: 'exact', head: true })
          .eq('status', 'pending_review')
          .in('project_id', projectIds)
      : { count: 0 };

    const students = projectIds.length;
    const projects = activeCount;

    const { data: profile } = await supabase.from('profiles').select('capacity').eq('id', userId).single();
    const cap = profile?.capacity ?? 5;
    return {
      assignedStudents: students,
      activeProjects: projects,
      pendingReviews: reviews ?? 0,
      workloadPercent: Math.round((students / cap) * 100),
    };
  },

  students: async (search?: string): Promise<StudentRecord[]> => {
    if (IS_MOCK) {
      await pause(400);
      if (!search) return MOCK_ASSIGNED_STUDENTS;
      const q = search.toLowerCase();
      return MOCK_ASSIGNED_STUDENTS.filter(s =>
        s.name.toLowerCase().includes(q) || s.regNo.toLowerCase().includes(q)
      );
    }

    const userId = await getAuthUserId();
    let query = supabase
      .from('projects')
      .select(`
        student_id, overall_progress, status,
        student:profiles!projects_student_id_fkey(id, name, matric_number, department, avatar_url),
        topic:topics!projects_topic_id_fkey(title),
        submissions(status, uploaded_at)
      `)
      .eq('supervisor_id', userId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data ?? [])
      .filter(row => {
        if (!search) return true;
        const q = search.toLowerCase();
        const s = row.student as { name?: string; matric_number?: string } | null;
        return s?.name?.toLowerCase().includes(q) || s?.matric_number?.toLowerCase().includes(q);
      })
      .map(row => {
        const s = row.student as { id: string; name: string; matric_number?: string; department?: string; avatar_url?: string } | null;
        const submissions = (row.submissions ?? []) as { status: string; uploaded_at: string }[];
        let submissionStatus: StudentRecord['submissionStatus'] = 'up_to_date';
        if (submissions.some(sub => sub.status === 'pending_review')) submissionStatus = 'pending_review';
        return {
          id: s?.id ?? '',
          name: s?.name ?? '',
          regNo: s?.matric_number ?? '',
          department: s?.department ?? '',
          currentTopic: (row.topic as { title?: string } | null)?.title ?? '',
          supervisorId: userId,
          progress: row.overall_progress,
          submissionStatus,
          avatarUrl: s?.avatar_url ?? undefined,
        } as StudentRecord;
      });
  },
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminApi = {
  stats: async (): Promise<AdminStats> => {
    if (IS_MOCK) { await pause(400); return MOCK_ADMIN_STATS; }

    const [
      { count: totalStudents },
      { count: totalLecturers },
      { count: approvedTopics },
      { count: pendingTopics },
      { count: allocatedStudents },
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'lecturer'),
      supabase.from('topics').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('topics').select('id', { count: 'exact', head: true }).eq('status', 'pending_approval'),
      supabase.from('projects').select('id', { count: 'exact', head: true }).not('supervisor_id', 'is', null),
    ]);

    const total = totalStudents ?? 0;
    const allocated = allocatedStudents ?? 0;
    return {
      totalStudents: total,
      totalLecturers: totalLecturers ?? 0,
      approvedTopics: approvedTopics ?? 0,
      pendingTopics: pendingTopics ?? 0,
      allocatedPercentage: total > 0 ? Math.round((allocated / total) * 100) : 0,
      unallocatedStudents: total - allocated,
    };
  },

  /** Returns count of resolved supervision requests the student hasn't acknowledged.
   *  Requires `seen_by_student timestamptz` column on supervisor_requests table.
   *  If the column doesn't exist yet, returns 0 silently.
   *  SQL to add: ALTER TABLE supervisor_requests ADD COLUMN IF NOT EXISTS seen_by_student timestamptz;
   */
  unreadRequestNotifications: async (): Promise<number> => {
    if (IS_MOCK) return 0;
    try {
      const userId = await getAuthUserId();
      const { count, error } = await supabase
        .from('supervisor_requests')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', userId)
        .neq('status', 'pending')
        .is('seen_by_student', null);
      if (error) return 0; // column doesn't exist yet — graceful fallback
      return count ?? 0;
    } catch {
      return 0;
    }
  },

  markRequestNotificationsSeen: async (): Promise<void> => {
    if (IS_MOCK) return;
    try {
      const userId = await getAuthUserId();
      await supabase
        .from('supervisor_requests')
        .update({ seen_by_student: new Date().toISOString() })
        .eq('student_id', userId)
        .neq('status', 'pending')
        .is('seen_by_student', null);
    } catch { /* ignore if column doesn't exist */ }
  },

  notifications: async (): Promise<AppNotification[]> => {
    if (IS_MOCK) { await pause(300); return MOCK_NOTIFICATIONS; }
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []).map(row => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      createdAt: row.created_at,
      read: row.read,
    }));
  },

  unallocatedStudents: async (): Promise<StudentRecord[]> => {
    if (IS_MOCK) { await pause(400); return MOCK_UNALLOCATED_STUDENTS; }

    // Fetch students with their projects (no deep nesting to avoid PostgREST issues).
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id, name, matric_number, department')
      .eq('role', 'student');

    if (studentsError) throw new Error(studentsError.message);
    if (!students?.length) return [];

    const studentIds = students.map(s => s.id);

    // Fetch projects for these students separately.
    const { data: projects } = await supabase
      .from('projects')
      .select('id, student_id, supervisor_id, overall_progress, topic_id')
      .in('student_id', studentIds);

    // Fetch topic titles for any topic_ids we have.
    const topicIds = [...new Set((projects ?? []).map(p => p.topic_id).filter(Boolean))];
    const topicMap: Record<string, string> = {};
    if (topicIds.length) {
      const { data: topics } = await supabase
        .from('topics')
        .select('id, title')
        .in('id', topicIds);
      (topics ?? []).forEach(t => { topicMap[t.id] = t.title; });
    }

    // Group projects by student.
    const projectsByStudent: Record<string, typeof projects[0][]> = {};
    (projects ?? []).forEach(p => {
      if (!projectsByStudent[p.student_id]) projectsByStudent[p.student_id] = [];
      projectsByStudent[p.student_id].push(p);
    });

    return students
      .filter(student => {
        const sp = projectsByStudent[student.id] ?? [];
        return !sp.length || sp.every(p => !p.supervisor_id);
      })
      .map(student => {
        const sp = projectsByStudent[student.id] ?? [];
        const proj = sp[0];
        return {
          id: student.id,
          name: student.name,
          regNo: student.matric_number ?? '',
          department: student.department ?? '',
          currentTopic: proj?.topic_id ? (topicMap[proj.topic_id] ?? 'No topic yet') : 'No topic yet',
          progress: proj?.overall_progress ?? 0,
          submissionStatus: 'up_to_date',
        } as StudentRecord;
      });
  },

  supervisors: async (search?: string): Promise<SupervisorRecord[]> => {
    if (IS_MOCK) {
      await pause(400);
      if (!search) return MOCK_SUPERVISORS;
      const q = search.toLowerCase();
      return MOCK_SUPERVISORS.filter(s =>
        s.name.toLowerCase().includes(q) || s.specialization.toLowerCase().includes(q)
      );
    }

    let query = supabase
      .from('profiles')
      .select('id, name, staff_id, department, specialization, capacity, title, bio, awards, certifications, specializations, allow_students_see_capacity, avatar_url, projects:projects!projects_supervisor_id_fkey(id)')
      .eq('role', 'lecturer');

    if (search) query = query.or(`name.ilike.%${search}%,specialization.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data ?? []).map(row => {
      const load = (row.projects as unknown[]).length;
      const cap = row.capacity ?? 5;
      return {
        id: row.id,
        name: row.name,
        staffId: row.staff_id ?? '',
        specialization: row.specialization ?? '',
        department: row.department ?? undefined,
        currentLoad: load,
        maxLoad: cap,
        availability: load < cap ? 'available' : 'full',
        title: row.title ?? undefined,
        bio: row.bio ?? undefined,
        awards: row.awards ?? [],
        certifications: row.certifications ?? [],
        specializations: row.specializations ?? [],
        allowStudentsToSeeCapacity: row.allow_students_see_capacity ?? true,
        avatarUrl: row.avatar_url ?? undefined,
        rating: undefined,
        ratingCount: undefined,
      } as SupervisorRecord;
    });
  },

  allocate: async (studentId: string, supervisorId: string): Promise<void> => {
    if (IS_MOCK) { await pause(500); return; }

    // Validate supervisor capacity
    const [{ data: supProfile }, { count: currentLoad }] = await Promise.all([
      supabase.from('profiles').select('capacity').eq('id', supervisorId).single(),
      supabase.from('projects').select('id', { count: 'exact', head: true }).eq('supervisor_id', supervisorId),
    ]);
    const cap = supProfile?.capacity ?? 5;
    if ((currentLoad ?? 0) >= cap) {
      throw new Error('This supervisor has reached their maximum student capacity.');
    }

    // Prevent duplicate assignment
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id, supervisor_id')
      .eq('student_id', studentId)
      .maybeSingle();
    if (existingProject?.supervisor_id) {
      throw new Error('This student already has a supervisor assigned via an accepted supervision request.');
    }

    if (existingProject) {
      const { error } = await supabase
        .from('projects')
        .update({ supervisor_id: supervisorId })
        .eq('id', existingProject.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from('projects').insert({
        student_id: studentId, supervisor_id: supervisorId, status: 'active', overall_progress: 0,
      });
      if (error) throw new Error(error.message);
    }
  },

  generateReport: async (filters: ReportFilters): Promise<ReportRow[]> => {
    if (IS_MOCK) { await pause(700); return MOCK_REPORT_ROWS; }

    // Fetch all projects with joins, then filter department client-side
    // (PostgREST doesn't support .eq on embedded foreign-key columns directly).
    let query = supabase
      .from('projects')
      .select(`
        overall_progress, status, created_at, supervisor_id,
        student:profiles!projects_student_id_fkey(name, matric_number, department),
        supervisor:profiles!projects_supervisor_id_fkey(name),
        topic:topics!projects_topic_id_fkey(title)
      `);

    if (filters.supervisorId) query = query.eq('supervisor_id', filters.supervisorId);
    if (filters.status)       query = query.eq('status', filters.status);
    if (filters.dateFrom)     query = query.gte('created_at', filters.dateFrom);
    if (filters.dateTo)       query = query.lte('created_at', filters.dateTo);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data ?? [])
      .filter(row => {
        if (!filters.department) return true;
        return (row.student as { department?: string } | null)?.department === filters.department;
      })
      .map(row => ({
        studentName: (row.student as { name?: string } | null)?.name ?? '',
        regNo: (row.student as { matric_number?: string } | null)?.matric_number ?? '',
        department: (row.student as { department?: string } | null)?.department ?? '',
        topic: (row.topic as { title?: string } | null)?.title ?? '',
        supervisor: (row.supervisor as { name?: string } | null)?.name ?? '',
        progress: row.overall_progress,
        status: row.status,
      }));
  },

  exportReport: async (filters: ReportFilters, format: 'pdf' | 'excel'): Promise<{ url: string }> => {
    if (IS_MOCK) { await pause(500); return { url: '#' }; }
    const rows = await adminApi.generateReport(filters);
    // Client-side CSV export; swap for a server-side PDF/Excel function when needed.
    const csv = [
      'Student,Reg No,Department,Topic,Supervisor,Progress,Status',
      ...rows.map(r =>
        `"${r.studentName}","${r.regNo}","${r.department}","${r.topic}","${r.supervisor}",${r.progress}%,"${r.status}"`
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: format === 'excel' ? 'text/csv' : 'text/plain' });
    return { url: URL.createObjectURL(blob) };
  },
};
