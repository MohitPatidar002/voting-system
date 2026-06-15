import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language } from '../i18n/translations';

interface AppState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      language: 'hi', // Default to Hindi as per request
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'village-app-storage',
    }
  )
);
