import { cn } from '@/utils/cn'

const ARMS = [0, 60, 120, 180, 240, 300]

export interface BrandMarkProps {
    className?: string
}

/**
 * The Galpa mark: a green six-arm snowflake (cold air) on an ink tile. Same drawing as
 * `public/favicon.svg`. Decorative: the wordmark or an `aria-label` next to it names the brand.
 */
export function BrandMark({ className }: BrandMarkProps) {
    return (
        <svg viewBox="0 0 64 64" aria-hidden="true" className={cn('size-10 shrink-0', className)}>
            <rect width="64" height="64" rx="16" fill="#0A0F0D" />
            <g
                fill="none"
                stroke="#10B981"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                transform="translate(32 32)"
            >
                {ARMS.map((angle) => (
                    <g key={angle} transform={`rotate(${angle})`}>
                        <path d="M0 0V-20" />
                        <path d="M-6 -15L0 -10L6 -15" />
                    </g>
                ))}
            </g>
            <circle cx="32" cy="32" r="4" fill="#38BDF8" />
        </svg>
    )
}
