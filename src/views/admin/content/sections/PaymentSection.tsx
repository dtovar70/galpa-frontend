import { Controller, useWatch } from 'react-hook-form'

import { IdNumberField } from '@/components/shared/IdNumberField'
import { MobilePhoneField } from '@/components/shared/MobilePhoneField'
import { Input, Select, Textarea } from '@/components/ui'
import { bankOptionLabel, useBanks } from '@/utils/hooks/useBanks'
import { FieldGroup, FieldRow } from '@/views/admin/content/components/FieldGroup'
import { PaymentPreviewCard } from '@/views/admin/content/components/PaymentPreviewCard'
import { SectionFormLayout } from '@/views/admin/content/components/SectionFormLayout'
import { useSectionForm, type SectionFormProps } from '@/views/admin/content/hooks/useSectionForm'
import { CONTENT_LIMITS, SECTION_FORMS } from '@/views/admin/content/schema/content.schema'

export function PaymentSection(props: SectionFormProps<'payment'>) {
    const state = useSectionForm(SECTION_FORMS.payment, props)
    const {
        control,
        register,
        setValue,
        formState: { errors },
    } = state.form
    const payment = useWatch({ control })
    const banks = useBanks()
    // A saved bank that was deactivated (or removed) still shows up, so the form reads right;
    // saving asks for an active one.
    const savedCode = props.saved.value.bankCode
    const options =
        savedCode && !banks.options.some((option) => option.value === savedCode)
            ? [
                  ...banks.options,
                  {
                      value: savedCode,
                      label: `${bankOptionLabel({ code: savedCode, name: props.saved.value.bankName })}${banks.isSuccess ? ' (inactivo)' : ''}`,
                  },
              ]
            : banks.options

    const bankField = register('bankCode', {
        onChange: (event: { target: { value: string } }) => {
            const bank = banks.banks.find((item) => item.code === event.target.value)
            if (bank) setValue('bankName', bank.name, { shouldDirty: true, shouldValidate: true })
        },
    })

    return (
        <SectionFormLayout state={state}>
            <FieldGroup
                title="Datos de Pago Móvil"
                description="Revisa bien cada dato: el cliente los copiará para pagarte."
            >
                <Select
                    label="Banco"
                    placeholder={banks.isPending ? 'Cargando bancos…' : 'Elige el banco'}
                    options={options}
                    hint="La lista de bancos se edita en Catálogos."
                    error={
                        errors.bankCode?.message ??
                        errors.bankName?.message ??
                        (banks.isError
                            ? 'No pudimos cargar la lista de bancos. Recarga la página.'
                            : undefined)
                    }
                    {...bankField}
                />
                <FieldRow>
                    <Controller
                        control={control}
                        name="phone"
                        render={({ field }) => (
                            <MobilePhoneField
                                label="Teléfono"
                                hint="Los códigos se editan en Catálogos."
                                error={errors.phone?.message}
                                {...field}
                            />
                        )}
                    />
                    <Controller
                        control={control}
                        name="idNumber"
                        render={({ field }) => (
                            <IdNumberField
                                label="Cédula o RIF"
                                error={errors.idNumber?.message}
                                {...field}
                            />
                        )}
                    />
                </FieldRow>
                <Input
                    label="Titular"
                    hint="Nombre de la persona o empresa dueña de la cuenta."
                    error={errors.holderName?.message}
                    {...register('holderName')}
                />
                <Textarea
                    label="Instrucciones"
                    optional
                    rows={3}
                    hint="Por ejemplo: envía la captura del pago por WhatsApp con tu número de pedido."
                    error={errors.instructions?.message}
                    maxLength={CONTENT_LIMITS.instructions}
                    {...register('instructions')}
                />
            </FieldGroup>

            <FieldGroup title="Vista previa">
                <PaymentPreviewCard
                    payment={{
                        bankCode: payment.bankCode ?? '',
                        bankName: payment.bankName ?? '',
                        phone: payment.phone?.trim() ?? '',
                        idNumber: payment.idNumber?.trim().toUpperCase() ?? '',
                        holderName: payment.holderName?.trim() ?? '',
                        instructions: payment.instructions?.trim() ?? '',
                    }}
                />
            </FieldGroup>
        </SectionFormLayout>
    )
}
