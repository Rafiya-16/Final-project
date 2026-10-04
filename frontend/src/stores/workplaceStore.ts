// frontend/src/stores/workplaceStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Workplace = 'FACULTY' | 'SUBADMIN';

interface WorkplaceState {
  activeWorkplace: Workplace;
  hasSubadminAccess: boolean;

  setWorkplace: (workplace: Workplace) => void;
  setHasSubadminAccess: (value: boolean) => void;
  resetWorkplace: () => void;
}

export const useWorkplaceStore = create<WorkplaceState>()(
  persist(
    (set) => ({
      activeWorkplace: 'FACULTY',
      hasSubadminAccess: false,

      setWorkplace: (workplace) => {
        set({
          activeWorkplace: workplace,
        });
      },

      setHasSubadminAccess: (value) => {
        set((state) => ({
          hasSubadminAccess: value,

          activeWorkplace: value
            ? state.activeWorkplace
            : 'FACULTY',
        }));
      },

      resetWorkplace: () => {
        set({
          activeWorkplace: 'FACULTY',
          hasSubadminAccess: false,
        });
      },
    }),
    {
      name: 'workplace',
    }
  )
);