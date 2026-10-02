import { HighlightedText } from '@/components/shared/HighlightedText'
import { cn } from '@/utils/cn'

export const HIGHLIGHT_HINT =
    'Encierra entre asteriscos las palabras que van en azul, por ejemplo: Tu *confort*.'

export interface HighlightPreviewProps {
    text: string
    /** `hero` matches the big home headline; `heading` the other section titles. */
    size?: 'hero' | 'heading'
    className?: string
}

/** Live rendering of a title with its *highlighted* words, as the storefront sets it. */
export function HighlightPreview({ text, size = 'heading', className }: HighlightPreviewProps) {
    return (
        <div
            className={cn(
                'rounded-2xl border-2 border-dashed border-line bg-page px-4 py-3',
                className,
            )}
        >
            <p className="text-xs font-semibold text-ink-soft">Vista previa</p>
            <p
                className={cn(
                    'font-extrabold tracking-display break-words text-ink',
                    size === 'hero' ? 'text-3xl leading-tight sm:text-4xl' : 'text-2xl',
                )}
            >
                {text.trim() ? <HighlightedText text={text} /> : '—'}
            </p>
        </div>
    )
}
