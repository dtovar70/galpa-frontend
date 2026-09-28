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
import { useMobilePrefixes } from '@/utils/hooks/useMobilePrefixes'
import { joinMobile, MOBILE_NUMBER_DIGITS, parseMobile, splitMobile } from '@/utils/veFormats'

export interface MobilePhoneFieldProps {
    label: string
    /** "0424-1234567", or "" when empty. */
    value: string | undefined
    onChange: (value: string) => void
    onBlur?: () => void
    name?: string
    hint?: string
    error?: string
    optional?: boolean
    disabled?: boolean
    /** For the number input, e.g. "tel-national" on the customer forms. */
    autoComplete?: string
    /** Receives the number input, so react-hook-form can focus it on an error. */
    ref?: Ref<HTMLInputElement>
}

/**
 * A Venezuelan mobile number: the operator code picked from the active codes of Catálogos
 * (`GET /catalogs/mobile-prefixes`) and the 7 digits after it. Only digits can be typed; pasting
 * or autofilling a whole number ("04241234567", "0424-1234567", "+58 424 1234567") fills both
 * parts. Emits "0424-1234567", or "" while no digit is typed. Use it through a `Controller`.
 */
export function MobilePhoneField({
    label,
    value = '',
    onChange,
    onBlur,
    name,
    hint,
    error,
    optional = false,
    disabled = false,
    autoComplete = 'off',
    ref,
}: MobilePhoneFieldProps) {
    const fieldId = useId()
    const labelId = `${fieldId}-label`
    const inputId = `${fieldId}-number`
    const hintId = `${fieldId}-hint`
    const errorId = `${fieldId}-error`
    const prefixes = useMobilePrefixes()

    const parts = splitMobile(value)
    // The code picked before any digit is typed (the value is "" until then).
    const [draftPrefix, setDraftPrefix] = useState(parts.prefix)
    const prefix = parts.number ? parts.prefix : draftPrefix

    // A stored number whose code was deactivated still shows (saving it is refused by the API).
    const options: SelectOption[] =
        prefix && !prefixes.options.some((option) => option.value === prefix)
            ? [
                  ...prefixes.options,
                  {
                      value: prefix,
                      label: prefix,
                      description: prefixes.isSuccess ? 'No disponible' : undefined,
                  },
              ]
            : prefixes.options

    const emit = (next: { prefix: string; number: string }) => {
        setDraftPrefix(next.prefix)
        onChange(joinMobile(next))
    }

    const onNumberChange = (event: ChangeEvent<HTMLInputElement>) => {
        const raw = event.target.value
        const whole = raw.replace(/\D/g, '').length > MOBILE_NUMBER_DIGITS ? parseMobile(raw) : null
        emit(
            whole ?? {
                prefix,
                number: raw.replace(/\D/g, '').slice(0, MOBILE_NUMBER_DIGITS),
            },
        )
    }

    const onNumberPaste = (event: ClipboardEvent<HTMLInputElement>) => {
        event.preventDefault()
        const text = event.clipboardData.getData('text')
        const whole = parseMobile(text)
        emit(
            whole ?? {
                prefix,
                number: insertDigits(event.currentTarget, text, MOBILE_NUMBER_DIGITS),
            },
        )
    }

    const describedBy = error ? errorId : hint ? hintId : undefined

    return (
        <div className="flex w-full flex-col gap-1.5">
            <label id={labelId} htmlFor={inputId} className={FIELD_LABEL_CLASS}>
                {label}
                {optional ? <OptionalMark /> : null}
            </label>

            <div role="group" aria-labelledby={labelId} className="flex min-w-0 gap-2">
                <div className="w-28 shrink-0">
                    <Select
                        label={`${label}: código de operadora`}
                        hideLabel
                        placeholder={prefixes.isPending ? '…' : 'Código'}
                        options={options}
                        value={prefix}
                        disabled={disabled}
                        onChange={(event) =>
                            emit({ prefix: event.target.value, number: parts.number })
                        }
                        className={error ? FIELD_ERROR_CLASS : undefined}
                    />
                </div>
                <input
                    ref={ref}
                    id={inputId}
                    name={name}
                    type="text"
                    inputMode="numeric"
                    autoComplete={autoComplete}
                    placeholder="1234567"
                    spellCheck={false}
                    disabled={disabled}
                    value={parts.number}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy}
                    onBeforeInput={rejectNonDigits}
                    onChange={onNumberChange}
                    onPaste={onNumberPaste}
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
            ) : prefixes.isError ? (
                <p className={FIELD_MESSAGE_ERROR_CLASS}>
                    No pudimos cargar los códigos de celular. Recarga la página.
                </p>
            ) : hint ? (
                <p id={hintId} className={FIELD_HINT_CLASS}>
                    {hint}
                </p>
            ) : null}
        </div>
    )
}
