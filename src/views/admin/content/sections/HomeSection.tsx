import { useFieldArray, useWatch } from 'react-hook-form'

import { Input, Textarea } from '@/components/ui'
import { categoryCountPhrase } from '@/utils/content'
import { FieldGroup, FieldRow } from '@/views/admin/content/components/FieldGroup'
import { SectionFormLayout } from '@/views/admin/content/components/SectionFormLayout'
import { SortableList } from '@/views/admin/content/components/SortableList'
import { TitleField } from '@/views/admin/content/components/TitleField'
import { useSectionForm, type SectionFormProps } from '@/views/admin/content/hooks/useSectionForm'
import {
    CONTENT_LIMITS,
    CONTENT_LIST_SIZES,
    SECTION_FORMS,
} from '@/views/admin/content/schema/content.schema'
import { useCategories } from '@/views/catalog/hooks/useCategories'

export function HomeSection(props: SectionFormProps<'home'>) {
    const state = useSectionForm(SECTION_FORMS.home, props)
    const {
        control,
        register,
        formState: { errors },
    } = state.form
    const features = useFieldArray({ control, name: 'heroFeatures' })
    const steps = useFieldArray({ control, name: 'steps' })
    const testimonials = useFieldArray({ control, name: 'testimonials' })
    const [heroTitle, categoriesTitle, featuredTitle, stepsTitle, testimonialsTitle, ctaTitle] =
        useWatch({
            control,
            name: [
                'heroTitle',
                'categoriesTitle',
                'featuredTitle',
                'stepsTitle',
                'testimonialsTitle',
                'ctaTitle',
            ],
        })
    const { data: categories } = useCategories()
    const categoriesPhrase = categoryCountPhrase(categories?.length)

    return (
        <SectionFormLayout state={state}>
            <FieldGroup title="Portada" description="Lo primero que se ve al entrar a la tienda.">
                <Input
                    label="Etiqueta"
                    hint="El recuadro amarillo sobre el titular."
                    error={errors.heroBadge?.message}
                    {...register('heroBadge')}
                />
                <TitleField
                    label="Titular"
                    size="hero"
                    value={heroTitle}
                    error={errors.heroTitle?.message}
                    registration={register('heroTitle')}
                />
                <Textarea
                    label="Subtítulo"
                    rows={3}
                    error={errors.heroSubtitle?.message}
                    maxLength={CONTENT_LIMITS.text}
                    {...register('heroSubtitle')}
                />
                <FieldRow>
                    <Input
                        label="Botón principal"
                        hint="Lleva al catálogo."
                        error={errors.heroPrimaryCta?.message}
                        {...register('heroPrimaryCta')}
                    />
                    <Input
                        label="Botón secundario"
                        hint="Lleva a Contacto."
                        error={errors.heroSecondaryCta?.message}
                        {...register('heroSecondaryCta')}
                    />
                </FieldRow>
                <div className="space-y-2">
                    <p className="text-sm font-semibold text-ink">Ventajas con check</p>
                    <SortableList
                        label="Ventajas de la portada"
                        itemIds={features.fields.map((field) => field.id)}
                        itemName={(position) => `Ventaja ${position}`}
                        onMove={features.move}
                        onRemove={features.remove}
                        onAdd={() => features.append({ value: '' })}
                        addLabel="Agregar ventaja"
                        minItems={CONTENT_LIST_SIZES.heroFeatures.min}
                        maxItems={CONTENT_LIST_SIZES.heroFeatures.max}
                        emptyText="Sin ventajas: la línea con checks no se muestra."
                        error={errors.heroFeatures?.message ?? errors.heroFeatures?.root?.message}
                        renderItem={(index) => (
                            <Input
                                label={`Ventaja ${index + 1}`}
                                hideLabel
                                error={errors.heroFeatures?.[index]?.value?.message}
                                {...register(`heroFeatures.${index}.value`)}
                            />
                        )}
                    />
                </div>
            </FieldGroup>

            <FieldGroup title="Categorías" description="El bloque con las tarjetas de categorías.">
                <Input
                    label="Antetítulo"
                    error={errors.categoriesEyebrow?.message}
                    {...register('categoriesEyebrow')}
                />
                <TitleField
                    label="Título"
                    value={categoriesTitle}
                    error={errors.categoriesTitle?.message}
                    registration={register('categoriesTitle')}
                />
                <Textarea
                    label="Descripción"
                    rows={2}
                    hint={`Puedes usar {categorias}: se cambia por la cantidad de categorías en palabras (hoy «${categoriesPhrase}»), así se actualiza sola al crear o borrar una.`}
                    error={errors.categoriesDescription?.message}
                    maxLength={CONTENT_LIMITS.text}
                    {...register('categoriesDescription')}
                />
            </FieldGroup>

            <FieldGroup title="Favoritos" description="Los productos destacados.">
                <FieldRow>
                    <Input
                        label="Antetítulo"
                        error={errors.featuredEyebrow?.message}
                        {...register('featuredEyebrow')}
                    />
                    <Input
                        label="Botón"
                        hint="Lleva al catálogo."
                        error={errors.featuredCta?.message}
                        {...register('featuredCta')}
                    />
                </FieldRow>
                <TitleField
                    label="Título"
                    value={featuredTitle}
                    error={errors.featuredTitle?.message}
                    registration={register('featuredTitle')}
                />
                <Textarea
                    label="Descripción"
                    rows={2}
                    error={errors.featuredDescription?.message}
                    maxLength={CONTENT_LIMITS.text}
                    {...register('featuredDescription')}
                />
            </FieldGroup>

            <FieldGroup title="Cómo funciona" description="Los pasos numerados.">
                <Input
                    label="Antetítulo"
                    error={errors.stepsEyebrow?.message}
                    {...register('stepsEyebrow')}
                />
                <TitleField
                    label="Título"
                    value={stepsTitle}
                    error={errors.stepsTitle?.message}
                    registration={register('stepsTitle')}
                />
                <Input
                    label="Descripción"
                    optional
                    error={errors.stepsDescription?.message}
                    {...register('stepsDescription')}
                />
                <SortableList
                    label="Pasos"
                    itemIds={steps.fields.map((field) => field.id)}
                    itemName={(position) => `Paso ${position}`}
                    onMove={steps.move}
                    onRemove={steps.remove}
                    onAdd={() => steps.append({ title: '', description: '' })}
                    addLabel="Agregar paso"
                    minItems={CONTENT_LIST_SIZES.steps.min}
                    maxItems={CONTENT_LIST_SIZES.steps.max}
                    error={errors.steps?.message ?? errors.steps?.root?.message}
                    renderItem={(index) => (
                        <>
                            <Input
                                label="Título del paso"
                                error={errors.steps?.[index]?.title?.message}
                                {...register(`steps.${index}.title`)}
                            />
                            <Textarea
                                label="Descripción del paso"
                                rows={2}
                                error={errors.steps?.[index]?.description?.message}
                                maxLength={CONTENT_LIMITS.text}
                                {...register(`steps.${index}.description`)}
                            />
                        </>
                    )}
                />
            </FieldGroup>

            <FieldGroup
                title="Reseñas"
                description="Opiniones de clientes. Si no agregas ninguna, el bloque no se muestra en la tienda."
            >
                <Input
                    label="Antetítulo"
                    error={errors.testimonialsEyebrow?.message}
                    {...register('testimonialsEyebrow')}
                />
                <TitleField
                    label="Título"
                    value={testimonialsTitle}
                    error={errors.testimonialsTitle?.message}
                    registration={register('testimonialsTitle')}
                />
                <p className="text-sm text-ink-soft">
                    Usa opiniones reales de tus clientes y pídeles permiso antes de publicarlas.
                </p>
                <SortableList
                    label="Reseñas de clientes"
                    itemIds={testimonials.fields.map((field) => field.id)}
                    itemName={(position) => `Reseña ${position}`}
                    onMove={testimonials.move}
                    onRemove={testimonials.remove}
                    onAdd={() =>
                        testimonials.append({ quote: '', name: '', city: '', product: '' })
                    }
                    addLabel="Agregar reseña"
                    minItems={CONTENT_LIST_SIZES.testimonials.min}
                    maxItems={CONTENT_LIST_SIZES.testimonials.max}
                    emptyText="Sin reseñas: el bloque no se muestra en la página de inicio."
                    error={errors.testimonials?.message ?? errors.testimonials?.root?.message}
                    renderItem={(index) => (
                        <>
                            <Textarea
                                label="Opinión"
                                rows={3}
                                error={errors.testimonials?.[index]?.quote?.message}
                                maxLength={CONTENT_LIMITS.testimonialQuote}
                                {...register(`testimonials.${index}.quote`)}
                            />
                            <Input
                                label="Nombre del cliente"
                                error={errors.testimonials?.[index]?.name?.message}
                                {...register(`testimonials.${index}.name`)}
                            />
                            <FieldRow>
                                <Input
                                    label="Ciudad"
                                    optional
                                    error={errors.testimonials?.[index]?.city?.message}
                                    {...register(`testimonials.${index}.city`)}
                                />
                                <Input
                                    label="Producto"
                                    optional
                                    hint="Por ejemplo: Taza personalizada."
                                    error={errors.testimonials?.[index]?.product?.message}
                                    {...register(`testimonials.${index}.product`)}
                                />
                            </FieldRow>
                        </>
                    )}
                />
            </FieldGroup>

            <FieldGroup
                title="Banner final"
                description="El recuadro con el formulario del boletín."
            >
                <Input
                    label="Etiqueta"
                    error={errors.ctaBadge?.message}
                    {...register('ctaBadge')}
                />
                <TitleField
                    label="Título"
                    value={ctaTitle}
                    error={errors.ctaTitle?.message}
                    registration={register('ctaTitle')}
                />
                <Textarea
                    label="Descripción"
                    rows={2}
                    error={errors.ctaDescription?.message}
                    maxLength={CONTENT_LIMITS.text}
                    {...register('ctaDescription')}
                />
                <FieldRow>
                    <Input
                        label="Botón principal"
                        hint="Lleva a Contacto."
                        error={errors.ctaPrimary?.message}
                        {...register('ctaPrimary')}
                    />
                    <Input
                        label="Botón secundario"
                        hint="Lleva a Nosotros."
                        error={errors.ctaSecondary?.message}
                        {...register('ctaSecondary')}
                    />
                </FieldRow>
            </FieldGroup>
        </SectionFormLayout>
    )
}
