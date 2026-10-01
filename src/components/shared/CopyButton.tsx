import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'

import { cn } from '@/utils/cn'
import { copyText } from '@/utils/clipboard'

const COPIED_MS = 1800

export interface CopyButtonProps {
    /** Text put on the clipboard. */
    value: string
    /** Accessible name, e.g. "Copiar teléfono". */
    label: string
    /** Visible text; icon-only when omitted. */
    children?: string
    className?: string
}

/** Copies `value` and confirms with a check mark (announced to screen readers). */
export function CopyButton({ value, label, children, className }: CopyButtonProps) {
    const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
    const timer = useRef(0)

    useEffect(() => () => window.clearTimeout(timer.current), [])

    const handleCopy = async () => {
        const copied = await copyText(value)
        setState(copied ? 'copied' : 'failed')
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => setState('idle'), COPIED_MS)
    }

    const Icon = state === 'copied' ? Check : Copy
    return (
        <button
            type="button"
            onClick={() => void handleCopy()}
            aria-label={children ? undefined : label}
            className={cn(
                // The pseudo-element grows the 36px button to a 44px hit area without a bigger look.
                "relative inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition after:absolute after:-inset-1 after:content-[''] focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:ring-offset-2",
                children
                    ? 'h-9 border-2 border-ink/10 bg-white px-3.5 text-ink hover:border-ink/20'
                    : 'size-9 text-ink-soft hover:bg-blush-100 hover:text-blush-700',
                state === 'copied' && 'border-mint-400 text-ink',
                className,
            )}
        >
            <Icon aria-hidden="true" className="size-4" />
            {children ? (state === 'copied' ? 'Copiado' : children) : null}
            <span role="status" aria-live="polite" className="sr-only">
                {state === 'copied' ? 'Copiado' : state === 'failed' ? 'No se pudo copiar' : ''}
            </span>
        </button>
    )
}
