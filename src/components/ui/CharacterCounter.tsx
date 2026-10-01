import { FIELD_HINT_CLASS } from '@/components/ui/field.styles'
import { cn } from '@/utils/cn'
import type { CharacterCount } from '@/utils/hooks/useCharacterCount'

export interface CharacterCounterProps {
    id: string
    count: CharacterCount
}

/** "87/100" in the hint row of a text field, right-aligned. */
export function CharacterCounter({ id, count }: CharacterCounterProps) {
    return (
        <p
            id={id}
            className={cn(
                FIELD_HINT_CLASS,
                'ml-auto shrink-0 tabular-nums',
                count.length >= count.maxLength && 'font-semibold text-danger-700',
            )}
        >
            <span className="sr-only">Caracteres: </span>
            {count.length}/{count.maxLength}
        </p>
    )
}
