import { useEffect, useId, useState } from 'react'
import {
    ArrowDown,
    ArrowUp,
    ChevronDown,
    CircleAlert,
    Package,
    PenLine,
    Plus,
    Trash2,
} from 'lucide-react'
import {
    useFieldArray,
    useWatch,
    type Control,
    type FieldErrors,
    type UseFormRegister,
    type UseFormSetValue,
} from 'react-hook-form'

import type { AdminProduct } from '@/@types/admin'
import type { ProductVariant } from '@/@types/product'
import { Button, Input, QuantityStepper } from '@/components/ui'
import { cn } from '@/utils/cn'
import { formatCurrency } from '@/utils/formatCurrency'
import { toOptionalNumber } from '@/views/admin/products/schema/product.schema'
import { QuoteProductPicker } from '@/views/admin/quotes/components/QuoteProductPicker'
import {
    lineTotal,
    QUOTE_DESCRIPTION_MAX_LENGTH,
    QUOTE_MAX_ITEMS,
    QUOTE_MAX_QUANTITY,
    type QuoteFormValues,
} from '@/views/admin/quotes/schema/quote.schema'

const iconButtonClass =
    'flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-soft transition hover:bg-mist hover:text-ink focus-visible:ring-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-40'

export interface QuoteItemsEditorProps {
    control: Control<QuoteFormValues>
    register: UseFormRegister<QuoteFormValues>
    setValue: UseFormSetValue<QuoteFormValues>
    errors: FieldErrors<QuoteFormValues>
    /** Grows on every save attempt: a failed one opens the first line with an error. */
    submitCount: number
    readOnly: boolean
}

/**
 * The quote's lines: catalog products (picked from a search) or free text, in order. Each line
 * is a one-row summary (description, quantity × price, total) and only one opens at a time to
 * edit its fields, so a long quote stays short. A newly added line opens and the previous one
 * folds. Closed lines keep their inputs mounted (hidden), so the form still validates them.
 */
