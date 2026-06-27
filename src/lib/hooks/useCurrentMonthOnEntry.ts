import { useEffect } from 'react'
import { getCurrentMonth } from '@/utils/format'

export function useCurrentMonthOnEntry(setMonth: (month: string) => void) {
  useEffect(() => {
    setMonth(getCurrentMonth())
  }, [setMonth])
}
