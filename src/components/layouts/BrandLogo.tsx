import { Link } from 'react-router'

import { BrandMark } from '@/components/shared/BrandMark'
import { appConfig } from '@/configs/app.config'
import { ROUTES } from '@/constants/route.constant'
import { cn } from '@/utils/cn'
import { useSiteContent } from '@/utils/hooks/useSiteContent'

export interface BrandLogoProps {
    className?: string
    /** `light`: light text for the navy footer; `dark`: navy text for the white header. */
    tone?: 'light' | 'dark'
    /** Renders the tagline under the wordmark; used in the footer. */
    withTagline?: boolean
}

export function BrandLogo({ className, tone = 'light', withTagline = false }: BrandLogoProps) {
    const { general } = useSiteContent()
    const onDark = tone === 'light'

    return (
        <Link
            to={ROUTES.home}
            aria-label={`${general.brandName} — ir al inicio`}
            className={cn('group inline-flex items-center gap-3 rounded-xl', className)}
        >
            <BrandMark className="size-10 lg:size-11" />

            <span className="flex flex-col leading-none">
                <span
                    className={cn(
                        'text-xl font-extrabold tracking-display sm:text-2xl',
                        onDark ? 'text-white' : 'text-ink',
                    )}
                >
                    {appConfig.brandShortName}
                </span>
                <span
                    className={cn(
                        'mt-1 hidden text-[0.6rem] font-semibold tracking-[0.18em] uppercase sm:block',
                        onDark ? 'text-frost-400' : 'text-brand-700',
                    )}
                >
                    {general.brandName}
                </span>
                {withTagline ? (
                    <span
                        className={cn(
                            'mt-2 text-sm font-normal tracking-normal normal-case',
                            onDark ? 'text-white/70' : 'text-ink-soft',
                        )}
                    >
                        {general.tagline}
                    </span>
                ) : null}
            </span>
        </Link>
    )
}
