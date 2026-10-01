import { Gauge, Snowflake, Zap } from 'lucide-react'

const WAVES = [
    { d: 'M40 8c20 14 52 14 72 0s52-14 72 0', delay: '0s', className: 'text-frost-400' },
    { d: 'M52 30c18 12 46 12 64 0s46-12 64 0', delay: '0.4s', className: 'text-brand-400' },
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
            className="relative rounded-3xl border border-white/10 bg-surface-raised/80 p-6 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.7)] backdrop-blur sm:p-8"
        >
            <div className="flex items-center justify-between text-xs font-semibold tracking-[0.16em] text-white/50 uppercase">
                <span className="inline-flex items-center gap-2">
                    <span className="size-2 animate-soft-pulse rounded-full bg-brand-400" />
                    Modo frío
                </span>
                <span className="font-tech">Sala · 20 m²</span>
            </div>

            <svg viewBox="0 0 260 150" className="mt-6 w-full" fill="none">
                <rect x="10" y="10" width="240" height="72" rx="16" className="fill-white/95" />
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
                <circle cx="226" cy="28" r="4" className="fill-brand-500" />
                <text
                    x="30"
                    y="40"
                    className="fill-ink/40 font-tech text-[11px] font-bold tracking-[0.2em]"
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
                    <p className="text-xs font-semibold tracking-[0.16em] text-white/50 uppercase">
                        Temperatura
                    </p>
                    <p className="font-tech text-6xl font-bold tracking-tight text-white">
                        22<span className="text-3xl text-brand-400">°C</span>
                    </p>
                </div>
                <p className="mb-2 rounded-lg bg-brand-500/15 px-3 py-1.5 text-xs font-bold text-brand-300">
                    Recomendado por tu asesor
                </p>
            </div>

            <ul className="mt-6 grid grid-cols-3 gap-2">
                {READINGS.map(({ icon: Icon, label, value }) => (
                    <li key={label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <Icon className="size-4 text-brand-400" />
                        <p className="mt-2 truncate text-[9px] font-semibold tracking-[0.08em] text-white/50 uppercase sm:text-[10px] sm:tracking-[0.14em]">
                            {label}
                        </p>
                        <p className="font-tech text-sm font-bold text-white">{value}</p>
                    </li>
                ))}
            </ul>
        </div>
    )
}
