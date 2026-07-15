import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MessageSquareCode, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 dark:bg-gray-900 dark:glowing-grid-dark transition-colors duration-300 py-12 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-violet-600/10">
          <MessageSquareCode className="w-8 h-8 animate-bounce" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
            <Sparkles className="w-3 h-3 mr-1" />
            Error 404
          </span>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white">Page Not Found</h2>
          <p className="text-xs text-gray-400 font-light max-w-xs mx-auto">
            The page you are looking for does not exist or has been moved. Use the options below to resume chatting.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link
            to="/chats"
            className="px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow shadow-violet-600/10 transition-colors flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Go to Chats
          </Link>
          <Link
            to="/"
            className="px-5 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl transition-all"
          >
            Home Landing
          </Link>
        </div>

      </div>
    </div>
  );
};

export default NotFound;
