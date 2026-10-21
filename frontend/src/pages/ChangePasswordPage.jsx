import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, CheckCircle2, AlertCircle, KeyRound, Info } from 'lucide-react';

export default function ChangePasswordPage() {
  const { user, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('123');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      return setError('New password and confirmation do not match.');
    }
    if (newPassword.length < 3) {
      return setError('New password must be at least 3 characters long.');
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setMessage('Your security password has been changed successfully! Default password 123 has been replaced.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to update password. Initial default password is 123');
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-all";
  const labelCls = "block text-slate-700 font-semibold text-xs mb-1.5";

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <KeyRound className="w-4 h-4 text-blue-600" />
          </div>
          Employee Self-Service Password Management
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Account: <strong className="text-slate-700">{user?.name}</strong> ({user?.email}) &bull; Role: <strong className="text-blue-600">{user?.role}</strong>
        </p>
      </div>

      {/* Info Callout */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-3">
        <Info className="w-5 h-5 text-amber-500 shrink-0" />
        <span>Update your initial default password (<strong className="font-mono">123</strong>) to your own private password.</span>
      </div>

      {/* Change Password Form */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-5">
        {message && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className={labelCls}>Current Password *</label>
              <span className="text-[10px] text-amber-600 font-mono font-semibold">Initial Default: 123</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Initial default password is 123"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className={`${inputCls} pl-9`}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>New Security Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Enter your new secret password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className={`${inputCls} pl-9`}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Confirm New Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className={`${inputCls} pl-9`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer text-sm"
          >
            {loading ? 'Updating Password...' : 'Update Password & Replace Default (123)'}
          </button>
        </form>
      </div>
    </div>
  );
}
