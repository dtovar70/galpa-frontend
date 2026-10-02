import { useCallback, useId, useMemo, useRef, useState } from 'react'
import { isAfter, isBefore, isSameDay, startOfMonth, subMonths } from 'date-fns'
import { CalendarDays, X } from 'lucide-react'
import { DayPicker, type ClassNames } from 'react-day-picker'
import { es } from 'react-day-picker/locale'

import { Button } from '@/components/ui/Button'
import { CalendarChevron } from '@/components/ui/CalendarChevron'
import { CALENDAR_CLASSES, CALENDAR_SELECTED_DAY_CLASS } from '@/components/ui/calendar.styles'
import { FIELD_BASE_CLASS } from '@/components/ui/field.styles'
import { Popover } from '@/components/ui/Popover'
import {
    caracasToday,
    DATE_RANGE_PRESETS,
    formatDayRange,
    parseCalendarDay,
    toCalendarDay,
    type DateRangeDraft,
    type DayRange,
} from '@/utils/calendarDay'
import { cn } from '@/utils/cn'
import { useMediaQuery } from '@/utils/hooks/useMediaQuery'

/** Two months need ~750px (presets included); narrower windows get one, never a squeeze. */
const TWO_MONTHS_QUERY = '(min-width: 50rem)'

/*
 * The range reads as one pill: the cells carry the pale band (rounded at both ends) and the
 * day buttons sit on top of it, solid blue at the ends. While a second day is only being
 * hovered, `.is-previewing` on the root pales the band and the hovered end turns dashed.
 */
const RANGE_CALENDAR_CLASSES: Partial<ClassNames> = {
    ...CALENDAR_CLASSES,
    range_start: `rounded-l-full bg-brand-100 group-[.is-previewing]/calendar:bg-brand-50 ${CALENDAR_SELECTED_DAY_CLASS}`,
    range_end: `rounded-r-full bg-brand-100 group-[.is-previewing]/calendar:bg-brand-50 ${CALENDAR_SELECTED_DAY_CLASS}`,
    range_middle:
        'bg-brand-100 group-[.is-previewing]/calendar:bg-brand-50 [&>button]:rounded-full [&>button]:text-brand-800 [&>button]:hover:bg-brand-200',
}

/** The day under the pointer while only the start is picked: a dashed, not-yet-chosen end. */
const PREVIEW_END_CLASS =
    '[&>button]:bg-white! [&>button]:text-brand-700! [&>button]:outline-2 [&>button]:-outline-offset-2 [&>button]:outline-brand-500 [&>button]:outline-dashed'

function firstVisibleMonth(anchor: Date, twoMonths: boolean): Date {
    return twoMonths ? subMonths(startOfMonth(anchor), 1) : startOfMonth(anchor)
}

export interface DateRangePickerProps {
    /** Calendar days, "YYYY-MM-DD". */
    value: DayRange
    onChange: (range: DayRange) => void
    /** Accessible name of the trigger; also the text shown while nothing is picked. */
    label?: string
    className?: string
}

/**
 * One field for a day range: presets, a calendar (Spanish, Monday first, no future days) and an
 * explicit Aplicar, so browsing the calendar never refetches anything. A popover on wide
 * screens, a bottom sheet on phones.
 */