export function QuoteItemsEditor({
    control,
    register,
    setValue,
    errors,
    submitCount,
    readOnly,
}: QuoteItemsEditorProps) {
    const idPrefix = useId()
    const items = useFieldArray({ control, name: 'items' })
    const values = useWatch({ control, name: 'items' })
    const isFull = items.fields.length >= QUOTE_MAX_ITEMS
    // Tracked by position: append, move and remove below keep it pointing at the same line.
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    // A failed save opens the first line with an error. Only a new save attempt moves the open
    // line: errors that change while typing must not yank it to another one.
    const [seenSubmitCount, setSeenSubmitCount] = useState(submitCount)
    const [scrollTarget, setScrollTarget] = useState<number | null>(null)
    if (submitCount !== seenSubmitCount) {
        setSeenSubmitCount(submitCount)
        const first = Array.isArray(errors.items) ? errors.items.findIndex(Boolean) : -1
        if (first >= 0) {
            setOpenIndex(first)
            setScrollTarget(first)
        }
    }

    // ...and brings it into view once it is open.
    useEffect(() => {
        if (scrollTarget === null) return
        document
            .getElementById(`${idPrefix}-line-${scrollTarget}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, [scrollTarget, seenSubmitCount, idPrefix])

    const appendLine = (line: QuoteFormValues['items'][number], focus: boolean) => {
        setOpenIndex(items.fields.length)
        items.append(line, { shouldFocus: focus })
    }

    const addProduct = (product: AdminProduct, variant: ProductVariant | null) =>
        appendLine(
            {
                productId: product.id,
                variantId: variant?.id ?? null,
                description: variant ? `${product.name} — ${variant.label}` : product.name,
                brand: product.brand,
                model: product.model ?? '',
                quantity: 1,
                unitPrice: Math.round((product.price + (variant?.priceDelta ?? 0)) * 100) / 100,
            },
            false,
        )

    const moveLine = (from: number, to: number) => {
        items.move(from, to)
        setOpenIndex((open) => (open === from ? to : open === to ? from : open))
    }

    const removeLine = (index: number) => {
        items.remove(index)
        setOpenIndex((open) =>
            open === null || open === index ? null : open > index ? open - 1 : open,
        )
    }

    return (
        <div className="space-y-5">
            {readOnly ? null : (
                <div className="grid grid-cols-1 gap-4 rounded-xl border border-dashed border-line-strong bg-page p-4 @2xl:grid-cols-[minmax(0,1fr)_auto] @2xl:items-end">
                    <QuoteProductPicker onPick={addProduct} disabled={isFull} />
                    <Button
                        variant="secondary"
                        disabled={isFull}
                        onClick={() =>
                            appendLine(
                                {
                                    productId: null,
                                    variantId: null,
                                    description: '',
                                    brand: '',
                                    model: '',
                                    quantity: 1,
                                    unitPrice: 0,
                                },
                                true,
                            )
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
                <ol className="space-y-2">
                    {items.fields.map((field, index) => {
                        const rowErrors = errors.items?.[index]
                        const current = values?.[index]
                        const isProduct = Boolean(current?.productId)
                        const isOpen = openIndex === index
                        const panelId = `${idPrefix}-panel-${index}`
                        const LineIcon = isProduct ? Package : PenLine
                        const details = [current?.brand, current?.model]
                            .map((part) => part?.trim())
                            .filter(Boolean)
                            .join(' · ')
                        const quantity = Number.isFinite(current?.quantity)
                            ? Number(current?.quantity)
                            : 1

                        return (
                            <li
                                key={field.id}
                                id={`${idPrefix}-line-${index}`}
                                className={cn(
                                    'rounded-xl border bg-white transition-shadow',
                                    rowErrors
                                        ? 'border-danger-300'
                                        : isOpen
                                          ? 'border-brand-200 shadow-soft'
                                          : 'border-line',
                                )}
                            >
                                <div className="flex items-center gap-3 p-2 pl-3">
                                    <span
                                        className={cn(
                                            'flex size-9 shrink-0 items-center justify-center rounded-lg',
                                            isProduct
                                                ? 'bg-brand-50 text-brand-700'
                                                : 'bg-mist text-ink-soft',
                                        )}
                                        title={isProduct ? 'Producto del catálogo' : 'Línea libre'}
                                    >
                                        <LineIcon aria-hidden="true" className="size-4" />
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => setOpenIndex(isOpen ? null : index)}
                                        aria-expanded={isOpen}
                                        aria-controls={panelId}
                                        className="group flex min-w-0 flex-1 items-center gap-3 rounded-lg py-1 text-left focus-visible:ring-2 focus-visible:ring-brand-500"
                                    >
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-baseline gap-2">
                                                <span className="shrink-0 text-xs text-ink-muted tabular-nums">
                                                    #{index + 1}
                                                </span>
                                                <span className="truncate text-sm font-semibold text-ink">
                                                    {current?.description?.trim() ||
                                                        'Línea sin descripción'}
                                                </span>
                                            </span>
                                            {rowErrors ? (
                                                <span className="mt-0.5 flex items-center gap-1 text-xs font-medium text-danger-700">
                                                    <CircleAlert
                                                        aria-hidden="true"
                                                        className="size-3.5"
                                                    />
                                                    Revisa esta línea
                                                </span>
                                            ) : (
                                                <span className="mt-0.5 block truncate text-xs text-ink-soft tabular-nums">
                                                    {details ? `${details} · ` : ''}
                                                    {quantity} ×{' '}
                                                    {formatCurrency(
                                                        Number(current?.unitPrice) || 0,
                                                    )}
                                                </span>
                                            )}
                                        </span>
                                        <span className="shrink-0 text-sm font-bold text-ink tabular-nums">
                                            {formatCurrency(lineTotal(current ?? {}))}
                                        </span>
                                        <ChevronDown
                                            aria-hidden="true"
                                            className={cn(
                                                'size-4 shrink-0 text-ink-muted transition group-hover:text-ink',
                                                isOpen && 'rotate-180',
                                            )}
                                        />
                                        <span className="sr-only">
                                            {isOpen ? 'Cerrar' : 'Editar'} la línea {index + 1}
                                        </span>
                                    </button>

                                    {readOnly ? null : (
                                        <>
                                            <QuantityStepper
                                                value={quantity}
                                                min={1}
                                                max={QUOTE_MAX_QUANTITY}
                                                label={`Cantidad de la línea ${index + 1}`}
                                                onChange={(next) =>
                                                    setValue(`items.${index}.quantity`, next, {
                                                        shouldDirty: true,
                                                        shouldValidate: true,
                                                    })
                                                }
                                                className="hidden @2xl:inline-flex"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeLine(index)}
                                                aria-label={`Eliminar la línea ${index + 1}`}
                                                className={iconButtonClass}
                                            >
                                                <Trash2 aria-hidden="true" className="size-4" />
                                            </button>
                                        </>
                                    )}
                                </div>

                                <div
                                    id={panelId}
                                    hidden={!isOpen}
                                    className="space-y-3 border-t border-line px-4 pt-4 pb-3"
                                >
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

                                    <div className="flex items-center gap-1">
                                        {readOnly ? null : (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => moveLine(index, index - 1)}
                                                    disabled={index === 0}
                                                    aria-label={`Subir la línea ${index + 1}`}
                                                    className={iconButtonClass}
                                                >
                                                    <ArrowUp
                                                        aria-hidden="true"
                                                        className="size-4"
                                                    />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => moveLine(index, index + 1)}
                                                    disabled={index === items.fields.length - 1}
                                                    aria-label={`Bajar la línea ${index + 1}`}
                                                    className={iconButtonClass}
                                                >
                                                    <ArrowDown
                                                        aria-hidden="true"
                                                        className="size-4"
                                                    />
                                                </button>
                                            </>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setOpenIndex(null)}
                                            className="ml-auto"
                                        >
                                            Listo
                                        </Button>
                                    </div>
                                </div>
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
