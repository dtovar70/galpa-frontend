import { Gauge, Snowflake, Zap } from 'lucide-react'

const WAVES = [
    { d: 'M40 8c20 14 52 14 72 0s52-14 72 0', delay: '0s', className: 'text-frost-400' },
    { d: 'M52 30c18 12 46 12 64 0s46-12 64 0', delay: '0.4s', className: 'text-brand-500' },
    { d: 'M64 52c16 10 40 10 56 0s40-10 56 0', delay: '0.8s', className: 'text-frost-300' },
] as const

const READINGS = [
    { icon: Snowflake, label: 'Capacidad', value: '12.000 BTU' },
    { icon: Zap, label: 'Tecnología', value: 'Inverter' },
    { icon: Gauge, label: 'Refrigerante', value: 'R32' },
] as const

/**
 * The hero's illustration: a split unit on a control panel, with the air flowing out and the
 * figures an advisor checks. Decorative: the headline next to it carries the message.
 */
export function HeroVisual() {
    return (
        <div
            aria-hidden="true"
            className="relative rounded-3xl border border-line bg-white/90 p-6 shadow-[0_40px_80px_-30px_rgb(16_42_67/0.35)] backdrop-blur sm:p-8"
        >
            <div className="flex items-center justify-between text-xs font-semibold tracking-[0.16em] text-ink-muted uppercase">
                <span className="inline-flex items-center gap-2">
                    <span className="size-2 animate-soft-pulse rounded-full bg-frost-400" />
                    Modo frío
                </span>
                <span className="tabular-nums">Sala · 20 m²</span>
            </div>

            <svg viewBox="0 0 260 150" className="mt-6 w-full" fill="none">
                <rect
                    x="10"
                    y="10"
                    width="240"
                    height="72"
                    rx="16"
                    className="fill-mist stroke-line-strong"
                    strokeWidth="1.5"
                />
                <path
                    d="M30 66h200"
                    className="stroke-ink/15"
                    strokeWidth="4"
                    strokeLinecap="round"
                />
                <path
                    d="M30 74h200"
                    className="stroke-ink/10"
                    strokeWidth="3"
                    strokeLinecap="round"
                />
                <circle cx="226" cy="28" r="4" className="fill-brand-600" />
                <text
                    x="30"
                    y="40"
                    className="fill-ink/40 text-[11px] font-bold tracking-[0.2em] tabular-nums"
                >
                    GALPA
                </text>
                <g transform="translate(0 88)">
                    {WAVES.map((wave) => (
                        <path
                            key={wave.d}
                            d={wave.d}
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeLinecap="round"
                            style={{ animationDelay: wave.delay }}
                            className={`animate-airflow opacity-0 motion-reduce:animate-none motion-reduce:opacity-70 ${wave.className}`}
                        />
                    ))}
                </g>
            </svg>

            <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold tracking-[0.16em] text-ink-muted uppercase">
                        Temperatura
                    </p>
                    <p className="text-6xl font-bold tracking-tight text-ink tabular-nums">
                        22<span className="text-3xl text-brand-600">°C</span>
                    </p>
                </div>
                <p className="mb-2 rounded-lg bg-brand-100 px-3 py-1.5 text-xs font-bold text-brand-700">
                    Recomendado por tu asesor
                </p>
            </div>

            <ul className="mt-6 grid grid-cols-3 gap-2">
                {READINGS.map(({ icon: Icon, label, value }) => (
                    <li key={label} className="rounded-xl border border-line bg-page p-3">
                        <Icon className="size-4 text-brand-600" />
                        <p className="mt-2 truncate text-[9px] font-semibold tracking-[0.08em] text-ink-muted uppercase sm:text-[10px] sm:tracking-[0.14em]">
                            {label}
                        </p>
                        <p className="text-sm font-bold text-ink tabular-nums">{value}</p>
                    </li>
                ))}
            </ul>
        </div>
    )
}
