import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Volume2, Bell, Shield, Sparkles, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Settings = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('soundAlerts') !== 'false';
  });

  const [pushEnabled, setPushEnabled] = useState(() => {
    return localStorage.getItem('pushAlerts') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('soundAlerts', soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('pushAlerts', pushEnabled);
  }, [pushEnabled]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900 dark:glowing-grid-dark transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 rounded-3xl shadow-xl space-y-6 relative">
        
        {/* Back Link */}
        <button
          onClick={() => navigate('/chats')}
          className="flex items-center text-xs font-bold text-gray-500 hover:text-violet-600 transition-colors focus:outline-none"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </button>

        <div className="text-center space-y-2 relative">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Workspace Prefs
          </span>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white">Settings</h2>
          <p className="text-xs text-gray-400 font-medium">Personalize sound alerts and UI designs</p>
        </div>

        <div className="space-y-4">
          
          {/* 1. Theme toggle row */}
          <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center space-x-3 text-left">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-violet-500" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <h4 className="text-xs font-bold text-gray-800 dark:text-white">Visual Interface Theme</h4>
                <p className="text-[10px] text-gray-400">Toggle dark mode glow layouts</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-[10px] rounded-xl transition-all"
            >
              Switch Theme
            </button>
          </div>

          {/* 2. Sound notification */}
          <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center space-x-3 text-left">
              <Volume2 className="w-5 h-5 text-violet-500" />
              <div>
                <h4 className="text-xs font-bold text-gray-800 dark:text-white">Sound Alerts</h4>
                <p className="text-[10px] text-gray-400">Play a sound on new incoming message</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={() => setSoundEnabled(!soundEnabled)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
            </label>
          </div>

          {/* 3. Push notifications */}
          <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center space-x-3 text-left">
              <Bell className="w-5 h-5 text-violet-500" />
              <div>
                <h4 className="text-xs font-bold text-gray-800 dark:text-white">Desktop Notifications</h4>
                <p className="text-[10px] text-gray-400">Show notification alerts in tab banner</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={pushEnabled}
                onChange={() => setPushEnabled(!pushEnabled)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
            </label>
          </div>

          {/* 4. Support and security info */}
          <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center space-x-3 text-left">
              <Shield className="w-5 h-5 text-violet-500" />
              <div>
                <h4 className="text-xs font-bold text-gray-800 dark:text-white">Connection Privacy</h4>
                <p className="text-[10px] text-gray-400">Secure WebSocket communication protocols</p>
              </div>
            </div>
            <span className="px-2 py-1 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-[9px] font-bold">
              SSL SECURED
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Settings;
