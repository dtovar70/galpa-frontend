import {
    useEffect,
    useState,
    type ClipboardEvent,
    type DragEvent,
    type FormEvent,
    type Ref,
} from 'react'
import { ClipboardX } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import { Input } from '@/components/ui'
import { FIELD_HINT_CLASS } from '@/components/ui/field.styles'
import { cn } from '@/utils/cn'
import { RESET_CODE_LENGTH, toResetCode } from '@/views/admin/auth/schema/recovery.schema'

const NO_PASTE_HINT = 'Escribe el código a mano, por seguridad no se puede pegar.'
const NO_PASTE_HINT_MS = 4000

export interface ResetCodeInputProps {
    value: string
    onChange: (value: string) => void
    onBlur?: () => void
    name?: string
    inputRef?: Ref<HTMLInputElement>
    error?: string
}

/**
 * The 6-digit reset code (from Telegram or email). A controlled string (never a number, so
 * leading zeros survive): only digits can go in, a 7th is refused, and it has to be typed by
 * hand: paste, drop, copy and cut are blocked, and a paste or drop attempt shows a short hint
 * that fades.
 */
export function ResetCodeInput({
    value,
    onChange,
    onBlur,
    name,
    inputRef,
    error,
}: ResetCodeInputProps) {
    const reduceMotion = useReducedMotion()
    /** Bumped on every paste/drop attempt (0: hint hidden), which also restarts its timer. */
    const [hintAttempt, setHintAttempt] = useState(0)

    useEffect(() => {
        if (!hintAttempt) return
        const timer = window.setTimeout(() => setHintAttempt(0), NO_PASTE_HINT_MS)
        return () => window.clearTimeout(timer)
    }, [hintAttempt])

    const refuse = (event: ClipboardEvent | DragEvent) => event.preventDefault()
    const refuseWithHint = (event: ClipboardEvent | DragEvent) => {
        event.preventDefault()
        setHintAttempt((attempt) => attempt + 1)
    }

    // Stops a non-digit or a 7th digit before it lands (onChange still filters as a backstop,
    // e.g. for IME compositions, which cannot be cancelled).
    const onBeforeInput = (event: FormEvent<HTMLInputElement>) => {
        const data = (event.nativeEvent as InputEvent).data
        if (data == null) return
        const input = event.currentTarget
        const selected = (input.selectionEnd ?? 0) - (input.selectionStart ?? 0)
        if (
            !/^\d+$/.test(data) ||
            input.value.length - selected + data.length > RESET_CODE_LENGTH
        ) {
            event.preventDefault()
        }
    }

    return (
        <div>
            <Input
                label="Código de 6 dígitos"
                name={name}
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                enterKeyHint="next"
                maxLength={RESET_CODE_LENGTH}
                autoFocus
                placeholder="123456"
                spellCheck={false}
                className="font-mono tracking-[0.3em]"
                value={value}
                onBeforeInput={onBeforeInput}
                onChange={(event) => onChange(toResetCode(event.target.value))}
                onBlur={onBlur}
                onPaste={refuseWithHint}
                onDrop={refuseWithHint}
                onCopy={refuse}
                onCut={refuse}
                error={error}
            />
            <div role="status" aria-live="polite">
                <AnimatePresence initial={false}>
                    {hintAttempt ? (
                        <motion.p
                            key="no-paste"
                            initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                            transition={{ duration: reduceMotion ? 0 : 0.25, ease: 'easeOut' }}
                            className="overflow-hidden"
                        >
                            <span
                                className={cn(
                                    FIELD_HINT_CLASS,
                                    'flex items-center gap-1.5 pt-1.5 font-medium text-brand-700',
                                )}
                            >
                                <ClipboardX aria-hidden="true" className="size-3.5 shrink-0" />
                                {NO_PASTE_HINT}
                            </span>
                        </motion.p>
                    ) : null}
                </AnimatePresence>
            </div>
        </div>
    )
}
