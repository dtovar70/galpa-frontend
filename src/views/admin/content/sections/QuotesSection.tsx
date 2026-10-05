import { useWatch } from 'react-hook-form'

import { Input, Textarea } from '@/components/ui'
import { FieldGroup } from '@/views/admin/content/components/FieldGroup'
import { SectionFormLayout } from '@/views/admin/content/components/SectionFormLayout'
import { useSectionForm, type SectionFormProps } from '@/views/admin/content/hooks/useSectionForm'
import {
    CONTENT_LIMITS,
    QUOTE_VALIDITY_DAYS,
    SECTION_FORMS,
} from '@/views/admin/content/schema/content.schema'
import { toOptionalNumber } from '@/views/admin/products/schema/product.schema'

function isDays(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value > 0
}

export function QuotesSection(props: SectionFormProps<'quotes'>) {
    const state = useSectionForm(SECTION_FORMS.quotes, props)
    const {
        control,
        register,
        formState: { errors },
    } = state.form
    const days = useWatch({ control, name: 'defaultValidityDays' })

    return (
        <SectionFormLayout state={state}>
            <FieldGroup
                title="Vigencia"
                description="Cada cotización nueva vence este número de días después de crearla. Puedes cambiar la fecha en cada cotización."
            >
                <Input
                    label="Días de vigencia"
                    type="number"
                    inputMode="numeric"
                    step={1}
                    min={QUOTE_VALIDITY_DAYS.min}
                    max={QUOTE_VALIDITY_DAYS.max}
                    hint={
                        isDays(days)
                            ? `Una cotización creada hoy se respeta durante ${days} ${days === 1 ? 'día' : 'días'}. Entre ${QUOTE_VALIDITY_DAYS.min} y ${QUOTE_VALIDITY_DAYS.max}.`
                            : `Entre ${QUOTE_VALIDITY_DAYS.min} y ${QUOTE_VALIDITY_DAYS.max} días.`
                    }
                    error={errors.defaultValidityDays?.message}
                    className="tabular-nums"
                    {...register('defaultValidityDays', { setValueAs: toOptionalNumber })}
                />
            </FieldGroup>

            <FieldGroup
                title="Términos y condiciones"
                description="El texto con el que empieza cada cotización nueva. Se puede ajustar en cada cotización antes de enviarla."
            >
                <Textarea
                    label="Términos y condiciones por defecto"
                    optional
                    rows={5}
                    maxLength={CONTENT_LIMITS.quoteTerms}
                    error={errors.defaultTerms?.message}
                    {...register('defaultTerms')}
                />
            </FieldGroup>
        </SectionFormLayout>
    )
}
