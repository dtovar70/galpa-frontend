import { useId, useRef, useState, type DragEvent } from 'react'
import { ArrowDown, ArrowUp, GripVertical, Pencil, Trash2 } from 'lucide-react'

import { CategoryIconGlyph } from '@/components/shared/CategoryIconGlyph'
import type { AdminCategory } from '@/@types/admin'
import { Badge, Tooltip } from '@/components/ui'
import { cn } from '@/utils/cn'
import { CategoryForm } from '@/views/admin/categories/components/CategoryForm'

/** `aria-disabled` instead of `disabled` keeps keyboard focus on the button while saving. */
const actionClass =
    'flex size-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-brand-100 hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent aria-disabled:hover:text-ink-soft'

function plural(count: number, singular: string, pluralForm: string): string {
    return `${count} ${count === 1 ? singular : pluralForm}`
}

export interface CategoryRowProps {
    category: AdminCategory
    index: number
    total: number
    /** Positions below this one are listed in the storefront's top menu. */
    menuLimit: number
    /** While a new order is being saved, moves are ignored. */
    isBusy: boolean
    /** A row of this list is being dragged, so rows accept drops. */
    isDragActive: boolean
    isDragged: boolean
    isDropTarget: boolean
    onMove: (index: number, offset: -1 | 1) => void
    onDragStart: (slug: string) => void
    onDragEnd: () => void
    onDragOverRow: (slug: string) => void
    onDropOnRow: (slug: string) => void
    /** Omitted for roles that cannot delete, which hides the button entirely. */
    onDelete?: (category: AdminCategory) => void
}

