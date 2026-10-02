import { HighlightedText } from '@/components/shared/HighlightedText'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { CONTAINER } from '@/constants/layout.constant'
import { cn } from '@/utils/cn'
import { useSiteContent } from '@/utils/hooks/useSiteContent'
import { ContactFaq } from '@/views/contact/components/ContactFaq'
import { ContactForm } from '@/views/contact/components/ContactForm'
import { ContactInfo } from '@/views/contact/components/ContactInfo'

/** "Asesoría y contacto": the advisory request form, the store's channels and the FAQ. */
export function ContactView() {
    const { contactPage } = useSiteContent()

    return (
        <div className="space-y-16">
            <section className="relative isolate overflow-hidden bg-hero text-ink">
                <div
                    aria-hidden="true"
                    className="absolute -top-24 left-1/3 -z-10 size-96 rounded-full bg-frost-400/25 blur-3xl"
                />
                <div className={cn(CONTAINER, 'space-y-5 pt-14 pb-28 lg:pt-20 lg:pb-32')}>
                    <p className="inline-flex rounded-full border border-brand-200 bg-white/80 px-3.5 py-1.5 text-xs font-bold tracking-[0.14em] text-brand-700 uppercase">
                        {contactPage.badge}
                    </p>

                    <h1 className="max-w-3xl text-4xl leading-tight font-extrabold tracking-display text-balance sm:text-5xl">
                        <HighlightedText text={contactPage.title} className="text-brand-600" />
                    </h1>

                    <p className="max-w-xl text-lg text-ink-soft">{contactPage.intro}</p>
                </div>
            </section>

            <section
                className={cn(
                    CONTAINER,
                    'relative -mt-36 grid grid-cols-1 gap-8 lg:-mt-40 lg:grid-cols-[minmax(0,1fr)_22rem]',
                )}
            >
                <ContactForm />
                <ContactInfo />
            </section>

            <section aria-labelledby="faq-heading" className={cn(CONTAINER, 'space-y-8')}>
                <SectionHeading
                    headingId="faq-heading"
                    eyebrow={contactPage.faqEyebrow}
                    title={contactPage.faqTitle}
                />
                <ContactFaq />
            </section>
        </div>
    )
}
