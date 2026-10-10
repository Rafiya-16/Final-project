// frontend/src/components/ui/ThemeToggle.tsx

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';

interface Props {
  variant?: 'nav' | 'dashboard';
}

export const ThemeToggle: React.FC<Props> = ({
  variant = 'nav',
}) => {
  const { theme, toggleTheme } = useThemeStore();

  const isDark = theme === 'dark';

  if (variant === 'dashboard') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="
          group relative
          flex items-center gap-2
          px-3 py-2
          rounded-xl
          border
          border-cream-300 dark:border-slate-700
          bg-white/80 dark:bg-slate-700/80
          text-stone-600 dark:text-slate-300
          shadow-sm
          hover:shadow-md
          hover:-translate-y-0.5
          hover:bg-cream-100
          dark:hover:bg-slate-600
          transition-all duration-300
        "
      >
        <span
          className="
            flex items-center justify-center
            w-7 h-7
            rounded-lg
            bg-cream-100 dark:bg-slate-800
            group-hover:scale-110
            transition-transform duration-300
          "
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-500" />
          )}
        </span>

        <span className="hidden sm:block text-xs font-semibold">
          {isDark ? 'Light' : 'Dark'}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="
        group
        flex items-center justify-center
        w-10 h-10
        rounded-xl
        bg-cream-100 dark:bg-white/10
        border border-cream-300 dark:border-white/10
        text-stone-600 dark:text-slate-300
        hover:bg-cream-200 dark:hover:bg-white/20
        hover:text-stone-900 dark:hover:text-white
        hover:-translate-y-0.5
        shadow-sm hover:shadow-md
        transition-all duration-300
      "
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-500 group-hover:rotate-45 transition-transform duration-300" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-500 group-hover:-rotate-12 transition-transform duration-300" />
      )}
    </button>
  );
};

export default ThemeToggle;