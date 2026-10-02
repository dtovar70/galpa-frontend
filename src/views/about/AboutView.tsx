import { Headset } from 'lucide-react'

import { HighlightedText } from '@/components/shared/HighlightedText'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { ButtonLink } from '@/components/ui'
import { CONTAINER } from '@/constants/layout.constant'
import { ROUTES } from '@/constants/route.constant'
import { cn } from '@/utils/cn'
import { useFillPlaceholders, useSiteContent } from '@/utils/hooks/useSiteContent'
import { AdvisoryExpertise } from '@/views/about/components/AdvisoryExpertise'
import { StatsRow } from '@/views/about/components/StatsRow'
import { Timeline } from '@/views/about/components/Timeline'
import { ValuesGrid } from '@/views/about/components/ValuesGrid'

export function AboutView() {
    const { about } = useSiteContent()
    const fill = useFillPlaceholders()

    return (
        <div className="space-y-20 lg:space-y-24">
            <section className="relative isolate overflow-hidden bg-hero text-ink">
                <div
                    aria-hidden="true"
                    className="absolute -top-32 right-0 -z-10 size-[32rem] rounded-full bg-frost-400/25 blur-3xl"
                />
                <div
                    className={cn(
                        CONTAINER,
                        'grid items-center gap-12 py-16 lg:grid-cols-[1.3fr_1fr] lg:py-24',
                    )}
                >
                    <div className="space-y-6">
                        <p className="inline-flex rounded-full border border-brand-200 bg-white/80 px-3.5 py-1.5 text-xs font-bold tracking-[0.14em] text-brand-700 uppercase">
                            {about.badge}
                        </p>

                        <h1 className="text-4xl leading-tight font-extrabold tracking-display text-balance sm:text-5xl lg:text-6xl">
                            <HighlightedText text={about.title} className="text-brand-600" />
                        </h1>

                        {about.paragraphs.map((paragraph, index) => (
                            <p
                                key={index}
                                className={cn(
                                    'leading-relaxed text-ink-soft',
                                    index === 0 && 'text-lg',
                                )}
                            >
                                {fill(paragraph)}
                            </p>
                        ))}

                        <ButtonLink
                            to={ROUTES.contact}
                            size="lg"
                            leadingIcon={<Headset aria-hidden="true" className="size-5" />}
                        >
                            {about.ctaLabel}
                        </ButtonLink>
                    </div>

                    <div className="relative mx-auto w-full max-w-sm">
                        <div className="rounded-3xl border border-line bg-white p-8 text-center shadow-lift">
                            <p className="text-8xl font-bold tracking-tighter text-brand-600 tabular-nums sm:text-9xl">
                                30
                            </p>
                            <p className="mt-2 text-sm font-bold tracking-[0.2em] text-ink-muted uppercase">
                                años de experiencia
                            </p>
                        </div>
                        <p className="absolute -bottom-3 left-6 rounded-full bg-brand-600 px-4 py-1.5 text-sm font-bold text-white shadow-lift">
                            {about.imageBadge}
                        </p>
                    </div>
                </div>
            </section>

            <section aria-labelledby="trajectory-heading" className={cn(CONTAINER, 'space-y-10')}>
                <SectionHeading
                    headingId="trajectory-heading"
                    eyebrow="Trayectoria"
                    title="Tres décadas de *experiencia*"
                    description="Cada etapa sumó algo a la forma en que hoy asesoramos a nuestros clientes."
                />
                <Timeline />
            </section>

            <section aria-labelledby="values-heading" className={cn(CONTAINER, 'space-y-10')}>
                <SectionHeading
                    headingId="values-heading"
                    eyebrow={about.valuesEyebrow}
                    title={about.valuesTitle}
                    description={about.valuesDescription}
                />
                <ValuesGrid values={about.values} />
            </section>

            <section aria-labelledby="expertise-heading" className="bg-sky py-16 text-ink lg:py-24">
                <div
                    className={cn(
                        CONTAINER,
                        'grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-center',
                    )}
                >
                    <SectionHeading
                        headingId="expertise-heading"
                        eyebrow="Asesoría técnica"
                        title="Antes de vender, *escuchamos*"
                        description="Nuestros asesores revisan contigo lo que define el equipo correcto, para que no pagues de más ni te quedes corto."
                    />
                    <AdvisoryExpertise />
                </div>
            </section>

            <section aria-labelledby="stats-heading" className={cn(CONTAINER, 'space-y-10 pb-4')}>
                <SectionHeading
                    headingId="stats-heading"
                    eyebrow={about.statsEyebrow}
                    title={about.statsTitle}
                    align="center"
                />
                <StatsRow stats={about.stats} />
            </section>
        </div>
    )
}
