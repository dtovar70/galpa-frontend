import { Headset, PackageCheck, Wallet, Wrench, type LucideIcon } from 'lucide-react'

import { SectionHeading } from '@/components/shared/SectionHeading'
import { CONTAINER } from '@/constants/layout.constant'
import { PAYMENT_METHOD_INFO, PAYMENT_METHOD_ORDER } from '@/constants/payment.constant'
import { cn } from '@/utils/cn'
import { useSiteContent } from '@/utils/hooks/useSiteContent'

/** Icons of the reasons, in order; extra reasons reuse the last one. */
const REASON_ICONS: readonly LucideIcon[] = [Headset, PackageCheck, Wrench, Wallet]

/** "Por qué elegirnos": the home `steps` content, plus the accepted payment methods. */
export function WhyChooseUs() {
    const { home } = useSiteContent()

    return (
        <section aria-labelledby="why-heading" className="bg-white py-16 lg:py-24">
            <div className={cn(CONTAINER, 'space-y-12')}>
                <SectionHeading
                    headingId="why-heading"
                    eyebrow={home.stepsEyebrow}
                    title={home.stepsTitle}
                    description={home.stepsDescription}
                />

                <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {home.steps.map((step, index) => {
                        const Icon =
                            REASON_ICONS[Math.min(index, REASON_ICONS.length - 1)] ?? Headset
                        return (
                            <li
                                key={index}
                                className="group flex h-full flex-col gap-4 rounded-2xl border border-line bg-page p-6 transition hover:border-brand-200 hover:bg-white hover:shadow-soft"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="grid size-12 place-items-center rounded-xl bg-ink text-brand-400">
                                        <Icon
                                            aria-hidden="true"
                                            className="size-6"
                                            strokeWidth={1.75}
                                        />
                                    </span>
                                    <span className="font-tech text-sm font-bold text-ink-muted/60">
                                        0{index + 1}
                                    </span>
                                </div>
                                <h3 className="text-lg text-ink">{step.title}</h3>
                                <p className="text-sm leading-relaxed text-ink-soft">
                                    {step.description}
                                </p>
                            </li>
                        )
                    })}
                </ol>

                <div className="flex flex-col gap-4 rounded-2xl border border-line bg-page p-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-ink">Métodos de pago aceptados</p>
                    <ul className="flex flex-wrap gap-2">
                        {PAYMENT_METHOD_ORDER.map((method) => (
                            <li
                                key={method}
                                className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-white px-3 py-1.5 text-sm font-semibold text-ink"
                            >
                                {PAYMENT_METHOD_INFO[method].label}
                                <span className="font-tech text-[11px] font-bold text-ink-muted">
                                    {PAYMENT_METHOD_INFO[method].currency === 'BS' ? 'Bs' : 'USD'}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    )
}
