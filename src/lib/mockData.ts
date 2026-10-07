import type {
  AuthResponse, Topic, Project, Submission, Conversation, Message,
  StudentRecord, SupervisorRecord, LecturerStats, AdminStats,
  AppNotification, ReportRow, SupervisionRequest, Announcement, ActivityItem,
} from '../types';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const MOCK_AUTH: Record<string, AuthResponse> = {
  student: {
    token: 'mock-token-student',
    user: {
      id: 'stu-001', name: 'Alex Johnson', email: 'alex.johnson@university.edu',
      role: 'student', department: 'Computer Science', matricNumber: 'CS/2021/001',
    },
  },
  lecturer: {
    token: 'mock-token-lecturer',
    user: {
      id: 'lec-001', name: 'Dr. Amina Yusuf', email: 'a.yusuf@university.edu',
      role: 'lecturer', department: 'Computer Science', staffId: 'STF-00123',
      specialization: 'Machine Learning & AI',
    },
  },
  admin: {
    token: 'mock-token-admin',
    user: {
      id: 'adm-001', name: 'Portal Administrator', email: 'admin@university.edu',
      role: 'admin', staffId: 'ADM-00001',
    },
  },
};

// ─── Topics ───────────────────────────────────────────────────────────────────
export const MOCK_TOPICS: Topic[] = [
  {
    id: 'top-001', title: 'AI-Driven Student Performance Prediction',
    description: 'Design a machine learning system that predicts student academic performance based on historical behavioural data and external factors.',
    lecturerId: 'lec-001', lecturerName: 'Dr. Amina Yusuf', specialization: 'Machine Learning & AI',
    department: 'Computer Science', researchArea: 'Artificial Intelligence',
    maxStudents: 5, enrolledStudents: 2, status: 'available', createdAt: '2023-09-01',
  },
  {
    id: 'top-002', title: 'Blockchain-Based Certificate Verification',
    description: 'Develop a decentralised system for verifying and issuing academic certificates using blockchain technology to prevent forgery.',
    lecturerId: 'lec-002', lecturerName: 'Dr. Chukwu Eze', specialization: 'Cybersecurity & Networks',
    department: 'Computer Science', researchArea: 'Blockchain',
    maxStudents: 4, enrolledStudents: 3, status: 'available', createdAt: '2023-09-02',
  },
  {
    id: 'top-003', title: 'Web-Based Project Allocation System',
    description: 'Design and implement a web application for managing final-year project allocation across multiple departments.',
    lecturerId: 'lec-003', lecturerName: 'Dr. Fatima Bello', specialization: 'Software Engineering',
    department: 'Software Engineering', researchArea: 'Web Development',
    maxStudents: 3, enrolledStudents: 1, status: 'available', createdAt: '2023-09-03',
  },
  {
    id: 'top-004', title: 'IoT-Based Smart Campus Monitoring',
    description: 'Build an IoT network for real-time monitoring and automation of campus facilities — energy, security, and attendance.',
    lecturerId: 'lec-004', lecturerName: 'Dr. Emeka Obi', specialization: 'IoT & Embedded Systems',
    department: 'Computer Engineering', researchArea: 'Internet of Things',
    maxStudents: 4, enrolledStudents: 4, status: 'full', createdAt: '2023-09-04',
  },
  {
    id: 'top-005', title: 'NLP for Low-Resource African Languages',
    description: 'Develop NLP models and labelled datasets for under-resourced West African languages using transfer learning.',
    lecturerId: 'lec-001', lecturerName: 'Dr. Amina Yusuf', specialization: 'Machine Learning & AI',
    department: 'Computer Science', researchArea: 'Artificial Intelligence',
    maxStudents: 5, enrolledStudents: 1, status: 'available', createdAt: '2023-09-05',
  },
];

export const MOCK_LECTURER_TOPICS: Topic[] = MOCK_TOPICS.filter(t => t.lecturerId === 'lec-001');

