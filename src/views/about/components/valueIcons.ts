import {
    HeartHandshake,
    Leaf,
    Palette,
    ShieldCheck,
    Sparkles,
    Star,
    Timer,
    Truck,
    type LucideIcon,
} from 'lucide-react'

import type { AboutValueIcon } from '@/@types/content'

/** Icons a brand value can use, with the name the admin shows for each. */
export const ABOUT_VALUE_ICON_COMPONENTS: Record<AboutValueIcon, LucideIcon> = {
    palette: Palette,
    'heart-handshake': HeartHandshake,
    timer: Timer,
    leaf: Leaf,
    sparkles: Sparkles,
    star: Star,
    truck: Truck,
    'shield-check': ShieldCheck,
}

export const ABOUT_VALUE_ICON_LABELS: Record<AboutValueIcon, string> = {
    palette: 'Paleta (criterio)',
    'heart-handshake': 'Apretón de manos (trato)',
    timer: 'Reloj (tiempos)',
    leaf: 'Hoja (eficiencia)',
    sparkles: 'Destellos',
    star: 'Estrella',
    truck: 'Camión (envíos)',
    'shield-check': 'Escudo (garantía)',
}
