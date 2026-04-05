import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, ImagePlus, AlertTriangle } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useUIStore } from '@/lib/stores/ui.store'
import { useT } from '@/lib/hooks/useT'
import { translations } from '@/lib/i18n'
import { TransactionForm } from '@/components/features/transactions/TransactionForm'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { PageHeader } from '@/components/ui/PageHeader'
import type { ParsedReceipt } from '@/types/app'
import type { Transaction } from '@/types/app'

type Step = 'upload' | 'parsing' | 'result'

export default function Receipt() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { lang } = useUIStore()
  const t = useT()
  const tr = translations[lang]
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('upload')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [parsedReceipt, setParsedReceipt] = useState<ParsedReceipt | null>(null)
  const [receiptId, setReceiptId] = useState<string | null>(null)
  const [parseStep, setParseStep] = useState('')

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error(t('receipt_image_only'))
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('receipt_size_limit'))
      return
    }
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function handleParse() {
    if (!previewUrl || !user) return
    setStep('parsing')

    try {
      setParseStep(t('receipt_uploading'))
      const fileInput = cameraRef.current?.files?.[0] ?? galleryRef.current?.files?.[0]
      if (!fileInput) throw new Error(t('receipt_file_not_found'))

      const ext = fileInput.name.split('.').pop() ?? 'jpg'
      const storagePath = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(storagePath, fileInput, { contentType: fileInput.type })

      if (uploadError) throw uploadError

      setParseStep(t('receipt_analyzing'))
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-receipt`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ storage_path: storagePath }),
        }
      )

      if (!response.ok) {
        const err = await response.json() as { error?: string }
        throw new Error(err.error ?? t('receipt_parse_fail'))
      }

      const result = await response.json() as { receipt: { id: string }; parsed: ParsedReceipt }
      setParsedReceipt(result.parsed)
      setReceiptId(result.receipt.id)
      setStep('result')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('receipt_parse_fail'))
      setStep('upload')
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) handleFile(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    noClick: true,
  })

  const parsedInitialValues: Partial<Transaction> | undefined = parsedReceipt
    ? {
        date: parsedReceipt.date ?? undefined,
        amount: parsedReceipt.total_amount ?? undefined,
        description: parsedReceipt.store_name ?? '',
        payment_method: parsedReceipt.payment_method ?? '크레딧',
        type: '지출',
      }
    : undefined

  return (
    <div className="pb-6">
      <PageHeader title={t('receipt_title')} back />

      {step === 'upload' && (
        <div className="space-y-4 px-4 py-4">
          {/* 드롭존 */}
          <div
            {...getRootProps()}
            className={`relative overflow-hidden rounded-[1.75rem] border-2 border-dashed transition ${
              isDragActive
                ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-900/20'
                : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
            }`}
          >
            <input {...getInputProps()} />
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={t('receipt_preview_alt')}
                className="w-full max-h-80 object-contain bg-slate-100 dark:bg-slate-800"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <ImagePlus className="mb-3 h-12 w-12" />
                <p className="text-sm font-medium">{t('receipt_drop_hint')}</p>
                <p className="mt-1 text-xs text-slate-400">{t('receipt_drop_formats')}</p>
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => cameraRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 py-3 text-sm font-semibold text-white transition active:scale-[0.98] shadow-lg shadow-indigo-500/20"
            >
              <Camera className="h-5 w-5" />
              {t('receipt_camera')}
            </button>
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />

            <button
              onClick={() => galleryRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <ImagePlus className="h-5 w-5" />
              {t('receipt_gallery')}
            </button>
            <input
              ref={galleryRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
          </div>

          {previewUrl && (
            <button
              onClick={handleParse}
              className="btn btn-primary w-full py-4 text-base"
            >
              {t('receipt_parse_btn')}
            </button>
          )}
        </div>
      )}

      {step === 'parsing' && (
        <div className="flex flex-col items-center justify-center gap-4 py-32">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-slate-500">{parseStep}</p>
        </div>
      )}

      {step === 'result' && parsedReceipt && (
        <div>
          {parsedReceipt.confidence < 0.7 && (
            <div className="mx-4 mt-4 flex items-center gap-2 rounded-3xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              {tr.receipt_low_confidence(Math.round(parsedReceipt.confidence * 100))}
            </div>
          )}
          <TransactionForm initialValues={parsedInitialValues} receiptId={receiptId ?? undefined} />
        </div>
      )}
    </div>
  )
}
