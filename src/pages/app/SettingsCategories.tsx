import { useState } from 'react'
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

export default function SettingsCategories() {
  const t = useT()
  const { data: categories, isLoading } = useCategories()
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()

  const [editing, setEditing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<CategoryFormData>({ name: '', color: CATEGORY_COLORS[0], icon: 'tag' })

  function openCreate() {
    setEditing(null)
    setForm({ name: '', color: CATEGORY_COLORS[0], icon: 'tag' })
    setShowForm(true)
  }

  function openEdit(id: string) {
    const cat = categories?.find((c) => c.id === id)
    if (!cat) return
    setEditing(id)
    setForm({ name: cat.name, color: cat.color, icon: cat.icon })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing, data: form })
        toast.success(t('categories_updated'))
      } else {
        await createMutation.mutateAsync({ ...form, sort_order: (categories?.length ?? 0) + 1 })
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
            className="tap-target flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-sm shadow-indigo-500/25 hover:bg-indigo-600 transition active:scale-95"
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
                {cat.name[0]}
              </span>
              <span className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100">{cat.name}</span>
              {cat.is_default && (
                <span className="text-xs text-slate-400 mr-1">{t('categories_default')}</span>
              )}
              <button
                onClick={() => openEdit(cat.id)}
                className="p-2 rounded-lg text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-500 transition"
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
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t('categories_name_placeholder')}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition"
              />
              <div>
                <p className="mb-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('categories_color')}</p>
                <div className="grid grid-cols-9 gap-2">
                  {CATEGORY_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      className={`h-7 w-7 rounded-full transition-transform ${form.color === color ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'}`}
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
                  className="flex-1 rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white hover:bg-indigo-600 transition"
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
