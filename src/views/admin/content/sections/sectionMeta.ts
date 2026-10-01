import type { ContentSection } from '@/@types/content'

export interface SectionMeta {
    label: string
    description: string
}

/** Tab labels and intros of the content editor, in display order. */
export const SECTION_META: Record<ContentSection, SectionMeta> = {
    general: {
        label: 'General y marca',
        description:
            'Nombre de la marca, eslogan, descripción del pie de página y lo que muestran los buscadores.',
    },
    announcements: {
        label: 'Cinta de anuncios',
        description: 'Los mensajes cortos que se desplazan en la franja oscura sobre el menú.',
    },
    home: {
        label: 'Inicio',
        description:
            'Portada, títulos de cada bloque, «Por qué elegirnos», opiniones y el banner final.',
    },
    about: {
        label: 'Nosotros',
        description: 'Trayectoria, valores y cifras de la página Nosotros.',
    },
    contact: {
        label: 'Contacto y redes',
        description:
            'Correo, teléfonos, dirección, horario y redes. Se usan en Asesoría, el pie de página y los enlaces de WhatsApp.',
    },
    contactPage: {
        label: 'Página de asesoría',
        description: 'Encabezado y preguntas frecuentes de la página Asesoría y contacto.',
    },
    shipping: {
        label: 'Envíos',
        description:
            'Monto para envío gratis, tarifa y texto de despacho. El carrito y el checkout calculan el envío con estos valores.',
    },
    payment: {
        label: 'Métodos de pago',
        description:
            'Pago Móvil, transferencia, Zelle y Binance. El checkout ofrece solo los métodos activos y completos.',
    },
}
