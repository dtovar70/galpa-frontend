import { AtSign } from 'lucide-react'
import { Controller, useWatch } from 'react-hook-form'

import { MobilePhoneField } from '@/components/shared/MobilePhoneField'
import { Input } from '@/components/ui'
import { formatVePhone, whatsappUrl } from '@/utils/content'
import { FieldGroup, FieldRow } from '@/views/admin/content/components/FieldGroup'
import { SectionFormLayout } from '@/views/admin/content/components/SectionFormLayout'
import { useSectionForm, type SectionFormProps } from '@/views/admin/content/hooks/useSectionForm'
import {
    SECTION_FORMS,
    VE_MOBILE_PATTERN,
    VE_PHONE_PATTERN,
} from '@/views/admin/content/schema/content.schema'

function handleHint(network: string, handle: string, url: (handle: string) => string): string {
    const clean = handle.trim().replace(/^@+/, '')
    return clean
        ? `Sin @. Enlace: ${url(clean)}`
        : `Sin @. Déjalo vacío para no mostrar ${network}.`
}

export function ContactSection(props: SectionFormProps<'contact'>) {
    const state = useSectionForm(SECTION_FORMS.contact, props)
    const {
        control,
        register,
        formState: { errors },
    } = state.form
    const [phone, whatsapp, instagram, tiktok] = useWatch({
        control,
        name: ['phone', 'whatsapp', 'instagram', 'tiktok'],
    })

    return (
        <SectionFormLayout state={state}>
            <FieldGroup title="Datos de contacto">
                <Input
                    label="Correo"
                    type="email"
                    autoComplete="off"
                    error={errors.email?.message}
                    {...register('email')}
                />
                <FieldRow>
                    <Input
                        label="Teléfono"
                        inputMode="tel"
                        placeholder="0412-5550134"
                        hint={
                            VE_PHONE_PATTERN.test(phone.trim())
                                ? `Se muestra como ${formatVePhone(phone.trim())}.`
                                : 'Formato 0412-5550134 (también fijos, 0251-1234567).'
                        }
                        error={errors.phone?.message}
                        {...register('phone')}
                    />
                    <Controller
                        control={control}
                        name="whatsapp"
                        render={({ field }) => (
                            <MobilePhoneField
                                label="WhatsApp"
                                hint={
                                    VE_MOBILE_PATTERN.test(whatsapp.trim())
                                        ? `Enlace: ${whatsappUrl(whatsapp.trim())}`
                                        : 'Elige el código y escribe los 7 números.'
                                }
                                error={errors.whatsapp?.message}
                                {...field}
                            />
                        )}
                    />
                </FieldRow>
                <FieldRow>
                    <Input
                        label="Ciudad del taller"
                        error={errors.city?.message}
                        {...register('city')}
                    />
                    <Input
                        label="Horario"
                        error={errors.schedule?.message}
                        {...register('schedule')}
                    />
                </FieldRow>
            </FieldGroup>

            <FieldGroup title="Redes sociales" description="Se muestran en el pie de página.">
                <FieldRow>
                    <Input
                        label="Usuario de Instagram"
                        optional
                        autoCapitalize="none"
                        spellCheck={false}
                        leadingIcon={<AtSign aria-hidden="true" className="size-4" />}
                        hint={handleHint(
                            'Instagram',
                            instagram,
                            (handle) => `https://instagram.com/${handle}`,
                        )}
                        error={errors.instagram?.message}
                        {...register('instagram')}
                    />
                    <Input
                        label="Usuario de TikTok"
                        optional
                        autoCapitalize="none"
                        spellCheck={false}
                        leadingIcon={<AtSign aria-hidden="true" className="size-4" />}
                        hint={handleHint(
                            'TikTok',
                            tiktok,
                            (handle) => `https://tiktok.com/@${handle}`,
                        )}
                        error={errors.tiktok?.message}
                        {...register('tiktok')}
                    />
                </FieldRow>
            </FieldGroup>
        </SectionFormLayout>
    )
}
