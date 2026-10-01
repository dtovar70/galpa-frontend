import type { AboutValue } from '@/@types/content'
import { Card } from '@/components/ui'
import { ABOUT_VALUE_ICON_COMPONENTS } from '@/views/about/components/valueIcons'

export interface ValuesGridProps {
    values: AboutValue[]
}

export function ValuesGrid({ values }: ValuesGridProps) {
    return (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => {
                // Unknown icons (an older payload) fall back to the first one.
                const Icon =
                    ABOUT_VALUE_ICON_COMPONENTS[value.icon] ??
                    ABOUT_VALUE_ICON_COMPONENTS['shield-check']
                return (
                    <li key={index} className="h-full">
                        <Card className="flex h-full flex-col gap-3">
                            <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                                <Icon aria-hidden="true" className="size-5" />
                            </span>
                            <h3 className="text-lg text-ink">{value.title}</h3>
                            <p className="text-sm text-ink-soft">{value.description}</p>
                        </Card>
                    </li>
                )
            })}
        </ul>
    )
}
