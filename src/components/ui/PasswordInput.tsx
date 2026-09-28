import { useCallback, useLayoutEffect, useRef, useState, type Ref } from 'react'

import { AnimatedEyeToggle } from '@/components/ui/AnimatedEyeToggle'
import { Input, type InputProps } from '@/components/ui/Input'
import { cn } from '@/utils/cn'

export interface PasswordInputProps extends Omit<InputProps, 'type' | 'trailingAction'> {
    /** Controlled visibility; leave out to let the input keep its own. */
    visible?: boolean
    onVisibleChange?: (visible: boolean) => void
}

type Selection = [
    start: number | null,
    end: number | null,
    direction: 'forward' | 'backward' | 'none' | null,
]

function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
}

/**
 * A password `Input` with the animated show/hide eye. Showing or hiding keeps the focus and the
 * caret (or selection) where they were; `autoComplete` is whatever the caller passes
 * (`current-password` / `new-password`). Works with react-hook-form's `register` or controlled.
 */
export function PasswordInput({
    visible: visibleProp,
    onVisibleChange,
    ref,
    className,
    ...rest
}: PasswordInputProps) {
    const [ownVisible, setOwnVisible] = useState(false)
    const visible = visibleProp ?? ownVisible
    const inputRef = useRef<HTMLInputElement | null>(null)
    const pendingSelection = useRef<Selection | null>(null)

    const bindInput = useCallback(
        (node: HTMLInputElement | null) => {
            inputRef.current = node
            assignRef(ref, node)
        },
        [ref],
    )

    const toggle = () => {
        const input = inputRef.current
        if (input && document.activeElement === input) {
            pendingSelection.current = [
                input.selectionStart,
                input.selectionEnd,
                input.selectionDirection,
            ]
        }
        const next = !visible
        if (visibleProp === undefined) setOwnVisible(next)
        onVisibleChange?.(next)
    }

    // Switching `type` (and the font) makes Chrome rebuild the field on its next style pass and
    // drop the caret to the start. Run that pass now (one forced layout, once per click), put
    // the selection back, and once more on the next frame in case it runs again.
    useLayoutEffect(() => {
        const selection = pendingSelection.current
        const input = inputRef.current
        pendingSelection.current = null
        if (!selection || !input) return
        const [start, end, direction] = selection
        if (start === null || end === null) return
        const restore = () => {
            if (document.activeElement === input) {
                void input.offsetWidth
                input.setSelectionRange(start, end, direction ?? 'none')
            }
        }
        restore()
        const frame = requestAnimationFrame(restore)
        return () => cancelAnimationFrame(frame)
    }, [visible])

    return (
        <Input
            {...rest}
            ref={bindInput}
            type={visible ? 'text' : 'password'}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className={cn(visible && 'font-mono tracking-wide', className)}
            trailingAction={<AnimatedEyeToggle visible={visible} onToggle={toggle} />}
        />
    )
}
