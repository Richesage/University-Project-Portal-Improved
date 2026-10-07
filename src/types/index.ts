// ─── Auth ─────────────────────────────────────────────────────────────────────
export type UserRole = 'student' | 'lecturer' | 'admin';
export type IdentifierType = 'id' | 'email';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  matricNumber?: string;  // students
  staffId?: string;       // lecturers + admins
  specialization?: string; // lecturers
  avatarUrl?: string;
}

export interface LoginPayload {
  identifier: string;
  identifierType: IdentifierType;
  password: string;
  _mockRole?: UserRole; // wireframe-only hint; omit in real API calls
}

export interface RegisterPayload {
  role: UserRole;
  name: string;
  identifier: string;
  identifierType: IdentifierType;
  department?: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

// ─── Topics ───────────────────────────────────────────────────────────────────
export type TopicStatus = 'available' | 'full' | 'pending_approval' | 'approved' | 'rejected';

export interface Topic {
  id: string;
  title: string;
  description: string;
  lecturerId: string;
  lecturerName: string;
  specialization: string;
  department: string;
  researchArea: string;
  maxStudents: number;
  enrolledStudents: number;
  status: TopicStatus;
  createdAt: string;
}

export interface TopicFormData {
  title: string;
  description: string;
  department: string;
  researchArea: string;
  maxStudents: number;
}

export interface TopicFilters {
  search: string;
  department: string;
  researchArea: string;
}

export interface ProposalFormData {
  title: string;
  description: string;
  file: File | null;
}

// ─── Project & Milestones ─────────────────────────────────────────────────────
export type MilestoneStatus = 'completed' | 'in_progress' | 'pending';

export interface Milestone {
  id: string;
  label: string;
  status: MilestoneStatus;
  percentage: number;
  dueDate?: string;
}

export interface Project {
  id: string;
  studentId: string;
  topicId: string;
  topicTitle: string;
  supervisorId: string;
  supervisorName: string;
  supervisorSpecialization?: string;
  status: 'active' | 'completed' | 'suspended';
  overallProgress: number;
  supervisorApprovalStatus: string;
  milestones: Milestone[];
}

// ─── Submissions ──────────────────────────────────────────────────────────────
export type SubmissionStatus = 'pending_review' | 'reviewed' | 'approved' | 'rejected';

export interface Submission {
  id: string;
  projectId: string;
  studentId: string;
  studentName?: string;
  chapterLabel: string;
  fileName: string;
  fileSize?: string;
  uploadedAt: string;
  status: SubmissionStatus;
  feedback?: string;
  mark?: number;       // 0-100
  weight?: number;     // percentage weight toward final grade (e.g. 20)
  gradedAt?: string;
}

export interface StudentGradeSummary {
  studentId: string;
  studentName: string;
  regNo: string;
  projectTitle: string;
  submissions: Submission[];
  finalMark: number | null;   // weighted average 0-100
  letterGrade: string | null; // A, B, C, D, F
  gradeStatus: 'not_started' | 'in_progress' | 'finalized';
}

// ─── Messaging ────────────────────────────────────────────────────────────────
export type MessageType = 'text' | 'image' | 'video' | 'file';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  type: MessageType;
  content: string;
  mediaUrl?: string;
  sentAt: string;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantInitials: string;
  participantSubtitle: string;
  projectInfo?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

// ─── Students & Supervisors (lecturer / admin views) ──────────────────────────
export type SubmissionStatusLabel = 'pending_review' | 'up_to_date' | 'overdue';

export interface StudentRecord {
  id: string;
  name: string;
  regNo: string;
  department: string;
  currentTopic: string;
  supervisorId?: string;
  supervisorName?: string;
  progress: number;
  submissionStatus: SubmissionStatusLabel;
  avatarUrl?: string;
}

export interface SupervisorRecord {
  id: string;
  name: string;
  staffId: string;
  specialization: string;
  department?: string;
  currentLoad: number;
  maxLoad: number;
  availability: 'available' | 'full';
  // Extended profile fields (from profiles table)
  title?: string;
  bio?: string;
  awards?: string[];
  certifications?: string[];
  specializations?: string[];
  allowStudentsToSeeCapacity?: boolean;
  avatarUrl?: string;
  rating?: number;       // average star rating (1-5)
  ratingCount?: number;  // number of student ratings
}

// ─── Lecturer ─────────────────────────────────────────────────────────────────
export interface LecturerStats {
  assignedStudents: number;
  activeProjects: number;
  pendingReviews: number;
  pendingRequests: number;
  workloadPercent: number;
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export interface AdminStats {
  totalStudents: number;
  totalLecturers: number;
  approvedTopics: number;
  pendingTopics: number;
  allocatedPercentage: number;
  unallocatedStudents: number;
}

export type NotificationSeverity = 'warning' | 'info' | 'success' | 'error';

export interface AppNotification {
  id: string;
  type: NotificationSeverity;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

// ─── Supervision Requests ─────────────────────────────────────────────────────
export type SupervisionRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface SupervisionRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentRegNo: string;
  studentDepartment: string;
  studentAvatarUrl?: string;
  lecturerId: string;
  lecturerName: string;
  topicInterest: string;
  message: string;
  status: SupervisionRequestStatus;
  denyReason?: string;
  adminNote?: string;
  resolutionType?: 'special_approval' | 'recommend_alternative';
  createdAt: string;
  resolvedAt?: string;
}

// ─── Lecturer profile (extended) ─────────────────────────────────────────────
export interface LecturerProfile {
  title: string;
  bio: string;
  specializations: string[];
  awards: string[];
  certifications: string[];
  maxStudents: number;
  allowStudentsToSeeCapacity: boolean;
  requirePlagiarismCheck: boolean;
  plagiarismThreshold: number;
}

// ─── Announcements ────────────────────────────────────────────────────────────
export type AnnouncementType = 'info' | 'warning' | 'success' | 'urgent';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  type: AnnouncementType;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
}

// ─── Activity feed (bell dropdown) ───────────────────────────────────────────
export type ActivityCategory = 'supervision' | 'topic' | 'student' | 'allocation' | 'announcement' | 'submission';

export interface ActivityItem {
  id: string;
  category: ActivityCategory;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  navigateTo?: string;
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export interface ReportFilters {
  department: string;
  supervisorId: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

export interface ReportRow {
  studentName: string;
  regNo: string;
  department: string;
  topic: string;
  supervisor: string;
  progress: number;
  status: string;
}
