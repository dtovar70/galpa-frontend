import {
    AirVent,
    HeartHandshake,
    ShieldCheck,
    Snowflake,
    Star,
    Timer,
    Truck,
    Wrench,
    type LucideIcon,
} from 'lucide-react'

import type { AboutValueIcon } from '@/@types/content'

/** Icons a brand value can use, with the name the admin shows for each. */
export const ABOUT_VALUE_ICON_COMPONENTS: Record<AboutValueIcon, LucideIcon> = {
    'air-vent': AirVent,
    snowflake: Snowflake,
    wrench: Wrench,
    'heart-handshake': HeartHandshake,
    timer: Timer,
    star: Star,
    truck: Truck,
    'shield-check': ShieldCheck,
}

export const ABOUT_VALUE_ICON_LABELS: Record<AboutValueIcon, string> = {
    'air-vent': 'Aire acondicionado (equipos)',
    snowflake: 'Copo de nieve (frío)',
    wrench: 'Llave (repuestos)',
    'heart-handshake': 'Apretón de manos (trato)',
    timer: 'Reloj (tiempos)',
    star: 'Estrella',
    truck: 'Camión (envíos)',
    'shield-check': 'Escudo (garantía)',
}
