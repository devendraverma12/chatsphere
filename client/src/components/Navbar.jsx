import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { MessageSquareCode, User as UserIcon, LogOut, Menu, X, Settings as SettingsIcon, MessageSquare } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setDropOpen(false);
    setMobileOpen(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  // Do not show full navbar on ChatDashboard to preserve maximum workspace height/width for chats!
  // This is a premium UX choice: dashboards should be edge-to-edge.
  if (isActive('/chats')) {
    return null;
  }

  const linkStyle = (path) =>
    `px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
      isActive(path)
        ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/15'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`;

  const mobileLinkStyle = (path) =>
    `block px-4 py-3 rounded-xl text-base font-semibold transition-all duration-200 ${
      isActive(path)
        ? 'bg-violet-600 text-white shadow-md shadow-violet-600/10'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`;

  return (
    <nav className="sticky top-0 z-50 glassmorphism dark:glassmorphism-dark border-b border-gray-200/50 dark:border-gray-800/50 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/20 transform group-hover:scale-105 transition-transform duration-200">
                <MessageSquareCode className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                ChatSphere
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-2">
            <Link to="/" className={linkStyle('/')}>Home</Link>
            {user && (
              <Link to="/chats" className={linkStyle('/chats')}>
                Chat Dashboard
              </Link>
            )}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropOpen(!dropOpen)}
                  className="flex items-center space-x-2.5 p-1.5 pr-3.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
                >
                  <img
                    src={user.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-violet-500/20"
                  />
                  <div className="text-left leading-tight hidden lg:block">
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-300">{user.name}</p>
                    <p className="text-[10px] text-emerald-500 font-bold flex items-center">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1"></span>
                      Online
                    </p>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {dropOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 py-1 ring-1 ring-black ring-opacity-5 focus:outline-none transition-all">
                    <Link
                      to="/chats"
                      onClick={() => setDropOpen(false)}
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 mr-2.5 text-gray-400" />
                      Chat Dashboard
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setDropOpen(false)}
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 mr-2.5 text-gray-400" />
                      My Profile
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setDropOpen(false)}
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <SettingsIcon className="w-4 h-4 mr-2.5 text-gray-400" />
                      Settings
                    </Link>
                    <hr className="border-gray-100 dark:border-gray-700 my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors font-semibold"
                    >
                      <LogOut className="w-4 h-4 mr-2.5 text-red-500" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-md hover:shadow-lg shadow-violet-600/10 transition-all duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden glassmorphism dark:glassmorphism-dark border-b border-gray-200/50 dark:border-gray-800/50 py-3 px-4 space-y-1.5">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className={mobileLinkStyle('/')}
          >
            Home
          </Link>
          {user && (
            <Link
              to="/chats"
              onClick={() => setMobileOpen(false)}
              className={mobileLinkStyle('/chats')}
            >
              Chat Dashboard
            </Link>
          )}

          <hr className="border-gray-300 dark:border-gray-700 my-2" />

          {user ? (
            <div className="space-y-1">
              <div className="flex items-center px-4 py-2 space-x-3 mb-2">
                <img
                  src={user.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-violet-500/20"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-300">{user.name}</p>
                  <p className="text-xs text-emerald-500 font-bold">Online</p>
                </div>
              </div>
              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center w-full px-4 py-3 rounded-lg text-base font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <UserIcon className="w-5 h-5 mr-3 text-gray-400" />
                My Profile
              </Link>
              <Link
                to="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center w-full px-4 py-3 rounded-lg text-base font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <SettingsIcon className="w-5 h-5 mr-3 text-gray-400" />
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 rounded-lg text-base font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                <LogOut className="w-5 h-5 mr-3 text-red-500" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-2 px-2">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex justify-center items-center px-4 py-2.5 text-base font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="flex justify-center items-center px-4 py-2.5 text-base font-semibold text-white bg-violet-600 rounded-xl shadow-md"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
