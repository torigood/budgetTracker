import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/lib/hooks/useCategories'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { PageHeader } from '@/components/ui/PageHeader'
import { CATEGORY_COLORS } from '@/types/app'
import { useT } from '@/lib/hooks/useT'

interface CategoryFormData {
  name: string
  color: string
  icon: string
}

const CATEGORY_ICON_PRESETS = [
  '⌂', '⌁', '☰', '☕︎', '✿', '✎', '✈︎', '✉︎',
  '☎︎', '♨︎', '⚑', '⚙︎', '⚕︎', '⚖︎', '♿︎', '♻︎',
  '♡', '♪', '⚽︎', '☘︎', '☀︎', '☾', '⌚︎', '⚡︎',
] as const

export default function SettingsCategories() {
  const t = useT()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: categories, isLoading } = useCategories()
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()

  const [editing, setEditing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<CategoryFormData>({ name: '', color: CATEGORY_COLORS[0], icon: '' })

  function openCreate() {
    setEditing(null)
    setForm({ name: '', color: CATEGORY_COLORS[0], icon: '' })
    setShowForm(true)
  }

  function openEdit(id: string) {
    const cat = categories?.find((c) => c.id === id)
    if (!cat) return
    const rawIcon = cat.icon?.trim() ?? ''
    setEditing(id)
    setForm({
      name: cat.name,
      color: cat.color,
      icon: rawIcon && !/^[a-z0-9_-]+$/i.test(rawIcon) ? rawIcon : '',
    })
    setShowForm(true)
  }

  useEffect(() => {
    if (searchParams.get('new') !== '1') return
    openCreate()
    const next = new URLSearchParams(searchParams)
    next.delete('new')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    const payload = { ...form, icon: form.icon.trim() }
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing, data: payload })
        toast.success(t('categories_updated'))
      } else {
        await createMutation.mutateAsync({ ...payload, sort_order: (categories?.length ?? 0) + 1 })
        toast.success(t('categories_added'))
      }
      setShowForm(false)
    } catch {
      toast.error(t('save'))
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success(t('categories_deleted'))
    } catch {
      toast.error(t('categories_delete_fail'))
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div>
      <PageHeader
        title={t('categories_title')}
        back
        action={
          <button
            onClick={openCreate}
            className="tap-target flex h-11 w-11 items-center justify-center rounded-xl bg-[#0d8a7a] text-white shadow-sm shadow-[#0d8a7a]/25 hover:bg-[#0a7568] transition active:scale-95"
            aria-label={t('categories_add')}
          >
            <Plus className="h-5 w-5" />
          </button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : (
        <div className="m-4 card divide-y divide-slate-100 dark:divide-slate-800">
          {categories?.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3 px-4 py-3.5">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: cat.color }}
              >
                {(() => {
                  const rawIcon = cat.icon?.trim() ?? ''
                  return rawIcon && !/^[a-z0-9_-]+$/i.test(rawIcon) ? rawIcon : (cat.name[0] || '?')
                })()}
              </span>
              <span className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100">{cat.name}</span>
              {cat.is_default && (
                <span className="text-xs text-slate-400 mr-1">{t('categories_default')}</span>
              )}
              <button
                onClick={() => openEdit(cat.id)}
                className="p-2 rounded-lg text-slate-400 hover:bg-[#dbefeb] dark:hover:bg-[#0d8a7a]/20 hover:text-[#0d8a7a] transition"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              {!cat.is_default && (
                <button
                  onClick={() => setDeleteId(cat.id)}
                  className="p-2 rounded-lg text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-500 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 카테고리 폼 시트 */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center pb-[calc(7.25rem+env(safe-area-inset-bottom))] sm:items-center sm:pb-0"
          onClick={() => setShowForm(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-5 text-base font-bold text-slate-900 dark:text-white">
              {editing ? t('categories_edit_title') : t('categories_add_title')}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="mb-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">아이콘 선택</p>
                <div className="grid grid-cols-8 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, icon: '' })}
                    className={`rounded-xl border px-1 py-2 text-[11px] font-semibold transition ${
                      !form.icon ? 'border-[#0d8a7a] bg-[#dbefeb] text-[#0d8a7a]' : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    없음
                  </button>
                  {CATEGORY_ICON_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setForm({ ...form, icon: preset })}
                      className={`flex h-9 items-center justify-center rounded-xl border text-lg transition ${
                        form.icon === preset
                          ? 'border-[#0d8a7a] bg-[#dbefeb]'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                      aria-label={`icon-${preset}`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t('categories_name_placeholder')}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-[#0d8a7a] focus:ring-2 focus:ring-[#0d8a7a]/10 transition"
              />
              <div>
                <p className="mb-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('categories_color')}</p>
                <div className="grid grid-cols-9 gap-2">
                  {CATEGORY_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      className={`h-7 w-7 rounded-full transition-transform ${form.color === color ? 'ring-2 ring-offset-2 ring-[#0d8a7a] scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#0d8a7a] py-3 text-sm font-semibold text-white hover:bg-[#0a7568] transition"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title={t('categories_delete_confirm')}
        description={t('categories_delete_desc')}
        confirmLabel={t('delete')}
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
