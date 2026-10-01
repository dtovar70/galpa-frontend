import { ChevronDown } from 'lucide-react'

import { cn } from '@/utils/cn'

export interface AccordionItem {
    id: string
    question: string
    answer: string
}

export interface AccordionProps {
    items: AccordionItem[]
    className?: string
}

export function Accordion({ items, className }: AccordionProps) {
    return (
        <div
            className={cn(
                'divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white',
                className,
            )}
        >
            {items.map((item) => (
                <details key={item.id} className="group px-5 py-4 open:bg-brand-50/50">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-ink">
                        {item.question}
                        <ChevronDown
                            aria-hidden="true"
                            className="size-5 shrink-0 text-brand-600 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                        />
                    </summary>
                    <p className="pt-3 text-sm leading-relaxed text-ink-soft">{item.answer}</p>
                </details>
            ))}
        </div>
    )
}
