import type { BadgeTone } from '@/@types/catalog'
import type { BadgeVariant } from '@/components/ui/Badge'

/**
 * The badge variant of each stored status tone. The API stores `brand` for the "approved" green
 * (the brand used to be green); it renders with the success variant now that brand is blue.
 * `solid` (navy) reads too heavy on a status, so statuses show it as the soft blue `done`.
 */
export const STATUS_TONE_VARIANTS: Record<BadgeTone, BadgeVariant> = {
    brand: 'success',
    warning: 'warning',
    info: 'info',
    danger: 'danger',
    outline: 'outline',
    solid: 'done',
    neutral: 'neutral',
}

/** Names the admin reads when choosing a status color. */
export const STATUS_TONE_LABELS: Record<BadgeTone, string> = {
    brand: 'Verde (aprobado)',
    warning: 'Ámbar (atención)',
    info: 'Celeste (en proceso)',
    danger: 'Rojo (problema)',
    outline: 'Contorno',
    solid: 'Azul claro (completado)',
    neutral: 'Gris',
}
