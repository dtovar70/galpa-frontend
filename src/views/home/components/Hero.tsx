import { ArrowRight, Check, Headset, ShieldCheck } from 'lucide-react'
import { motion } from 'motion/react'

import { HighlightedText } from '@/components/shared/HighlightedText'
import { ButtonLink } from '@/components/ui'
import { CONTAINER } from '@/constants/layout.constant'
import { ROUTES } from '@/constants/route.constant'
import { cn } from '@/utils/cn'
import { usePrefersReducedMotion } from '@/utils/hooks/useMediaQuery'
import { useSiteContent } from '@/utils/hooks/useSiteContent'
import { HeroVisual } from '@/views/home/components/HeroVisual'

export function Hero() {
    const { home, about } = useSiteContent()
    const prefersReducedMotion = usePrefersReducedMotion()
    const entrance = prefersReducedMotion ? false : { opacity: 0, y: 24 }

    return (
        <section className="relative isolate overflow-hidden bg-hero text-ink">
            {/* Blueprint grid and a cool glow: technical, but quiet. */}
            <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-[linear-gradient(rgb(11_111_184/0.06)_1px,transparent_1px),linear-gradient(90deg,rgb(11_111_184/0.06)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)] bg-[size:48px_48px]"
            />
            <div
                aria-hidden="true"
                className="absolute -top-40 right-0 -z-10 size-[36rem] rounded-full bg-frost-400/25 blur-3xl"
            />
            <div
                aria-hidden="true"
                className="absolute bottom-0 -left-40 -z-10 size-96 rounded-full bg-white/70 blur-3xl"
            />

            <div
                className={cn(
                    CONTAINER,
                    'grid items-center gap-14 pt-14 pb-16 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-10 lg:pt-24 lg:pb-24',
                )}
            >
                <motion.div
                    initial={entrance}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="space-y-8"
                >
                    <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3.5 py-1.5 text-xs font-bold tracking-[0.14em] text-brand-700 uppercase">
                        <ShieldCheck aria-hidden="true" className="size-4" />
                        {home.heroBadge}
                    </p>

                    <h1 className="text-4xl leading-[1.05] font-extrabold tracking-display text-balance sm:text-5xl lg:text-6xl">
                        <HighlightedText text={home.heroTitle} className="text-brand-600" />
                    </h1>

                    <p className="max-w-xl text-lg leading-relaxed text-ink-soft">
                        {home.heroSubtitle}
                    </p>

                    <div className="flex flex-wrap gap-3">
                        <ButtonLink
                            to={ROUTES.catalog}
                            size="lg"
                            trailingIcon={<ArrowRight aria-hidden="true" className="size-5" />}
                        >
                            {home.heroPrimaryCta}
                        </ButtonLink>
                        <ButtonLink
                            to={ROUTES.contact}
                            size="lg"
                            variant="secondary"
                            leadingIcon={<Headset aria-hidden="true" className="size-5" />}
                        >
                            {home.heroSecondaryCta}
                        </ButtonLink>
                    </div>

                    {home.heroFeatures.length > 0 ? (
                        <ul className="flex flex-wrap gap-x-6 gap-y-2.5">
                            {home.heroFeatures.map((feature, index) => (
                                <li
                                    key={`${index}-${feature}`}
                                    className="flex items-center gap-2 text-sm font-semibold text-ink"
                                >
                                    <span className="flex size-5 items-center justify-center rounded-full bg-brand-600 text-white">
                                        <Check
                                            aria-hidden="true"
                                            className="size-3"
                                            strokeWidth={3}
                                        />
                                    </span>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </motion.div>

                <motion.div
                    initial={entrance}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                    className="mx-auto w-full max-w-md lg:max-w-lg"
                >
                    <HeroVisual />
                </motion.div>
            </div>

            {about.stats.length > 0 ? (
                <div className="border-t border-line bg-white/70">
                    <dl
                        className={cn(
                            CONTAINER,
                            'grid grid-cols-1 divide-line py-8 sm:grid-cols-3 sm:divide-x',
                        )}
                    >
                        {about.stats.slice(0, 3).map((stat, index) => (
                            <div
                                key={index}
                                className="flex items-baseline gap-3 py-2 sm:flex-col sm:items-center sm:gap-1 sm:py-0 sm:text-center"
                            >
                                <dt className="order-2 text-sm text-ink-muted">{stat.label}</dt>
                                <dd className="order-1 text-3xl font-bold text-brand-600 tabular-nums sm:text-4xl">
                                    {stat.value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            ) : null}
        </section>
    )
}