// ─── Project (current student) ────────────────────────────────────────────────
export const MOCK_PROJECT: Project = {
  id: 'proj-001', studentId: 'stu-001', topicId: 'top-003',
  topicTitle: 'Web-Based Project Allocation System',
  supervisorId: 'lec-001', supervisorName: 'Dr. Amina Yusuf',
  supervisorSpecialization: 'Machine Learning & AI',
  status: 'active', overallProgress: 45, supervisorApprovalStatus: 'On Track',
  milestones: [
    { id: 'm1', label: 'Proposal Approved', status: 'completed', percentage: 100, dueDate: '2023-09-15' },
    { id: 'm2', label: 'Chapter 1', status: 'completed', percentage: 100, dueDate: '2023-10-02' },
    { id: 'm3', label: 'Chapter 2', status: 'in_progress', percentage: 50, dueDate: '2023-11-01' },
    { id: 'm4', label: 'Chapter 3', status: 'pending', percentage: 0, dueDate: '2023-12-01' },
    { id: 'm5', label: 'Final Submission', status: 'pending', percentage: 0, dueDate: '2024-01-15' },
  ],
};

// ─── Submissions ──────────────────────────────────────────────────────────────
export const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-001', projectId: 'proj-001', studentId: 'stu-001',
    studentName: 'Alex Johnson',
    chapterLabel: 'Chapter 1: Introduction', fileName: 'Chapter1_Introduction.pdf',
    fileSize: '1.2 MB', uploadedAt: '2023-10-02T10:00:00Z',
    status: 'approved', feedback: 'Good introduction. Expand the problem statement in section 1.2 and add more references.',
    mark: 72, weight: 15, gradedAt: '2023-10-05T09:00:00Z',
  },
  {
    id: 'sub-002', projectId: 'proj-001', studentId: 'stu-001',
    studentName: 'Alex Johnson',
    chapterLabel: 'Chapter 2: Literature Review', fileName: 'Chapter2_LitReview.pdf',
    fileSize: '2.4 MB', uploadedAt: '2023-10-20T14:30:00Z',
    status: 'reviewed', feedback: 'Comprehensive review. Organise sources into thematic clusters.',
    mark: 68, weight: 20, gradedAt: '2023-10-23T11:00:00Z',
  },
  {
    id: 'sub-003', projectId: 'proj-001', studentId: 'stu-001',
    studentName: 'Alex Johnson',
    chapterLabel: 'Chapter 3: Methodology', fileName: 'Chapter3_Methodology.pdf',
    fileSize: '1.8 MB', uploadedAt: '2023-11-15T09:00:00Z',
    status: 'pending_review', weight: 25,
  },
  // Additional student submissions for grading screen
  {
    id: 'sub-004', projectId: 'proj-002', studentId: 'stu-002',
    studentName: 'Bola Adeyemi',
    chapterLabel: 'Chapter 1: Introduction', fileName: 'Chapter1_Intro.pdf',
    fileSize: '1.0 MB', uploadedAt: '2023-10-04T08:00:00Z',
    status: 'approved', feedback: 'Excellent problem framing. Well structured.',
    mark: 80, weight: 15, gradedAt: '2023-10-06T10:00:00Z',
  },
  {
    id: 'sub-005', projectId: 'proj-002', studentId: 'stu-002',
    studentName: 'Bola Adeyemi',
    chapterLabel: 'Chapter 2: Literature Review', fileName: 'Chapter2_LitReview.pdf',
    fileSize: '2.1 MB', uploadedAt: '2023-10-22T11:00:00Z',
    status: 'pending_review', weight: 20,
  },
];

// ─── Messages — Student (one conversation with supervisor) ────────────────────
export const MOCK_STUDENT_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-s001', participantId: 'lec-001', participantName: 'Dr. Amina Yusuf',
    participantInitials: 'AY', participantSubtitle: 'Supervisor · Machine Learning & AI',
    projectInfo: 'Web-Based Project Allocation System',
    lastMessage: 'Please review the attached feedback on Chapter 2...',
    lastMessageAt: '2024-01-10T09:28:00Z', unreadCount: 2,
  },
];

