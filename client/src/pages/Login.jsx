import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Key, AlertCircle, Sparkles } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if user logged in
  useEffect(() => {
    if (user) {
      navigate('/chats');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/chats');
    } catch (err) {
      setError(err || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 dark:bg-gray-950 dark:glowing-grid-dark transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 rounded-3xl shadow-xl space-y-6 relative overflow-hidden">
        
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center space-y-2 relative">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
            <Sparkles className="w-3 h-3 mr-1" />
            Welcome Back
          </span>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white">
            Sign In to ChatSphere
          </h2>
          <p className="text-xs text-gray-400 font-medium">
            Enter your email to connect with active users
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-955/15 border border-red-100 dark:border-red-900/30 text-red-500 rounded-xl text-xs flex items-start font-medium animate-pulse">
            <AlertCircle className="w-4.5 h-4.5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Email Address</label>
            <div className="relative">
              <Mail className="w-4.5 h-4.5 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-gray-800 dark:text-gray-300 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Password</label>
            <div className="relative">
              <Lock className="w-4.5 h-4.5 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-gray-800 dark:text-gray-300 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl shadow-violet-600/10 transition-all flex items-center justify-center focus:outline-none"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Quick Logins box */}
        <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-2">
          <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest flex items-center">
            <Key className="w-3.5 h-3.5 mr-1" />
            Quick Demo Logins (Password is user123)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-medium text-gray-500 dark:text-gray-400">
            <div>
              <p className="font-bold text-gray-700 dark:text-gray-200">John Doe (User)</p>
              <p className="truncate">user@chatsphere.com</p>
            </div>
            <div>
              <p className="font-bold text-gray-700 dark:text-gray-200">Alice (Chatbot)</p>
              <p className="truncate">alice@chatsphere.com</p>
            </div>
            <div>
              <p className="font-bold text-gray-700 dark:text-gray-200">Bob (Support)</p>
              <p className="truncate">bob@chatsphere.com</p>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 dark:text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-violet-600 dark:text-violet-400 font-bold hover:underline">
            Register Here
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;
