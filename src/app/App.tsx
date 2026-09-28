import React, { useState } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { AppSettingsProvider } from '../context/AppSettingsContext';
import { Login } from './components/Login';
import { Layout } from './components/Layout';

import {
  StudentDashboard, FindSupervisor, ProjectTopicSelection,
  SubmissionAndFeedback, ProgressTracking, StudentMessaging,
  StudentProfile, MyRequests,
} from './components/StudentScreens';

import {
  LecturerDashboard, LecturerProfile, StudentSupervisionRequests,
  ProjectTopicUpload, ViewAssignedStudents,
  SupervisorWorkloadTracking, LecturerMessaging,
  SupervisorTopicApproval,
} from './components/LecturerScreens';

import {
  AdminDashboard, TopicApproval, SupervisorAllocation, ReportGeneration,
  AdminProfile,
} from './components/AdminScreens';

function AppRouter() {
  const { user, logout } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<string>('dashboard');

  const handleNavigate = (screen: string) => setCurrentScreen(screen);

  if (!user) {
    return <Login />;
  }

  const renderScreen = () => {
    if (user.role === 'student') {
      switch (currentScreen) {
        case 'dashboard':        return <StudentDashboard onNavigate={handleNavigate} />;
        case 'find-supervisor':  return <FindSupervisor onNavigate={handleNavigate} />;
        case 'my-requests':      return <MyRequests onNavigate={handleNavigate} />;
        case 'topic-selection':  return <ProjectTopicSelection onNavigate={handleNavigate} />;
        case 'submission':       return <SubmissionAndFeedback onNavigate={handleNavigate} />;
        case 'progress':         return <ProgressTracking onNavigate={handleNavigate} />;
        case 'messages':         return <StudentMessaging onNavigate={handleNavigate} />;
        case 'my-profile':       return <StudentProfile onNavigate={handleNavigate} />;
        default:                 return <StudentDashboard onNavigate={handleNavigate} />;
      }
    }

    if (user.role === 'lecturer') {
      switch (currentScreen) {
        case 'dashboard':        return <LecturerDashboard onNavigate={handleNavigate} />;
        case 'my-profile':       return <LecturerProfile onNavigate={handleNavigate} />;
        case 'student-requests': return <StudentSupervisionRequests onNavigate={handleNavigate} />;
        case 'topic-approval':   return <SupervisorTopicApproval onNavigate={handleNavigate} />;
        case 'topic-upload':     return <ProjectTopicUpload onNavigate={handleNavigate} />;
        case 'view-students':    return <ViewAssignedStudents onNavigate={handleNavigate} />;
        case 'workload':         return <SupervisorWorkloadTracking onNavigate={handleNavigate} />;
        case 'messages':         return <LecturerMessaging onNavigate={handleNavigate} />;
        default:                 return <LecturerDashboard onNavigate={handleNavigate} />;
      }
    }

    if (user.role === 'admin') {
      switch (currentScreen) {
        case 'dashboard':             return <AdminDashboard onNavigate={handleNavigate} />;
        case 'topic-approval':        return <TopicApproval onNavigate={handleNavigate} />;
        case 'supervisor-allocation': return <SupervisorAllocation onNavigate={handleNavigate} />;
        case 'report-generation':     return <ReportGeneration onNavigate={handleNavigate} />;
        case 'my-profile':            return <AdminProfile onNavigate={handleNavigate} />;
        default:                      return <AdminDashboard onNavigate={handleNavigate} />;
      }
    }

    return null;
  };

  return (
    <Layout
      role={user.role}
      currentScreen={currentScreen}
      onNavigate={handleNavigate}
      onLogout={logout}
    >
      {renderScreen()}
    </Layout>
  );
}

export default function App() {
  return (
    <AppSettingsProvider>
      <AuthProvider>
        <AppRouter />
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </AppSettingsProvider>
  );
}
