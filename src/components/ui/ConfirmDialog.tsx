interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center px-4 pb-[calc(7.25rem+env(safe-area-inset-bottom))] sm:items-center sm:pb-0"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        {description && (
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        )}
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition active:scale-[0.98] ${
              danger
                ? 'bg-rose-500 hover:bg-rose-600'
                : 'bg-indigo-500 hover:bg-indigo-600'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
