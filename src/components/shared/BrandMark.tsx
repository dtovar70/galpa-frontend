import { cn } from '@/utils/cn'

export interface BrandMarkProps {
    className?: string
}

/**
 * Each wave is one 100-unit dash plus a 30-unit gap, so at rest the whole wave shows. Hovering,
 * tapping or focusing the parent `group` slides the dash along the path and the air streams out
 * of the unit; the second wave starts later so the two flow one after the other.
 */
const waveClass =
    '[stroke-dasharray:100_30] group-hover:animate-blow group-focus-visible:animate-blow group-active:animate-blow motion-reduce:animate-none'

/**
 * The Galpa mark: a white split air-conditioner unit blowing two waves of cold air, on a blue
 * tile. Same drawing as `public/favicon.svg`. Decorative: the wordmark or an `aria-label` next
 * to it names the brand.
 */
export function BrandMark({ className }: BrandMarkProps) {
    return (
        <svg viewBox="0 0 64 64" aria-hidden="true" className={cn('size-10 shrink-0', className)}>
            <rect width="64" height="64" rx="16" fill="#0B6FB8" />
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="13" width="46" height="19" rx="6" stroke="#FFFFFF" strokeWidth="4" />
                <path d="M17 26H47" stroke="#FFFFFF" strokeWidth="3" />
                <path
                    d="M15 41C19 38 23 44 27 41S35 38 39 41S47 44 49 41"
                    pathLength={100}
                    stroke="#BDE3F8"
                    strokeWidth="3.5"
                    className={waveClass}
                />
                <path
                    d="M21 50C24.5 47.5 28 52.5 31.5 50S38.5 47.5 43 50"
                    pathLength={100}
                    stroke="#FFFFFF"
                    strokeWidth="3.5"
                    className={cn(waveClass, '[animation-delay:250ms]')}
                />
            </g>
        </svg>
    )
}