export const MOCK_STUDENT_MESSAGES: Record<string, Message[]> = {
  'conv-s001': [
    { id: 'sm-1', conversationId: 'conv-s001', senderId: 'lec-001', senderName: 'Dr. Amina Yusuf', type: 'text', content: 'Hello! I have reviewed your Chapter 1 draft. Overall it is good but there are a few areas to improve.', sentAt: '2024-01-10T09:10:00Z' },
    { id: 'sm-2', conversationId: 'conv-s001', senderId: 'lec-001', senderName: 'Dr. Amina Yusuf', type: 'image', content: 'Annotated feedback — Chapter 1', sentAt: '2024-01-10T09:11:00Z' },
    { id: 'sm-3', conversationId: 'conv-s001', senderId: 'stu-001', senderName: 'Alex Johnson', type: 'text', content: 'Thank you Dr. Yusuf! I will review your annotations and revise accordingly. Should I send the updated version here?', sentAt: '2024-01-10T09:25:00Z' },
    { id: 'sm-4', conversationId: 'conv-s001', senderId: 'lec-001', senderName: 'Dr. Amina Yusuf', type: 'text', content: 'Yes, please upload it here when done. Also watch this short clip on research methodology — it will help with Chapter 2.', sentAt: '2024-01-10T09:27:00Z' },
    { id: 'sm-5', conversationId: 'conv-s001', senderId: 'lec-001', senderName: 'Dr. Amina Yusuf', type: 'video', content: 'Research Methodology Overview', sentAt: '2024-01-10T09:28:00Z' },
    { id: 'sm-6', conversationId: 'conv-s001', senderId: 'stu-001', senderName: 'Alex Johnson', type: 'text', content: 'Great, I will watch it tonight. Thank you!', sentAt: '2024-01-10T09:35:00Z' },
  ],
};

// ─── Messages — Lecturer (multiple student conversations) ─────────────────────
export const MOCK_LECTURER_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-l001', participantId: 'stu-001', participantName: 'Alex Johnson',
    participantInitials: 'AJ', participantSubtitle: 'CS/2021/001',
    projectInfo: 'Web-Based Project Allocation System',
    lastMessage: 'Thank you! I will revise and resend.',
    lastMessageAt: '2024-01-10T09:35:00Z', unreadCount: 0,
  },
  {
    id: 'conv-l002', participantId: 'stu-002', participantName: 'Bola Adeyemi',
    participantInitials: 'BA', participantSubtitle: 'CS/2021/002',
    projectInfo: 'AI-Driven Student Performance Prediction',
    lastMessage: 'Is this the correct format for Chapter 2?',
    lastMessageAt: '2024-01-09T16:01:00Z', unreadCount: 2,
  },
  {
    id: 'conv-l003', participantId: 'stu-003', participantName: 'Chioma Obi',
    participantInitials: 'CO', participantSubtitle: 'CS/2021/003',
    projectInfo: 'NLP for Low-Resource African Languages',
    lastMessage: 'Thank you for the video!',
    lastMessageAt: '2024-01-08T11:20:00Z', unreadCount: 0,
  },
];

