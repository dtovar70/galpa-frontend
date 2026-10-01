interface TimelineItem {
    period: string
    title: string
    description: string
}

/**
 * The company's trajectory, from the first installations to today. Kept in code (not content):
 * it is the company's history, not a text the owner tweaks.
 */
const TRAJECTORY: readonly TimelineItem[] = [
    {
        period: 'Hace 30 años',
        title: 'Los primeros equipos',
        description:
            'Comenzamos como un equipo técnico dedicado a la instalación y el mantenimiento de aires acondicionados.',
    },
    {
        period: 'Años 2000',
        title: 'Repuestos y servicio',
        description:
            'Sumamos la distribución de repuestos para responder rápido a las fallas de nuestros clientes.',
    },
    {
        period: 'Años 2010',
        title: 'Proyectos comerciales',
        description:
            'Llevamos la climatización a oficinas y comercios con equipos piso-techo, cassette y ductos.',
    },
    {
        period: '2022',
        title: 'Nace Corporación Galpa',
        description:
            'Formalizamos la experiencia acumulada en una empresa dedicada a la distribución con asesoría.',
    },
    {
        period: 'Hoy',
        title: 'Asesoría en línea',
        description:
            'Nuestro catálogo y nuestros asesores, a un clic: compras con la confianza de siempre.',
    },
]

export function Timeline() {
    return (
        <ol className="relative grid gap-8 md:grid-cols-5 md:gap-4">
            <span
                aria-hidden="true"
                className="absolute top-0 bottom-0 left-[0.6875rem] w-px bg-line-strong md:top-[0.6875rem] md:right-0 md:bottom-auto md:left-0 md:h-px md:w-auto"
            />
            {TRAJECTORY.map((item, index) => (
                <li key={item.period} className="relative pl-10 md:pt-10 md:pl-0">
                    <span
                        aria-hidden="true"
                        className={
                            index === TRAJECTORY.length - 1
                                ? 'absolute top-0 left-0 grid size-6 place-items-center rounded-full bg-brand-500 ring-4 ring-brand-100'
                                : 'absolute top-0 left-0 grid size-6 place-items-center rounded-full border-2 border-brand-500 bg-white'
                        }
                    />
                    <p className="font-tech text-sm font-bold text-brand-700">{item.period}</p>
                    <h3 className="mt-1 text-base text-ink">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                        {item.description}
                    </p>
                </li>
            ))}
        </ol>
    )
}
