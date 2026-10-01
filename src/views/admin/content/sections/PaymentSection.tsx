import {
    Controller,
    useWatch,
    type Control,
    type UseFormRegister,
    type UseFormSetValue,
} from 'react-hook-form'

import { BANK_ACCOUNT_TYPES, type BankAccountType, type PaymentContent } from '@/@types/content'
import { IdNumberField } from '@/components/shared/IdNumberField'
import { MobilePhoneField } from '@/components/shared/MobilePhoneField'
import { Input, Select, Switch, Textarea, type SelectOption } from '@/components/ui'
import { bankOptionLabel, useBanks } from '@/utils/hooks/useBanks'
import { FieldGroup, FieldRow } from '@/views/admin/content/components/FieldGroup'
import { PaymentPreviewCard } from '@/views/admin/content/components/PaymentPreviewCard'
import { SectionFormLayout } from '@/views/admin/content/components/SectionFormLayout'
import { useSectionForm, type SectionFormProps } from '@/views/admin/content/hooks/useSectionForm'
import {
    CONTENT_LIMITS,
    SECTION_FORMS,
    type PaymentFormValues,
} from '@/views/admin/content/schema/content.schema'

const ACCOUNT_TYPE_LABELS: Record<BankAccountType, string> = {
    CORRIENTE: 'Corriente',
    AHORRO: 'Ahorro',
}

const ACCOUNT_TYPE_OPTIONS: SelectOption[] = BANK_ACCOUNT_TYPES.map((type) => ({
    value: type,
    label: ACCOUNT_TYPE_LABELS[type],
}))

type BankMethod = 'pagoMovil' | 'transfer'

interface EnableSwitchProps {
    control: Control<PaymentFormValues>
    name: 'pagoMovil.enabled' | 'transfer.enabled' | 'zelle.enabled' | 'binance.enabled'
    label: string
}

/** "Activo" switch of one method, next to its title. */
function EnableSwitch({ control, name, label }: EnableSwitchProps) {
    return (
        <Controller
            control={control}
            name={name}
            render={({ field }) => (
                <span className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
                    {field.value ? 'Activo' : 'Inactivo'}
                    <Switch checked={field.value} onChange={field.onChange} label={label} />
                </span>
            )}
        />
    )
}

interface BankSelectProps {
    method: BankMethod
    saved: PaymentContent
    error: string | undefined
    register: UseFormRegister<PaymentFormValues>
    setValue: UseFormSetValue<PaymentFormValues>
}

/** The bank of a bolívar method; picking one also fills its name. */
function BankSelect({ method, saved, error, register, setValue }: BankSelectProps) {
    const banks = useBanks()
    // A saved bank that was deactivated (or removed) still shows up, so the form reads right;
    // saving asks for an active one.
    const savedBank = saved[method]
    const options =
        savedBank.bankCode && !banks.options.some((option) => option.value === savedBank.bankCode)
            ? [
                  ...banks.options,
                  {
                      value: savedBank.bankCode,
                      label: `${bankOptionLabel({ code: savedBank.bankCode, name: savedBank.bankName })}${banks.isSuccess ? ' (inactivo)' : ''}`,
                  },
              ]
            : banks.options

    const field = register(`${method}.bankCode`, {
        onChange: (event: { target: { value: string } }) => {
            const bank = banks.banks.find((item) => item.code === event.target.value)
            if (bank) {
                setValue(`${method}.bankName`, bank.name, {
                    shouldDirty: true,
                    shouldValidate: true,
                })
            }
        },
    })

    return (
        <Select
            label="Banco"
            placeholder={banks.isPending ? 'Cargando bancos…' : 'Elige el banco'}
            options={options}
            hint="La lista de bancos se edita en Catálogos."
            error={
                error ??
                (banks.isError
                    ? 'No pudimos cargar la lista de bancos. Recarga la página.'
                    : undefined)
            }
            {...field}
        />
    )
}

