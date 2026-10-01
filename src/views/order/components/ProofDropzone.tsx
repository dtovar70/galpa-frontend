import { useEffect, useId, useMemo, useRef, useState, type DragEvent } from 'react'
import { ImageUp, X } from 'lucide-react'

import {
    FIELD_HINT_CLASS,
    FIELD_LABEL_CLASS,
    FIELD_MESSAGE_ERROR_CLASS,
} from '@/components/ui/field.styles'
import { ProofViewer } from '@/components/shared/ProofViewer'
import { OptionalMark } from '@/components/ui'
import { cn } from '@/utils/cn'
import { compressProof } from '@/utils/imageResize'
import { proofProblem } from '@/views/order/schema/payment.schema'

/** "850 KB" / "1,4 MB"; small screenshots no longer read "0 MB". */
function formatFileSize(bytes: number): string {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
    return `${(bytes / 1024 / 1024).toLocaleString('es-VE', { maximumFractionDigits: 1 })} MB`
}

export interface ProofDropzoneProps {
    file: File | null
    onChange: (file: File | null) => void
    error?: string
    disabled?: boolean
}

/** Screenshot picker: drag and drop or tap to choose, with a preview before sending. */
export function ProofDropzone({ file, onChange, error, disabled = false }: ProofDropzoneProps) {
    const inputId = useId()
    const inputRef = useRef<HTMLInputElement>(null)
    const [isOver, setIsOver] = useState(false)
    const [localError, setLocalError] = useState<string | null>(null)
    const [isPreparing, setIsPreparing] = useState(false)
    const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

    // Frees the previous preview when the file changes or the form goes away.
    useEffect(
        () => () => {
            if (preview) URL.revokeObjectURL(preview)
        },
        [preview],
    )

    const choose = async (candidate: File | undefined) => {
        if (!candidate) return
        // The type is checked first; the weight after shrinking (a 6 MB screenshot is fine).
        const typeProblem = proofProblem(candidate, { ignoreSize: true })
        if (typeProblem) {
            setLocalError(typeProblem)
            return
        }
        setLocalError(null)
        setIsPreparing(true)
        try {
            const compressed = await compressProof(candidate)
            const problem = proofProblem(compressed)
            setLocalError(problem)
            if (!problem) onChange(compressed)
        } finally {
            setIsPreparing(false)
        }
    }

    const onDrop = (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault()
        setIsOver(false)
        if (!disabled && !isPreparing) void choose(event.dataTransfer.files[0])
    }

    const message = localError ?? error

    return (
        <div className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL_CLASS}>
                Captura del pago
                <OptionalMark />
            </span>

            {file && preview ? (
                <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3">
                    <ProofViewer src={preview} title="Tu captura del pago" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{file.name}</p>
                        <p className="text-xs text-ink-soft">{formatFileSize(file.size)}</p>
                        <p className="mt-1 text-xs text-ink-soft">Toca la imagen para verla.</p>
                    </div>
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                            onChange(null)
                            if (inputRef.current) inputRef.current.value = ''
                        }}
                        aria-label="Quitar la captura"
                        className="flex size-11 shrink-0 items-center justify-center rounded-full text-ink-soft transition hover:bg-brand-100 hover:text-brand-700"
                    >
                        <X aria-hidden="true" className="size-4" />
                    </button>
                </div>
            ) : (
                <label
                    htmlFor={inputId}
                    onDragOver={(event) => {
                        event.preventDefault()
                        if (!disabled) setIsOver(true)
                    }}
                    onDragLeave={() => setIsOver(false)}
                    onDrop={onDrop}
                    className={cn(
                        'flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition',
                        isOver
                            ? 'border-brand-400 bg-brand-50'
                            : 'border-line bg-white hover:border-brand-200',
                        message && 'border-danger-500',
                        (disabled || isPreparing) && 'cursor-not-allowed opacity-60',
                    )}
                    aria-busy={isPreparing || undefined}
                >
                    <ImageUp aria-hidden="true" className="size-7 text-brand-600" />
                    <span className="text-sm font-semibold text-ink">
                        {isPreparing
                            ? 'Preparando tu captura…'
                            : 'Arrastra la captura aquí o toca para elegirla'}
                    </span>
                    <span className={FIELD_HINT_CLASS}>JPG, PNG o WEBP, hasta 5 MB</span>
                </label>
            )}

            <input
                ref={inputRef}
                id={inputId}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={disabled || isPreparing}
                aria-describedby={message ? `${inputId}-error` : undefined}
                onChange={(event) => void choose(event.target.files?.[0])}
            />

            {message ? (
                <p id={`${inputId}-error`} role="alert" className={FIELD_MESSAGE_ERROR_CLASS}>
                    {message}
                </p>
            ) : (
                <p className={FIELD_HINT_CLASS}>
                    Nos ayuda a confirmar tu pago más rápido. Solo el equipo de la tienda puede
                    verla.
                </p>
            )}
        </div>
    )
}
