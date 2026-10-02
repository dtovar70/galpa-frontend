import { useId, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDown, ArrowUp, Clock, PackageCheck, Plus, Save, Trash2 } from 'lucide-react'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'

import type { AdminProduct, ProductInput } from '@/@types/admin'
import { PRODUCT_TAGS, STOCK_MODES, type StockMode } from '@/@types/product'
import { ProductPlaceholder } from '@/components/shared/ProductPlaceholder'
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
import { placeholderArtFor } from '@/constants/category.constant'
import { PRODUCT_TAG_LABELS } from '@/constants/product.constant'
import { cn } from '@/utils/cn'
import { formatCurrency } from '@/utils/formatCurrency'
import { slugify } from '@/utils/slugify'
import { useAdminCategories } from '@/views/admin/hooks/useAdminCategories'
import {
    MAX_HIGHLIGHTS,
    MAX_SPECS,
    MAX_VARIANTS,
    PRODUCT_DESCRIPTION_MAX_LENGTH,
    productFormSchema,
    toOptionalNumber,
    toProductInput,
    variantsStockTotal,
    type ProductFormValues,
} from '@/views/admin/products/schema/product.schema'
import { applyServerErrors } from '@/views/admin/products/utils/applyServerErrors'

const sectionTitleClass = 'text-xl text-ink'

const iconButtonClass =
    'flex size-11 shrink-0 items-center justify-center rounded-xl text-ink-soft transition hover:bg-mist hover:text-ink focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40'

const STOCK_MODE_DETAILS: Record<
    StockMode,
    { label: string; description: string; icon: typeof PackageCheck }
> = {
    STOCK: {
        label: 'En stock',
        description: 'Se vende con las unidades que hay en el almacén.',
        icon: PackageCheck,
    },
    ON_ORDER: {
        label: 'Bajo pedido',
        description: 'Sin límite de unidades: se pide al proveedor después de la compra.',
        icon: Clock,
    },
}

const INVERTER_OPTIONS: SelectOption[] = [
    { value: '', label: 'No aplica' },
    { value: 'yes', label: 'Sí, inverter' },
    { value: 'no', label: 'No, convencional' },
]

