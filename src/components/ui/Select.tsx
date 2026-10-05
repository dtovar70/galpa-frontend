import {
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type ComponentPropsWithRef,
    type KeyboardEvent,
} from 'react'
import { cva } from 'class-variance-authority'
import { Check, ChevronDown } from 'lucide-react'

import {
    FIELD_BASE_CLASS,
    FIELD_ERROR_CLASS,
    FIELD_HINT_CLASS,
    FIELD_LABEL_CLASS,
    FIELD_MESSAGE_ERROR_CLASS,
} from '@/components/ui/field.styles'
import { OptionalMark } from '@/components/ui/OptionalMark'
import { Popover, SHEET_QUERY } from '@/components/ui/Popover'
import { cn } from '@/utils/cn'
import { useMediaQuery } from '@/utils/hooks/useMediaQuery'

/**
 * React installs its own `value` setter on every <select> node and remembers the last value
 * it wrote there. Assigning through that instance setter keeps its tracker in sync, so the
 * change event we dispatch right after is discarded as a no-op. Reaching for the prototype
 * setter leaves the tracker stale, which is precisely what makes React — and react-hook-form
 * riding on top of it — treat the dispatch as a genuine user change.
 */
const nativeValueSetter =
    typeof HTMLSelectElement === 'undefined'
        ? undefined
        : Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set

/** How long a typed prefix stays alive before the next keystroke starts a fresh search. */
const TYPEAHEAD_RESET_MS = 600

/** Panel height plus its gap; below this the list flips above the trigger instead. */
const PANEL_CLEARANCE_PX = 264

/**
 * The list grows past a narrow trigger to fit its longest option, up to 22rem and never past
 * the viewport (keeping this gutter on each side). Longer labels still truncate.
 */
const PANEL_MAX_WIDTH = 'min(22rem, calc(100vw - 2rem))'
const VIEWPORT_GUTTER_PX = 16

/**
 * When the list opens as a bottom sheet instead of the floating panel: the Popover's own
 * small-screen breakpoint, so a Select and a DatePicker in one form always agree, plus any
 * touch-first screen. A tablet held wide clears 640px, yet a finger still wants big rows and a
 * sheet within thumb reach more than a dropdown hanging off a 44px field.
 */
const SELECT_SHEET_QUERY = `${SHEET_QUERY}, (pointer: coarse)`

const optionVariants = cva(
    'flex cursor-pointer items-center justify-between gap-3 rounded-xl font-semibold transition duration-150',
    {
        variants: {
            // The sheet's rows are thumb targets: 48px at least, and 16px text.
            inSheet: { true: 'min-h-12 px-4 py-3 text-base', false: 'px-3.5 py-2.5 text-sm' },
            isSelected: { true: 'text-brand-700', false: 'text-ink-soft' },
            isActive: { true: '', false: '' },
            isDisabled: { true: 'cursor-not-allowed opacity-45', false: '' },
        },
        compoundVariants: [
            { isSelected: true, isActive: true, class: 'bg-brand-200 text-brand-800' },
            { isSelected: true, isActive: false, class: 'bg-brand-100' },
            { isSelected: false, isActive: true, class: 'bg-brand-50 text-ink' },
            // Tailwind's `hover:` only applies where a pointer can hover, never to a finger.
            { inSheet: true, isSelected: false, isDisabled: false, class: 'hover:bg-brand-50' },
        ],
        defaultVariants: { inSheet: false, isSelected: false, isActive: false, isDisabled: false },
    },
)

export interface SelectOption {
    value: string
    label: string
    /** A quieter second line in the list (the trigger shows only the label). */
    description?: string
    disabled?: boolean
}

export interface SelectProps extends Omit<ComponentPropsWithRef<'select'>, 'id'> {
    label: string
    options: SelectOption[]
    /** Hides the label visually while keeping it available to screen readers. */
    hideLabel?: boolean
    hint?: string
    error?: string
    /** Adds a muted "(opcional)" suffix to the label. */
    optional?: boolean
    placeholder?: string
}

