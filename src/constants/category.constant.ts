import {
    AirVent,
    Box,
    Building2,
    Cable,
    Factory,
    Fan,
    Gauge,
    House,
    Package,
    Plug,
    Settings,
    Snowflake,
    Thermometer,
    Wrench,
    Zap,
    type LucideIcon,
} from 'lucide-react'

import type { Category, CategorySlug } from '@/@types/product'

/**
 * Icons a category can use (the admin picks one by name). Names are lucide's kebab-case ids,
 * which is what the API stores in `Category.icon`.
 */
export const CATEGORY_ICONS = {
    'air-vent': { icon: AirVent, label: 'Aire acondicionado' },
    'building-2': { icon: Building2, label: 'Edificio' },
    house: { icon: House, label: 'Hogar' },
    factory: { icon: Factory, label: 'Industria' },
    snowflake: { icon: Snowflake, label: 'Copo de nieve' },
    fan: { icon: Fan, label: 'Ventilador' },
    thermometer: { icon: Thermometer, label: 'Termómetro' },
    gauge: { icon: Gauge, label: 'Manómetro' },
    wrench: { icon: Wrench, label: 'Llave' },
    settings: { icon: Settings, label: 'Engranaje' },
    package: { icon: Package, label: 'Paquete' },
    box: { icon: Box, label: 'Caja' },
    plug: { icon: Plug, label: 'Enchufe' },
    cable: { icon: Cable, label: 'Cable' },
    zap: { icon: Zap, label: 'Electricidad' },
} as const satisfies Record<string, { icon: LucideIcon; label: string }>

export type CategoryIconName = keyof typeof CATEGORY_ICONS

export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS) as CategoryIconName[]

export function isCategoryIconName(value: string | null | undefined): value is CategoryIconName {
    return typeof value === 'string' && Object.hasOwn(CATEGORY_ICONS, value)
}

/** The category's icon; unknown or missing names fall back to the air conditioner. */
export function categoryIcon(icon: string | null | undefined): LucideIcon {
    return isCategoryIconName(icon) ? CATEGORY_ICONS[icon].icon : AirVent
}

/** Line-art drawn when a product has no photo. */
export type PlaceholderArt = 'split' | 'cassette' | 'part' | 'accessory'

const ART_BY_SLUG: Record<string, PlaceholderArt> = {
    'aires-residenciales': 'split',
    'aires-comerciales': 'cassette',
    repuestos: 'part',
    accesorios: 'accessory',
}

const ART_BY_ICON: Partial<Record<CategoryIconName, PlaceholderArt>> = {
    'building-2': 'cassette',
    factory: 'cassette',
    wrench: 'part',
    settings: 'part',
    gauge: 'part',
    package: 'accessory',
    box: 'accessory',
    plug: 'accessory',
    cable: 'accessory',
}

/**
 * The placeholder drawing of a category: by its seeded slug, then by its icon, else the
 * split unit (most of the catalog).
 */
export function placeholderArtFor(
    slug: CategorySlug,
    category?: Pick<Category, 'icon'> | null,
): PlaceholderArt {
    const bySlug = ART_BY_SLUG[slug]
    if (bySlug) return bySlug
    const icon = category?.icon
    return (isCategoryIconName(icon) ? ART_BY_ICON[icon] : undefined) ?? 'split'
}
