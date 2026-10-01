import { appConfig } from '@/configs/app.config'
import { cn } from '@/utils/cn'

/** Six curved blades around the hub, drawn once and rotated. */
const BLADE_ANGLES = [0, 60, 120, 180, 240, 300]

/** The air leaving the unit: each wave starts a beat after the previous one. */
const WAVES = [
    { d: 'M14 6c10 8 26 8 36 0s26-8 36 0', delay: '0s', className: 'text-frost-400' },
    { d: 'M20 18c9 7 23 7 32 0s23-7 32 0', delay: '0.3s', className: 'text-brand-400' },
    { d: 'M28 30c8 6 18 6 26 0s18-6 26 0', delay: '0.6s', className: 'text-frost-300' },
] as const

export interface AirFlowLoaderProps {
    message?: string
    className?: string
}

/**
 * The app-wide loader: a split unit whose turbine spins while three waves of air leave it.
 * Pure SVG + CSS keyframes. With reduced motion the fan stands still and only the text pulses.
 */
export function AirFlowLoader({ message = 'Preparando todo…', className }: AirFlowLoaderProps) {
    return (
        <div
            role="status"
            aria-live="polite"
            className={cn('flex flex-col items-center gap-5 text-center', className)}
        >
            <div aria-hidden="true" className="flex flex-col items-center">
                <svg viewBox="0 0 160 112" className="w-44" fill="none">
                    {/* Split unit housing with its louver line. */}
                    <rect
                        x="6"
                        y="6"
                        width="148"
                        height="100"
                        rx="22"
                        className="fill-surface stroke-white/10"
                        strokeWidth="2"
                    />
                    <path
                        d="M28 92h104"
                        className="stroke-white/15"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                    <circle cx="136" cy="24" r="3" className="fill-brand-400" />

                    {/* Turbine: ring, rotor and hub. */}
                    <circle
                        cx="80"
                        cy="52"
                        r="34"
                        className="stroke-brand-500/40"
                        strokeWidth="2"
                    />
                    <g
                        className="animate-rotor motion-reduce:animate-none"
                        style={{ transformOrigin: '80px 52px' }}
                    >
                        {BLADE_ANGLES.map((angle) => (
                            <path
                                key={angle}
                                d="M80 52c2-9 8-18 18-22 3 6 1 15-6 20z"
                                transform={`rotate(${angle} 80 52)`}
                                className="fill-brand-500"
                            />
                        ))}
                    </g>
                    <circle
                        cx="80"
                        cy="52"
                        r="7"
                        className="fill-ink stroke-brand-400"
                        strokeWidth="2"
                    />
                </svg>

                <svg viewBox="0 0 100 40" className="-mt-1 w-32" fill="none">
                    {WAVES.map((wave) => (
                        <path
                            key={wave.d}
                            d={wave.d}
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            style={{ animationDelay: wave.delay }}
                            className={cn(
                                'animate-airflow opacity-0 motion-reduce:animate-none motion-reduce:opacity-60',
                                wave.className,
                            )}
                        />
                    ))}
                </svg>
            </div>

            <div className="space-y-1">
                <p className="text-2xl font-extrabold tracking-tight text-ink">
                    {appConfig.brandShortName}
                </p>
                <p
                    data-reduced-pulse=""
                    className="text-sm font-medium text-ink-soft motion-reduce:animate-soft-pulse"
                >
                    {message}
                </p>
            </div>
        </div>
    )
}