export const MOCK_LECTURER_MESSAGES: Record<string, Message[]> = {
  'conv-l001': [
    { id: 'lm-1', conversationId: 'conv-l001', senderId: 'stu-001', senderName: 'Alex Johnson', type: 'text', content: 'Good morning Dr. Yusuf, I have uploaded Chapter 1 for your review.', sentAt: '2024-01-10T08:50:00Z' },
    { id: 'lm-2', conversationId: 'conv-l001', senderId: 'lec-001', senderName: 'Dr. Amina Yusuf', type: 'text', content: 'Received! I will go through it today and send feedback shortly.', sentAt: '2024-01-10T09:10:00Z' },
    { id: 'lm-3', conversationId: 'conv-l001', senderId: 'lec-001', senderName: 'Dr. Amina Yusuf', type: 'image', content: 'Chapter 1 Annotated Feedback', sentAt: '2024-01-10T09:15:00Z' },
    { id: 'lm-4', conversationId: 'conv-l001', senderId: 'stu-001', senderName: 'Alex Johnson', type: 'text', content: 'Thank you! I will revise and resend.', sentAt: '2024-01-10T09:35:00Z' },
  ],
  'conv-l002': [
    { id: 'lm-5', conversationId: 'conv-l002', senderId: 'stu-002', senderName: 'Bola Adeyemi', type: 'text', content: 'Dr. Yusuf, is this the correct format for Chapter 2?', sentAt: '2024-01-09T16:00:00Z' },
    { id: 'lm-6', conversationId: 'conv-l002', senderId: 'stu-002', senderName: 'Bola Adeyemi', type: 'image', content: 'Chapter 2 Draft Format', sentAt: '2024-01-09T16:01:00Z' },
  ],
  'conv-l003': [
    { id: 'lm-7', conversationId: 'conv-l003', senderId: 'lec-001', senderName: 'Dr. Amina Yusuf', type: 'text', content: 'Hi Chioma, please watch the methodology video below.', sentAt: '2024-01-08T10:00:00Z' },
    { id: 'lm-8', conversationId: 'conv-l003', senderId: 'lec-001', senderName: 'Dr. Amina Yusuf', type: 'video', content: 'Research Methodology Guide', sentAt: '2024-01-08T10:01:00Z' },
    { id: 'lm-9', conversationId: 'conv-l003', senderId: 'stu-003', senderName: 'Chioma Obi', type: 'text', content: 'Thank you for the video!', sentAt: '2024-01-08T11:20:00Z' },
  ],
};

// ─── Lecturer stats & students ────────────────────────────────────────────────
export const MOCK_LECTURER_STATS: LecturerStats = {
  assignedStudents: 12, activeProjects: 10, pendingReviews: 4, pendingRequests: 2, workloadPercent: 80,
};

export const MOCK_ASSIGNED_STUDENTS: StudentRecord[] = [
  { id: 'stu-001', name: 'Alex Johnson', regNo: 'CS/2021/001', department: 'Computer Science', currentTopic: 'Web-Based Project Allocation System', supervisorId: 'lec-001', supervisorName: 'Dr. Amina Yusuf', progress: 45, submissionStatus: 'pending_review' },
  { id: 'stu-002', name: 'Bola Adeyemi', regNo: 'CS/2021/002', department: 'Computer Science', currentTopic: 'AI-Driven Student Performance Prediction', supervisorId: 'lec-001', supervisorName: 'Dr. Amina Yusuf', progress: 30, submissionStatus: 'up_to_date' },
  { id: 'stu-003', name: 'Chioma Obi', regNo: 'CS/2021/003', department: 'Computer Science', currentTopic: 'NLP for Low-Resource African Languages', supervisorId: 'lec-001', supervisorName: 'Dr. Amina Yusuf', progress: 60, submissionStatus: 'pending_review' },
  { id: 'stu-004', name: 'David Musa', regNo: 'CS/2021/004', department: 'Computer Science', currentTopic: 'Web-Based Project Allocation System', supervisorId: 'lec-001', supervisorName: 'Dr. Amina Yusuf', progress: 20, submissionStatus: 'up_to_date' },
];

