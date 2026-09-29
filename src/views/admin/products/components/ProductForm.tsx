import { useId, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Save, Trash2 } from 'lucide-react'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'

import type { AdminProduct, ProductInput } from '@/@types/admin'
import { ProductIllustration } from '@/components/shared/ProductIllustration'
import {
    Alert,
    Button,
    Card,
    Input,
    OptionalMark,
    Select,
    Switch,
    Textarea,
    type SelectOption,
} from '@/components/ui'
import { cn } from '@/utils/cn'
import { formatCurrency } from '@/utils/formatCurrency'
import { toColorInputValue } from '@/utils/color'
import { slugify } from '@/utils/slugify'
import { useAdminCategories } from '@/views/admin/hooks/useAdminCategories'
import {
    HEX_COLOR_PATTERN,
    MAX_HIGHLIGHTS,
    MAX_VARIANTS,
    PRODUCT_DESCRIPTION_MAX_LENGTH,
    PRODUCT_TAG_LABELS,
    PRODUCT_TAGS,
    productFormSchema,
    toOptionalNumber,
    toProductInput,
    variantsStockTotal,
    type ProductFormValues,
} from '@/views/admin/products/schema/product.schema'
import { applyServerErrors } from '@/views/admin/products/utils/applyServerErrors'

const sectionTitleClass = 'font-display text-xl text-ink'

const iconButtonClass =
    'flex size-11 shrink-0 items-center justify-center rounded-full text-ink-soft transition hover:bg-blush-100 hover:text-blush-700 focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40'

export interface ProductFormProps {
    mode: 'create' | 'edit'
    initialValues: Partial<ProductFormValues>
    onSubmit: (input: ProductInput) => Promise<AdminProduct>
}

