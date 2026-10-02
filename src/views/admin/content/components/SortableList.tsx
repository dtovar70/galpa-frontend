import { useRef, useState, type DragEvent, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from 'lucide-react'

import { Button, Tooltip } from '@/components/ui'
import { FIELD_MESSAGE_ERROR_CLASS } from '@/components/ui/field.styles'
import { cn } from '@/utils/cn'

/** Same look as the category rows' actions. */
const actionClass =
    'flex size-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-brand-100 hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent aria-disabled:hover:text-ink-soft'

export interface SortableListProps {
    /** Accessible name of the list: "Preguntas frecuentes". */
    label: string
    /** Stable ids (react-hook-form's `field.id`), in order. */
    itemIds: string[]
    /** "Mensaje 2". */
    itemName: (position: number) => string
    renderItem: (index: number) => ReactNode
    onMove: (from: number, to: number) => void
    onRemove: (index: number) => void
    onAdd: () => void
    addLabel: string
    minItems: number
    maxItems: number
    /** List-level error (too few or too many items, or an item error reported on the list). */
    error?: string
    emptyText?: string
}

/**
 * An editable list: drag a row by its handle, or use the arrows (keyboard and touch), to change
 * the order; the same interaction as the category list.
 */
export function SortableList({
    label,
    itemIds,
    itemName,
    renderItem,
    onMove,
    onRemove,
    onAdd,
    addLabel,
    minItems,
    maxItems,
    error,
    emptyText,
}: SortableListProps) {
    const rowRefs = useRef(new Map<string, HTMLLIElement>())
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
    const [overIndex, setOverIndex] = useState<number | null>(null)
    const [announcement, setAnnouncement] = useState('')
    const total = itemIds.length
    const canRemove = total > minItems

    const move = (from: number, to: number) => {
        if (from === to || to < 0 || to >= total) return
        onMove(from, to)
        setAnnouncement(`${itemName(from + 1)} pasó a la posición ${to + 1} de ${total}.`)
    }

    const endDrag = () => {
        setDraggedIndex(null)
        setOverIndex(null)
    }

    const startDrag = (event: DragEvent<HTMLSpanElement>, index: number, id: string) => {
        event.dataTransfer.effectAllowed = 'move'
        // Firefox only starts a drag when some data is set.
        event.dataTransfer.setData('text/plain', id)
        const row = rowRefs.current.get(id)
        if (row) {
            const rect = row.getBoundingClientRect()
            event.dataTransfer.setDragImage(
                row,
                event.clientX - rect.left,
                event.clientY - rect.top,
            )
        }
        setDraggedIndex(index)
    }

    return (
        <div className="space-y-3">
            <p className="sr-only" aria-live="polite">
                {announcement}
            </p>

            {total === 0 && emptyText ? <p className="text-sm text-ink-soft">{emptyText}</p> : null}

            <ol className="space-y-3" aria-label={label}>
                {itemIds.map((id, index) => {
                    const name = itemName(index + 1)
                    const isFirst = index === 0
                    const isLast = index === total - 1
                    return (
                        <li
                            key={id}
                            ref={(node) => {
                                if (node) rowRefs.current.set(id, node)
                                else rowRefs.current.delete(id)
                            }}
                            onDragOver={(event) => {
                                // Only react to this list's own row drags.
                                if (draggedIndex === null) return
                                event.preventDefault()
                                event.dataTransfer.dropEffect = 'move'
                                setOverIndex(index)
                            }}
                            onDrop={(event) => {
                                if (draggedIndex === null) return
                                event.preventDefault()
                                const from = draggedIndex
                                endDrag()
                                move(from, index)
                            }}
                            className={cn(
                                'rounded-2xl border bg-white p-3 transition sm:p-4',
                                draggedIndex !== null &&
                                    overIndex === index &&
                                    draggedIndex !== index
                                    ? 'border-brand-400 bg-brand-50'
                                    : 'border-line',
                                draggedIndex === index && 'opacity-50',
                            )}
                        >
                            <div className="mb-2 flex items-center gap-2">
                                <span
                                    draggable
                                    onDragStart={(event) => startDrag(event, index, id)}
                                    onDragEnd={endDrag}
                                    title="Arrastra para cambiar el orden"
                                    aria-hidden="true"
                                    className="flex h-9 w-6 shrink-0 cursor-grab items-center justify-center rounded-full text-ink-soft hover:text-ink active:cursor-grabbing"
                                >
                                    <GripVertical className="size-5" />
                                </span>
                                <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">
                                    {name}
                                </span>
                                <div className="flex shrink-0 items-center gap-1">
                                    <Tooltip label="Subir" placement="top">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!isFirst) move(index, index - 1)
                                            }}
                                            aria-disabled={isFirst}
                                            aria-label={`Subir ${name}`}
                                            className={actionClass}
                                        >
                                            <ArrowUp aria-hidden="true" className="size-4" />
                                        </button>
                                    </Tooltip>
                                    <Tooltip label="Bajar" placement="top">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!isLast) move(index, index + 1)
                                            }}
                                            aria-disabled={isLast}
                                            aria-label={`Bajar ${name}`}
                                            className={actionClass}
                                        >
                                            <ArrowDown aria-hidden="true" className="size-4" />
                                        </button>
                                    </Tooltip>
                                    <Tooltip
                                        label={canRemove ? 'Eliminar' : `Mínimo ${minItems}`}
                                        placement="top"
                                        align="end"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (canRemove) onRemove(index)
                                            }}
                                            aria-disabled={!canRemove}
                                            aria-label={`Eliminar ${name}`}
                                            className={actionClass}
                                        >
                                            <Trash2 aria-hidden="true" className="size-4" />
                                        </button>
                                    </Tooltip>
                                </div>
                            </div>
                            <div className="space-y-4">{renderItem(index)}</div>
                        </li>
                    )
                })}
            </ol>

            {error ? (
                <p role="alert" className={FIELD_MESSAGE_ERROR_CLASS}>
                    {error}
                </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={onAdd}
                    disabled={total >= maxItems}
                    leadingIcon={<Plus aria-hidden="true" className="size-4" />}
                >
                    {addLabel}
                </Button>
                <span className="text-xs text-ink-soft">
                    {total} de {maxItems} como máximo
                </span>
            </div>
        </div>
    )
}
