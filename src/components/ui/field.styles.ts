/**
 * Shared shell for the text-entry fields (Input, Textarea, Select).
 *
 * The focus treatment is deliberately one element: the border turns green and a soft halo
 * hugs it. A coloured border *plus* an offset ring reads as two stacked outlines.
 */
export const FIELD_BASE_CLASS =
    'w-full border border-line-strong bg-white text-base text-ink transition placeholder:text-ink-muted/80 focus-visible:border-brand-500 focus-visible:ring-4 focus-visible:ring-brand-100 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60'

/** Field label; `OptionalMark` sits inline after the text when a field can be left empty. */
export const FIELD_LABEL_CLASS = 'text-sm font-semibold text-ink'

/** One helper style for every field: small, muted, directly under the control. */
export const FIELD_HINT_CLASS = 'text-xs leading-snug text-ink-soft'

/** Validation message under a field; replaces the hint while it is shown. */
export const FIELD_MESSAGE_ERROR_CLASS = 'text-sm font-medium text-danger-700'

/** Invalid fields keep the halo but swap both layers to red. */
export const FIELD_ERROR_CLASS =
    'border-danger-500 focus-visible:border-danger-500 focus-visible:ring-danger-100'
