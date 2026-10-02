import { MessageCircle } from 'lucide-react'

import { HighlightedText } from '@/components/shared/HighlightedText'
import { ButtonLink } from '@/components/ui'
import { buttonVariants } from '@/components/ui/Button.variants'
import { CONTAINER } from '@/constants/layout.constant'
import { ROUTES } from '@/constants/route.constant'
import { whatsappUrl } from '@/utils/content'
import { useSiteContent } from '@/utils/hooks/useSiteContent'

export function CtaBanner() {
    const { home, contact } = useSiteContent()

    return (
        <section aria-labelledby="cta-heading" className="py-16 lg:py-20">
            <div className={CONTAINER}>
                <div className="relative isolate overflow-hidden rounded-3xl border border-line bg-hero px-6 py-14 text-ink shadow-soft sm:px-12">
                    <div
                        aria-hidden="true"
                        className="absolute -top-24 -right-16 -z-10 size-80 rounded-full bg-frost-400/30 blur-3xl"
                    />
                    <div
                        aria-hidden="true"
                        className="absolute -bottom-24 left-10 -z-10 size-72 rounded-full bg-white/80 blur-3xl"
                    />

                    <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl space-y-5">
                            <p className="inline-flex rounded-full border border-brand-200 bg-white/80 px-3 py-1 text-xs font-bold tracking-[0.14em] text-brand-700 uppercase">
                                {home.ctaBadge}
                            </p>

                            <h2
                                id="cta-heading"
                                className="text-3xl font-extrabold tracking-display sm:text-4xl lg:text-5xl"
                            >
                                <HighlightedText text={home.ctaTitle} className="text-brand-600" />
                            </h2>

                            <p className="max-w-lg text-ink-soft">{home.ctaDescription}</p>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-3">
                            {contact.whatsapp ? (
                                <a
                                    href={whatsappUrl(
                                        contact.whatsapp,
                                        'Hola, quisiera asesoría para elegir un aire acondicionado.',
                                    )}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={buttonVariants({ variant: 'whatsapp', size: 'lg' })}
                                >
                                    <MessageCircle aria-hidden="true" className="size-5" />
                                    {home.ctaPrimary}
                                </a>
                            ) : (
                                <ButtonLink to={ROUTES.contact} size="lg">
                                    {home.ctaPrimary}
                                </ButtonLink>
                            )}
                            <ButtonLink to={ROUTES.about} size="lg" variant="secondary">
                                {home.ctaSecondary}
                            </ButtonLink>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