/** Usual values, offered as suggestions (any text is accepted). */
const VOLTAGE_SUGGESTIONS = ['110V', '220V', '208-230V', '380V']
const REFRIGERANT_SUGGESTIONS = ['R32', 'R410A', 'R22', 'R134A']

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
    const voltageListId = useId()
    const refrigerantListId = useId()

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
    const specs = useFieldArray({ control, name: 'specs' })
    const variants = useFieldArray({ control, name: 'variants' })
    const [category, variantValues, basePrice, stockMode] = useWatch({
        control,
        name: ['categorySlug', 'variants', 'price', 'stockMode'],
    })
    const isOnOrder = stockMode === 'ON_ORDER'

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
    const selectedCategory = categories?.find((item) => item.slug === category)

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
                <Card className="@container space-y-5">
                    <h2 className={sectionTitleClass}>Información básica</h2>
                    <Input label="Nombre" error={errors.name?.message} {...nameField} />
                    <Input
                        label="Slug (URL)"
                        hint={
                            mode === 'create'
                                ? 'Se genera a partir del nombre; puedes cambiarlo.'
                                : 'Cambiarlo rompe los enlaces que ya se hayan compartido.'
                        }
                        placeholder="split-daikin-12000-inverter"
                        autoCapitalize="none"
                        spellCheck={false}
                        error={errors.slug?.message}
                        {...slugField}
                    />
                    <div className="grid grid-cols-1 items-start gap-5 @md:grid-cols-3">
                        <Input
                            label="Marca"
                            placeholder="Daikin"
                            error={errors.brand?.message}
                            {...register('brand')}
                        />
                        <Input
                            label="Modelo"
                            optional
                            placeholder="FTKF12"
                            error={errors.model?.message}
                            className="tabular-nums"
                            {...register('model')}
                        />
                        <Input
                            label="SKU"
                            optional
                            hint="Código interno; único."
                            autoCapitalize="characters"
                            spellCheck={false}
                            error={errors.sku?.message}
                            className="tabular-nums"
                            {...register('sku')}
                        />
                    </div>
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

                <Card className="@container space-y-5">
                    <h2 className={sectionTitleClass}>Precio y disponibilidad</h2>
                    <div className="grid grid-cols-1 items-start gap-5 @md:grid-cols-2">
                        <Input
                            label="Precio (USD)"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min={0}
                            error={errors.price?.message}
                            className="tabular-nums"
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
                            className="tabular-nums"
                            {...register('compareAtPrice', { setValueAs: toOptionalNumber })}
                        />
                    </div>

                    <Controller
                        control={control}
                        name="stockMode"
                        render={({ field }) => (
                            <fieldset className="space-y-2">
                                <legend className="text-sm font-semibold text-ink">
                                    Modo de venta
                                </legend>
                                <div className="grid gap-3 @md:grid-cols-2">
                                    {STOCK_MODES.map((mode) => {
                                        const details = STOCK_MODE_DETAILS[mode]
                                        const Icon = details.icon
                                        const isOn = field.value === mode
                                        return (
                                            <label
                                                key={mode}
                                                className={cn(
                                                    'flex cursor-pointer gap-3 rounded-xl border p-4 transition has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-brand-500',
                                                    isOn
                                                        ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                                                        : 'border-line-strong hover:border-ink/40',
                                                )}
                                            >
                                                <input
                                                    type="radio"
                                                    name={field.name}
                                                    value={mode}
                                                    checked={isOn}
                                                    onChange={() => field.onChange(mode)}
                                                    className="sr-only"
                                                />
                                                <Icon
                                                    aria-hidden="true"
                                                    className={cn(
                                                        'mt-0.5 size-5 shrink-0',
                                                        mode === 'ON_ORDER'
                                                            ? 'text-warning-600'
                                                            : 'text-brand-600',
                                                    )}
                                                />
                                                <span>
                                                    <span className="block font-semibold text-ink">
                                                        {details.label}
                                                    </span>
                                                    <span className="block text-xs text-ink-soft">
                                                        {details.description}
                                                    </span>
                                                </span>
                                            </label>
                                        )
                                    })}
                                </div>
                            </fieldset>
                        )}
                    />

                    <div className="grid grid-cols-1 items-start gap-5 @md:grid-cols-2">
                        {isOnOrder ? (
                            <Input
                                // Distinct keys: the read-only total is controlled, the others
                                // are not, so React must not reuse one input for another.
                                key="leadTimeDays"
                                label="Tiempo de entrega (días)"
                                optional
                                hint="Se muestra como «Entrega en ~N días»."
                                type="number"
                                inputMode="numeric"
                                step="1"
                                min={1}
                                error={errors.leadTimeDays?.message}
                                {...register('leadTimeDays', { setValueAs: toOptionalNumber })}
                            />
                        ) : variants.fields.length > 0 ? (
                            // With variants the stock is theirs; this is only their sum.
                            <Input
                                key="stockTotal"
                                label="Stock"
                                value={`Total: ${variantsStockTotal(variantValues)}`}
                                readOnly
                                tabIndex={-1}
                                hint="Suma de las variantes. Cámbialo en cada una."
                                className="bg-page tabular-nums"
                            />
                        ) : (
                            <Input
                                key="stock"
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

                <Card className="@container space-y-5">
                    <div>
                        <h2 className={sectionTitleClass}>Datos técnicos</h2>
                        <p className="text-sm text-ink-soft">
                            Alimentan los filtros del catálogo y la ficha técnica. Déjalos vacíos en
                            repuestos y accesorios que no los tengan.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 items-start gap-5 @md:grid-cols-2 @3xl:grid-cols-4">
                        <Input
                            label="Capacidad (BTU)"
                            optional
                            type="number"
                            inputMode="numeric"
                            step="1000"
                            min={0}
                            placeholder="12000"
                            error={errors.btu?.message}
                            className="tabular-nums"
                            {...register('btu', { setValueAs: toOptionalNumber })}
                        />
                        <Input
                            label="Voltaje"
                            optional
                            placeholder="220V"
                            list={voltageListId}
                            error={errors.voltage?.message}
                            className="tabular-nums"
                            {...register('voltage')}
                        />
                        <Select
                            label="Inverter"
                            options={INVERTER_OPTIONS}
                            error={errors.inverter?.message}
                            {...register('inverter')}
                        />
                        <Input
                            label="Refrigerante"
                            optional
                            placeholder="R32"
                            list={refrigerantListId}
                            autoCapitalize="characters"
                            error={errors.refrigerant?.message}
                            className="tabular-nums"
                            {...register('refrigerant')}
                        />
                    </div>
                    <datalist id={voltageListId}>
                        {VOLTAGE_SUGGESTIONS.map((value) => (
                            <option key={value} value={value} />
                        ))}
                    </datalist>
                    <datalist id={refrigerantListId}>
                        {REFRIGERANT_SUGGESTIONS.map((value) => (
                            <option key={value} value={value} />
                        ))}
                    </datalist>
                </Card>

                <Card className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className={sectionTitleClass}>Ficha técnica</h2>
                            <p className="text-sm text-ink-soft tabular-nums">
                                {specs.fields.length}/{MAX_SPECS} filas · Se muestran en este orden
                                debajo de los datos técnicos.
                            </p>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={specs.fields.length >= MAX_SPECS}
                            onClick={() => specs.append({ label: '', value: '' })}
                            leadingIcon={<Plus aria-hidden="true" className="size-4" />}
                        >
                            Agregar fila
                        </Button>
                    </div>

                    {specs.fields.length === 0 ? (
                        <p className="text-sm text-ink-soft">
                            Sin filas. Agrega datos como «Consumo», «Dimensiones» o «Garantía».
                        </p>
                    ) : (
                        <ol className="space-y-3">
                            {specs.fields.map((field, index) => {
                                const rowErrors = errors.specs?.[index]
                                return (
                                    <li
                                        key={field.id}
                                        className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 rounded-xl border border-line bg-page p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]"
                                    >
                                        <Input
                                            label={`Dato ${index + 1}`}
                                            hideLabel
                                            placeholder="Consumo"
                                            error={rowErrors?.label?.message}
                                            {...register(`specs.${index}.label`)}
                                        />
                                        <div className="col-start-1 sm:col-start-2">
                                            <Input
                                                label={`Valor ${index + 1}`}
                                                hideLabel
                                                placeholder="1.100 W"
                                                error={rowErrors?.value?.message}
                                                {...register(`specs.${index}.value`)}
                                            />
                                        </div>
                                        <div className="col-start-2 row-span-2 row-start-1 flex flex-col sm:col-start-3 sm:row-span-1 sm:flex-row">
                                            <button
                                                type="button"
                                                onClick={() => specs.move(index, index - 1)}
                                                disabled={index === 0}
                                                aria-label={`Subir la fila ${index + 1}`}
                                                className={iconButtonClass}
                                            >
                                                <ArrowUp aria-hidden="true" className="size-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => specs.move(index, index + 1)}
                                                disabled={index === specs.fields.length - 1}
                                                aria-label={`Bajar la fila ${index + 1}`}
                                                className={iconButtonClass}
                                            >
                                                <ArrowDown aria-hidden="true" className="size-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => specs.remove(index)}
                                                aria-label={`Eliminar la fila ${index + 1}`}
                                                className={iconButtonClass}
                                            >
                                                <Trash2 aria-hidden="true" className="size-4" />
                                            </button>
                                        </div>
                                    </li>
                                )
                            })}
                        </ol>
                    )}
                    {errors.specs?.message ? (
                        <p role="alert" className="text-sm font-medium text-danger-700">
                            {errors.specs.message}
                        </p>
                    ) : null}
                </Card>

                <Card className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className={sectionTitleClass}>Características destacadas</h2>
                            <p
                                id={highlightsLimitId}
                                className={cn(
                                    'text-sm text-ink-soft tabular-nums',
                                    isHighlightsFull && 'font-semibold text-warning-800',
                                )}
                            >
                                {highlights.fields.length}/{MAX_HIGHLIGHTS} · Máximo{' '}
                                {MAX_HIGHLIGHTS} características
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
                            Agregar característica
                        </Button>
                    </div>

                    {highlights.fields.length === 0 ? (
                        <p className="text-sm text-ink-soft">
                            Sin características. Aparecen como lista en la página del producto.
                        </p>
                    ) : (
                        <ul className="space-y-3">
                            {highlights.fields.map((field, index) => (
                                <li key={field.id} className="flex items-start gap-2">
                                    <Input
                                        label={`Característica ${index + 1}`}
                                        hideLabel
                                        placeholder="Bajo nivel de ruido"
                                        error={errors.highlights?.[index]?.value?.message}
                                        {...register(`highlights.${index}.value`)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => highlights.remove(index)}
                                        aria-label={`Eliminar característica ${index + 1}`}
                                        className={iconButtonClass}
                                    >
                                        <Trash2 aria-hidden="true" className="size-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    {errors.highlights?.message ? (
                        <p role="alert" className="text-sm font-medium text-danger-700">
                            {errors.highlights.message}
                        </p>
                    ) : null}
                </Card>

                <Card className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className={sectionTitleClass}>Variantes</h2>
                            <p className="text-sm text-ink-soft">
                                Opcional: versiones del mismo producto («12.000 BTU», «220V»).
                                {isOnOrder
                                    ? ' Bajo pedido no llevan stock.'
                                    : ' La primera con stock es la predeterminada; las que están en 0 se ven como «Agotada».'}
                            </p>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={variants.fields.length >= MAX_VARIANTS}
                            onClick={() => variants.append({ label: '', priceDelta: 0, stock: 0 })}
                            leadingIcon={<Plus aria-hidden="true" className="size-4" />}
                        >
                            Agregar variante
                        </Button>
                    </div>

                    {variants.fields.length === 0 ? (
                        <p className="text-sm text-ink-soft">
                            Sin variantes: se vende como un único producto.
                        </p>
                    ) : (
                        <ul className="space-y-4">
                            {variants.fields.map((field, index) => {
                                const rowErrors = errors.variants?.[index]
                                return (
                                    <li
                                        key={field.id}
                                        className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-xl border border-line bg-page p-4"
                                    >
                                        <div
                                            className={cn(
                                                'grid grid-cols-1 items-start gap-3',
                                                isOnOrder ? 'sm:grid-cols-2' : 'sm:grid-cols-3',
                                            )}
                                        >
                                            <Input
                                                label="Nombre"
                                                placeholder="12.000 BTU"
                                                error={rowErrors?.label?.message}
                                                {...register(`variants.${index}.label`)}
                                            />
                                            <Input
                                                label="Ajuste de precio"
                                                hint={finalPriceHint(index)}
                                                type="number"
                                                inputMode="decimal"
                                                step="0.01"
                                                error={rowErrors?.priceDelta?.message}
                                                className="tabular-nums"
                                                {...register(`variants.${index}.priceDelta`, {
                                                    setValueAs: toOptionalNumber,
                                                })}
                                            />
                                            {isOnOrder ? null : (
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
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => variants.remove(index)}
                                            aria-label={`Eliminar variante ${index + 1}`}
                                            className={cn(iconButtonClass, 'mt-6.5')}
                                        >
                                            <Trash2 aria-hidden="true" className="size-4" />
                                        </button>
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
                                                    'rounded-lg border px-3 py-1.5 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
                                                    isOn
                                                        ? 'border-brand-500 bg-brand-50 text-brand-800'
                                                        : 'border-line-strong bg-white text-ink-soft hover:border-ink/40',
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

                <Card tone="muted" className="space-y-3">
                    <h2 className="text-sm font-semibold text-ink">Imagen sin fotos</h2>
                    <p className="text-xs text-ink-soft">
                        Mientras el producto no tenga fotos, la tienda muestra el dibujo de su
                        categoría.
                    </p>
                    <ProductPlaceholder
                        art={placeholderArtFor(category ?? '', selectedCategory)}
                        size="lg"
                        className="mx-auto max-w-48"
                    />
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
