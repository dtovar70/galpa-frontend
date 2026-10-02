import { useCallback, useId, useRef, useState, type Ref } from 'react'
import { addDays, isAfter, isBefore, isSameDay, startOfMonth } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import { DayPicker, type Matcher } from 'react-day-picker'
import { es } from 'react-day-picker/locale'

import { CalendarChevron } from '@/components/ui/CalendarChevron'
import { CALENDAR_CLASSES, CALENDAR_SELECTED_DAY_CLASS } from '@/components/ui/calendar.styles'
import {
    FIELD_BASE_CLASS,
    FIELD_ERROR_CLASS,
    FIELD_HINT_CLASS,
    FIELD_LABEL_CLASS,
    FIELD_MESSAGE_ERROR_CLASS,
} from '@/components/ui/field.styles'
import { OptionalMark } from '@/components/ui/OptionalMark'
import { Popover, type PopoverCloseReason } from '@/components/ui/Popover'
import { caracasToday, formatDayRange, parseCalendarDay, toCalendarDay } from '@/utils/calendarDay'
import { cn } from '@/utils/cn'

const DAY_CALENDAR_CLASSES = { ...CALENDAR_CLASSES, selected: CALENDAR_SELECTED_DAY_CLASS }

const DAY_PRESETS = [
    { id: 'today', label: 'Hoy', day: (today: Date) => today },
    { id: 'yesterday', label: 'Ayer', day: (today: Date) => addDays(today, -1) },
] as const

export interface DatePickerProps {
    label: string
    /** Hides the label visually while keeping it available to screen readers. */
    hideLabel?: boolean
    hint?: string
    error?: string
    /** Adds a muted "(opcional)" suffix to the label. */
    optional?: boolean
    /** The picked Caracas calendar day, "YYYY-MM-DD"; empty or undefined when none. */
    value?: string
    onChange: (value: string) => void
    onBlur?: () => void
    /** Also rendered as a hidden input, so a plain `<form>` submits the day too. */
    name?: string
    /** Earliest selectable day, "YYYY-MM-DD" (inclusive). */
    min?: string
    /** Latest selectable day, "YYYY-MM-DD" (inclusive). */
    max?: string
    placeholder?: string
    /** "Hoy" / "Ayer" shortcuts under the calendar; each shows only when it is selectable. */
    presets?: boolean
    disabled?: boolean
    /** Lands on the trigger button, so react-hook-form can focus the field on an error. */
    ref?: Ref<HTMLButtonElement>
    className?: string
}

/**
 * One calendar day, as a drop-in for `<input type="date">`: same "YYYY-MM-DD" value, the look of
 * the other fields, and a Spanish Monday-first calendar that applies the day on click. A
 * popover on wide screens, a bottom sheet on phones. Works with react-hook-form's `Controller`
 * (`value`, `onChange`, `onBlur`, `name`, `ref`).
 */
