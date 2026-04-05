import { useUIStore } from '@/lib/stores/ui.store'
import { translations, type TranslationKey } from '@/lib/i18n'

export function useT() {
  const { lang } = useUIStore()
  const t = translations[lang]

  return (key: TranslationKey) => {
    const val = t[key as keyof typeof t]
    if (typeof val === 'function') return val as never
    return val as string
  }
}
