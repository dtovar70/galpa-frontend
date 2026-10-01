import type { ClassNames } from 'react-day-picker'

/*
 * Brand styling shared by every react-day-picker calendar (DatePicker, DateRangePicker). Kept
 * out of the ui barrel for the same reason as the pickers: it only matters where a calendar is.
 */

const NAV_BUTTON_CLASS =
    'flex size-8 items-center justify-center rounded-full text-ink-soft transition hover:bg-brand-100 hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-30 aria-disabled:pointer-events-none aria-disabled:opacity-30'

/**
 * Month grid, navigation, today dot and disabled days; modes add their own selection look.
 * Today is tinted only while unselected, so a picked today stays white on green. Days are
 * 36px, so two months plus the range presets fit a 600px-tall window.
 */
export const CALENDAR_CLASSES: Partial<ClassNames> = {
    root: 'group/calendar relative',
    // Side by side: the pickers only ask for a second month where it fits.
    months: 'relative flex gap-6',
    month: 'space-y-1',
    month_caption: 'flex h-8 items-center justify-center',
    caption_label: 'text-[0.95rem] font-semibold text-ink capitalize',
    nav: 'absolute inset-x-0 top-0 z-10 flex h-8 items-center justify-between',
    button_previous: NAV_BUTTON_CLASS,
    button_next: NAV_BUTTON_CLASS,
    month_grid: 'border-collapse',
    weekdays: '',
    weekday: 'h-6 w-9 text-[0.65rem] font-bold text-ink-soft/80 uppercase',
    week: '',
    day: 'p-0 text-center text-sm',
    day_button:
        'relative mx-auto flex size-9 items-center justify-center rounded-full font-semibold text-ink transition-colors hover:bg-brand-100 hover:text-brand-800 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1 focus-visible:outline-none',
    today: '[&:not([data-selected])>button]:text-brand-700 [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:size-1 [&>button]:after:-translate-x-1/2 [&>button]:after:rounded-full [&>button]:after:bg-current',
    selected: '',
    disabled:
        '[&>button]:cursor-not-allowed [&>button]:text-ink-soft/35 [&>button]:hover:bg-transparent [&>button]:hover:text-ink-soft/35',
    outside: 'invisible',
    hidden: 'invisible',
    focused: '',
}

/** A picked day on its own: the solid green dot (also the ends of a range). */
export const CALENDAR_SELECTED_DAY_CLASS =
    '[&>button]:bg-brand-700 [&>button]:text-white [&>button]:hover:bg-brand-800 [&>button]:hover:text-white'
