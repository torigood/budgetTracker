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
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const ignoreSwipe = useRef(false)

  const onTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement | null
    if (target?.closest('[data-swipe-month-ignore="true"]')) {
      ignoreSwipe.current = true
      touchStart.current = null
      return
    }
    ignoreSwipe.current = false
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (ignoreSwipe.current) {
      ignoreSwipe.current = false
      return
    }
    if (!touchStart.current) return
    const dx = touchStart.current.x - e.changedTouches[0].clientX
    const dy = touchStart.current.y - e.changedTouches[0].clientY
    touchStart.current = null
    // Ignore if vertical movement is dominant (user is scrolling)
    if (Math.abs(dy) > Math.abs(dx)) return
    if (Math.abs(dx) < threshold) return
    setSelectedMonth(shiftMonth(selectedMonth, dx > 0 ? 1 : -1))
  }

  return { onTouchStart, onTouchEnd }
}