export function PaymentSection(props: SectionFormProps<'payment'>) {
    const state = useSectionForm(SECTION_FORMS.payment, props)
    const {
        control,
        register,
        setValue,
        formState: { errors },
    } = state.form
    const payment = useWatch({ control })

    return (
        <SectionFormLayout state={state}>
            <FieldGroup
                title="Pago Móvil"
                description="En bolívares, a la tasa BCV. Revisa bien cada dato: el cliente los copiará para pagarte."
                action={
                    <EnableSwitch
                        control={control}
                        name="pagoMovil.enabled"
                        label="Ofrecer Pago Móvil"
                    />
                }
            >
                <BankSelect
                    method="pagoMovil"
                    saved={props.saved.value}
                    error={
                        errors.pagoMovil?.bankCode?.message ?? errors.pagoMovil?.bankName?.message
                    }
                    register={register}
                    setValue={setValue}
                />
                <FieldRow>
                    <Controller
                        control={control}
                        name="pagoMovil.phone"
                        render={({ field }) => (
                            <MobilePhoneField
                                label="Teléfono"
                                hint="Los códigos se editan en Catálogos."
                                error={errors.pagoMovil?.phone?.message}
                                {...field}
                            />
                        )}
                    />
                    <Controller
                        control={control}
                        name="pagoMovil.idNumber"
                        render={({ field }) => (
                            <IdNumberField
                                label="Cédula o RIF"
                                error={errors.pagoMovil?.idNumber?.message}
                                {...field}
                            />
                        )}
                    />
                </FieldRow>
                <Input
                    label="Titular"
                    hint="Nombre de la persona o empresa dueña de la cuenta."
                    error={errors.pagoMovil?.holderName?.message}
                    {...register('pagoMovil.holderName')}
                />
            </FieldGroup>

            <FieldGroup
                title="Transferencia bancaria"
                description="En bolívares, a la tasa BCV."
                action={
                    <EnableSwitch
                        control={control}
                        name="transfer.enabled"
                        label="Ofrecer transferencia bancaria"
                    />
                }
            >
                <BankSelect
                    method="transfer"
                    saved={props.saved.value}
                    error={errors.transfer?.bankCode?.message ?? errors.transfer?.bankName?.message}
                    register={register}
                    setValue={setValue}
                />
                <FieldRow>
                    <Input
                        label="Número de cuenta"
                        inputMode="numeric"
                        maxLength={20}
                        hint="Los 20 dígitos de la cuenta."
                        error={errors.transfer?.accountNumber?.message}
                        className="font-tech"
                        {...register('transfer.accountNumber')}
                    />
                    <Select
                        label="Tipo de cuenta"
                        options={ACCOUNT_TYPE_OPTIONS}
                        error={errors.transfer?.accountType?.message}
                        {...register('transfer.accountType')}
                    />
                </FieldRow>
                <FieldRow>
                    <Controller
                        control={control}
                        name="transfer.idNumber"
                        render={({ field }) => (
                            <IdNumberField
                                label="Cédula o RIF"
                                error={errors.transfer?.idNumber?.message}
                                {...field}
                            />
                        )}
                    />
                    <Input
                        label="Titular"
                        error={errors.transfer?.holderName?.message}
                        {...register('transfer.holderName')}
                    />
                </FieldRow>
            </FieldGroup>

            <FieldGroup
                title="Zelle"
                description="En dólares."
                action={
                    <EnableSwitch control={control} name="zelle.enabled" label="Ofrecer Zelle" />
                }
            >
                <FieldRow>
                    <Input
                        label="Correo de Zelle"
                        type="email"
                        error={errors.zelle?.email?.message}
                        {...register('zelle.email')}
                    />
                    <Input
                        label="Titular"
                        error={errors.zelle?.holderName?.message}
                        {...register('zelle.holderName')}
                    />
                </FieldRow>
            </FieldGroup>

            <FieldGroup
                title="Binance Pay"
                description="En dólares (USDT)."
                action={
                    <EnableSwitch
                        control={control}
                        name="binance.enabled"
                        label="Ofrecer Binance Pay"
                    />
                }
            >
                <FieldRow>
                    <Input
                        label="Binance Pay ID"
                        inputMode="numeric"
                        error={errors.binance?.payId?.message}
                        className="font-tech"
                        {...register('binance.payId')}
                    />
                    <Input
                        label="Correo de la cuenta"
                        optional
                        type="email"
                        error={errors.binance?.email?.message}
                        {...register('binance.email')}
                    />
                </FieldRow>
                <Input
                    label="Titular"
                    optional
                    error={errors.binance?.holderName?.message}
                    {...register('binance.holderName')}
                />
            </FieldGroup>

            <FieldGroup title="Instrucciones generales">
                <Textarea
                    label="Instrucciones"
                    optional
                    rows={3}
                    hint="Se muestran con cualquier método. Por ejemplo: incluye tu número de pedido en el concepto."
                    error={errors.instructions?.message}
                    maxLength={CONTENT_LIMITS.instructions}
                    {...register('instructions')}
                />
            </FieldGroup>

            <FieldGroup title="Vista previa">
                <PaymentPreviewCard payment={payment} />
            </FieldGroup>
        </SectionFormLayout>
    )
}
