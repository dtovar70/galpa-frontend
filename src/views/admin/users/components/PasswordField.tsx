import { useState, type Ref } from 'react'
import { Check, Sparkles, X } from 'lucide-react'

import { CopyButton } from '@/components/shared/CopyButton'
import { Button } from '@/components/ui'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { cn } from '@/utils/cn'
import {
    generatePassword,
    PASSWORD_MAX_LENGTH,
    PASSWORD_RULES,
    passwordStrength,
    STRENGTH_LABEL,
    type PasswordStrength,
} from '@/views/admin/users/utils/password'

const STRENGTH_BAR_CLASS: Record<PasswordStrength, string> = {
    0: 'bg-brand-500',
    1: 'bg-brand-400',
    2: 'bg-warning-400',
    3: 'bg-brand-400',
    4: 'bg-brand-400',
}

export interface PasswordFieldProps {
    label: string
    value: string
    onChange: (value: string) => void
    onBlur?: () => void
    name?: string
    inputRef?: Ref<HTMLInputElement>
    error?: string
    hint?: string
    autoComplete: 'new-password' | 'current-password'
    /** Strength bar and the policy checklist, for new passwords. */
    withStrength?: boolean
    /** "Generar contraseña segura": fills in a random password and offers to copy it. */
    withGenerator?: boolean
}

/** A password input with show/hide and, for new passwords, a strength hint and a generator. */
export function PasswordField({
    label,
    value,
    onChange,
    onBlur,
    name,
    inputRef,
    error,
    hint,
    autoComplete,
    withStrength = false,
    withGenerator = false,
}: PasswordFieldProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [generated, setGenerated] = useState<string | null>(null)
    const strength = passwordStrength(value)
    const showCopy = generated !== null && generated === value

    const generate = () => {
        const password = generatePassword()
        onChange(password)
        setGenerated(password)
        // The whole point is to read it and pass it on.
        setIsVisible(true)
    }

    return (
        <div className="space-y-2">
            <PasswordInput
                label={label}
                name={name}
                ref={inputRef}
                visible={isVisible}
                onVisibleChange={setIsVisible}
                autoComplete={autoComplete}
                maxLength={PASSWORD_MAX_LENGTH}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onBlur={onBlur}
                error={error}
                hint={hint}
            />

            {withGenerator ? (
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={generate}
                        leadingIcon={<Sparkles aria-hidden="true" className="size-4" />}
                    >
                        Generar contraseña segura
                    </Button>
                    {showCopy ? (
                        <CopyButton value={value} label="Copiar contraseña">
                            Copiar
                        </CopyButton>
                    ) : null}
                </div>
            ) : null}

            {withStrength && value ? (
                <div className="space-y-1.5" aria-live="polite">
                    <div className="flex items-center gap-3">
                        <div aria-hidden="true" className="flex flex-1 gap-1">
                            {[1, 2, 3, 4].map((step) => (
                                <span
                                    key={step}
                                    className={cn(
                                        'h-1.5 flex-1 rounded-full transition-colors',
                                        strength >= step || (step === 1 && strength === 0)
                                            ? STRENGTH_BAR_CLASS[strength]
                                            : 'bg-line',
                                    )}
                                />
                            ))}
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-ink-soft">
                            Seguridad: {STRENGTH_LABEL[strength]}
                        </span>
                    </div>
                    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                        {PASSWORD_RULES.map((rule) => {
                            const ok = rule.test(value)
                            const Icon = ok ? Check : X
                            return (
                                <li
                                    key={rule.label}
                                    className={cn(
                                        'inline-flex items-center gap-1',
                                        ok ? 'text-ink' : 'text-ink-soft',
                                    )}
                                >
                                    <Icon
                                        aria-hidden="true"
                                        className={cn(
                                            'size-3.5',
                                            ok ? 'text-brand-600' : 'text-danger-500',
                                        )}
                                    />
                                    {rule.label}
                                    <span className="sr-only">{ok ? '(cumple)' : '(falta)'}</span>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            ) : null}
        </div>
    )
}
