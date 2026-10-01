import { useId, useState } from 'react'
import { ArrowRight, Calculator, CloudSun, Sun, SunDim, Users } from 'lucide-react'

import { ButtonLink, Input } from '@/components/ui'
import { CONTAINER } from '@/constants/layout.constant'
import { formatBtu } from '@/constants/product.constant'
import { ROUTES } from '@/constants/route.constant'
import { cn } from '@/utils/cn'
import { catalogBtuPath } from '@/views/catalog/hooks/useCatalogFilters'
import { recommendBtu, type SunExposure } from '@/views/home/utils/btuCalculator'

const SUN_OPTIONS: { value: SunExposure; label: string; icon: typeof Sun }[] = [
    { value: 'low', label: 'Poca', icon: SunDim },
    { value: 'medium', label: 'Media', icon: CloudSun },
    { value: 'high', label: 'Mucha', icon: Sun },
]

const MAX_AREA = 500
const MAX_PEOPLE = 50

function parseBounded(value: string, max: number): number | null {
    const parsed = Number.parseFloat(value.replace(',', '.'))
    if (!Number.isFinite(parsed) || parsed <= 0) return null
    return Math.min(parsed, max)
}

/** "¿Qué capacidad necesitas?": a quick estimate that links to the matching catalog. */
export function BtuCalculator() {
    const [area, setArea] = useState('20')
    const [people, setPeople] = useState('2')
    const [sun, setSun] = useState<SunExposure>('medium')
    const sunLegendId = useId()

    const areaM2 = parseBounded(area, MAX_AREA)
    const peopleCount = parseBounded(people, MAX_PEOPLE) ?? 1
    const result = areaM2 === null ? null : recommendBtu({ areaM2, sun, people: peopleCount })

    return (
        <section aria-labelledby="btu-heading" className="py-16 lg:py-24">
            <div className={CONTAINER}>
                <div className="grid overflow-hidden rounded-3xl border border-line bg-white shadow-soft lg:grid-cols-[1.2fr_1fr]">
                    <div className="space-y-7 p-6 sm:p-10">
                        <div className="space-y-3">
                            <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-brand-700 uppercase">
                                <Calculator aria-hidden="true" className="size-4" />
                                Calculadora BTU
                            </p>
                            <h2
                                id="btu-heading"
                                className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl"
                            >
                                ¿Qué capacidad <span className="text-brand-600">necesitas</span>?
                            </h2>
                            <p className="max-w-lg text-ink-soft">
                                Una estimación rápida para orientarte. Un asesor la confirma
                                revisando tu espacio, la instalación eléctrica y el uso.
                            </p>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <Input
                                label="Área del espacio (m²)"
                                type="number"
                                inputMode="decimal"
                                min={1}
                                max={MAX_AREA}
                                step="any"
                                value={area}
                                onChange={(event) => setArea(event.target.value)}
                                error={areaM2 === null ? 'Indica los metros cuadrados.' : undefined}
                            />
                            <Input
                                label="Personas que lo usan"
                                type="number"
                                inputMode="numeric"
                                min={1}
                                max={MAX_PEOPLE}
                                value={people}
                                onChange={(event) => setPeople(event.target.value)}
                                leadingIcon={<Users aria-hidden="true" className="size-4" />}
                            />
                        </div>

                        <fieldset className="space-y-3" aria-describedby={sunLegendId}>
                            <legend className="text-sm font-semibold text-ink">
                                Exposición al sol
                            </legend>
                            <p id={sunLegendId} className="sr-only">
                                Cuánto sol recibe el espacio durante el día.
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                {SUN_OPTIONS.map(({ value, label, icon: Icon }) => (
                                    <label
                                        key={value}
                                        className={cn(
                                            'flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-semibold transition has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-brand-500 has-[input:focus-visible]:ring-offset-2',
                                            sun === value
                                                ? 'border-brand-500 bg-brand-50 text-brand-800'
                                                : 'border-line-strong text-ink-soft hover:border-ink/40',
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name="sun-exposure"
                                            value={value}
                                            checked={sun === value}
                                            onChange={() => setSun(value)}
                                            className="sr-only"
                                        />
                                        <Icon aria-hidden="true" className="size-5" />
                                        {label}
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                    </div>

                    <div
                        aria-live="polite"
                        className="relative flex flex-col justify-between gap-8 bg-ink p-6 text-white sm:p-10"
                    >
                        <div
                            aria-hidden="true"
                            className="absolute -top-20 -right-20 size-64 rounded-full bg-brand-500/20 blur-3xl"
                        />
                        {result ? (
                            <div className="relative space-y-4">
                                <p className="text-xs font-bold tracking-[0.2em] text-white/50 uppercase">
                                    Capacidad recomendada
                                </p>
                                <p className="font-tech text-5xl font-bold tracking-tight text-brand-400 sm:text-6xl">
                                    {formatBtu(result.recommended)}
                                </p>
                                <p className="text-sm text-white/70">
                                    Estimación:{' '}
                                    <span className="font-tech">{formatBtu(result.estimate)}</span>{' '}
                                    para {areaM2} m².{' '}
                                    {result.exceedsSingleUnit
                                        ? 'Tu espacio probablemente necesite más de un equipo o un sistema comercial: un asesor te ayudará a diseñarlo.'
                                        : 'Te mostramos equipos de esta capacidad y la siguiente, por si quieres margen extra.'}
                                </p>
                            </div>
                        ) : (
                            <p className="relative text-white/70">
                                Escribe el área de tu espacio para ver la capacidad recomendada.
                            </p>
                        )}

                        <div className="relative flex flex-wrap gap-3">
                            {result ? (
                                <ButtonLink
                                    to={catalogBtuPath(result.range.min, result.range.max)}
                                    trailingIcon={
                                        <ArrowRight aria-hidden="true" className="size-4" />
                                    }
                                >
                                    Ver equipos recomendados
                                </ButtonLink>
                            ) : null}
                            <ButtonLink to={ROUTES.contact} variant="outline-light">
                                Hablar con un asesor
                            </ButtonLink>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
