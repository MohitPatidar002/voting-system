import { useAppStore } from '../store/useAppStore';
import { translations } from '../i18n/translations';

export const useTranslation = () => {
  const language = useAppStore((state) => state.language);
  const t = (key: keyof typeof translations['en']) => translations[language][key];
  return { t, language };
};
