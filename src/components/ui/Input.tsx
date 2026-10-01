import { useId, type ComponentPropsWithRef, type ReactNode } from 'react'

import { CharacterCounter } from '@/components/ui/CharacterCounter'
import {
    FIELD_BASE_CLASS,
    FIELD_ERROR_CLASS,
    FIELD_HINT_CLASS,
    FIELD_LABEL_CLASS,
    FIELD_MESSAGE_ERROR_CLASS,
} from '@/components/ui/field.styles'
import { OptionalMark } from '@/components/ui/OptionalMark'
import { TEXT_INPUT_MAX_LENGTH } from '@/constants/ui.constant'
import { cn } from '@/utils/cn'
import { useCharacterCount } from '@/utils/hooks/useCharacterCount'

/** Types that hold free text and therefore get `TEXT_INPUT_MAX_LENGTH` by default. */
const TEXT_LIKE_TYPES = new Set(['text', 'email', 'search', 'tel', 'url'])

export interface InputProps extends Omit<ComponentPropsWithRef<'input'>, 'id'> {
    label: string
    /** Hides the label visually while keeping it available to screen readers. */
    hideLabel?: boolean
    hint?: string
    error?: string
    /** Adds a muted "(opcional)" suffix to the label. */
    optional?: boolean
    leadingIcon?: ReactNode
    /** Interactive slot pinned to the right edge, e.g. a clear button. */
    trailingAction?: ReactNode
    /** Always show the "12/100" counter (by default it appears near the limit). */
    showCount?: boolean
}

/**
 * Text-like inputs accept at most `TEXT_INPUT_MAX_LENGTH` characters unless `maxLength` says
 * otherwise, and show a character counter once the value gets close to the limit.
 */
export function Input({
    label,
    hideLabel = false,
    hint,
    error,
    optional = false,
    leadingIcon,
    trailingAction,
    showCount = false,
    className,
    type = 'text',
    maxLength: maxLengthProp,
    ref,
    value,
    onChange,
    ...rest
}: InputProps) {
    const inputId = useId()
    const hintId = `${inputId}-hint`
    const errorId = `${inputId}-error`
    const countId = `${inputId}-count`
    const maxLength =
        maxLengthProp ?? (TEXT_LIKE_TYPES.has(type) ? TEXT_INPUT_MAX_LENGTH : undefined)
    const { bindElement, handleChange, count } = useCharacterCount<HTMLInputElement>({
        ref,
        value,
        onChange,
        maxLength,
        alwaysShow: showCount,
    })
    const describedBy =
        [error ? errorId : hint ? hintId : null, count ? countId : null]
            .filter(Boolean)
            .join(' ') || undefined

    return (
        <div className="flex w-full flex-col gap-1.5">
            <label htmlFor={inputId} className={cn(FIELD_LABEL_CLASS, hideLabel && 'sr-only')}>
                {label}
                {optional ? <OptionalMark /> : null}
            </label>

            <div className="relative">
                {leadingIcon ? (
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-ink-soft"
                    >
                        {leadingIcon}
                    </span>
                ) : null}

                <input
                    id={inputId}
                    type={type}
                    maxLength={maxLength}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy}
                    className={cn(
                        FIELD_BASE_CLASS,
                        'h-11 rounded-xl px-4',
                        leadingIcon && 'pl-11',
                        trailingAction && 'pr-11',
                        error && FIELD_ERROR_CLASS,
                        className,
                    )}
                    value={value}
                    {...rest}
                    ref={bindElement}
                    onChange={handleChange}
                />

                {trailingAction ? (
                    <span className="absolute inset-y-0 right-1.5 flex items-center">
                        {trailingAction}
                    </span>
                ) : null}
            </div>

            {error || hint || count ? (
                <div className={cn(count && 'flex items-start justify-between gap-3')}>
                    {error ? (
                        <p id={errorId} role="alert" className={FIELD_MESSAGE_ERROR_CLASS}>
                            {error}
                        </p>
                    ) : hint ? (
                        <p id={hintId} className={FIELD_HINT_CLASS}>
                            {hint}
                        </p>
                    ) : null}
                    {count ? <CharacterCounter id={countId} count={count} /> : null}
                </div>
            ) : null}
        </div>
    )
}
