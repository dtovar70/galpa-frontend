import type { AboutStat } from '@/@types/content'
import { cn } from '@/utils/cn'

/** One column per stat on wide screens, so 2 or 3 stats fill the row instead of leaving gaps. */
const WIDE_COLUMNS: Record<number, string> = {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'sm:grid-cols-3 lg:grid-cols-3',
}

export interface StatsRowProps {
    stats: AboutStat[]
}

export function StatsRow({ stats }: StatsRowProps) {
    if (stats.length === 0) return null

    return (
        <dl
            className={cn(
                'grid gap-6 rounded-2xl border border-line bg-white px-6 py-10 shadow-soft',
                stats.length === 1 ? 'grid-cols-1' : 'grid-cols-2',
                WIDE_COLUMNS[stats.length] ?? 'lg:grid-cols-4',
            )}
        >
            {stats.map((stat, index) => (
                <div key={index} className="space-y-1 text-center">
                    <dt className="sr-only">{stat.label}</dt>
                    <dd>
                        <span className="block font-tech text-4xl font-bold text-brand-600">
                            {stat.value}
                        </span>
                        <span className="text-sm text-ink-soft">{stat.label}</span>
                    </dd>
                </div>
            ))}
        </dl>
    )
}