// ─── Admin stats & allocation ─────────────────────────────────────────────────
export const MOCK_ADMIN_STATS: AdminStats = {
  totalStudents: 145, totalLecturers: 24, approvedTopics: 110,
  pendingTopics: 12, allocatedPercentage: 85, unallocatedStudents: 15,
};

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', type: 'warning', title: 'Duplicate Topic Detected', message: 'Alex Johnson submitted a topic similar to an existing one (78% similarity).', createdAt: '2024-01-10T08:00:00Z', read: false },
  { id: 'n2', type: 'info', title: '5 New Topics Awaiting Approval', message: 'Submitted in the last 24 hours across 3 departments.', createdAt: '2024-01-10T07:30:00Z', read: false },
  { id: 'n3', type: 'success', title: 'Supervisor Allocation Complete', message: '12 students have been successfully allocated supervisors this week.', createdAt: '2024-01-09T16:00:00Z', read: true },
];

export const MOCK_UNALLOCATED_STUDENTS: StudentRecord[] = [
  { id: 'stu-010', name: 'Mark Johnson', regNo: 'CS/2021/010', department: 'Computer Science', currentTopic: 'Blockchain for Supply Chain', progress: 0, submissionStatus: 'up_to_date' },
  { id: 'stu-011', name: 'Ngozi Eze', regNo: 'SE/2021/011', department: 'Software Engineering', currentTopic: 'Mobile Health Monitoring App', progress: 0, submissionStatus: 'up_to_date' },
];

export const MOCK_SUPERVISORS: SupervisorRecord[] = [
  { id: 'lec-001', name: 'Dr. Amina Yusuf', staffId: 'STF-00123', specialization: 'Machine Learning & AI', currentLoad: 12, maxLoad: 15, availability: 'available', rating: 4.8, ratingCount: 24 },
  { id: 'lec-002', name: 'Dr. Chukwu Eze', staffId: 'STF-00124', specialization: 'Cybersecurity & Networks', currentLoad: 9, maxLoad: 15, availability: 'available', rating: 4.5, ratingCount: 18 },
  { id: 'lec-003', name: 'Dr. Fatima Bello', staffId: 'STF-00125', specialization: 'Software Engineering', currentLoad: 15, maxLoad: 15, availability: 'full', rating: 4.2, ratingCount: 31 },
];

export const MOCK_LECTURER_SUPERVISION_REQUESTS: SupervisionRequest[] = [
  {
    id: 'req-001', studentId: 'stu-001', studentName: 'Alex Johnson',
    studentRegNo: 'CS/2021/001', studentDepartment: 'Computer Science',
    lecturerId: 'lec-001', lecturerName: 'Dr. Amina Yusuf',
    topicInterest: 'Web-Based Project Allocation System',
    message: 'I have a strong interest in your research on intelligent systems and would love to work under your supervision for my final-year project.',
    status: 'accepted', createdAt: '2024-01-05T10:00:00Z', resolvedAt: '2024-01-06T09:00:00Z',
  },
  {
    id: 'req-002', studentId: 'stu-004', studentName: 'David Musa',
    studentRegNo: 'CS/2021/004', studentDepartment: 'Computer Science',
    lecturerId: 'lec-001', lecturerName: 'Dr. Amina Yusuf',
    topicInterest: 'Predictive Analytics for Academic Performance',
    message: 'I am particularly interested in data-driven approaches to education and would like your guidance on this topic.',
    status: 'accepted', createdAt: '2024-01-07T11:30:00Z', resolvedAt: '2024-01-08T08:00:00Z',
  },
  {
    id: 'req-003', studentId: 'stu-005', studentName: 'Emmanuel Tunde',
    studentRegNo: 'CS/2022/005', studentDepartment: 'Computer Science',
    lecturerId: 'lec-001', lecturerName: 'Dr. Amina Yusuf',
    topicInterest: 'Machine Learning for Agricultural Yield Prediction',
    message: 'I have been following your publications on ML and would love to explore this applied topic under your guidance.',
    status: 'pending', createdAt: '2024-01-10T14:00:00Z',
  },
  {
    id: 'req-004', studentId: 'stu-006', studentName: 'Fatima Lawal',
    studentRegNo: 'SE/2022/006', studentDepartment: 'Software Engineering',
    lecturerId: 'lec-001', lecturerName: 'Dr. Amina Yusuf',
    topicInterest: 'Explainability in Deep Learning Models',
    message: 'I have a background in Python and ML and this topic aligns perfectly with my career goals.',
    status: 'rejected', denyReason: 'Currently at maximum supervision capacity for this academic year.', createdAt: '2024-01-09T09:00:00Z', resolvedAt: '2024-01-09T16:00:00Z',
  },
];

