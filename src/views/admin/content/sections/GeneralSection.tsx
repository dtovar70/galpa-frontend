import { useWatch } from 'react-hook-form'

import { Input, Textarea } from '@/components/ui'
import { placeholderValues } from '@/utils/content'
import { useFillPlaceholders, useSiteContent } from '@/utils/hooks/useSiteContent'
import { FieldGroup, FieldRow } from '@/views/admin/content/components/FieldGroup'
import { placeholderHint } from '@/views/admin/content/components/placeholders'
import { SectionFormLayout } from '@/views/admin/content/components/SectionFormLayout'
import { useSectionForm, type SectionFormProps } from '@/views/admin/content/hooks/useSectionForm'
import { CONTENT_LIMITS, SECTION_FORMS } from '@/views/admin/content/schema/content.schema'

export function GeneralSection(props: SectionFormProps<'general'>) {
    const state = useSectionForm(SECTION_FORMS.general, props)
    const {
        control,
        register,
        formState: { errors },
    } = state.form
    const [brandName, titleSuffix, metaDescription] = useWatch({
        control,
        name: ['brandName', 'titleSuffix', 'metaDescription'],
    })
    const values = placeholderValues(useSiteContent())
    const fill = useFillPlaceholders()
    const pageTitle = titleSuffix.trim() ? `${brandName.trim()} — ${titleSuffix.trim()}` : brandName

    return (
        <SectionFormLayout state={state}>
            <FieldGroup title="Marca">
                <FieldRow>
                    <Input
                        label="Nombre de la marca"
                        hint="Razón social completa: se ve bajo el logo, en el pie de página y en los correos."
                        error={errors.brandName?.message}
                        {...register('brandName')}
                    />
                    <Input
                        label="Eslogan"
                        hint="Aparece bajo el logo en el pie de página."
                        error={errors.tagline?.message}
                        {...register('tagline')}
                    />
                </FieldRow>
                <Textarea
                    label="Descripción corta"
                    hint="Pie de página, junto al logo."
                    rows={3}
                    error={errors.description?.message}
                    maxLength={CONTENT_LIMITS.text}
                    {...register('description')}
                />
                <Input
                    label="Texto del buscador"
                    hint="Lo que se lee dentro del campo de búsqueda antes de escribir."
                    error={errors.searchPlaceholder?.message}
                    {...register('searchPlaceholder')}
                />
            </FieldGroup>

            <FieldGroup
                title="Buscadores y pestaña del navegador"
                description="Así aparece la tienda en Google y en la pestaña del navegador."
            >
                <Input
                    label="Complemento del título"
                    optional
                    hint={`Título de la pestaña: «${pageTitle}».`}
                    error={errors.titleSuffix?.message}
                    {...register('titleSuffix')}
                />
                <Textarea
                    label="Descripción para buscadores"
                    rows={3}
                    hint={placeholderHint(['envioGratis'], values)}
                    error={errors.metaDescription?.message}
                    maxLength={CONTENT_LIMITS.metaDescription}
                    {...register('metaDescription')}
                />
                <div className="rounded-2xl border-2 border-dashed border-line bg-page px-4 py-3">
                    <p className="text-xs font-semibold text-ink-soft">Vista previa en Google</p>
                    <p className="text-base font-semibold break-words text-frost-700">
                        {pageTitle}
                    </p>
                    <p className="text-sm break-words text-ink-soft">{fill(metaDescription)}</p>
                </div>
            </FieldGroup>
        </SectionFormLayout>
    )
}
