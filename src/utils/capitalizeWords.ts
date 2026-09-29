import type { ChangeEvent } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'

const WORD_START = /(^|\s)(\p{Ll})/gu

/** Upper-cases the first letter of every word, leaving the rest as typed ("mcDonald" stays). */
export function capitalizeWords(value: string): string {
    return value.replace(WORD_START, (match, space: string, letter: string) => {
        const upper = letter.toLocaleUpperCase('es')
        // Keep the length (e.g. "ß" -> "SS" would move the caret).
        return upper.length === 1 ? space + upper : match
    })
}

/**
 * Wraps a `register()` result so a name field capitalizes each word as it is typed. The value
 * is rewritten inside the same input event, before the browser paints, so there is no visible
 * flash from lower to upper case; the caret stays put because the length never changes.
 */
export function withCapitalizedWords<T extends UseFormRegisterReturn>(registration: T): T {
    return {
        ...registration,
        onChange: (event: ChangeEvent<HTMLInputElement>) => {
            const input = event.target
            const next = capitalizeWords(input.value)
            if (next !== input.value) {
                const { selectionStart, selectionEnd } = input
                input.value = next
                input.setSelectionRange(selectionStart, selectionEnd)
            }
            return registration.onChange(event)
        },
    }
}