export const MOCK_REPORT_ROWS: ReportRow[] = [
  { studentName: 'Alex Johnson', regNo: 'CS/2021/001', department: 'Computer Science', topic: 'Web-Based Project Allocation System', supervisor: 'Dr. Amina Yusuf', progress: 45, status: 'In Progress' },
  { studentName: 'Bola Adeyemi', regNo: 'CS/2021/002', department: 'Computer Science', topic: 'AI-Driven Student Performance Prediction', supervisor: 'Dr. Amina Yusuf', progress: 30, status: 'In Progress' },
  { studentName: 'Chioma Obi', regNo: 'CS/2021/003', department: 'Computer Science', topic: 'NLP for Low-Resource African Languages', supervisor: 'Dr. Amina Yusuf', progress: 60, status: 'In Progress' },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-001',
    title: 'Chapter 1 Submission Deadline',
    body: 'All students must submit Chapter 1 drafts by Friday, 5pm. Late submissions will not be accepted without prior approval from your supervisor.',
    type: 'warning',
    createdBy: 'Admin',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ann-002',
    title: 'Portal Maintenance — Saturday 2am–4am',
    body: 'The system will be unavailable for scheduled maintenance on Saturday morning. Please save all in-progress work before then.',
    type: 'info',
    createdBy: 'Admin',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ann-003',
    title: 'Topic Selection Now Open',
    body: 'Students may now select or propose project topics for the upcoming academic session. Visit the Project Topics page to get started.',
    type: 'success',
    createdBy: 'Admin',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const now = Date.now();
export const MOCK_ACTIVITY_FEED: ActivityItem[] = [
  { id: 'act-001', category: 'supervision', title: 'New supervision request', description: 'Fatima Lawal requested Dr. Amina Yusuf as supervisor', timestamp: new Date(now - 5 * 60 * 1000).toISOString(), read: false, navigateTo: 'supervisor-allocation' },
  { id: 'act-002', category: 'topic', title: 'Topic submitted for approval', description: 'Alex Johnson proposed "Federated Learning for Edge Devices"', timestamp: new Date(now - 22 * 60 * 1000).toISOString(), read: false, navigateTo: 'topic-approval' },
  { id: 'act-003', category: 'student', title: 'New student registered', description: 'Chukwuemeka Nwosu joined — SE/2024/019', timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(), read: false, navigateTo: 'supervisor-allocation' },
  { id: 'act-004', category: 'allocation', title: 'Supervisor allocated', description: 'Bola Adeyemi assigned to Prof. Kehinde Olatunji', timestamp: new Date(now - 4 * 60 * 60 * 1000).toISOString(), read: true, navigateTo: 'supervisor-allocation' },
  { id: 'act-005', category: 'submission', title: 'Chapter reviewed', description: 'Dr. Amina Yusuf submitted feedback on Chioma Obi\'s Chapter 2', timestamp: new Date(now - 6 * 60 * 60 * 1000).toISOString(), read: true },
  { id: 'act-006', category: 'topic', title: 'Topic approved', description: 'Dr. Hassan Bala approved "Blockchain in Academic Records"', timestamp: new Date(now - 10 * 60 * 60 * 1000).toISOString(), read: true, navigateTo: 'topic-approval' },
  { id: 'act-007', category: 'supervision', title: 'Request denied', description: 'Dr. Amina Yusuf denied Ibrahim Musa\'s request — capacity full', timestamp: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(), read: true },
  { id: 'act-008', category: 'announcement', title: 'Announcement sent', description: 'Chapter 1 deadline notice broadcast to all users', timestamp: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(), read: true },
];
