import { useWatch } from 'react-hook-form'

import { Input, Textarea } from '@/components/ui'
import { fillPlaceholders, formatShortMoney } from '@/utils/content'
import { FieldGroup, FieldRow } from '@/views/admin/content/components/FieldGroup'
import { SectionFormLayout } from '@/views/admin/content/components/SectionFormLayout'
import { useSectionForm, type SectionFormProps } from '@/views/admin/content/hooks/useSectionForm'
import { CONTENT_LIMITS, SECTION_FORMS } from '@/views/admin/content/schema/content.schema'
import { toOptionalNumber } from '@/views/admin/products/schema/product.schema'

function isAmount(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

export function ShippingSection(props: SectionFormProps<'shipping'>) {
    const state = useSectionForm(SECTION_FORMS.shipping, props)
    const {
        control,
        register,
        formState: { errors },
    } = state.form
    const [freeThreshold, flatRate, freeShippingCopy] = useWatch({
        control,
        name: ['freeThreshold', 'flatRate', 'freeShippingCopy'],
    })
    const threshold = isAmount(freeThreshold) ? formatShortMoney(freeThreshold) : '—'
    const rate = isAmount(flatRate) ? formatShortMoney(flatRate) : '—'

    return (
        <SectionFormLayout state={state}>
            <FieldGroup
                title="Costo del envío"
                description="El carrito y el checkout cobran la tarifa cuando el subtotal no llega al monto de envío gratis."
            >
                <FieldRow>
                    <Input
                        label="Envío gratis desde (USD)"
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min={0}
                        hint="Con 0, todos los pedidos van sin costo de envío."
                        error={errors.freeThreshold?.message}
                        {...register('freeThreshold', { setValueAs: toOptionalNumber })}
                    />
                    <Input
                        label="Tarifa de envío (USD)"
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min={0}
                        error={errors.flatRate?.message}
                        {...register('flatRate', { setValueAs: toOptionalNumber })}
                    />
                </FieldRow>
                <p className="rounded-xl bg-frost-50 px-4 py-3 text-sm text-ink">
                    Pedidos desde <strong>{threshold}</strong>: envío gratis. Por debajo se cobran{' '}
                    <strong>{rate}</strong>.
                </p>
            </FieldGroup>

            <FieldGroup title="Textos de envío">
                <Input
                    label="Texto de envío gratis"
                    hint={`Menú móvil, página de producto y preguntas. {envioGratis} se cambia por el monto: «${fillPlaceholders(freeShippingCopy, { envioGratis: threshold })}».`}
                    error={errors.freeShippingCopy?.message}
                    {...register('freeShippingCopy')}
                />
                <Textarea
                    label="Texto de despacho"
                    rows={2}
                    hint="Página de producto y preguntas frecuentes ({despacho}): cuándo salen los pedidos pagados."
                    error={errors.dispatchCopy?.message}
                    maxLength={CONTENT_LIMITS.announcement}
                    {...register('dispatchCopy')}
                />
            </FieldGroup>
        </SectionFormLayout>
    )
}
