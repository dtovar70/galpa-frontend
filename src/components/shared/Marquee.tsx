import { Snowflake } from 'lucide-react'

import { cn } from '@/utils/cn'

/**
 * Two identical tracks sit side by side and slide by exactly one track width, so the
 * second one lands where the first started and the loop has no seam.
 */
const TRACKS = [0, 1]

/**
 * Each track repeats the announcements so its natural width already overflows a wide
 * desktop. Without this the track falls back to `min-w-full`, which keeps the loop
 * seamless but spreads the items thin.
 */
const REPEATS_PER_TRACK = [0, 1, 2]

export interface MarqueeProps {
    items: readonly string[]
    className?: string
}

export function Marquee({ items, className }: MarqueeProps) {
    return (
        <div
            className={cn(
                'flex overflow-hidden border-b border-white/5 bg-surface py-2 text-xs font-semibold text-white/85',
                className,
            )}
        >
            <ul className="sr-only">
                {items.map((item) => (
                    <li key={item}>{item}</li>
                ))}
            </ul>

            {TRACKS.map((track) => (
                <div
                    key={track}
                    aria-hidden="true"
                    className="flex min-w-full shrink-0 animate-marquee items-center justify-around whitespace-nowrap motion-reduce:animate-none"
                >
                    {REPEATS_PER_TRACK.map((repeat) =>
                        items.map((item) => (
                            <span
                                key={`${repeat}-${item}`}
                                className="flex items-center gap-2 px-6"
                            >
                                <Snowflake aria-hidden="true" className="size-3.5 text-brand-400" />
                                {item}
                            </span>
                        )),
                    )}
                </div>
            ))}
        </div>
    )
}