/**
 * A listbox we draw ourselves, because the native dropdown is painted by the operating
 * system and ignores every style we own.
 *
 * A real <select> stays mounted behind it, holding the value and the forwarded ref, so
 * `register()` and `event.target.value` keep working untouched at every call site — the
 * custom UI only drives that element and never becomes the source of truth.
 *
 * On small or touch screens (`SELECT_SHEET_QUERY`) the list opens as a bottom sheet — the
 * Popover's, with its backdrop, scroll lock and rise-in — titled with the field label, its
 * rows big enough for a thumb. It used to hand the taps to the native <select> instead, but
 * that picker is the operating system's again: unstyled, and a bare desktop popup wherever
 * a browser only pretends to be a phone. Focus moves into the sheet's list while it is open
 * and returns to the trigger when it closes, however it closes.
 */
export function Select({
    label,
    options,
    hideLabel = false,
    hint,
    error,
    optional = false,
    placeholder,
    className,
    ref,
    ...rest
}: SelectProps) {
    const fieldId = useId()
    const labelId = `${fieldId}-label`
    const listboxId = `${fieldId}-listbox`
    const hintId = `${fieldId}-hint`
    const errorId = `${fieldId}-error`

    const selectRef = useRef<HTMLSelectElement>(null)
    const rootRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const listRef = useRef<HTMLUListElement>(null)
    const sheetTitleId = `${fieldId}-sheet-title`
    const typeahead = useRef({ query: '', timer: 0 })

    const [isOpen, setIsOpen] = useState(false)
    const [panel, setPanel] = useState({ dropUp: false, width: 0, left: 0 })
    const [sheetContainer, setSheetContainer] = useState<Element | null>(null)
    const [activeIndex, setActiveIndex] = useState(-1)
    const [selectedValue, setSelectedValue] = useState(() => {
        if (rest.value !== undefined) return String(rest.value)
        if (rest.defaultValue !== undefined) return String(rest.defaultValue)
        return placeholder ? '' : (options[0]?.value ?? '')
    })

    const isDisabled = rest.disabled === true
    const asSheet = useMediaQuery(SELECT_SHEET_QUERY)
    const describedBy = error ? errorId : hint ? hintId : undefined
    const selectedOption = options.find((option) => option.value === selectedValue)

    const enabledBounds = useMemo(() => {
        const first = options.findIndex((option) => !option.disabled)
        let last = -1
        for (let index = options.length - 1; index >= 0; index -= 1) {
            if (!options[index]?.disabled) {
                last = index
                break
            }
        }
        return { first, last }
    }, [options])

    /** Keeps the forwarded ref (react-hook-form's, usually) and our own pointing at one node. */
    const attachSelect = useCallback(
        (node: HTMLSelectElement | null) => {
            selectRef.current = node
            if (typeof ref === 'function') ref(node)
            else if (ref) ref.current = node
        },
        [ref],
    )

    /*
     * Form libraries seed the field by writing straight to the DOM node, with no re-render to
     * observe, so the element itself is the only trustworthy value. Mirror it back after every
     * render until the two agree; comparing first keeps this from looping.
     *
     * A dependency list would defeat the point: `setValue()` and `reset()` also land straight
     * on the node without rendering us, and a deps-gated effect would never see them.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useLayoutEffect(() => {
        const node = selectRef.current
        if (node && node.value !== selectedValue) setSelectedValue(node.value)
    })

    const commit = useCallback((nextValue: string) => {
        const node = selectRef.current
        if (!node) return
        nativeValueSetter?.call(node, nextValue)
        node.dispatchEvent(new Event('change', { bubbles: true }))
        setSelectedValue(node.value)
    }, [])

    const openList = useCallback(
        (landOn: 'selected' | 'first' | 'last' = 'selected') => {
            if (isDisabled || options.length === 0) return
            const selectedIndex = options.findIndex(
                (option) => option.value === selectedValue && !option.disabled,
            )
            // A tapped sheet highlights only the chosen row; a first row lit up would pass for it.
            const fallback =
                landOn === 'last'
                    ? enabledBounds.last
                    : asSheet && landOn === 'selected'
                      ? -1
                      : enabledBounds.first
            setActiveIndex(landOn === 'selected' && selectedIndex >= 0 ? selectedIndex : fallback)
            // Inside a modal <dialog> the sheet must live in the dialog, or it is inert (and
            // drawn beneath it). A Drawer is not a <dialog>: the body portal clears its z-50.
            setSheetContainer(triggerRef.current?.closest('dialog') ?? null)
            setIsOpen(true)
        },
        [asSheet, enabledBounds, isDisabled, options, selectedValue],
    )

    const closeList = useCallback(() => {
        setIsOpen(false)
        setActiveIndex(-1)
    }, [])

    /* The sheet is modal: however it goes away, the field it belongs to gets focus back. */
    const dismissSheet = useCallback(() => {
        closeList()
        triggerRef.current?.focus()
    }, [closeList])

    const stepActive = useCallback(
        (step: number) => {
            const total = options.length
            if (total === 0) return
            setActiveIndex((current) => {
                // Nothing active yet (a sheet with no value): Up starts from the last row.
                let index = current < 0 && step < 0 ? total : current
                for (let hop = 0; hop < total; hop += 1) {
                    index = (((index + step) % total) + total) % total
                    if (!options[index]?.disabled) return index
                }
                return current
            })
        },
        [options],
    )

    const selectActive = useCallback(() => {
        const option = options[activeIndex]
        if (!option || option.disabled) return
        commit(option.value)
        closeList()
        triggerRef.current?.focus()
    }, [activeIndex, closeList, commit, options])

    /** Jumping by typed prefix, the one native-select habit worth keeping. */
    const runTypeahead = useCallback(
        (character: string) => {
            window.clearTimeout(typeahead.current.timer)
            const query = (typeahead.current.query + character).toLowerCase()
            typeahead.current.query = query
            typeahead.current.timer = window.setTimeout(() => {
                typeahead.current.query = ''
            }, TYPEAHEAD_RESET_MS)

            const matchIndex = options.findIndex(
                (option) => !option.disabled && option.label.toLowerCase().startsWith(query),
            )
            const matched = options[matchIndex]
            if (!matched) return
            if (isOpen) setActiveIndex(matchIndex)
            else commit(matched.value)
        },
        [commit, isOpen, options],
    )

    useEffect(() => () => window.clearTimeout(typeahead.current.timer), [])

    /*
     * Pointer down rather than click: the list should be gone before the next widget reacts.
     * The sheet is portalled outside the root, so the Popover watches its backdrop instead.
     */
    useEffect(() => {
        if (!isOpen || asSheet) return
        const onPointerDown = (event: PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) closeList()
        }
        document.addEventListener('pointerdown', onPointerDown)
        return () => document.removeEventListener('pointerdown', onPointerDown)
    }, [asSheet, closeList, isOpen])

    /*
     * Measured rather than stretched: callers size the control through `className`, so the
     * containing block is wider than the trigger and `inset-x-0` would hang the panel past it.
     * The list is at least as wide as the trigger and grows to fit its options (up to
     * `PANEL_MAX_WIDTH`), moving left when it would cross the viewport's right edge. The same
     * measurement decides the direction, since a field near the fold would otherwise drop its
     * list off-screen.
     */
    useLayoutEffect(() => {
        if (!isOpen || asSheet) return
        const rect = triggerRef.current?.getBoundingClientRect()
        if (!rect) return
        const spaceBelow = window.innerHeight - rect.bottom
        // Rendered at `max-content` (capped), so this is the width its options ask for.
        const listWidth = Math.max(rect.width, listRef.current?.offsetWidth ?? 0)
        // Aligned with the trigger, shifted left only as far as needed to stay on screen.
        const viewportLeft = Math.max(
            VIEWPORT_GUTTER_PX,
            Math.min(rect.left, window.innerWidth - VIEWPORT_GUTTER_PX - listWidth),
        )
        const containerLeft = listRef.current?.offsetParent?.getBoundingClientRect().left ?? 0
        setPanel({
            dropUp: spaceBelow < PANEL_CLEARANCE_PX && rect.top > spaceBelow,
            width: rect.width,
            left: viewportLeft - containerLeft,
        })
    }, [asSheet, isOpen])

    /*
     * The sheet takes focus, as a modal should: the keys then work on its list, and a screen
     * reader lands among the options instead of behind the backdrop.
     */
    useEffect(() => {
        if (isOpen && asSheet) listRef.current?.focus({ preventScroll: true })
    }, [asSheet, isOpen])

    /* Focus never leaves the trigger (or the sheet's list), so the active row is scrolled by hand. */
    useEffect(() => {
        if (!isOpen || activeIndex < 0) return
        listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' })
    }, [activeIndex, isOpen])

    /* Shared by the trigger and, while it holds focus, the sheet's list. */
    const onListKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault()
                if (isOpen) stepActive(1)
                else openList()
                return
            case 'ArrowUp':
                event.preventDefault()
                if (isOpen) stepActive(-1)
                else openList('last')
                return
            case 'Home':
                if (!isOpen) return
                event.preventDefault()
                setActiveIndex(enabledBounds.first)
                return
            case 'End':
                if (!isOpen) return
                event.preventDefault()
                setActiveIndex(enabledBounds.last)
                return
            case 'Enter':
            case ' ':
                event.preventDefault()
                if (isOpen) selectActive()
                else openList()
                return
            case 'Escape':
                if (!isOpen) return
                event.preventDefault()
                // Only the sheet: an enclosing dialog or Drawer would close on the same press.
                event.stopPropagation()
                if (asSheet) dismissSheet()
                else closeList()
                return
            case 'Tab':
                // The sheet traps Tab (the Popover's `trapFocus`); the panel simply closes.
                if (isOpen && !asSheet) closeList()
                return
            default:
                if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
                    event.preventDefault()
                    runTypeahead(event.key)
                }
        }
    }

    const renderOptions = (inSheet: boolean) =>
        options.map((option, index) => {
            const isSelected = option.value === selectedValue
            return (
                <li
                    key={option.value}
                    id={`${fieldId}-option-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled}
                    /*
                     * Not in the sheet: it opens under a finger at rest, and the browser fires a
                     * mouseenter on whichever row slides beneath it. Its rows hover by CSS alone.
                     */
                    onMouseEnter={
                        inSheet ? undefined : () => !option.disabled && setActiveIndex(index)
                    }
                    onClick={() => {
                        if (option.disabled) return
                        commit(option.value)
                        closeList()
                        triggerRef.current?.focus()
                    }}
                    className={optionVariants({
                        inSheet,
                        isSelected,
                        isActive: index === activeIndex,
                        isDisabled: option.disabled === true,
                    })}
                >
                    {option.description ? (
                        <span className="flex min-w-0 flex-col gap-0.5">
                            <span className="truncate">{option.label}</span>
                            <span className="text-xs leading-snug font-normal text-ink-soft">
                                {option.description}
                            </span>
                        </span>
                    ) : (
                        <span className="truncate">{option.label}</span>
                    )}
                    {isSelected ? (
                        <Check
                            aria-hidden="true"
                            className={cn('shrink-0', inSheet ? 'size-5' : 'size-4')}
                        />
                    ) : null}
                </li>
            )
        })

    return (
        <div ref={rootRef} className="flex w-full flex-col gap-1.5">
            <span id={labelId} className={cn(FIELD_LABEL_CLASS, hideLabel && 'sr-only')}>
                {label}
                {optional ? <OptionalMark /> : null}
            </span>

            <div className="relative">
                {/*
                 * The real control: it owns the value, the name and the forwarded ref, but it is
                 * pulled out of the accessibility tree and the tab order so the button below is
                 * the only thing a keyboard or a screen reader ever meets.
                 */}
                <select
                    ref={attachSelect}
                    {...rest}
                    onChange={(event) => {
                        setSelectedValue(event.target.value)
                        rest.onChange?.(event)
                    }}
                    tabIndex={-1}
                    aria-hidden
                    className="pointer-events-none absolute bottom-0 left-4 size-0 opacity-0"
                >
                    {placeholder ? (
                        <option value="" hidden>
                            {placeholder}
                        </option>
                    ) : null}
                    {options.map((option) => (
                        <option key={option.value} value={option.value} disabled={option.disabled}>
                            {option.label}
                        </option>
                    ))}
                </select>

                <button
                    ref={triggerRef}
                    type="button"
                    role="combobox"
                    disabled={rest.disabled}
                    aria-labelledby={labelId}
                    aria-controls={listboxId}
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    aria-required={rest.required}
                    aria-invalid={error ? true : undefined}
                    aria-activedescendant={
                        isOpen && !asSheet && activeIndex >= 0
                            ? `${fieldId}-option-${activeIndex}`
                            : undefined
                    }
                    aria-describedby={describedBy}
                    onClick={() => (isOpen ? closeList() : openList())}
                    onKeyDown={onListKeyDown}
                    className={cn(
                        FIELD_BASE_CLASS,
                        'flex h-11 items-center justify-between gap-3 rounded-xl px-4 text-left outline-none',
                        'enabled:hover:border-brand-200',
                        isOpen && 'border-brand-400 ring-4 ring-brand-100',
                        error && FIELD_ERROR_CLASS,
                        className,
                    )}
                >
                    <span className={cn('truncate', !selectedOption && 'text-ink-soft/70')}>
                        {selectedOption?.label ?? placeholder ?? ''}
                    </span>
                    <ChevronDown
                        aria-hidden="true"
                        className={cn(
                            'size-4 shrink-0 text-ink-soft transition duration-200',
                            isOpen && 'rotate-180 text-brand-600',
                        )}
                    />
                </button>

                {isOpen && !asSheet ? (
                    <ul
                        ref={listRef}
                        id={listboxId}
                        role="listbox"
                        aria-labelledby={labelId}
                        /* Keep the press from pulling focus off the trigger that drives the keys. */
                        onMouseDown={(event) => event.preventDefault()}
                        style={{
                            left: panel.left,
                            minWidth: panel.width || undefined,
                            maxWidth: PANEL_MAX_WIDTH,
                        }}
                        className={cn(
                            'absolute z-30 max-h-60 w-max space-y-0.5 overflow-y-auto overscroll-contain',
                            'animate-select-pop rounded-2xl border border-line bg-white p-1.5 shadow-lift',
                            panel.dropUp
                                ? 'bottom-full mb-2 origin-bottom'
                                : 'top-full mt-2 origin-top',
                        )}
                    >
                        {renderOptions(false)}
                    </ul>
                ) : null}
            </div>

            {error ? (
                <p id={errorId} role="alert" className={FIELD_MESSAGE_ERROR_CLASS}>
                    {error}
                </p>
            ) : hint ? (
                <p id={hintId} className={FIELD_HINT_CLASS}>
                    {hint}
                </p>
            ) : null}

            {/*
             * The Popover's sheet brings the backdrop, the body scroll lock, the rise-in (cut short
             * under `prefers-reduced-motion` by the global rule) and the 640px+ centring. Escape is
             * caught on the list first, so it never reaches the Popover or an enclosing dialog.
             */}
            <Popover
                open={isOpen && asSheet}
                anchorRef={triggerRef}
                onClose={dismissSheet}
                sheetOnMobile
                sheetQuery={SELECT_SHEET_QUERY}
                trapFocus
                container={sheetContainer}
                role="dialog"
                aria-label={label}
                className="flex flex-col sm:mx-auto sm:w-full sm:max-w-lg"
            >
                <p id={sheetTitleId} className="px-5 pt-3 pb-2 text-base font-bold text-ink">
                    {label}
                </p>
                <ul
                    ref={listRef}
                    id={listboxId}
                    role="listbox"
                    tabIndex={0}
                    aria-labelledby={sheetTitleId}
                    aria-activedescendant={
                        activeIndex >= 0 ? `${fieldId}-option-${activeIndex}` : undefined
                    }
                    onKeyDown={onListKeyDown}
                    className="scroll-soft max-h-[70dvh] space-y-1 overflow-y-auto overscroll-contain px-3 pb-4 outline-none"
                >
                    {renderOptions(true)}
                </ul>
            </Popover>
        </div>
    )
}
