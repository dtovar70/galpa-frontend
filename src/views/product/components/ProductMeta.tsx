import { Check } from 'lucide-react'

import type { Product } from '@/@types/product'
import { Accordion, type AccordionItem } from '@/components/shared/Accordion'
import { useShippingContent, useSiteContent } from '@/utils/hooks/useSiteContent'

/** Dispatch, warranty and installation answers, filled with the editable store data. */
function useProductFaq(): AccordionItem[] {
    const { contact } = useSiteContent()
    const { dispatchCopy, freeShippingText } = useShippingContent()
    return [
        {
            id: 'shipping',
            question: 'Despacho y entrega',
            answer: `${dispatchCopy} ${freeShippingText}. También puedes retirar tu pedido en nuestra tienda.`,
        },
        {
            id: 'warranty',
            question: 'Garantía',
            answer: 'Los equipos cuentan con la garantía del fabricante. Te entregamos la factura y te orientamos si necesitas hacerla valer.',
        },
        {
            id: 'installation',
            question: '¿Me ayudan con la instalación?',
            answer: `Sí. Al comprar puedes pedir asesoría para la instalación, o escribirnos a ${contact.email} y te recomendamos lo necesario para que el equipo rinda como debe.`,
        },
    ]
}

export interface ProductMetaProps {
    product: Product
}

export function ProductMeta({ product }: ProductMetaProps) {
    const faqItems = useProductFaq()

    return (
        <div className="space-y-10">
            {product.highlights.length > 0 ? (
                <section aria-labelledby="highlights-heading" className="space-y-4">
                    <h2 id="highlights-heading" className="text-xl text-ink">
                        Características destacadas
                    </h2>
                    <ul className="grid gap-2.5 sm:grid-cols-2">
                        {product.highlights.map((highlight) => (
                            <li
                                key={highlight}
                                className="flex items-start gap-2.5 text-sm text-ink"
                            >
                                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                                    <Check aria-hidden="true" className="size-3" />
                                </span>
                                {highlight}
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}

            <section aria-labelledby="product-faq-heading" className="space-y-4">
                <h2 id="product-faq-heading" className="text-xl text-ink">
                    Preguntas frecuentes
                </h2>
                <Accordion items={faqItems} />
            </section>
        </div>
    )
}
