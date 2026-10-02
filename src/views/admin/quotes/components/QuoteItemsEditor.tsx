import { ArrowDown, ArrowUp, Package, PenLine, Plus, Trash2 } from 'lucide-react'
import {
    useFieldArray,
    useWatch,
    type Control,
    type FieldErrors,
    type UseFormRegister,
} from 'react-hook-form'

import type { AdminProduct } from '@/@types/admin'
import type { ProductVariant } from '@/@types/product'
import { Button, Input } from '@/components/ui'
import { cn } from '@/utils/cn'
import { formatCurrency } from '@/utils/formatCurrency'
import { toOptionalNumber } from '@/views/admin/products/schema/product.schema'
import { QuoteProductPicker } from '@/views/admin/quotes/components/QuoteProductPicker'
import {
    lineTotal,
    QUOTE_DESCRIPTION_MAX_LENGTH,
    QUOTE_MAX_ITEMS,
    type QuoteFormValues,
} from '@/views/admin/quotes/schema/quote.schema'

const iconButtonClass =
    'flex size-10 shrink-0 items-center justify-center rounded-xl text-ink-soft transition hover:bg-mist hover:text-ink focus-visible:ring-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-40'

export interface QuoteItemsEditorProps {
    control: Control<QuoteFormValues>
    register: UseFormRegister<QuoteFormValues>
    errors: FieldErrors<QuoteFormValues>
    readOnly: boolean
}

/** The quote's lines: catalog products (picked from a search) or free text, in order. */
export function QuoteItemsEditor({ control, register, errors, readOnly }: QuoteItemsEditorProps) {
    const items = useFieldArray({ control, name: 'items' })
    const values = useWatch({ control, name: 'items' })
    const isFull = items.fields.length >= QUOTE_MAX_ITEMS

    const addProduct = (product: AdminProduct, variant: ProductVariant | null) =>
        items.append({
            productId: product.id,
            variantId: variant?.id ?? null,
            description: variant ? `${product.name} — ${variant.label}` : product.name,
            brand: product.brand,
            model: product.model ?? '',
            quantity: 1,
            unitPrice: Math.round((product.price + (variant?.priceDelta ?? 0)) * 100) / 100,
        })

    return (
        <div className="space-y-5">
            {readOnly ? null : (
                <div className="grid gap-4 rounded-xl border border-dashed border-line-strong bg-page p-4 @2xl:grid-cols-[minmax(0,1fr)_auto] @2xl:items-end">
                    <QuoteProductPicker onPick={addProduct} disabled={isFull} />
                    <Button
                        variant="secondary"
                        disabled={isFull}
                        onClick={() =>
                            items.append({
                                productId: null,
                                variantId: null,
                                description: '',
                                brand: '',
                                model: '',
                                quantity: 1,
                                unitPrice: 0,
                            })
                        }
                        leadingIcon={<Plus aria-hidden="true" className="size-4" />}
                    >
                        Línea libre
                    </Button>
                </div>
            )}

            {items.fields.length === 0 ? (
                <p className="text-sm text-ink-soft">
                    Sin líneas. Busca un producto del catálogo o agrega una línea libre (por
                    ejemplo, la instalación).
                </p>
            ) : (
                <ol className="space-y-3">
                    {items.fields.map((field, index) => {
                        const rowErrors = errors.items?.[index]
                        const current = values?.[index]
                        const isProduct = Boolean(current?.productId)
                        return (
                            <li
                                key={field.id}
                                className="space-y-3 rounded-xl border border-line bg-white p-4"
                            >
                                <div className="flex items-center gap-2">
                                    <span
                                        className={cn(
                                            'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase',
                                            isProduct
                                                ? 'bg-brand-50 text-brand-800'
                                                : 'bg-mist text-ink-soft',
                                        )}
                                    >
                                        {isProduct ? (
                                            <Package aria-hidden="true" className="size-3" />
                                        ) : (
                                            <PenLine aria-hidden="true" className="size-3" />
                                        )}
                                        {isProduct ? 'Producto del catálogo' : 'Línea libre'}
                                    </span>
                                    <span className="text-xs text-ink-muted tabular-nums">
                                        #{index + 1}
                                    </span>
                                    {readOnly ? null : (
                                        <div className="ml-auto flex">
                                            <button
                                                type="button"
                                                onClick={() => items.move(index, index - 1)}
                                                disabled={index === 0}
                                                aria-label={`Subir la línea ${index + 1}`}
                                                className={iconButtonClass}
                                            >
                                                <ArrowUp aria-hidden="true" className="size-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => items.move(index, index + 1)}
                                                disabled={index === items.fields.length - 1}
                                                aria-label={`Bajar la línea ${index + 1}`}
                                                className={iconButtonClass}
                                            >
                                                <ArrowDown aria-hidden="true" className="size-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => items.remove(index)}
                                                aria-label={`Eliminar la línea ${index + 1}`}
                                                className={iconButtonClass}
                                            >
                                                <Trash2 aria-hidden="true" className="size-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <fieldset
                                    disabled={readOnly}
                                    className="grid grid-cols-1 items-start gap-3 @xl:grid-cols-2 @4xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]"
                                >
                                    <legend className="sr-only">Línea {index + 1}</legend>
                                    <div className="@xl:col-span-2 @4xl:col-span-1">
                                        <Input
                                            label="Descripción"
                                            error={rowErrors?.description?.message}
                                            maxLength={QUOTE_DESCRIPTION_MAX_LENGTH}
                                            {...register(`items.${index}.description`)}
                                        />
                                    </div>
                                    <Input
                                        label="Marca"
                                        optional
                                        error={rowErrors?.brand?.message}
                                        {...register(`items.${index}.brand`)}
                                    />
                                    <Input
                                        label="Modelo"
                                        optional
                                        error={rowErrors?.model?.message}
                                        className="tabular-nums"
                                        {...register(`items.${index}.model`)}
                                    />
                                    <Input
                                        label="Cantidad"
                                        type="number"
                                        inputMode="numeric"
                                        min={1}
                                        step="1"
                                        error={rowErrors?.quantity?.message}
                                        {...register(`items.${index}.quantity`, {
                                            setValueAs: toOptionalNumber,
                                        })}
                                    />
                                    <Input
                                        label="Precio unitario (USD)"
                                        type="number"
                                        inputMode="decimal"
                                        min={0}
                                        step="0.01"
                                        error={rowErrors?.unitPrice?.message}
                                        className="tabular-nums"
                                        {...register(`items.${index}.unitPrice`, {
                                            setValueAs: toOptionalNumber,
                                        })}
                                    />
                                </fieldset>
                                <p className="text-right text-sm text-ink-soft">
                                    Total de la línea:{' '}
                                    <span className="font-bold text-ink tabular-nums">
                                        {formatCurrency(lineTotal(current ?? {}))}
                                    </span>
                                </p>
                            </li>
                        )
                    })}
                </ol>
            )}
            {errors.items?.message ? (
                <p role="alert" className="text-sm font-medium text-danger-700">
                    {errors.items.message}
                </p>
            ) : null}
        </div>
    )
}
