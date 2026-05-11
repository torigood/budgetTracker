import { useUIStore } from '@/lib/stores/ui.store'
import { translations, type TranslationKey } from '@/lib/i18n'

type TranslationValue<K extends TranslationKey> = (typeof translations)['ko'][K]

export function useT() {
  const { lang } = useUIStore()
  const t = translations[lang]

  return <K extends TranslationKey>(key: K): TranslationValue<K> => t[key] as TranslationValue<K>
}
