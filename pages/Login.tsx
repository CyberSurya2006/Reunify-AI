import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Mail, Lock, Loader2, AlertCircle, ArrowRight, Check, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // If user is already logged in, redirect to dashboard or the page they came from
  React.useEffect(() => {
    if (user) {
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
        if (isSignUp) {
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });
            if (signUpError) throw signUpError;
            setMessage("Account created! Please check your email to confirm your registration.");
        } else {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (signInError) throw signInError;
        }
    } catch (err: any) {
        setError(err.message || "An error occurred during authentication.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full animate-[fadeIn_0.5s_ease-out]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-6 shadow-lg shadow-indigo-200">R</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-slate-500">
            {isSignUp ? "Join Reunify to track lost items." : "Sign in to manage your reports and see matches."}
          </p>
        </div>

        {/* Toggle Switch */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button 
                onClick={() => { setIsSignUp(false); setError(null); setMessage(null); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition flex items-center justify-center gap-2 ${!isSignUp ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <LogIn size={16} /> Sign In
            </button>
            <button 
                onClick={() => { setIsSignUp(true); setError(null); setMessage(null); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition flex items-center justify-center gap-2 ${isSignUp ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <UserPlus size={16} /> Sign Up
            </button>
        </div>

        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm flex items-start gap-2 animate-[shake_0.5s_ease-in-out]">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
            <Check size={16} className="mt-0.5 shrink-0" />
            {message}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-slate-400" />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition p-3 text-sm text-slate-900"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-slate-400" />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition p-3 text-sm text-slate-900"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            {isSignUp && <p className="text-xs text-slate-400 mt-1 ml-1">Must be at least 6 characters</p>}
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 mt-6"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                {isSignUp ? 'Create Account' : 'Sign In'}
                {!isSignUp && <ArrowRight size={18} />}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};