export function DateRangePicker({
    value,
    onChange,
    label = 'Fechas',
    className,
}: DateRangePickerProps) {
    const dialogId = useId()
    const triggerRef = useRef<HTMLButtonElement>(null)
    const twoMonths = useMediaQuery(TWO_MONTHS_QUERY)

    const [isOpen, setIsOpen] = useState(false)
    const [draft, setDraft] = useState<DateRangeDraft>({})
    const [hovered, setHovered] = useState<Date>()
    const [month, setMonth] = useState(() => startOfMonth(new Date()))
    const [today, setToday] = useState(caracasToday)

    const from = parseCalendarDay(value.from)
    const to = parseCalendarDay(value.to) ?? from
    const hasValue = Boolean(from)

    const open = () => {
        const now = caracasToday()
        const current = from ? { from, to } : {}
        setToday(now)
        setDraft(current)
        setHovered(undefined)
        setMonth(firstVisibleMonth(current.to ?? now, twoMonths))
        setIsOpen(true)
    }

    const close = useCallback(() => setIsOpen(false), [])
    const closeAndReturn = () => {
        setIsOpen(false)
        triggerRef.current?.focus()
    }

    const pick = (day: Date) => {
        setDraft((current) => {
            if (!current.from || current.to) return { from: day }
            if (isBefore(day, current.from)) return { from: day, to: current.from }
            return { from: current.from, to: day }
        })
        setHovered(undefined)
    }

    const applyPreset = (range: { from: Date; to: Date }) => {
        setDraft(range)
        setHovered(undefined)
        setMonth(firstVisibleMonth(range.to, twoMonths))
    }

    const apply = () => {
        onChange(
            draft.from
                ? { from: toCalendarDay(draft.from), to: toCalendarDay(draft.to ?? draft.from) }
                : {},
        )
        closeAndReturn()
    }

    /* Only the start is picked: show the range up to the hovered (or focused) day, lighter. */
    const preview =
        draft.from && !draft.to && hovered && !isAfter(hovered, today) ? hovered : undefined
    const shown = preview
        ? isBefore(preview, draft.from as Date)
            ? { from: preview, to: draft.from }
            : { from: draft.from, to: preview }
        : draft.from
          ? { from: draft.from, to: draft.to }
          : undefined

    const activePreset = useMemo(
        () =>
            draft.from && draft.to
                ? DATE_RANGE_PRESETS.find((preset) => {
                      const range = preset.range(today)
                      return (
                          isSameDay(range.from, draft.from as Date) &&
                          isSameDay(range.to, draft.to as Date)
                      )
                  })?.id
                : undefined,
        [draft, today],
    )

    const status = draft.from
        ? draft.to
            ? formatDayRange(draft.from, draft.to)
            : `Desde el ${formatDayRange(draft.from)}: elige el día final`
        : 'Elige el día inicial o un atajo'

    return (
        <div className={cn('relative', className)}>
            <button
                ref={triggerRef}
                type="button"
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                aria-controls={isOpen ? dialogId : undefined}
                aria-label={hasValue && from ? `${label}: ${formatDayRange(from, to)}` : label}
                onClick={() => (isOpen ? close() : open())}
                className={cn(
                    FIELD_BASE_CLASS,
                    'flex h-11 items-center gap-2.5 rounded-xl px-4 text-left outline-none hover:border-brand-200',
                    hasValue && 'border-brand-200 bg-brand-50/60 pr-11',
                    isOpen && 'border-brand-400 ring-4 ring-brand-100',
                )}
            >
                <CalendarDays
                    aria-hidden="true"
                    className={cn('size-4 shrink-0', hasValue ? 'text-brand-600' : 'text-ink-soft')}
                />
                <span
                    className={cn(
                        'truncate text-sm font-semibold',
                        hasValue ? 'text-ink' : 'text-ink-soft',
                    )}
                >
                    {hasValue && from ? formatDayRange(from, to) : label}
                </span>
            </button>
            {hasValue ? (
                <button
                    type="button"
                    onClick={() => {
                        onChange({})
                        triggerRef.current?.focus()
                    }}
                    aria-label="Quitar el filtro de fechas"
                    className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-soft transition hover:bg-brand-100 hover:text-brand-700"
                >
                    <X aria-hidden="true" className="size-4" />
                </button>
            ) : null}

            <Popover
                open={isOpen}
                anchorRef={triggerRef}
                onClose={close}
                placement="bottom"
                align="end"
                sheetOnMobile
                trapFocus
                id={dialogId}
                role="dialog"
                aria-label="Elegir rango de fechas"
                className="sm:w-max"
            >
                {/* Phones: presets, calendar and actions stacked. Wider: the presets and the
                    actions share a slim left column, so the panel is only as tall as the
                    calendar and fits short windows. */}
                <div className="flex flex-col sm:grid sm:grid-cols-[11rem_auto] sm:grid-rows-[auto_1fr]">
                    <div className="px-4 pt-3 sm:col-start-1 sm:row-start-1 sm:px-3 sm:pt-3">
                        <p className="mb-2 px-1 text-xs font-bold tracking-wide text-ink-soft uppercase sm:mb-1.5 sm:px-2.5 sm:text-[0.7rem]">
                            Atajos
                        </p>
                        <ul className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-col sm:gap-0 sm:overflow-visible sm:px-0 sm:pb-0">
                            {DATE_RANGE_PRESETS.map((preset) => {
                                const isActive = activePreset === preset.id
                                return (
                                    <li key={preset.id} className="shrink-0">
                                        <button
                                            type="button"
                                            aria-pressed={isActive}
                                            onClick={() => applyPreset(preset.range(today))}
                                            className={cn(
                                                'w-full rounded-full border-2 px-3 py-1.5 text-left text-sm font-semibold whitespace-nowrap transition sm:rounded-lg sm:border-0 sm:px-2.5 sm:py-1',
                                                isActive
                                                    ? 'border-brand-400 bg-brand-100 text-brand-700'
                                                    : 'border-line text-ink-soft hover:bg-brand-50 hover:text-ink',
                                            )}
                                        >
                                            {preset.label}
                                        </button>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>

                    <div className="flex justify-center px-4 pt-3 sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:border-l-2 sm:border-line sm:px-4 sm:py-3">
                        <DayPicker
                            mode="range"
                            locale={es}
                            weekStartsOn={1}
                            numberOfMonths={twoMonths ? 2 : 1}
                            month={month}
                            onMonthChange={setMonth}
                            endMonth={today}
                            today={today}
                            disabled={{ after: today }}
                            modifiers={{ preview_end: preview }}
                            modifiersClassNames={{ preview_end: PREVIEW_END_CLASS }}
                            selected={shown}
                            onSelect={(_range, day) => pick(day)}
                            onDayMouseEnter={(day) => setHovered(day)}
                            onDayMouseLeave={() => setHovered(undefined)}
                            onDayFocus={(day) => setHovered(day)}
                            autoFocus
                            classNames={{
                                ...RANGE_CALENDAR_CLASSES,
                                root: cn(RANGE_CALENDAR_CLASSES.root, preview && 'is-previewing'),
                            }}
                            components={{ Chevron: CalendarChevron }}
                        />
                    </div>

                    <div className="mt-2 flex flex-col gap-3 border-t-2 border-line px-4 py-3 sm:col-start-1 sm:row-start-2 sm:mt-0 sm:gap-2 sm:self-end sm:border-t-0 sm:px-3 sm:pt-2 sm:pb-3">
                        <p
                            aria-live="polite"
                            className={cn(
                                'text-sm sm:px-1 sm:text-xs sm:leading-4',
                                draft.from && draft.to ? 'font-semibold text-ink' : 'text-ink-soft',
                            )}
                        >
                            {status}
                        </p>
                        <div className="flex gap-2 sm:gap-1.5">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={closeAndReturn}
                                className="flex-1 sm:px-2"
                            >
                                Cancelar
                            </Button>
                            <Button
                                size="sm"
                                onClick={apply}
                                disabled={!draft.from && !hasValue}
                                className="flex-1 sm:px-2"
                            >
                                Aplicar
                            </Button>
                        </div>
                    </div>
                </div>
            </Popover>
        </div>
    )
}