export function CategoryRow({
    category,
    index,
    total,
    menuLimit,
    isBusy,
    isDragActive,
    isDragged,
    isDropTarget,
    onMove,
    onDragStart,
    onDragEnd,
    onDragOverRow,
    onDropOnRow,
    onDelete,
}: CategoryRowProps) {
    const rowRef = useRef<HTMLLIElement>(null)
    const panelId = useId()
    const deleteHintId = useId()
    const [isExpanded, setIsExpanded] = useState(false)
    /** The form stays mounted once opened, so collapsing never throws away unsaved edits. */
    const [hasOpened, setHasOpened] = useState(false)

    const position = index + 1
    const isInMenu = index < menuLimit
    const productTotal = category.totalProductCount
    const canDelete = productTotal === 0
    const isFirst = index === 0
    const isLast = index === total - 1

    const toggleExpanded = () => {
        setHasOpened(true)
        setIsExpanded((current) => !current)
    }

    const handleDragStart = (event: DragEvent<HTMLSpanElement>) => {
        event.dataTransfer.effectAllowed = 'move'
        // Firefox only starts a drag when some data is set.
        event.dataTransfer.setData('text/plain', category.slug)
        const row = rowRef.current
        if (row) {
            // Drag the whole row, grabbed where the pointer is on the handle.
            const rect = row.getBoundingClientRect()
            event.dataTransfer.setDragImage(
                row,
                event.clientX - rect.left,
                event.clientY - rect.top,
            )
        }
        onDragStart(category.slug)
    }

    const deleteLabel = canDelete
        ? 'Eliminar'
        : `Tiene ${plural(productTotal, 'producto', 'productos')}`

    return (
        <li
            ref={rowRef}
            data-category-slug={category.slug}
            onDragOver={(event) => {
                // Only react to our own row drags, never to files or text.
                if (!isDragActive) return
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
                onDragOverRow(category.slug)
            }}
            onDrop={(event) => {
                if (!isDragActive) return
                event.preventDefault()
                onDropOnRow(category.slug)
            }}
            className={cn(
                'rounded-2xl border bg-white shadow-soft transition',
                isDropTarget ? 'border-brand-400 bg-brand-50' : 'border-line',
                isDragged && 'opacity-50',
            )}
        >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-2 p-3 sm:gap-x-3 sm:p-4">
                <div className="flex min-w-0 flex-1 basis-52 items-center gap-2 sm:gap-3">
                    <span
                        draggable={!isBusy}
                        onDragStart={handleDragStart}
                        onDragEnd={onDragEnd}
                        title="Arrastra para cambiar el orden"
                        aria-hidden="true"
                        className={cn(
                            'flex h-10 w-6 shrink-0 items-center justify-center rounded-full text-ink-soft',
                            isBusy
                                ? 'opacity-40'
                                : 'cursor-grab hover:text-ink active:cursor-grabbing',
                        )}
                    >
                        <GripVertical className="size-5" />
                    </span>
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-page text-sm font-bold text-ink">
                        <span className="sr-only">Posición </span>
                        {position}
                    </span>
                    <span
                        aria-hidden="true"
                        className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600"
                    >
                        <CategoryIconGlyph name={category.icon} className="size-4" />
                    </span>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <h2 className="min-w-0 text-lg break-words text-ink">
                                {category.name}
                            </h2>
                            {isInMenu ? (
                                <Badge tone="brand" size="sm">
                                    En el menú
                                </Badge>
                            ) : null}
                        </div>
                        <p className="text-xs break-words text-ink-soft">
                            /{category.slug} · {plural(productTotal, 'producto', 'productos')},{' '}
                            {plural(category.productCount, 'visible', 'visibles')}
                        </p>
                    </div>
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-1">
                    <Tooltip label="Subir" placement="top">
                        <button
                            type="button"
                            onClick={() => {
                                if (!isBusy && !isFirst) onMove(index, -1)
                            }}
                            aria-disabled={isBusy || isFirst}
                            aria-label={`Subir ${category.name}`}
                            className={actionClass}
                        >
                            <ArrowUp aria-hidden="true" className="size-4" />
                        </button>
                    </Tooltip>
                    <Tooltip label="Bajar" placement="top">
                        <button
                            type="button"
                            onClick={() => {
                                if (!isBusy && !isLast) onMove(index, 1)
                            }}
                            aria-disabled={isBusy || isLast}
                            aria-label={`Bajar ${category.name}`}
                            className={actionClass}
                        >
                            <ArrowDown aria-hidden="true" className="size-4" />
                        </button>
                    </Tooltip>
                    <Tooltip
                        label={isExpanded ? 'Cerrar edición' : 'Editar'}
                        placement="top"
                        align={onDelete ? 'center' : 'end'}
                    >
                        <button
                            type="button"
                            onClick={toggleExpanded}
                            aria-expanded={isExpanded}
                            aria-controls={panelId}
                            aria-label={`Editar ${category.name}`}
                            className={cn(actionClass, isExpanded && 'bg-brand-100 text-brand-700')}
                        >
                            <Pencil aria-hidden="true" className="size-4" />
                        </button>
                    </Tooltip>
                    {onDelete ? (
                        <Tooltip label={deleteLabel} placement="top" align="end">
                            <button
                                type="button"
                                onClick={() => {
                                    if (canDelete) onDelete(category)
                                }}
                                aria-disabled={!canDelete}
                                aria-describedby={canDelete ? undefined : deleteHintId}
                                aria-label={`Eliminar ${category.name}`}
                                className={actionClass}
                            >
                                <Trash2 aria-hidden="true" className="size-4" />
                            </button>
                        </Tooltip>
                    ) : null}
                    {onDelete && !canDelete ? (
                        <span id={deleteHintId} className="sr-only">
                            No se puede eliminar: tiene{' '}
                            {plural(productTotal, 'producto', 'productos')}, contando los ocultos.
                        </span>
                    ) : null}
                </div>
            </div>

            {hasOpened ? (
                <div
                    id={panelId}
                    hidden={!isExpanded}
                    className="space-y-4 border-t border-line p-4 sm:p-6"
                >
                    {onDelete && !canDelete ? (
                        <p className="text-xs text-ink-soft">
                            Tiene {plural(productTotal, 'producto', 'productos')}, contando los
                            ocultos. Muévelos a otra categoría o elimínalos para poder borrarla.
                        </p>
                    ) : null}
                    <CategoryForm mode="edit" category={category} />
                </div>
            ) : null}
        </li>
    )
}
