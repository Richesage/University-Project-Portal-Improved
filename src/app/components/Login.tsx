import React, { useState } from 'react';
import { BookOpen, KeyRound, Mail, Hash, User, ChevronDown, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole, IdentifierType, RegisterPayload } from '../../types';

type AuthMode = 'login' | 'register';

const DEPARTMENTS = ['Computer Science', 'Software Engineering', 'Information Technology', 'Electrical Engineering', 'Computer Engineering'];

export function Login() {
  const { login, register, loading, error, clearError } = useAuth();

  // ── Shared ──
  const [mode, setMode] = useState<AuthMode>('login');

  // ── Login form state ──
  const [loginIdType, setLoginIdType] = useState<IdentifierType>('id');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── Register form state ──
  const [regRole, setRegRole] = useState<UserRole>('student');
  const [regIdType, setRegIdType] = useState<IdentifierType>('id');
  const [regName, setRegName] = useState('');
  const [regIdentifier, setRegIdentifier] = useState('');
  const [regDepartment, setRegDepartment] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const isStudent = regRole === 'student';

  const regIdLabel = isStudent
    ? (regIdType === 'id' ? 'Matric Number' : 'Student Email')
    : (regIdType === 'id' ? 'Staff ID' : 'Staff Email');

  const regIdPlaceholder = isStudent
    ? (regIdType === 'id' ? 'e.g. CS/2021/001' : 'student@university.edu')
    : (regIdType === 'id' ? 'e.g. STF-00123' : 'staff@university.edu');

  const switchMode = (next: AuthMode) => {
    clearError();
    setLocalError(null);
    setMode(next);
  };

  const displayError = localError ?? error;

  // ── Handlers ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await login({ identifier: loginIdentifier, identifierType: loginIdType, password: loginPassword });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    if (regPassword !== regConfirm) {
      setLocalError('Passwords do not match.');
      return;
    }
    const payload: RegisterPayload = {
      role: regRole, name: regName, identifier: regIdentifier,
      identifierType: regIdType, password: regPassword, confirmPassword: regConfirm,
      ...(regDepartment ? { department: regDepartment } : {}),
    };
    await register(payload);
  };

  const inputCls = 'block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#312DC4] focus:border-[#312DC4]';

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full max-w-md">

        {/* Header */}
        <div className="flex flex-col items-center pt-8 pb-6 px-8 border-b border-gray-100">
          <div className="w-14 h-14 bg-[#EEEDFB] rounded-full flex items-center justify-center mb-3">
            <BookOpen className="w-7 h-7 text-[#312DC4]" />
          </div>
          <h1 className="text-xl font-semibold text-gray-800">University Project Portal</h1>
          <p className="text-gray-500 text-sm mt-1">
            {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-gray-200">
          {(['login', 'register'] as AuthMode[]).map((tab) => (
            <button
              key={tab}
              onClick={() => switchMode(tab)}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                mode === tab
                  ? 'border-[#312DC4] text-[#312DC4]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        <div className="p-8">
          {/* Error banner */}
          {displayError && (
            <div className="mb-4 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {displayError}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Identifier */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">
                    {loginIdType === 'id' ? 'Matric / Staff ID' : 'Email Address'}
                  </label>
                  <div className="flex gap-2 text-xs">
                    {(['id', 'email'] as IdentifierType[]).map((t, i, arr) => (
                      <React.Fragment key={t}>
                        <button
                          type="button"
                          onClick={() => setLoginIdType(t)}
                          className={`font-medium transition-colors ${loginIdType === t ? 'text-[#312DC4] underline underline-offset-2' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          {t === 'id' ? 'Use ID' : 'Use Email'}
                        </button>
                        {i < arr.length - 1 && <span className="text-gray-300">|</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  {loginIdType === 'id'
                    ? <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    : <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  }
                  <input
                    type={loginIdType === 'email' ? 'email' : 'text'}
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className={inputCls}
                    placeholder={loginIdType === 'id' ? 'Matric No. or Staff ID' : 'your@university.edu'}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="block w-full pl-9 pr-10 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#312DC4] focus:border-[#312DC4]"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 border-gray-300 rounded accent-[#312DC4]"
                  />
                  Remember me
                </label>
                <button type="button" className="text-sm text-[#312DC4] hover:underline">Forgot Password?</button>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 rounded-md text-sm font-medium text-white bg-[#312DC4] hover:bg-[#2724b0] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Sign In
                </button>

              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">I am registering as</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select
                    value={regRole}
                    onChange={(e) => { setRegRole(e.target.value as UserRole); setRegIdentifier(''); }}
                    className="block w-full pl-9 pr-9 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#312DC4] appearance-none"
                  >
                    <option value="student">Student</option>
                    <option value="lecturer">Lecturer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              {/* Full name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className={inputCls}
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* Primary identifier */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">{regIdLabel}</label>
                  <div className="flex gap-2 text-xs">
                    {(['id', 'email'] as IdentifierType[]).map((t, i, arr) => (
                      <React.Fragment key={t}>
                        <button
                          type="button"
                          onClick={() => { setRegIdType(t); setRegIdentifier(''); }}
                          className={`font-medium transition-colors ${regIdType === t ? 'text-[#312DC4] underline underline-offset-2' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          {t === 'id' ? (isStudent ? 'Matric No.' : 'Staff ID') : (isStudent ? 'Student Email' : 'Staff Email')}
                        </button>
                        {i < arr.length - 1 && <span className="text-gray-300">|</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  {regIdType === 'id'
                    ? <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    : <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  }
                  <input
                    type={regIdType === 'email' ? 'email' : 'text'}
                    required
                    value={regIdentifier}
                    onChange={(e) => setRegIdentifier(e.target.value)}
                    className={inputCls}
                    placeholder={regIdPlaceholder}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  {isStudent
                    ? 'Use your matric number or university-issued student email.'
                    : 'Use your staff ID or institution staff email address.'}
                </p>
              </div>

              {/* Department */}
              {(regRole === 'student' || regRole === 'lecturer') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <div className="relative">
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <select
                      value={regDepartment}
                      onChange={(e) => setRegDepartment(e.target.value)}
                      required
                      className="block w-full pr-9 pl-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#312DC4] appearance-none"
                    >
                      <option value="">Select department</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="block w-full pl-9 pr-10 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#312DC4] focus:border-[#312DC4]"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type={showRegConfirm ? 'text' : 'password'}
                    required
                    value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                    className="block w-full pl-9 pr-10 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#312DC4] focus:border-[#312DC4]"
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showRegConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 rounded-md text-sm font-medium text-white bg-[#312DC4] hover:bg-[#2724b0] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Register as {regRole === 'admin' ? 'Administrator' : regRole.charAt(0).toUpperCase() + regRole.slice(1)}
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="w-full py-2 px-4 rounded-md text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
