import type { KeyboardEvent } from 'react'

import type { OrderStatus } from '@/@types/order'
import { Skeleton } from '@/components/ui'
import { cn } from '@/utils/cn'
import {
    ALL_ORDERS_GROUP_ID,
    groupCount,
    type OrderGroup,
} from '@/views/admin/orders/utils/orderGroups'

const SKELETON_TABS = 5

/*
 * The control's width decides the layout (a container query): wide, one segmented row; narrow,
 * the tabs wrap into rows of equal pills that fill each row, so every tab stays visible.
 * 42rem fits the whole row with two-digit counts.
 */
const TABLIST_CLASS =
    'flex flex-wrap gap-1 rounded-3xl border-2 border-line bg-white p-1 @2xl:w-max @2xl:flex-nowrap @2xl:rounded-full'
/** Narrow, each pill grows from 9.5rem: two per row on phones, three on wider containers. */
const TAB_SIZE_CLASS = 'flex-[1_1_9.5rem] @2xl:flex-none'

export interface OrderGroupTabsProps {
    /** The catalog's tabs plus "Todos", in order. */
    groups: readonly OrderGroup[]
    /** The status catalog is still loading: placeholders instead of tabs. */
    isLoading?: boolean
    active: string | null
    counts: Record<OrderStatus, number> | undefined
    /** `id` prefix shared with the tab panel (`${idPrefix}-tab-${group}` / `${idPrefix}-panel`). */
    idPrefix: string
    onSelect: (group: string) => void
}

/**
 * The orders page's main switch, one tab per workflow step. A segmented control on wide
 * containers; on narrow ones the tabs wrap into rows of equal pills (see `TABLIST_CLASS`).
 * Arrow keys move between tabs in reading order (and select them), following the ARIA tabs
 * pattern.
 */
export function OrderGroupTabs({
    groups,
    isLoading = false,
    active,
    counts,
    idPrefix,
    onSelect,
}: OrderGroupTabsProps) {
    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const ids = groups.map((group) => group.id)
        const current = ids.indexOf(active ?? ALL_ORDERS_GROUP_ID)
        const last = ids.length - 1
        const next =
            event.key === 'ArrowRight'
                ? current === last
                    ? 0
                    : current + 1
                : event.key === 'ArrowLeft'
                  ? current === 0
                      ? last
                      : current - 1
                  : event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? last
                      : -1
        const id = ids[next]
        if (!id) return
        event.preventDefault()
        onSelect(id)
        document.getElementById(`${idPrefix}-tab-${id}`)?.focus()
    }

    if (isLoading) {
        return (
            <div className="@container">
                <div className={TABLIST_CLASS}>
                    {Array.from({ length: SKELETON_TABS }, (_, index) => (
                        <Skeleton
                            key={index}
                            shape="circle"
                            className={cn('h-9 @2xl:w-24', TAB_SIZE_CLASS)}
                        />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="@container">
            <div
                role="tablist"
                aria-label="Pedidos por etapa"
                onKeyDown={onKeyDown}
                className={TABLIST_CLASS}
            >
                {groups.map((group) => {
                    const { id } = group
                    const isActive = id === active
                    const count = groupCount(group, counts)
                    const isUrgent = group.highlight && (count ?? 0) > 0
                    return (
                        <button
                            key={id}
                            id={`${idPrefix}-tab-${id}`}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={`${idPrefix}-panel`}
                            tabIndex={
                                isActive || (active === null && id === ALL_ORDERS_GROUP_ID) ? 0 : -1
                            }
                            onClick={() => onSelect(id)}
                            className={cn(
                                'inline-flex items-center justify-center gap-2 rounded-full py-2 pr-2.5 pl-4 text-sm font-semibold whitespace-nowrap transition focus-visible:ring-offset-white',
                                TAB_SIZE_CLASS,
                                isActive
                                    ? 'bg-blush-100 text-blush-800'
                                    : 'text-ink-soft hover:bg-blush-50 hover:text-ink',
                                count === undefined && 'pr-4',
                            )}
                        >
                            {group.label}
                            {count !== undefined ? (
                                <span
                                    className={cn(
                                        'min-w-6 rounded-full px-1.5 py-0.5 text-center text-xs font-bold tabular-nums',
                                        isUrgent
                                            ? 'bg-blush-700 text-white'
                                            : isActive
                                              ? 'bg-white text-blush-700'
                                              : 'bg-line/80 text-ink-soft',
                                    )}
                                >
                                    {count}
                                    {isUrgent ? (
                                        <span className="sr-only"> por revisar</span>
                                    ) : null}
                                </span>
                            ) : null}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
