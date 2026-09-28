import { useId, useState, type ChangeEvent, type ClipboardEvent, type Ref } from 'react'

import { Select, type SelectOption } from '@/components/ui'
import {
    FIELD_BASE_CLASS,
    FIELD_ERROR_CLASS,
    FIELD_HINT_CLASS,
    FIELD_LABEL_CLASS,
    FIELD_MESSAGE_ERROR_CLASS,
} from '@/components/ui/field.styles'
import { OptionalMark } from '@/components/ui/OptionalMark'
import { cn } from '@/utils/cn'
import { insertDigits, rejectNonDigits } from '@/utils/digitInput'
import {
    ID_NUMBER_MAX_DIGITS,
    isIdLetter,
    joinIdNumber,
    parseIdNumber,
    splitIdNumber,
    type IdNumberLetter,
    type IdNumberParts,
} from '@/utils/veFormats'

const LETTER_OPTIONS: SelectOption[] = [
    { value: 'V', label: 'V', description: 'Venezolano' },
    { value: 'J', label: 'J', description: 'Jurídico (empresa)' },
    { value: 'G', label: 'G', description: 'Gobierno' },
]

export interface IdNumberFieldProps {
    label: string
    /** "V-12345678", or "" when empty. */
    value: string | undefined
    onChange: (value: string) => void
    onBlur?: () => void
    name?: string
    hint?: string
    error?: string
    optional?: boolean
    disabled?: boolean
    /** Receives the digits input, so react-hook-form can focus it on an error. */
    ref?: Ref<HTMLInputElement>
}

/**
 * A cédula or RIF: the letter (V, J or G; V by default) and up to 9 digits. Letters and symbols
 * cannot be typed in the digits; pasting "v12345678", "V-12.345.678" or "J-123456789" fills
 * both parts. Emits "V-12345678", or "" while no digit is typed. Use it through a `Controller`.
 */
export function IdNumberField({
    label,
    value = '',
    onChange,
    onBlur,
    name,
    hint,
    error,
    optional = false,
    disabled = false,
    ref,
}: IdNumberFieldProps) {
    const fieldId = useId()
    const labelId = `${fieldId}-label`
    const inputId = `${fieldId}-digits`
    const hintId = `${fieldId}-hint`
    const errorId = `${fieldId}-error`

    const parts = splitIdNumber(value)
    // The letter picked before any digit is typed (the value is "" until then).
    const [draftLetter, setDraftLetter] = useState<IdNumberLetter>(parts.letter)
    const letter = parts.digits ? parts.letter : draftLetter

    const emit = (next: IdNumberParts) => {
        setDraftLetter(next.letter)
        onChange(joinIdNumber(next))
    }

    /** A whole cédula (with a letter or separators) replaces the value; bare digits are typed. */
    const fromText = (text: string, input: HTMLInputElement): IdNumberParts => {
        if (/^\d*$/.test(text)) {
            return { letter, digits: insertDigits(input, text, ID_NUMBER_MAX_DIGITS) }
        }
        const pasted = parseIdNumber(text)
        return { letter: pasted.letter ?? letter, digits: pasted.digits }
    }

    const onDigitsChange = (event: ChangeEvent<HTMLInputElement>) => {
        const raw = event.target.value
        // Typing only adds digits; autofill may bring the whole "V-12345678".
        const pasted = /^\s*[A-Za-z]/.test(raw) ? parseIdNumber(raw) : null
        emit({
            letter: pasted?.letter ?? letter,
            digits: pasted ? pasted.digits : raw.replace(/\D/g, '').slice(0, ID_NUMBER_MAX_DIGITS),
        })
    }

    const onDigitsPaste = (event: ClipboardEvent<HTMLInputElement>) => {
        event.preventDefault()
        emit(fromText(event.clipboardData.getData('text').trim(), event.currentTarget))
    }

    const describedBy = error ? errorId : hint ? hintId : undefined

    return (
        <div className="flex w-full flex-col gap-1.5">
            <label id={labelId} htmlFor={inputId} className={FIELD_LABEL_CLASS}>
                {label}
                {optional ? <OptionalMark /> : null}
            </label>

            <div role="group" aria-labelledby={labelId} className="flex min-w-0 gap-2">
                <div className="w-20 shrink-0">
                    <Select
                        label={`${label}: tipo de documento`}
                        hideLabel
                        options={LETTER_OPTIONS}
                        value={letter}
                        disabled={disabled}
                        onChange={(event) => {
                            const next = event.target.value
                            if (isIdLetter(next)) emit({ letter: next, digits: parts.digits })
                        }}
                        className={error ? FIELD_ERROR_CLASS : undefined}
                    />
                </div>
                <input
                    ref={ref}
                    id={inputId}
                    name={name}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="12345678"
                    spellCheck={false}
                    disabled={disabled}
                    value={parts.digits}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy}
                    onBeforeInput={rejectNonDigits}
                    onChange={onDigitsChange}
                    onPaste={onDigitsPaste}
                    onBlur={onBlur}
                    className={cn(
                        FIELD_BASE_CLASS,
                        'h-11 min-w-0 flex-1 rounded-full px-4 tabular-nums',
                        error && FIELD_ERROR_CLASS,
                    )}
                />
            </div>

            {error ? (
                <p id={errorId} role="alert" className={FIELD_MESSAGE_ERROR_CLASS}>
                    {error}
                </p>
            ) : hint ? (
                <p id={hintId} className={FIELD_HINT_CLASS}>
                    {hint}
                </p>
            ) : null}
        </div>
    )
}
