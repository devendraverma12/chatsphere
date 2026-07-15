import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-2xl bg-gray-200/70 hover:bg-gray-200/80 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all duration-300 transform active:scale-95 border border-gray-200/50 dark:border-gray-700/50"
      aria-label="Toggle Visual Theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-amber-400 rotate-0 transition-transform duration-500 hover:rotate-45" />
      ) : (
        <Moon className="w-5 h-5 text-violet-600 rotate-0 transition-transform duration-500 hover:-rotate-12" />
      )}
    </button>
  );
};

export default ThemeToggle;
