import { useUIStore } from '@/lib/stores/ui.store'
import { translations, type TranslationFn, type TranslationReturn } from '@/lib/i18n'

export function useT(): TranslationFn {
  const { lang } = useUIStore()
  const t = translations[lang]

  return (<K extends keyof typeof t>(key: K) => {
    const val = t[key]
    if (typeof val === 'function') return val as unknown as TranslationReturn<K & keyof typeof t>
    return String(val) as unknown as TranslationReturn<K & keyof typeof t>
  }) as TranslationFn
}
