import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';
import { Pill, ShieldCheck, Lock, User, AlertCircle, FileText } from 'lucide-react';
import axios from 'axios';

export const Login: React.FC = () => {
  const { login, isLoading, isInitialized } = useAppState();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStatus, setRecoveryStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [recoveryErrorMsg, setRecoveryErrorMsg] = useState('');
  const [recoveryPreviewUrl, setRecoveryPreviewUrl] = useState<string | null>(null);

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail.trim()) return;

    setRecoveryStatus('loading');
    setRecoveryErrorMsg('');

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/auth/forgot-password`, {
        email: recoveryEmail.trim(),
      });
      setRecoveryPreviewUrl(response.data.previewUrl || null);
      setRecoveryStatus('success');
    } catch (err: any) {
      setRecoveryStatus('error');
      if (err.response?.status === 404) {
        setRecoveryErrorMsg('Please contact the system administrator.');
      } else {
        setRecoveryErrorMsg(err.response?.data?.error || 'An error occurred during password recovery.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    const success = await login(username.trim(), password);
    if (!success) {
      setError('Invalid username or password. Please try again.');
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-slate-500 text-sm font-medium">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 md:p-8 select-none">
      {/* Container Card */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200/60 flex flex-col md:flex-row min-h-[550px]">
        
        {/* Left Side: Form */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-between">
          
          {/* Logo & Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Pill size={18} className="text-white transform -rotate-45" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-slate-900">MediCare</div>
              <div className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Clinic & Pharmacy</div>
            </div>
          </div>

          {/* Core Title Section */}
          <div className="my-8">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
              Smart pharmacy <br />
              management <span className="text-sky-600">starts here.</span>
            </h2>
            <p className="text-slate-500 text-xs mt-3 leading-relaxed">
              Welcome back. Sign in to access your clinic dashboard, manage inventories, and patient prescriptions.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2 animate-shake">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={14} />
                </div>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-slate-800 text-xs rounded-lg py-2.5 pl-9 pr-4 focus:outline-none transition-all duration-150"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-600">Password</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={14} />
                </div>
                <input
                  type="password"
                  placeholder="**********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-slate-800 text-xs rounded-lg py-2.5 pl-9 pr-4 focus:outline-none transition-all duration-150"
                  required
                />
              </div>
            </div>

            {/* Remember Me / Forgot Pass */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-sky-600 rounded border-slate-300 cursor-pointer"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-sky-600 font-semibold hover:underline outline-none cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg text-white font-semibold text-xs tracking-wide bg-gradient-to-r from-slate-900 to-sky-700 hover:opacity-95 shadow-lg shadow-slate-950/15 hover:shadow-xl transition-all duration-150 cursor-pointer outline-none mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Footer credentials reminder */}
          <div className="text-center pt-6 border-t border-slate-100 mt-6 text-[10px] text-slate-400">
            MediCare Clinic & Pharmacy System · v1.0
          </div>
        </div>

        {/* Right Side: Visual Brand Panel (Slate & Sky Gradient) */}
        <div className="hidden md:flex flex-1 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 p-12 flex-col justify-between text-white relative">
          {/* Subtle background abstract shapes */}
          <div className="absolute inset-0 bg-radial-gradient opacity-10 pointer-events-none" />
          
          <div className="flex justify-end">
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold tracking-tight">Streamlining care. Simplifying pharmacy.</h3>
            <p className="text-xs text-slate-300/85 leading-relaxed">
              Integrate clinic scheduling, doctor consultations, instant invoice billing, drug stock tracking, and pharmacy dispensing into one secure workspace.
            </p>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            © 2026 MediCare Inc. All rights reserved.
          </div>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-left">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200/50 overflow-hidden transform scale-100 transition-all duration-300">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                <ShieldCheck size={20} className="stroke-[2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Forgot Password?</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Account Recovery</p>
              </div>
            </div>
            
            {recoveryStatus === 'success' ? (
              <div className="p-6 space-y-4 font-sans text-xs">
                <div className="flex flex-col items-center text-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                    <ShieldCheck size={24} />
                  </div>
                  <h4 className="text-xs font-bold text-emerald-900">Email Found!</h4>
                  <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                    A temporary recovery password has been generated and sent to <span className="font-semibold text-emerald-950 font-mono">{recoveryEmail}</span>.
                  </p>
                </div>

                {recoveryPreviewUrl ? (
                  <div className="bg-sky-50 rounded-xl border border-sky-100 p-4 space-y-2 text-center text-sky-850">
                    <p className="text-[11px] leading-relaxed">
                      <strong>Developer Sandbox Active:</strong> Since the terminal's email server is running in simulated test mode, you can inspect the email sent to you directly:
                    </p>
                    <a
                      href={recoveryPreviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[10px] font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                    >
                      <FileText size={12} />
                      <span>Open Ethereal Mailbox Sandbox</span>
                    </a>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                    Please check your mailbox inbox and spam folder for credentials reset information.
                  </p>
                )}

                <p className="text-[10px] text-slate-400 text-center leading-normal italic">
                  Note: Log in with the recovery access key securely sent to you to restore session operations.
                </p>
                <div className="bg-slate-50/50 p-4 px-6 border-t border-slate-105 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setRecoveryStatus('idle');
                      setRecoveryEmail('');
                      setRecoveryErrorMsg('');
                      setRecoveryPreviewUrl(null);
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-md active:scale-95 transition-all duration-150 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit}>
                <div className="p-6 space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Provide the email address registered to your account. The system will verify if the email is on the system.
                  </p>
                  
                  {recoveryStatus === 'error' && (
                    <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-800 rounded-lg text-[11px] font-semibold leading-relaxed flex items-center gap-2">
                      <AlertCircle size={14} className="text-rose-600 flex-shrink-0" />
                      <span>{recoveryErrorMsg}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. staffname@medicare.com"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-slate-50/50 p-4 px-6 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setRecoveryStatus('idle');
                      setRecoveryEmail('');
                      setRecoveryErrorMsg('');
                    }}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold active:scale-95 transition-all duration-150 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={recoveryStatus === 'loading'}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-md active:scale-95 transition-all duration-150 disabled:opacity-60 cursor-pointer"
                  >
                    {recoveryStatus === 'loading' ? 'Verifying...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