export function DatePicker({
    label,
    hideLabel = false,
    hint,
    error,
    optional = false,
    value,
    onChange,
    onBlur,
    name,
    min,
    max,
    placeholder = 'Elige una fecha',
    presets = true,
    disabled = false,
    ref,
    className,
}: DatePickerProps) {
    const baseId = useId()
    const labelId = `${baseId}-label`
    const valueId = `${baseId}-value`
    const hintId = `${baseId}-hint`
    const errorId = `${baseId}-error`
    const dialogId = `${baseId}-dialog`

    const triggerRef = useRef<HTMLButtonElement | null>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [month, setMonth] = useState(() => startOfMonth(new Date()))
    const [today, setToday] = useState(caracasToday)
    const [container, setContainer] = useState<Element | null>(null)

    const selected = parseCalendarDay(value)
    const minDay = parseCalendarDay(min)
    const maxDay = parseCalendarDay(max)

    const isSelectable = (day: Date) =>
        !(minDay && isBefore(day, minDay)) && !(maxDay && isAfter(day, maxDay))

    const disabledDays: Matcher[] = []
    if (minDay) disabledDays.push({ before: minDay })
    if (maxDay) disabledDays.push({ after: maxDay })

    const attachTrigger = useCallback(
        (node: HTMLButtonElement | null) => {
            triggerRef.current = node
            if (typeof ref === 'function') return ref(node)
            if (ref) ref.current = node
        },
        [ref],
    )

    const open = () => {
        const now = caracasToday()
        const anchor = selected ?? (maxDay && isAfter(now, maxDay) ? maxDay : now)
        setToday(now)
        setMonth(startOfMonth(minDay && isBefore(anchor, minDay) ? minDay : anchor))
        // Inside a modal <dialog> the panel must live in the dialog, or it is inert.
        setContainer(triggerRef.current?.closest('dialog') ?? null)
        setIsOpen(true)
    }

    /* Escape hands focus back to the trigger; a press elsewhere means the field was left. */
    const close = useCallback(
        (reason?: PopoverCloseReason) => {
            setIsOpen(false)
            if (reason === 'outside') onBlur?.()
        },
        [onBlur],
    )

    const clear = () => {
        onChange('')
        setIsOpen(false)
        triggerRef.current?.focus()
    }

    const pick = (day: Date) => {
        if (!isSelectable(day)) return
        onChange(toCalendarDay(day))
        setIsOpen(false)
        triggerRef.current?.focus()
    }

    const shownPresets = presets
        ? DAY_PRESETS.map((preset) => ({ ...preset, date: preset.day(today) })).filter((preset) =>
              isSelectable(preset.date),
          )
        : []

    const describedBy = error ? errorId : hint ? hintId : undefined

    return (
        <div className={cn('flex w-full flex-col gap-1.5', className)}>
            <span id={labelId} className={cn(FIELD_LABEL_CLASS, hideLabel && 'sr-only')}>
                {label}
                {optional ? <OptionalMark /> : null}
            </span>

            {name ? <input type="hidden" name={name} value={value ?? ''} /> : null}

            <button
                ref={attachTrigger}
                type="button"
                disabled={disabled}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                aria-controls={isOpen ? dialogId : undefined}
                aria-labelledby={`${labelId} ${valueId}`}
                aria-describedby={describedBy}
                onClick={() => (isOpen ? setIsOpen(false) : open())}
                onBlur={() => {
                    if (!isOpen) onBlur?.()
                }}
                className={cn(
                    FIELD_BASE_CLASS,
                    'flex h-11 items-center gap-2.5 rounded-xl px-4 text-left outline-none enabled:hover:border-brand-200',
                    isOpen && 'border-brand-400 ring-4 ring-brand-100',
                    error && FIELD_ERROR_CLASS,
                )}
            >
                <CalendarDays
                    aria-hidden="true"
                    className={cn('size-4 shrink-0', selected ? 'text-brand-600' : 'text-ink-soft')}
                />
                <span
                    id={valueId}
                    className={cn('truncate', selected ? 'text-ink' : 'text-ink-soft/70')}
                >
                    {selected ? formatDayRange(selected) : placeholder}
                </span>
            </button>

            {error ? (
                <p id={errorId} role="alert" className={FIELD_MESSAGE_ERROR_CLASS}>
                    {error}
                </p>
            ) : hint ? (
                <p id={hintId} className={FIELD_HINT_CLASS}>
                    {hint}
                </p>
            ) : null}

            <Popover
                open={isOpen}
                anchorRef={triggerRef}
                onClose={close}
                placement="bottom"
                align="start"
                sheetOnMobile
                trapFocus
                container={container}
                id={dialogId}
                role="dialog"
                aria-label={label}
                className="sm:w-max"
            >
                <p className="px-5 pt-3 text-lg font-bold text-ink sm:hidden">{label}</p>
                <div className="flex justify-center px-4 pt-3 sm:px-4 sm:pt-4">
                    <DayPicker
                        mode="single"
                        required
                        locale={es}
                        weekStartsOn={1}
                        month={month}
                        onMonthChange={setMonth}
                        startMonth={minDay}
                        endMonth={maxDay}
                        today={today}
                        disabled={disabledDays}
                        selected={selected}
                        onSelect={(_day, day) => pick(day)}
                        autoFocus
                        classNames={DAY_CALENDAR_CLASSES}
                        components={{ Chevron: CalendarChevron }}
                    />
                </div>
                {shownPresets.length || (optional && selected) ? (
                    <div className="mt-2 flex items-center gap-2 border-t-2 border-line px-4 py-3">
                        {shownPresets.map((preset) => {
                            const isActive = Boolean(selected && isSameDay(selected, preset.date))
                            return (
                                <button
                                    key={preset.id}
                                    type="button"
                                    aria-pressed={isActive}
                                    onClick={() => pick(preset.date)}
                                    className={cn(
                                        'rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap transition focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none',
                                        isActive
                                            ? 'border-brand-400 bg-brand-100 text-brand-700'
                                            : 'border-line text-ink-soft hover:bg-brand-50 hover:text-ink',
                                    )}
                                >
                                    {preset.label}
                                </button>
                            )
                        })}
                        {optional && selected ? (
                            <button
                                type="button"
                                onClick={clear}
                                className="ml-auto rounded-full px-3 py-1.5 text-sm font-semibold text-ink-soft transition hover:bg-brand-50 hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
                            >
                                Quitar fecha
                            </button>
                        ) : null}
                    </div>
                ) : (
                    <div className="h-3" />
                )}
            </Popover>
        </div>
    )
}
