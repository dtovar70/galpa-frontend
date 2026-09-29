import { SectionHeading } from '@/components/shared/SectionHeading'
import { Card } from '@/components/ui'
import { CONTAINER } from '@/constants/layout.constant'
import { cn } from '@/utils/cn'
import { useSiteContent } from '@/utils/hooks/useSiteContent'

/** Real customer reviews edited in Admin > Contenido. With none, the section is not shown. */
export function Testimonials() {
    const { home } = useSiteContent()
    const testimonials = home.testimonials

    if (testimonials.length === 0) return null

    return (
        <section aria-labelledby="testimonials-heading" className="py-16 lg:py-24">
            <div className={cn(CONTAINER, 'space-y-10')}>
                <SectionHeading
                    headingId="testimonials-heading"
                    eyebrow={home.testimonialsEyebrow}
                    title={home.testimonialsTitle}
                    align="center"
                />

                <ul className="grid gap-6 md:grid-cols-3">
                    {testimonials.map((testimonial, index) => {
                        const details = [testimonial.city, testimonial.product]
                            .filter((part) => part !== '')
                            .join(' · ')
                        return (
                            <li key={index} className="h-full">
                                <Card tone="cream" className="flex h-full flex-col gap-4">
                                    <blockquote className="flex-1 text-sm leading-relaxed text-ink">
                                        “{testimonial.quote}”
                                    </blockquote>
                                    <footer className="text-sm">
                                        <p className="font-display text-base text-ink">
                                            {testimonial.name}
                                        </p>
                                        {details ? (
                                            <p className="text-ink-soft">{details}</p>
                                        ) : null}
                                    </footer>
                                </Card>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </section>
    )
}
