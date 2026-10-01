import { useId } from 'react'

import { BADGE_TONES, type BadgeTone } from '@/@types/catalog'
import { Badge } from '@/components/ui'
import { FIELD_LABEL_CLASS } from '@/components/ui/field.styles'
import { STATUS_TONE_LABELS, STATUS_TONE_VARIANTS } from '@/constants/tone.constant'
import { cn } from '@/utils/cn'

export interface ToneFieldProps {
    value: BadgeTone
    onChange: (tone: BadgeTone) => void
    /** Text of the swatches, so each one previews the real badge. */
    sample: string
}

/** The badge colors as a radio group, each swatch drawn as the badge it produces. */
export function ToneField({ value, onChange, sample }: ToneFieldProps) {
    const name = useId()
    return (
        <fieldset className="space-y-2">
            <legend className={FIELD_LABEL_CLASS}>Color de la etiqueta</legend>
            <div className="flex flex-wrap gap-2">
                {BADGE_TONES.map((tone) => (
                    <label
                        key={tone}
                        className={cn(
                            'flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-2 transition has-focus-visible:ring-2 has-focus-visible:ring-brand-500',
                            tone === value
                                ? 'border-brand-500 bg-brand-50'
                                : 'border-line hover:border-line-strong',
                        )}
                    >
                        <input
                            type="radio"
                            name={name}
                            value={tone}
                            checked={tone === value}
                            onChange={() => onChange(tone)}
                            className="sr-only"
                        />
                        <Badge
                            tone={STATUS_TONE_VARIANTS[tone]}
                            size="sm"
                            className="max-w-40 truncate"
                        >
                            {sample || STATUS_TONE_LABELS[tone]}
                        </Badge>
                        <span className="text-xs text-ink-soft">{STATUS_TONE_LABELS[tone]}</span>
                    </label>
                ))}
            </div>
        </fieldset>
    )
}
