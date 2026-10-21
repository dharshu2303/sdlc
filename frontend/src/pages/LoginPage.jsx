import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      setLoading(false);
      if (res.user?.role === 'Admin') {
        navigate('/admin/users');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative"
      style={{
        backgroundImage: "url('/login-bg.webp')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-sm space-y-5">

        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center shadow-2xl shadow-cyan-500/30 mx-auto ring-4 ring-white/10">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-lg">
              SDLC Governance Portal
            </h1>
            <p className="text-xs text-cyan-200 mt-1">
              System Admin & Employee Role Authentication
            </p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-7 rounded-2xl shadow-2xl space-y-5">

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/20 border border-red-400/40 text-red-100 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-300 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/90 font-semibold mb-1.5 text-xs">
                Email Address
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 z-20 pointer-events-none flex items-center justify-center">
                  <Mail className="w-4 h-4 text-black" strokeWidth={2.4} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white/90 focus:bg-white border border-white/30 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 placeholder-slate-500 text-xs font-medium backdrop-blur transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/90 font-semibold mb-1.5 text-xs">
                Password
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 z-20 pointer-events-none flex items-center justify-center">
                  <Lock className="w-4 h-4 text-black" strokeWidth={2.4} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/90 focus:bg-white border border-white/30 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 rounded-xl pl-10 pr-10 py-2.5 text-slate-900 placeholder-slate-500 text-xs font-medium backdrop-blur transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 z-20 text-slate-700 hover:text-black transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-black" /> : <Eye className="w-4 h-4 text-black" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 disabled:opacity-60 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <>
                  <span>Sign In to SDLC Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-[11px] text-center text-white/40">
          SDLC Governance Platform &bull; Secure Authentication
        </p>
      </div>
    </div>
  );
}
