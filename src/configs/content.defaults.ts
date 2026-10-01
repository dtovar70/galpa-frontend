/**
 * Built-in content: the texts and values the storefront ships with before anyone edits them.
 * `GET /content` merges the stored values over these, so a section nobody edited (or a field
 * added later) renders these.
 *
 * Mirror of backend-galpa/src/content/content.defaults.ts; the storefront falls back to it when
 * the API is slow or cannot be reached. Keep both files identical (only the import and this
 * comment differ). Contact details are placeholders meant to be replaced from the admin.
 */
import type { SiteContent } from '@/@types/content'

export const DEFAULT_SITE_CONTENT: SiteContent = {
    general: {
        brandName: 'Corporación Galpa 2022 C.A.',
        tagline: '30 años climatizando tus espacios',
        description:
            'Aires acondicionados residenciales y comerciales, repuestos y accesorios con asesoría técnica personalizada. 30 años de experiencia en climatización.',
        titleSuffix: 'Aires acondicionados, repuestos y asesoría',
        metaDescription:
            'Aires acondicionados residenciales y comerciales, repuestos y accesorios. 30 años de experiencia, asesoría técnica personalizada y equipos en stock o bajo pedido.',
        searchPlaceholder: 'Buscar equipos, marcas, repuestos…',
    },
    announcements: {
        messages: [
            '30 años climatizando hogares y negocios',
            'Asesoría técnica personalizada sin costo',
            'Pago Móvil, transferencia, Zelle y Binance',
        ],
    },
    home: {
        heroBadge: '30 años de experiencia',
        heroTitle: 'El clima ideal para tu espacio, *con asesoría experta*',
        heroSubtitle:
            'Aires acondicionados residenciales y comerciales, repuestos y accesorios de las mejores marcas. Te ayudamos a elegir el equipo correcto para tu espacio.',
        heroPrimaryCta: 'Ver catálogo',
        heroSecondaryCta: 'Solicitar asesoría',
        heroFeatures: ['Equipos en stock y bajo pedido', 'Asesoría técnica', 'Garantía de fábrica'],
        categoriesEyebrow: 'Nuestras líneas',
        categoriesTitle: 'Todo para *climatizar* tu espacio',
        categoriesDescription:
            '{categorias} de productos para hogares, oficinas y comercios, con la orientación de técnicos especializados.',
        featuredEyebrow: 'Destacados',
        featuredTitle: 'Equipos *más solicitados*',
        featuredDescription: 'Los modelos que más recomiendan nuestros asesores esta temporada.',
        featuredCta: 'Ver todo el catálogo',
        stepsEyebrow: 'Por qué elegirnos',
        stepsTitle: 'Tres décadas de *confianza*',
        stepsDescription:
            'Te acompañamos antes, durante y después de la compra, como lo hemos hecho por 30 años.',
        steps: [
            {
                title: 'Asesoría personalizada',
                description:
                    'Calculamos contigo la capacidad que necesita tu espacio para que compres el equipo justo, ni más ni menos.',
            },
            {
                title: 'Stock inmediato y bajo pedido',
                description:
                    'Equipos disponibles para entrega inmediata y modelos especiales bajo pedido con tiempos claros.',
            },
            {
                title: 'Apoyo en la instalación',
                description:
                    'Te orientamos sobre la instalación correcta para que tu equipo rinda y dure lo que debe.',
            },
            {
                title: 'Pagos a tu medida',
                description:
                    'Pago Móvil y transferencia en bolívares a tasa BCV, o Zelle y Binance en dólares.',
            },
        ],
        testimonialsEyebrow: 'Clientes satisfechos',
        testimonialsTitle: 'Lo que *dicen* de nosotros',
        testimonials: [],
        ctaBadge: 'Asesoría sin costo',
        ctaTitle: '¿No sabes qué equipo *necesitas*?',
        ctaDescription:
            'Cuéntanos sobre tu espacio y un asesor te recomendará la mejor opción en capacidad, consumo y presupuesto.',
        ctaPrimary: 'Hablar con un asesor',
        ctaSecondary: 'Conócenos',
    },
    about: {
        badge: 'Desde hace 30 años',
        title: 'Tres décadas *climatizando* Venezuela',
        paragraphs: [
            '{marca} reúne 30 años de experiencia en la distribución de aires acondicionados, repuestos y accesorios. Empezamos como un pequeño equipo técnico y hoy atendemos hogares, oficinas y comercios con la misma dedicación del primer día.',
            'Desde {ciudad} asesoramos a cada cliente para que elija el equipo correcto: medimos el espacio, revisamos la instalación eléctrica y recomendamos la capacidad adecuada antes de vender.',
        ],
        ctaLabel: 'Solicitar asesoría',
        imageBadge: 'Asesoría técnica',
        valuesEyebrow: 'Cómo trabajamos',
        valuesTitle: 'Lo que nos *define*',
        valuesDescription: 'Cuatro principios que sostienen cada recomendación y cada venta.',
        values: [
            {
                icon: 'shield-check',
                title: 'Equipos confiables',
                description: 'Trabajamos con marcas reconocidas y equipos con garantía de fábrica.',
            },
            {
                icon: 'heart-handshake',
                title: 'Trato cercano',
                description:
                    'Hablas con asesores que conocen los equipos, no con un formulario ni con un bot.',
            },
            {
                icon: 'timer',
                title: 'Tiempos claros',
                description:
                    'Si un equipo es bajo pedido te decimos cuándo llega, y te avisamos en cada paso.',
            },
            {
                icon: 'truck',
                title: 'Despacho seguro',
                description:
                    'Entregamos tu equipo protegido y revisado, o lo retiras en nuestra tienda.',
            },
        ],
        statsEyebrow: 'En números',
        statsTitle: 'Nuestra trayectoria en *cifras*',
        stats: [
            { value: '30+', label: 'años de experiencia' },
            { value: '+10.000', label: 'equipos instalados' },
            { value: '+15', label: 'marcas disponibles' },
        ],
    },
    contact: {
        email: 'ventas@galpa.com.ve',
        phone: '0414-0000000',
        whatsapp: '0414-0000000',
        city: 'Dirección por configurar',
        schedule: 'Lunes a viernes, 8:00 a.m. – 5:00 p.m.',
        instagram: 'galpa2022',
        tiktok: '',
    },
    contactPage: {
        badge: 'Asesoría sin costo',
        title: 'Hablemos de *tu espacio*',
        intro: 'Cuéntanos qué necesitas climatizar y un asesor te responderá con una recomendación de equipo, capacidad y presupuesto.',
        faqEyebrow: 'Dudas comunes',
        faqTitle: 'Preguntas *frecuentes*',
        faq: [
            {
                question: '¿Cómo sé qué capacidad (BTU) necesito?',
                answer: 'Depende del área, la exposición al sol y cuántas personas usan el espacio. Escríbenos con esos datos y te recomendamos la capacidad exacta.',
            },
            {
                question: '¿Qué significa «bajo pedido»?',
                answer: 'Son equipos que traemos especialmente para ti. Te indicamos el tiempo estimado de llegada antes de pagar y te avisamos cuando estén en nuestro almacén.',
            },
            {
                question: '¿Qué métodos de pago aceptan?',
                answer: 'Pago Móvil y transferencia en bolívares a la tasa BCV del día, y Zelle o Binance en dólares.',
            },
            {
                question: '¿Hacen envíos?',
                answer: 'Sí. Envío gratis desde {envioGratis}; por debajo de ese monto la tarifa es {tarifaEnvio}. También puedes retirar en tienda.',
            },
        ],
    },
    shipping: {
        freeThreshold: 500,
        flatRate: 15,
        freeShippingCopy: 'Envío gratis desde {envioGratis}',
        dispatchCopy: 'Despachamos en 24 a 48 horas hábiles después de aprobado el pago.',
    },
    /** Empty until the owner fills the payment details in the admin. */
    payment: {
        instructions: '',
        pagoMovil: {
            enabled: false,
            bankCode: '',
            bankName: '',
            phone: '',
            idNumber: '',
            holderName: '',
        },
        transfer: {
            enabled: false,
            bankCode: '',
            bankName: '',
            accountNumber: '',
            accountType: 'CORRIENTE',
            idNumber: '',
            holderName: '',
        },
        zelle: {
            enabled: false,
            email: '',
            holderName: '',
        },
        binance: {
            enabled: false,
            payId: '',
            email: '',
            holderName: '',
        },
    },
}
