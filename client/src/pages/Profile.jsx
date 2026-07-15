import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User as UserIcon, Lock, Sparkles, CheckCircle2, ChevronLeft } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [photo, setPhoto] = useState(user?.profilePhoto || '');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setLoading(true);

    try {
      const updates = { name, profilePhoto: photo };
      if (password) {
        updates.password = password;
      }

      await updateProfile(updates);
      setSuccess('Profile updated successfully.');
      setPassword('');
    } catch (err) {
      setError(err || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950 dark:glowing-grid-dark transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 rounded-3xl shadow-xl space-y-6 relative">
        
        {/* Back Link */}
        <button
          onClick={() => navigate('/chats')}
          className="flex items-center text-xs font-bold text-gray-500 hover:text-violet-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </button>

        <div className="text-center space-y-2 relative">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Manage Account
          </span>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white">Profile Settings</h2>
          <p className="text-xs text-gray-400 font-medium">Update your name, picture URL, and password</p>
        </div>

        {success && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-500 rounded-xl text-xs flex items-center font-semibold">
            <CheckCircle2 className="w-4.5 h-4.5 mr-2" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-955/15 border border-red-100 dark:border-red-900/30 text-red-500 rounded-xl text-xs flex items-center font-semibold">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center py-2 space-y-2">
            <img
              src={photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
              alt="Preview"
              className="w-20 h-20 rounded-full object-cover ring-4 ring-violet-500/20 shadow-md"
            />
            <span className="text-[10px] font-bold text-gray-400">Profile Photo Preview</span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Display Name</label>
            <div className="relative">
              <UserIcon className="w-4.5 h-4.5 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Avatar Image URL</label>
            <input
              type="url"
              value={photo}
              onChange={(e) => setPhoto(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Change Password (Optional)</label>
            <div className="relative">
              <Lock className="w-4.5 h-4.5 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                minLength="6"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-gray-800 dark:text-gray-300 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none animate-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center focus:outline-none"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : null}
            Save Settings
          </button>
        </form>

      </div>
    </div>
  );
};

export default Profile;
