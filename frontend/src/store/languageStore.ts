import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import ru from '@/locales/ru.json'
import kk from '@/locales/kk.json'

type Language = 'ru' | 'kk'
type Translations = typeof ru

const translations: Record<Language, Translations> = { ru, kk }

interface LanguageState {
  language: Language
  setLanguage: (lang: Language) => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'ru',
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export const useTranslations = () => {
  const language = useLanguageStore((state) => state.language)
  return translations[language]
}
