import { SectionHeading } from '@/components/shared/SectionHeading'
import { Card } from '@/components/ui'
import { CONTAINER } from '@/constants/layout.constant'
import { cn } from '@/utils/cn'
import { useSiteContent } from '@/utils/hooks/useSiteContent'

export function HowItWorks() {
    const { home } = useSiteContent()

    return (
        <section aria-labelledby="how-heading" className="bg-blush-50 py-16 lg:py-24">
            <div className={cn(CONTAINER, 'space-y-10')}>
                <SectionHeading
                    headingId="how-heading"
                    eyebrow={home.stepsEyebrow}
                    title={home.stepsTitle}
                    align="center"
                    description={home.stepsDescription}
                />

                <ol className="grid gap-6 md:grid-cols-3">
                    {home.steps.map((step, index) => (
                        <li key={index} className="h-full">
                            <Card className="flex h-full flex-col gap-3">
                                <span className="flex size-12 items-center justify-center rounded-full bg-blush-700 font-display text-xl font-semibold text-white">
                                    {index + 1}
                                </span>
                                <h3 className="font-display text-xl text-ink">{step.title}</h3>
                                <p className="text-sm text-ink-soft">{step.description}</p>
                            </Card>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    )
}
