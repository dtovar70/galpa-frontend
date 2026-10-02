import { Gauge, Plug, Ruler, Wrench, type LucideIcon } from 'lucide-react'

interface Check {
    icon: LucideIcon
    title: string
    description: string
}

/** What an advisor reviews before recommending a unit. */
const CHECKS: readonly Check[] = [
    {
        icon: Ruler,
        title: 'Carga térmica',
        description: 'Área, altura, ventanas, exposición al sol y personas que usan el espacio.',
    },
    {
        icon: Plug,
        title: 'Instalación eléctrica',
        description: 'Voltaje disponible (110V / 220V) y protección adecuada para el equipo.',
    },
    {
        icon: Gauge,
        title: 'Eficiencia y consumo',
        description: 'Cuándo conviene un equipo inverter y qué refrigerante usa cada modelo.',
    },
    {
        icon: Wrench,
        title: 'Instalación y mantenimiento',
        description: 'Ubicación de las unidades, materiales necesarios y cuidados para que dure.',
    },
]

export function AdvisoryExpertise() {
    return (
        <ul className="grid gap-4 sm:grid-cols-2">
            {CHECKS.map(({ icon: Icon, title, description }) => (
                <li
                    key={title}
                    className="flex gap-4 rounded-2xl border border-line bg-white p-5 shadow-soft"
                >
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                        <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <div>
                        <h3 className="text-base text-ink">{title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-ink-soft">{description}</p>
                    </div>
                </li>
            ))}
        </ul>
    )
}
