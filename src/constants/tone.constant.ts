import type { BadgeTone } from '@/@types/catalog'
import type { BadgeVariant } from '@/components/ui/Badge'

/**
 * How each stored status tone (the API's `BADGE_TONES`, kept for compatibility with the status
 * catalog) is painted with the Galpa badge palette.
 */
export const STATUS_TONE_VARIANTS: Record<BadgeTone, BadgeVariant> = {
    mint: 'brand',
    butter: 'warning',
    sky: 'info',
    blush: 'danger',
    lilac: 'outline',
    solid: 'solid',
    neutral: 'neutral',
}

/** Names the admin reads when choosing a status color. */
export const STATUS_TONE_LABELS: Record<BadgeTone, string> = {
    mint: 'Verde (aprobado)',
    butter: 'Ámbar (atención)',
    sky: 'Celeste (en proceso)',
    blush: 'Rojo (problema)',
    lilac: 'Contorno',
    solid: 'Negro',
    neutral: 'Gris',
}
