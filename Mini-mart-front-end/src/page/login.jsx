import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ onBrowseStore }) {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) await register(username, password);
      else await login(username, password);
    } catch (err) {
      setError(err.message || 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
    ), title: 'Real-time Dashboard', desc: 'Track sales, inventory, and performance at a glance' },
    { icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
    ), title: 'Fast POS', desc: 'Lightning-fast checkout with barcode scanning' },
    { icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
    ), title: 'Inventory Management', desc: 'Manage products with images and categories' },
    { icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
    ), title: 'Smart Reports', desc: 'Detailed analytics and revenue insights' },
  ];

  return (
    <div className="min-h-screen flex font-['Inter',sans-serif] overflow-hidden">
      {/* Left panel - animated gradient */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #059669 40%, #10b981 70%, #34d399 100%)' }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/5 rounded-full animate-float" />
          <div className="absolute top-1/3 -right-10 w-60 h-60 bg-orange-400/10 rounded-full animate-float2" />
          <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-white/5 rounded-full animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-10 left-1/2 w-24 h-24 bg-orange-300/10 rounded-full animate-float2" style={{ animationDelay: '1s' }} />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center px-16 w-full">
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-3xl bg-white/15 backdrop-blur-xl flex items-center justify-center shadow-2xl border border-white/20 animate-pulse-green">
              <img src="/logo-white.svg" alt="Mini Mart" className="w-16 h-16" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center shadow-lg">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
          </div>

          <h1 className="text-5xl font-extrabold text-white mb-3 tracking-tight">Mini Mart</h1>
          <p className="text-lg text-emerald-100/80 max-w-md text-center leading-relaxed font-light">
            Modern store management system for your business
          </p>

          <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-lg">
            {features.map((f, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/15 hover:bg-white/20 hover:border-white/25 transition-all duration-300 group cursor-default"
                style={{ animation: `slideUp 0.5s ease ${i * 0.1}s both` }}>
                <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center text-white mb-3 group-hover:scale-110 group-hover:bg-orange-400/30 transition-all duration-300">
                  {f.icon}
                </div>
                <h3 className="text-white font-semibold text-sm mb-1">{f.title}</h3>
                <p className="text-white/50 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex items-center gap-2 text-white/30 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Trusted by 1000+ stores worldwide</span>
          </div>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-white relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-50 to-transparent rounded-bl-[100px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
              <img src="/logo-white.svg" alt="Mini Mart" className="w-9 h-9" />
            </div>
            <div>
              <span className="text-2xl font-extrabold text-slate-800 block leading-tight">Mini Mart</span>
              <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Management System</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-1">
              {isRegister ? 'Create Account' : 'Welcome back'}
            </h2>
            <p className="text-slate-500 text-sm">
              {isRegister ? 'Sign up to start managing your store' : 'Sign in to your account to continue'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-xl mb-6 border border-red-100 animate-scaleIn flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-field">Username</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required
                  placeholder="Enter your username"
                  className="input-field pl-11" />
              </div>
            </div>
            <div>
              <label className="label-field">Password</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  placeholder="Enter your password"
                  className="input-field pl-11" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700" />
              {loading ? (
                <span className="flex items-center justify-center gap-2 relative">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Processing...
                </span>
              ) : (
                <span className="relative flex items-center justify-center gap-2">
                  {isRegister ? 'Create Account' : 'Sign In'}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </span>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
            <button onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="ml-1 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">
              {isRegister ? 'Sign In' : 'Sign Up'}
            </button>
          </p>

          {onBrowseStore && (
            <div className="mt-8">
              <div className="flex items-center gap-4 mb-5">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-medium">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <button onClick={onBrowseStore}
                className="w-full py-3.5 rounded-xl bg-white border-2 border-emerald-200 text-emerald-700 font-bold text-sm shadow-sm hover:bg-emerald-50 hover:border-emerald-300 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                Browse Store as Guest
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}