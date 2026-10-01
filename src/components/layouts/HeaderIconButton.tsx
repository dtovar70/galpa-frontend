import { type ComponentPropsWithRef, type ReactNode } from 'react'

import { cn } from '@/utils/cn'

export interface HeaderIconButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'children'> {
    /** Accessible name — the control shows an icon only. */
    label: string
    icon: ReactNode
    /** Overlay pinned to the corner, e.g. the cart count badge. */
    badge?: ReactNode
}

export function HeaderIconButton({
    label,
    icon,
    badge,
    className,
    ...rest
}: HeaderIconButtonProps) {
    return (
        <button
            type="button"
            aria-label={label}
            className={cn(
                'group relative flex size-11 items-center justify-center rounded-full border-2 border-white/15 bg-white/5 text-white transition-colors duration-200 hover:text-brand-300',
                className,
            )}
            {...rest}
        >
            {/*
             * The ring sits exactly on the button's 2px border and draws itself on hover:
             * 132 is 2πr for r = 21 inside the 44-unit viewBox, used as both the dash length
             * and the resting offset, so the stroke starts fully retracted. The values are
             * inlined because Tailwind only picks up arbitrary values written as literals.
             */}
            <svg
                viewBox="0 0 44 44"
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 size-full -rotate-90 text-brand-400"
            >
                <circle
                    cx="22"
                    cy="22"
                    r="21"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="transition-[stroke-dashoffset] duration-500 ease-out [stroke-dasharray:132] [stroke-dashoffset:132] group-hover:[stroke-dashoffset:0] group-focus-visible:[stroke-dashoffset:0] motion-reduce:transition-none"
                />
            </svg>

            {icon}
            {badge}
        </button>
    )
}
