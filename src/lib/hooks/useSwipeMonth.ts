import { useRef } from 'react'

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function useSwipeMonth(
  selectedMonth: string,
  setSelectedMonth: (month: string) => void,
  threshold = 50
) {
  const touchStartX = useRef<number | null>(null)

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) < threshold) return
    setSelectedMonth(shiftMonth(selectedMonth, diff > 0 ? 1 : -1))
    touchStartX.current = null
  }

  return { onTouchStart, onTouchEnd }
}
