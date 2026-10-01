import type { BadgeTone } from '@/@types/catalog'
import type { BadgeVariant } from '@/components/ui/Badge'

/** The badge variant of each stored status tone (the API stores the variant names themselves). */
export const STATUS_TONE_VARIANTS: Record<BadgeTone, BadgeVariant> = {
    brand: 'brand',
    warning: 'warning',
    info: 'info',
    danger: 'danger',
    outline: 'outline',
    solid: 'solid',
    neutral: 'neutral',
}

/** Names the admin reads when choosing a status color. */
export const STATUS_TONE_LABELS: Record<BadgeTone, string> = {
    brand: 'Verde (aprobado)',
    warning: 'Ámbar (atención)',
    info: 'Celeste (en proceso)',
    danger: 'Rojo (problema)',
    outline: 'Contorno',
    solid: 'Negro',
    neutral: 'Gris',
}
