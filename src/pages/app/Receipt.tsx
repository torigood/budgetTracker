import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, ImagePlus, AlertTriangle, ChevronLeft } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/stores/auth.store'
import { TransactionForm } from '@/components/features/transactions/TransactionForm'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { ParsedReceipt } from '@/types/app'
import type { Transaction } from '@/types/app'

type Step = 'upload' | 'parsing' | 'result'

export default function Receipt() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('upload')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [parsedReceipt, setParsedReceipt] = useState<ParsedReceipt | null>(null)
  const [receiptId, setReceiptId] = useState<string | null>(null)
  const [parseStep, setParseStep] = useState('')

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('10MB 이하 파일만 업로드 가능합니다')
      return
    }
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function handleParse() {
    if (!previewUrl || !user) return
    setStep('parsing')

    try {
      // Storage 업로드
      setParseStep('업로드 중...')
      const fileInput = cameraRef.current?.files?.[0] ?? galleryRef.current?.files?.[0]
      if (!fileInput) throw new Error('파일을 찾을 수 없습니다')

      const ext = fileInput.name.split('.').pop() ?? 'jpg'
      const storagePath = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(storagePath, fileInput, { contentType: fileInput.type })

      if (uploadError) throw uploadError

      // Edge Function 호출
      setParseStep('AI 분석 중...')
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
        throw new Error(err.error ?? '파싱 실패')
      }

      const result = await response.json() as { receipt: { id: string }; parsed: ParsedReceipt }
      setParsedReceipt(result.parsed)
      setReceiptId(result.receipt.id)
      setStep('result')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '파싱 실패')
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
    <div>
      <header className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-gray-500">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">영수증 촬영</h1>
      </header>

      {step === 'upload' && (
        <div className="p-4 space-y-4">
          {/* 이미지 미리보기 or 드롭존 */}
          <div
            {...getRootProps()}
            className={`relative rounded-2xl overflow-hidden border-2 border-dashed transition ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <input {...getInputProps()} />
            {previewUrl ? (
              <img src={previewUrl} alt="영수증 미리보기" className="w-full max-h-80 object-contain bg-gray-100" />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <ImagePlus className="mb-3 h-12 w-12" />
                <p className="text-sm font-medium">이미지를 드래그하거나 버튼을 누르세요</p>
                <p className="mt-1 text-xs">JPG, PNG 지원 · 최대 10MB</p>
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="grid grid-cols-2 gap-3">
            {/* 모바일: 카메라 */}
            <button
              onClick={() => cameraRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-500 py-3 text-sm font-medium text-white active:bg-blue-600"
            >
              <Camera className="h-5 w-5" />
              카메라 촬영
            </button>
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />

            {/* 갤러리 */}
            <button
              onClick={() => galleryRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              <ImagePlus className="h-5 w-5" />
              갤러리 선택
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
              className="w-full rounded-xl bg-blue-500 py-4 text-base font-semibold text-white active:bg-blue-600"
            >
              AI 파싱 시작
            </button>
          )}
        </div>
      )}

      {step === 'parsing' && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-500">{parseStep}</p>
        </div>
      )}

      {step === 'result' && parsedReceipt && (
        <div>
          {parsedReceipt.confidence < 0.7 && (
            <div className="mx-4 mt-4 flex items-center gap-2 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              인식 신뢰도가 낮습니다. 내용을 꼭 확인해주세요. (신뢰도 {Math.round(parsedReceipt.confidence * 100)}%)
            </div>
          )}
          <TransactionForm initialValues={parsedInitialValues} receiptId={receiptId ?? undefined} />
        </div>
      )}
    </div>
  )
}
