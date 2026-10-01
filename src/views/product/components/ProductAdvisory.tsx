import { Headset, MessageCircle } from 'lucide-react'

import type { Product } from '@/@types/product'
import { ButtonLink } from '@/components/ui'
import { buttonVariants } from '@/components/ui/Button.variants'
import { advisoryPath, productPath } from '@/constants/route.constant'
import { whatsappUrl } from '@/utils/content'
import { useSiteContent } from '@/utils/hooks/useSiteContent'

export interface ProductAdvisoryProps {
    product: Pick<Product, 'name' | 'slug' | 'brand' | 'model'>
}

/** "¿Dudas con este equipo?": WhatsApp with the product prefilled, or the advisory form. */
export function ProductAdvisory({ product }: ProductAdvisoryProps) {
    const { contact } = useSiteContent()
    const productUrl = `${window.location.origin}${productPath(product.slug)}`
    const name = [product.name, product.model ? `(${product.model})` : ''].join(' ').trim()
    const message = `Hola, quisiera asesoría sobre ${name}: ${productUrl}`

    return (
        <div className="space-y-3 rounded-2xl border border-line bg-page p-4 sm:p-5">
            <p className="text-sm text-ink-soft">
                <span className="font-semibold text-ink">¿Dudas con este equipo?</span> Un asesor te
                ayuda a confirmar la capacidad, la instalación y el modelo correcto.
            </p>
            <div className="flex flex-wrap gap-2">
                {contact.whatsapp ? (
                    <a
                        href={whatsappUrl(contact.whatsapp, message)}
                        target="_blank"
                        rel="noreferrer"
                        className={buttonVariants({ variant: 'whatsapp', size: 'sm' })}
                    >
                        <MessageCircle aria-hidden="true" className="size-4" />
                        Asesoría por WhatsApp
                    </a>
                ) : null}
                <ButtonLink
                    to={advisoryPath(product.slug)}
                    variant="secondary"
                    size="sm"
                    leadingIcon={<Headset aria-hidden="true" className="size-4" />}
                >
                    Solicitar asesoría
                </ButtonLink>
            </div>
        </div>
    )
}
