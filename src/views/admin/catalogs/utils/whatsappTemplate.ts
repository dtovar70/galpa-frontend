import type { OrderStatus } from '@/@types/order'

/**
 * Placeholders of the "Avisar por WhatsApp" templates. The API fills them in
 * (backend-galpa/src/orders/whatsapp/whatsapp-template.ts): keep the list, the rules and
 * `renderWhatsAppTemplate` in sync with it. Here they only drive the editor and its preview.
 */
export const WHATSAPP_PLACEHOLDERS = [
    { name: 'nombre', description: 'Primer nombre del cliente' },
    { name: 'pedido', description: 'Código del pedido' },
    { name: 'enlace', description: 'Enlace nuevo a la página del pedido' },
    { name: 'total', description: 'Total en $ y en Bs.' },
    {
        name: 'motivo',
        description: 'Motivo del último cambio a este estado (rechazo, cancelación)',
    },
    { name: 'marca', description: 'Nombre de la tienda' },
    { name: 'envio', description: 'Transporte y guía del despacho, o el método de entrega' },
    { name: 'comprobante', description: 'Enlace al comprobante de compra (PDF)' },
] as const

export type WhatsAppPlaceholder = (typeof WHATSAPP_PLACEHOLDERS)[number]['name']

/** Same limit as the API DTO and the `order_statuses.whatsapp_template` CHECK. */
export const WHATSAPP_TEMPLATE_MAX_LENGTH = 1000

/** Statuses that have a purchase receipt (the only ones where `{comprobante}` is allowed). */
export const RECEIPT_STATUSES: readonly OrderStatus[] = [
    'PAGO_VERIFICADO',
    'ESPERANDO_MERCANCIA',
    'EN_PREPARACION',
    'LISTO_PARA_RETIRO',
    'DESPACHADO',
    'ENTREGADO',
]

const NAMES = WHATSAPP_PLACEHOLDERS.map((placeholder) => placeholder.name) as readonly string[]
const TOKEN = /\{([^{}]*)\}/g

/** Same Spanish messages as the API (the server check still has the last word). */
export function whatsAppTemplateError(template: string, status?: OrderStatus): string | null {
    const unknown = [
        ...new Set(
            [...template.matchAll(TOKEN)]
                .filter(([, name]) => !NAMES.includes(name ?? ''))
                .map(([token]) => token),
        ),
    ]
    if (unknown.length) {
        return `Marcador desconocido: ${unknown.join(', ')}. Usa solo los de la lista.`
    }
    if (/[{}]/.test(template.replace(TOKEN, ''))) {
        return 'Las llaves { } solo se usan para los marcadores, por ejemplo {nombre}.'
    }
    if (status && template.includes('{comprobante}') && !RECEIPT_STATUSES.includes(status)) {
        return 'El marcador {comprobante} solo se puede usar en los estados con el pago verificado.'
    }
    return null
}

/** Sample data of the Catálogos preview. */
export function sampleWhatsAppValues(brandName: string): Record<WhatsAppPlaceholder, string> {
    return {
        nombre: 'Ana',
        pedido: 'GP-000123',
        enlace: 'https://galpa.com.ve/pedido/GP-000123?t=…',
        total: '$480,00 (Bs 410.152,80)',
        motivo: 'La referencia no coincide con el monto',
        marca: brandName,
        envio: 'MRW, guía 123456',
        comprobante: 'https://api.galpa.com.ve/api/orders/GP-000123/receipt.pdf?t=…',
    }
}

/** Fills the placeholders and tidies what an empty value leaves behind, like the API. */
export function renderWhatsAppTemplate(
    template: string,
    values: Record<WhatsAppPlaceholder, string>,
): string {
    return template
        .replace(TOKEN, (token, name: string) =>
            NAMES.includes(name) ? values[name as WhatsAppPlaceholder] : token,
        )
        .split('\n')
        .map((line) =>
            line
                .replace(/\(\s*\)/g, '')
                .replace(/[ \t]{2,}/g, ' ')
                .replace(/[ \t]+([.,;:!?)])/g, '$1')
                .replace(/:\s*\./g, '.')
                .trim(),
        )
        .join('\n')
        .trim()
}
