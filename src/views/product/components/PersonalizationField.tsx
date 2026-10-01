import { PERSONALIZATION_MAX_LENGTH } from '@/@types/order'
import { WhatsAppInlineLink } from '@/components/shared/WhatsAppInlineLink'
import { Textarea } from '@/components/ui'

export interface PersonalizationFieldProps {
    productName: string
    /** The product's own print text, shown as the example. */
    printText: string
    value: string
    onChange: (value: string) => void
    /** The line has the customer's own image: the text becomes extra instructions. */
    withDesign?: boolean
}

/** Optional text to print on a `personalizable` product, plus a WhatsApp way for photos/logos. */
export function PersonalizationField({
    productName,
    printText,
    value,
    onChange,
    withDesign = false,
}: PersonalizationFieldProps) {
    return (
        <div className="space-y-2">
            <Textarea
                label="Personalización"
                optional
                rows={2}
                maxLength={PERSONALIZATION_MAX_LENGTH}
                showCount
                placeholder={printText ? `Ej. ${printText}` : 'Ej. Feliz cumpleaños, Ana'}
                hint={
                    withDesign
                        ? 'Indicaciones extra para tu diseño: un texto, un nombre o una fecha.'
                        : '¿Qué texto, nombre o fecha quieres en tu pieza?'
                }
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
            <p className="text-sm text-ink-soft">
                ¿Quieres enviarnos una foto, tu logo o darnos más detalles?{' '}
                <WhatsAppInlineLink
                    message={`Hola, quiero personalizar «${productName}». Te envío los detalles:`}
                >
                    Escríbenos por WhatsApp
                </WhatsAppInlineLink>
            </p>
        </div>
    )
}
