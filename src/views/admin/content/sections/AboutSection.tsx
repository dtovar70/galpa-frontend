import { useFieldArray, useWatch } from 'react-hook-form'

import { Input, Select, Textarea, type SelectOption } from '@/components/ui'
import { placeholderValues } from '@/utils/content'
import { useSiteContent } from '@/utils/hooks/useSiteContent'
import { ABOUT_VALUE_ICON_LABELS } from '@/views/about/components/valueIcons'
import { FieldGroup, FieldRow } from '@/views/admin/content/components/FieldGroup'
import { placeholderHint } from '@/views/admin/content/components/placeholders'
import { SectionFormLayout } from '@/views/admin/content/components/SectionFormLayout'
import { SortableList } from '@/views/admin/content/components/SortableList'
import { TitleField } from '@/views/admin/content/components/TitleField'
import { useSectionForm, type SectionFormProps } from '@/views/admin/content/hooks/useSectionForm'
import {
    ABOUT_PLACEHOLDERS,
    ABOUT_VALUE_ICONS,
    CONTENT_LIMITS,
    CONTENT_LIST_SIZES,
    SECTION_FORMS,
} from '@/views/admin/content/schema/content.schema'

const ICON_OPTIONS: SelectOption[] = ABOUT_VALUE_ICONS.map((icon) => ({
    value: icon,
    label: ABOUT_VALUE_ICON_LABELS[icon],
}))

export function AboutSection(props: SectionFormProps<'about'>) {
    const state = useSectionForm(SECTION_FORMS.about, props)
    const {
        control,
        register,
        formState: { errors },
    } = state.form
    const paragraphs = useFieldArray({ control, name: 'paragraphs' })
    const values = useFieldArray({ control, name: 'values' })
    const stats = useFieldArray({ control, name: 'stats' })
    const [title, valuesTitle, statsTitle] = useWatch({
        control,
        name: ['title', 'valuesTitle', 'statsTitle'],
    })
    const placeholders = placeholderValues(useSiteContent())

    return (
        <SectionFormLayout state={state}>
            <FieldGroup title="Encabezado e historia">
                <FieldRow>
                    <Input label="Etiqueta" error={errors.badge?.message} {...register('badge')} />
                    <Input
                        label="Etiqueta de la imagen"
                        error={errors.imageBadge?.message}
                        {...register('imageBadge')}
                    />
                </FieldRow>
                <TitleField
                    label="Título"
                    size="hero"
                    value={title}
                    error={errors.title?.message}
                    registration={register('title')}
                />
                <div className="space-y-2">
                    <p className="text-sm font-semibold text-ink">Párrafos</p>
                    <p className="text-xs text-ink-soft">
                        El primero se muestra más grande.{' '}
                        {placeholderHint(ABOUT_PLACEHOLDERS, placeholders)}
                    </p>
                    <SortableList
                        label="Párrafos de la historia"
                        itemIds={paragraphs.fields.map((field) => field.id)}
                        itemName={(position) => `Párrafo ${position}`}
                        onMove={paragraphs.move}
                        onRemove={paragraphs.remove}
                        onAdd={() => paragraphs.append({ value: '' })}
                        addLabel="Agregar párrafo"
                        minItems={CONTENT_LIST_SIZES.paragraphs.min}
                        maxItems={CONTENT_LIST_SIZES.paragraphs.max}
                        error={errors.paragraphs?.message ?? errors.paragraphs?.root?.message}
                        renderItem={(index) => (
                            <Textarea
                                label={`Párrafo ${index + 1}`}
                                hideLabel
                                rows={4}
                                error={errors.paragraphs?.[index]?.value?.message}
                                maxLength={CONTENT_LIMITS.paragraph}
                                {...register(`paragraphs.${index}.value`)}
                            />
                        )}
                    />
                </div>
                <Input
                    label="Botón"
                    hint="Lleva a Contacto."
                    error={errors.ctaLabel?.message}
                    {...register('ctaLabel')}
                />
            </FieldGroup>

            <FieldGroup title="Valores" description="Las tarjetas «Lo que no negociamos».">
                <Input
                    label="Antetítulo"
                    error={errors.valuesEyebrow?.message}
                    {...register('valuesEyebrow')}
                />
                <TitleField
                    label="Título"
                    value={valuesTitle}
                    error={errors.valuesTitle?.message}
                    registration={register('valuesTitle')}
                />
                <Input
                    label="Descripción"
                    optional
                    error={errors.valuesDescription?.message}
                    {...register('valuesDescription')}
                />
                <SortableList
                    label="Valores"
                    itemIds={values.fields.map((field) => field.id)}
                    itemName={(position) => `Valor ${position}`}
                    onMove={values.move}
                    onRemove={values.remove}
                    onAdd={() => values.append({ icon: 'star', title: '', description: '' })}
                    addLabel="Agregar valor"
                    minItems={CONTENT_LIST_SIZES.values.min}
                    maxItems={CONTENT_LIST_SIZES.values.max}
                    error={errors.values?.message ?? errors.values?.root?.message}
                    renderItem={(index) => (
                        <>
                            <FieldRow>
                                <Select
                                    label="Ícono"
                                    options={ICON_OPTIONS}
                                    error={errors.values?.[index]?.icon?.message}
                                    {...register(`values.${index}.icon`)}
                                />
                                <Input
                                    label="Título"
                                    error={errors.values?.[index]?.title?.message}
                                    {...register(`values.${index}.title`)}
                                />
                            </FieldRow>
                            <Textarea
                                label="Descripción"
                                rows={2}
                                error={errors.values?.[index]?.description?.message}
                                maxLength={CONTENT_LIMITS.text}
                                {...register(`values.${index}.description`)}
                            />
                        </>
                    )}
                />
            </FieldGroup>

            <FieldGroup title="Cifras" description="Los números grandes al final de la página.">
                <Input
                    label="Antetítulo"
                    error={errors.statsEyebrow?.message}
                    {...register('statsEyebrow')}
                />
                <TitleField
                    label="Título"
                    value={statsTitle}
                    error={errors.statsTitle?.message}
                    registration={register('statsTitle')}
                />
                <SortableList
                    label="Cifras"
                    itemIds={stats.fields.map((field) => field.id)}
                    itemName={(position) => `Cifra ${position}`}
                    onMove={stats.move}
                    onRemove={stats.remove}
                    onAdd={() => stats.append({ value: '', label: '' })}
                    addLabel="Agregar cifra"
                    minItems={CONTENT_LIST_SIZES.stats.min}
                    maxItems={CONTENT_LIST_SIZES.stats.max}
                    error={errors.stats?.message ?? errors.stats?.root?.message}
                    renderItem={(index) => (
                        <FieldRow>
                            <Input
                                label="Cifra"
                                placeholder="+4.800"
                                error={errors.stats?.[index]?.value?.message}
                                {...register(`stats.${index}.value`)}
                            />
                            <Input
                                label="Texto"
                                placeholder="pedidos entregados"
                                error={errors.stats?.[index]?.label?.message}
                                {...register(`stats.${index}.label`)}
                            />
                        </FieldRow>
                    )}
                />
            </FieldGroup>
        </SectionFormLayout>
    )
}
