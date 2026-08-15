import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { Eye, EyeOff, LogIn, Loader2, GraduationCap, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/types';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { accessToken, user } = await authService.login(email, password);
      setAuth(user, accessToken);
      toast.success(`Welcome, ${user.firstName}!`);
      navigate('/dashboard');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 dark:bg-slate-950 dark:from-slate-950 dark:to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-200/40 dark:bg-blue-600/15 rounded-full blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-violet-200/40 dark:bg-violet-600/15 rounded-full blur-[120px] animate-pulse-glow delay-700" />
      <div className="absolute inset-0 opacity-0 dark:opacity-100 bg-[linear-gradient(rgba(255,255,255,.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.015)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative z-10 w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-stone-500 dark:text-slate-500 hover:text-stone-800 dark:hover:text-white mb-8 transition-colors animate-fade-in-down">
          <ArrowLeft className="w-4 h-4" />Back to Home
        </Link>

        <div className="bg-cream-50 dark:bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-cream-300 dark:border-white/10 p-8 shadow-2xl shadow-amber-200/30 dark:shadow-black/20 animate-scale-in">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-stone-800 dark:text-white">Welcome Back</h1>
            <p className="text-stone-500 dark:text-slate-400 mt-1.5 text-sm">Sign in to your ProjectAlloc account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-slate-300 mb-2">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-4 py-3 bg-cream-200 dark:bg-white/5 border border-cream-300 dark:border-white/10 rounded-xl text-stone-800 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all"
                placeholder="you@iul.ac.in" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-slate-300 mb-2">Password</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full px-4 py-3 bg-cream-200 dark:bg-white/5 border border-cream-300 dark:border-white/10 rounded-xl text-stone-800 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none pr-11 transition-all"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-slate-500 hover:text-stone-700 dark:hover:text-white transition-colors">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-violet-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-violet-700 disabled:from-cream-300 disabled:to-cream-300 dark:disabled:from-slate-700 dark:disabled:to-slate-700 disabled:text-stone-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-cream-200 dark:bg-white/[0.03] border border-cream-300 dark:border-white/5 rounded-xl">
            <p className="text-xs text-stone-500 dark:text-slate-500 font-medium mb-2">Demo credentials:</p>
            <div className="text-xs text-stone-600 dark:text-slate-400 space-y-1 font-mono">
              <p>Admin: admin@iul.ac.in / Admin@123456</p>
              <p>SubAdmin: subadmin@iul.ac.in / Subadmin@123456</p>
              <p>Faculty: faculty@iul.ac.in / Faculty@123456</p>
              <p>Student: student@iul.ac.in / Student@123456</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;