// frontend/src/stores/themeStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;

  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // Light mode is the default
      theme: 'light',

      toggleTheme: () => {
        const current = get().theme;

        const next: Theme =
          current === 'dark' ? 'light' : 'dark';

        applyTheme(next);

        set({
          theme: next,
        });
      },

      setTheme: (theme: Theme) => {
        applyTheme(theme);

        set({
          theme,
        });
      },
    }),
    {
      name: 'projectalloc-theme',

      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme);
        }
      },
    }
  )
);