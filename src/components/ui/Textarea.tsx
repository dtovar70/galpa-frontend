import { useId, type ComponentPropsWithRef } from 'react'

import { CharacterCounter } from '@/components/ui/CharacterCounter'
import {
    FIELD_BASE_CLASS,
    FIELD_ERROR_CLASS,
    FIELD_HINT_CLASS,
    FIELD_LABEL_CLASS,
    FIELD_MESSAGE_ERROR_CLASS,
} from '@/components/ui/field.styles'
import { OptionalMark } from '@/components/ui/OptionalMark'
import { cn } from '@/utils/cn'
import { useCharacterCount } from '@/utils/hooks/useCharacterCount'

export interface TextareaProps extends Omit<ComponentPropsWithRef<'textarea'>, 'id' | 'maxLength'> {
    label: string
    hideLabel?: boolean
    hint?: string
    error?: string
    /** Adds a muted "(opcional)" suffix to the label. */
    optional?: boolean
    /**
     * Required: every multi-line field has an explicit limit, the same one its API DTO and
     * database column enforce.
     */
    maxLength: number
    /** Always show the "12/140" counter (by default it appears near the limit). */
    showCount?: boolean
}

export function Textarea({
    label,
    hideLabel = false,
    hint,
    error,
    optional = false,
    showCount = false,
    className,
    rows = 4,
    maxLength,
    ref,
    value,
    onChange,
    ...rest
}: TextareaProps) {
    const textareaId = useId()
    const hintId = `${textareaId}-hint`
    const errorId = `${textareaId}-error`
    const countId = `${textareaId}-count`
    const { bindElement, handleChange, count } = useCharacterCount<HTMLTextAreaElement>({
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
            <label htmlFor={textareaId} className={cn(FIELD_LABEL_CLASS, hideLabel && 'sr-only')}>
                {label}
                {optional ? <OptionalMark /> : null}
            </label>

            <textarea
                id={textareaId}
                rows={rows}
                maxLength={maxLength}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                className={cn(
                    FIELD_BASE_CLASS,
                    'resize-y rounded-xl px-4 py-3',
                    error && FIELD_ERROR_CLASS,
                    className,
                )}
                value={value}
                {...rest}
                ref={bindElement}
                onChange={handleChange}
            />

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
        </div>
    )
}
