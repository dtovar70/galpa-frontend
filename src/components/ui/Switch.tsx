import { cn } from '@/utils/cn'

export interface SwitchProps {
    checked: boolean
    onChange: (checked: boolean) => void
    /** Accessible name; the visible label (if any) is rendered by the caller. */
    label: string
    disabled?: boolean
    className?: string
}

export function Switch({ checked, onChange, label, disabled = false, className }: SwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn(
                'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 transition duration-200 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
                checked ? 'border-brand-600 bg-brand-600' : 'border-line-strong bg-line-strong',
                className,
            )}
        >
            <span
                aria-hidden="true"
                className={cn(
                    'inline-block size-5 rounded-full bg-white shadow-soft transition-transform duration-200 motion-reduce:transition-none',
                    checked ? 'translate-x-5.5' : 'translate-x-0.5',
                )}
            />
        </button>
    )
}
