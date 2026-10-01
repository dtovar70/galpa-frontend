import { CONTENT_PLACEHOLDERS, type ContentPlaceholder } from '@/@types/content'
import type { PlaceholderValues } from '@/utils/content'

const DESCRIPTIONS: Record<ContentPlaceholder, string> = {
    envioGratis: 'el monto para envío gratis',
    tarifaEnvio: 'la tarifa de envío',
    despacho: 'el texto de despacho',
    categorias: 'la cantidad de categorías en palabras',
    marca: 'el nombre de la marca',
    ciudad: 'la ciudad',
}

/**
 * Hint under a field that accepts placeholders:
 * "Puedes usar {envioGratis} (el monto para envío gratis, hoy $500)."
 */
export function placeholderHint(
    names: readonly ContentPlaceholder[],
    values: PlaceholderValues,
): string {
    const parts = names.map((name) => {
        const current = values[name]
        const suffix = current ? `, hoy «${current}»` : ''
        return `${CONTENT_PLACEHOLDERS[name]} (${DESCRIPTIONS[name]}${suffix})`
    })
    return `Puedes usar ${parts.join(' y ')}.`
}