export function ProductForm({ mode, initialValues, onSubmit }: ProductFormProps) {
    const { data: categories } = useAdminCategories()
    const [serverError, setServerError] = useState<string | null>(null)
    /** Once the slug is typed by hand, the name stops rewriting it. */
    const [isSlugCustom, setIsSlugCustom] = useState(mode === 'edit')

    const {
        control,
        register,
        handleSubmit,
        setError,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema),
        defaultValues: initialValues,
    })

    const highlights = useFieldArray({ control, name: 'highlights' })
    const isHighlightsFull = highlights.fields.length >= MAX_HIGHLIGHTS
    const highlightsLimitId = useId()
    const variants = useFieldArray({ control, name: 'variants' })
    const [category, colorHex, printText, variantValues, basePrice] = useWatch({
        control,
        name: ['categorySlug', 'colorHex', 'printText', 'variants', 'price'],
    })

    /** What a variant ends up costing, shown under its price adjustment. */
    const finalPriceHint = (index: number): string | undefined => {
        const delta = Number(variantValues?.[index]?.priceDelta ?? 0)
        const base = Number(basePrice)
        if (!Number.isFinite(base) || !Number.isFinite(delta)) return undefined
        return `Precio final: ${formatCurrency(base + delta)}`
    }

    const categoryOptions: SelectOption[] = (categories ?? []).map((item) => ({
        value: item.slug,
        label: item.name,
    }))
    const accentColor = categories?.find((item) => item.slug === category)?.colorHex

    const submit = handleSubmit(async (values) => {
        setServerError(null)

        // On success the page navigates away (create: to the edit page for photos; edit:
        // back to the list, which shows the notice), so there is nothing to reset here.
        try {
            await onSubmit(toProductInput(values, mode))
        } catch (error) {
            setServerError(applyServerErrors(error, setError))
        }
    })

    const nameField = register('name', {
        onChange: (event: { target: { value: string } }) => {
            if (!isSlugCustom) {
                setValue('slug', slugify(event.target.value).slice(0, 80), {
                    shouldValidate: Boolean(errors.slug),
                })
            }
        },
    })
    const slugField = register('slug', {
        onChange: (event: { target: { value: string } }) => {
            setIsSlugCustom(event.target.value !== '')
        },
    })

    return (
        <form
            onSubmit={submit}
            noValidate
            className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]"
        >
            <div className="min-w-0 space-y-6">
                <Card className="space-y-5">
                    <h2 className={sectionTitleClass}>Información básica</h2>
                    <Input label="Nombre" error={errors.name?.message} {...nameField} />
                    <Input
                        label="Slug (URL)"
                        hint={
                            mode === 'create'
                                ? 'Se genera a partir del nombre; puedes cambiarlo.'
                                : 'Cambiarlo rompe los enlaces que ya se hayan compartido.'
                        }
                        placeholder="taza-cafe-primero"
                        autoCapitalize="none"
                        spellCheck={false}
                        error={errors.slug?.message}
                        {...slugField}
                    />
                    {/*
                     * Remounted once the categories arrive: the hidden <select> can only show the
                     * saved value after its <option> exists.
                     */}
                    <Select
                        key={categories ? 'loaded' : 'loading'}
                        label="Categoría"
                        placeholder={categories ? 'Elige una categoría' : 'Cargando categorías…'}
                        disabled={!categories}
                        options={categoryOptions}
                        error={errors.categorySlug?.message}
                        {...register('categorySlug')}
                    />
                    <Textarea
                        label="Descripción"
                        optional
                        rows={5}
                        error={errors.description?.message}
                        maxLength={PRODUCT_DESCRIPTION_MAX_LENGTH}
                        {...register('description')}
                    />
                </Card>

                {/*
                 * Columns follow the card's width, not the viewport's (the sidebar and the aside
                 * eat most of it). Three only from 34rem, where every label, "(opcional)"
                 * included, fits on one line, so the inputs stay level.
                 */}
                <Card className="@container space-y-5">
                    <h2 className={sectionTitleClass}>Precio e inventario</h2>
                    <div className="grid grid-cols-1 items-start gap-5 @md:grid-cols-2 @min-[34rem]:grid-cols-3">
                        <Input
                            label="Precio (USD)"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min={0}
                            error={errors.price?.message}
                            {...register('price', { setValueAs: toOptionalNumber })}
                        />
                        <Input
                            label="Precio anterior"
                            optional
                            hint="Se ve tachado en la tienda."
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min={0}
                            error={errors.compareAtPrice?.message}
                            {...register('compareAtPrice', { setValueAs: toOptionalNumber })}
                        />
                        {variants.fields.length > 0 ? (
                            // With variants the stock is theirs; this is only their sum.
                            <Input
                                label="Stock"
                                value={`Total: ${variantsStockTotal(variantValues)}`}
                                readOnly
                                tabIndex={-1}
                                hint="Suma de las variantes. Cámbialo en cada una."
                                className="bg-cream tabular-nums"
                            />
                        ) : (
                            <Input
                                label="Stock"
                                type="number"
                                inputMode="numeric"
                                step="1"
                                min={0}
                                error={errors.stock?.message}
                                {...register('stock', { setValueAs: toOptionalNumber })}
                            />
                        )}
                    </div>
                </Card>

                <Card className="space-y-5">
                    <h2 className={sectionTitleClass}>Ilustración</h2>
                    <p className="text-sm text-ink-soft">
                        Se usa cuando el producto todavía no tiene fotos.
                    </p>
                    <Input
                        label="Texto impreso"
                        optional
                        error={errors.printText?.message}
                        {...register('printText')}
                    />
                    <div className="flex items-start gap-3">
                        <label className="mt-6.5 flex shrink-0 flex-col">
                            <span className="sr-only">Elegir color</span>
                            <input
                                type="color"
                                value={toColorInputValue(colorHex)}
                                onChange={(event) =>
                                    setValue('colorHex', event.target.value.toUpperCase(), {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                    })
                                }
                                className="size-11 cursor-pointer rounded-full border-2 border-line bg-white p-1"
                            />
                        </label>
                        <Input
                            label="Color (hex)"
                            placeholder="#FFB3D1"
                            autoCapitalize="characters"
                            spellCheck={false}
                            error={errors.colorHex?.message}
                            {...register('colorHex')}
                        />
                    </div>
                </Card>

                <Card className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className={sectionTitleClass}>Detalles destacados</h2>
                            <p
                                id={highlightsLimitId}
                                className={cn(
                                    'text-sm text-ink-soft tabular-nums',
                                    isHighlightsFull && 'font-semibold text-blush-700',
                                )}
                            >
                                {highlights.fields.length}/{MAX_HIGHLIGHTS} · Máximo{' '}
                                {MAX_HIGHLIGHTS} detalles
                            </p>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={isHighlightsFull}
                            aria-describedby={highlightsLimitId}
                            onClick={() => highlights.append({ value: '' })}
                            leadingIcon={<Plus aria-hidden="true" className="size-4" />}
                        >
                            Agregar detalle
                        </Button>
                    </div>

                    {highlights.fields.length === 0 ? (
                        <p className="text-sm text-ink-soft">
                            Sin detalles. Aparecen como lista en la página del producto.
                        </p>
                    ) : (
                        <ul className="space-y-3">
                            {highlights.fields.map((field, index) => (
                                <li key={field.id} className="flex items-start gap-2">
                                    <Input
                                        label={`Detalle ${index + 1}`}
                                        hideLabel
                                        placeholder="Apta para microondas"
                                        error={errors.highlights?.[index]?.value?.message}
                                        {...register(`highlights.${index}.value`)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => highlights.remove(index)}
                                        aria-label={`Eliminar detalle ${index + 1}`}
                                        className={iconButtonClass}
                                    >
                                        <Trash2 aria-hidden="true" className="size-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    {errors.highlights?.message ? (
                        <p role="alert" className="text-sm font-medium text-blush-700">
                            {errors.highlights.message}
                        </p>
                    ) : null}
                </Card>

                <Card className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className={sectionTitleClass}>Variantes</h2>
                            <p className="text-sm text-ink-soft">
                                La primera con stock es la predeterminada; las que están en 0 se ven
                                como «Agotada». Sin variantes el producto no se puede agregar al
                                carrito.
                            </p>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={variants.fields.length >= MAX_VARIANTS}
                            onClick={() =>
                                variants.append({
                                    label: '',
                                    priceDelta: 0,
                                    colorHex: '',
                                    stock: 0,
                                })
                            }
                            leadingIcon={<Plus aria-hidden="true" className="size-4" />}
                        >
                            Agregar variante
                        </Button>
                    </div>

                    {variants.fields.length === 0 ? (
                        <Alert>
                            Este producto no tiene variantes, así que no se podrá comprar.
                        </Alert>
                    ) : (
                        <ul className="space-y-4">
                            {variants.fields.map((field, index) => {
                                const swatch = variantValues?.[index]?.colorHex ?? ''
                                const rowErrors = errors.variants?.[index]
                                return (
                                    <li
                                        key={field.id}
                                        className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-2xl border border-line bg-cream p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                                    >
                                        <div className="sm:col-span-2">
                                            <Input
                                                label="Nombre"
                                                placeholder="Blanca 11oz"
                                                error={rowErrors?.label?.message}
                                                {...register(`variants.${index}.label`)}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => variants.remove(index)}
                                            aria-label={`Eliminar variante ${index + 1}`}
                                            className={cn(iconButtonClass, 'mt-6.5')}
                                        >
                                            <Trash2 aria-hidden="true" className="size-4" />
                                        </button>
                                        <div className="col-span-2 grid grid-cols-1 items-start gap-3 sm:grid-cols-3">
                                            <Input
                                                label="Ajuste de precio"
                                                hint={finalPriceHint(index)}
                                                type="number"
                                                inputMode="decimal"
                                                step="0.01"
                                                error={rowErrors?.priceDelta?.message}
                                                {...register(`variants.${index}.priceDelta`, {
                                                    setValueAs: toOptionalNumber,
                                                })}
                                            />
                                            <Input
                                                label="Stock"
                                                type="number"
                                                inputMode="numeric"
                                                step="1"
                                                min={0}
                                                error={rowErrors?.stock?.message}
                                                {...register(`variants.${index}.stock`, {
                                                    setValueAs: toOptionalNumber,
                                                })}
                                            />
                                            <Input
                                                label="Color"
                                                optional
                                                placeholder="#FFFFFF"
                                                spellCheck={false}
                                                leadingIcon={
                                                    <span
                                                        className={cn(
                                                            'block size-4 rounded-full border border-ink/15',
                                                            !HEX_COLOR_PATTERN.test(swatch) &&
                                                                'bg-[repeating-linear-gradient(45deg,var(--color-line)_0_3px,white_3px_6px)]',
                                                        )}
                                                        style={
                                                            HEX_COLOR_PATTERN.test(swatch)
                                                                ? { backgroundColor: swatch }
                                                                : undefined
                                                        }
                                                    />
                                                }
                                                error={rowErrors?.colorHex?.message}
                                                {...register(`variants.${index}.colorHex`)}
                                            />
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </Card>
            </div>

            <aside className="min-w-0 space-y-6 xl:sticky xl:top-6 xl:self-start">
                <Card className="space-y-5">
                    <h2 className={sectionTitleClass}>Publicación</h2>
                    <Controller
                        control={control}
                        name="isActive"
                        render={({ field }) => (
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-ink">
                                        Visible en la tienda
                                    </p>
                                    <p className="text-xs text-ink-soft">
                                        {field.value
                                            ? 'Los clientes pueden verlo y comprarlo.'
                                            : 'Oculto: solo se ve en el panel.'}
                                    </p>
                                </div>
                                <Switch
                                    checked={field.value}
                                    onChange={field.onChange}
                                    label="Visible en la tienda"
                                />
                            </div>
                        )}
                    />

                    <Controller
                        control={control}
                        name="tags"
                        render={({ field }) => (
                            <fieldset className="space-y-2">
                                <legend className="text-sm font-semibold text-ink">
                                    Etiquetas
                                    <OptionalMark />
                                </legend>
                                <div className="flex flex-wrap gap-2">
                                    {PRODUCT_TAGS.map((tag) => {
                                        const isOn = field.value.includes(tag)
                                        return (
                                            <button
                                                key={tag}
                                                type="button"
                                                aria-pressed={isOn}
                                                onClick={() =>
                                                    field.onChange(
                                                        isOn
                                                            ? field.value.filter(
                                                                  (item) => item !== tag,
                                                              )
                                                            : PRODUCT_TAGS.filter(
                                                                  (item) =>
                                                                      item === tag ||
                                                                      field.value.includes(item),
                                                              ),
                                                    )
                                                }
                                                className={cn(
                                                    'rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:ring-offset-2',
                                                    isOn
                                                        ? 'border-blush-400 bg-blush-100 text-blush-700'
                                                        : 'border-line bg-white text-ink-soft hover:border-blush-200',
                                                )}
                                            >
                                                {PRODUCT_TAG_LABELS[tag]}
                                            </button>
                                        )
                                    })}
                                </div>
                            </fieldset>
                        )}
                    />
                </Card>

                <Card tone="cream" className="space-y-3">
                    <h2 className="text-sm font-semibold text-ink">
                        Vista previa de la ilustración
                    </h2>
                    <div className="flex justify-center rounded-2xl bg-white p-4">
                        {category ? (
                            <ProductIllustration
                                category={category}
                                color={toColorInputValue(colorHex)}
                                printText={printText ?? ''}
                                accentColor={accentColor}
                                size="md"
                            />
                        ) : (
                            <p className="py-10 text-center text-sm text-ink-soft">
                                Elige una categoría para ver la ilustración.
                            </p>
                        )}
                    </div>
                </Card>

                <div className="space-y-3">
                    {serverError ? <Alert>{serverError}</Alert> : null}
                    <Button
                        type="submit"
                        fullWidth
                        isLoading={isSubmitting}
                        leadingIcon={<Save aria-hidden="true" className="size-4" />}
                    >
                        {mode === 'create' ? 'Crear producto' : 'Guardar cambios'}
                    </Button>
                </div>
            </aside>
        </form>
    )
}
