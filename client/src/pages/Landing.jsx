import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Shield, Zap, Sparkles, Smile, ArrowRight, Code } from 'lucide-react';

const Landing = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950 dark:glowing-grid-dark transition-colors duration-300">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-violet-500/10 to-fuchsia-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center space-y-8">
          <div className="space-y-4 max-w-3xl mx-auto">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200/50 dark:border-violet-850/50">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-violet-500" />
              Next-Gen Messaging Platform
            </span>
            
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-gray-900 dark:text-white leading-none">
              Real-Time Chats Made{' '}
              <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                Stunning & Simple
              </span>
            </h1>
            
            <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 font-light max-w-xl mx-auto leading-relaxed">
              Connect with peers instantly, build group channels, search messages instantly, check seen receipts, and exchange images and files on a glowing glassmorphic interface.
            </p>
          </div>

          <div className="flex justify-center pt-2">
            {user ? (
              <Link
                to="/chats"
                className="px-6 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl shadow-violet-600/10 transform active:scale-98 transition-all flex items-center"
              >
                Go to Chat Dashboard
                <ArrowRight className="w-4.5 h-4.5 ml-2" />
              </Link>
            ) : (
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to="/register"
                  className="px-6 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl shadow-violet-600/10 transform active:scale-98 transition-all flex items-center"
                >
                  Create Free Account
                  <ArrowRight className="w-4.5 h-4.5 ml-2" />
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-3.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-bold text-sm rounded-xl border border-gray-300 dark:border-gray-800 hover:border-violet-500/50 shadow-sm transition-all"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8 border-t border-gray-200 dark:border-gray-900">
        <h2 className="text-2xl font-black text-center text-gray-900 dark:text-white mb-10">
          Supercharged Messaging Capabilities
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Real-Time WebSocket Engine</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-light leading-relaxed">
              Powered by Socket.io, messages fly instantly between users. Includes active typing signals and live online indicators.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-955/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Seen Receipts & Logs</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-light leading-relaxed">
              Keep track of read states. Double blue checks notify you immediately when your peer has seen the message.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-500 flex items-center justify-center">
              <Smile className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Attachment & Emojis Hub</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-light leading-relaxed">
              Send screenshots, photos, files, and tap onto emoji inputs to express yourself freely.
            </p>
          </div>
        </div>
      </section>

      {/* Database Fallback Callout */}
      <section className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-700 dark:from-violet-900 dark:to-indigo-950 p-8 sm:p-10 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl text-left">
            <h3 className="text-2xl font-black text-white">No Database Setup Required!</h3>
            <p className="text-xs text-violet-100 font-light leading-relaxed">
              ChatSphere automatically falls back to an internal local JSON database if MongoDB is down. It pre-seeds interactive chatbot profiles (Alice & Bob) who reply dynamically to your messages. Testing real-time messaging has never been this easy!
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link
              to="/login"
              className="px-5 py-3 bg-white text-violet-700 font-bold text-xs rounded-xl shadow shadow-black/10 hover:bg-violet-50 transition-all flex items-center"
            >
              Sign In Now
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Landing;
