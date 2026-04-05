import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, Trash2, Edit2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/lib/hooks/useCategories'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { CATEGORY_COLORS } from '@/types/app'

interface CategoryFormData {
  name: string
  color: string
  icon: string
}

export default function SettingsCategories() {
  const navigate = useNavigate()
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
        toast.success('카테고리가 수정됐습니다')
      } else {
        await createMutation.mutateAsync({ ...form, sort_order: (categories?.length ?? 0) + 1 })
        toast.success('카테고리가 추가됐습니다')
      }
      setShowForm(false)
    } catch {
      toast.error('저장 실패')
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('카테고리가 삭제됐습니다')
    } catch {
      toast.error('삭제 실패. 이 카테고리로 기록된 거래가 있을 수 있습니다.')
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div>
      <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-500">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">카테고리 관리</h1>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1 rounded-xl bg-blue-500 px-3 py-1.5 text-sm font-medium text-white">
          <Plus className="h-4 w-4" /> 추가
        </button>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
          {categories?.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3 px-4 py-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-base font-bold text-white shrink-0"
                style={{ backgroundColor: cat.color }}
              >
                {cat.name[0]}
              </span>
              <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{cat.name}</span>
              {cat.is_default && (
                <span className="text-xs text-gray-400 mr-1">기본</span>
              )}
              <button onClick={() => openEdit(cat.id)} className="p-2 text-gray-400 hover:text-blue-500">
                <Edit2 className="h-4 w-4" />
              </button>
              {!cat.is_default && (
                <button onClick={() => setDeleteId(cat.id)} className="p-2 text-gray-400 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 카테고리 폼 시트 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative z-10 w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-white dark:bg-gray-800 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-white">
              {editing ? '카테고리 수정' : '카테고리 추가'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="카테고리 이름"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
              <div>
                <p className="mb-2 text-xs font-medium text-gray-500">색상</p>
                <div className="grid grid-cols-9 gap-2">
                  {CATEGORY_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      className={`h-7 w-7 rounded-full transition ${form.color === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 text-sm font-medium text-gray-600">취소</button>
                <button type="submit" className="flex-1 rounded-xl bg-blue-500 py-2.5 text-sm font-medium text-white">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="카테고리를 삭제할까요?"
        description="이 카테고리로 기록된 거래가 있으면 삭제할 수 없습니다."
        confirmLabel="삭제"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
