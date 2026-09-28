import type { FormEvent } from 'react'

/** `onBeforeInput`: blocks typed characters that are not digits (pastes go through `onPaste`). */
export function rejectNonDigits(event: FormEvent<HTMLInputElement>) {
    const { data } = event.nativeEvent as InputEvent
    if (data && /\D/.test(data)) event.preventDefault()
}

/** The input's digits after replacing its selection with the digits of `inserted`, capped. */
export function insertDigits(input: HTMLInputElement, inserted: string, max: number): string {
    const current = input.value
    const start = input.selectionStart ?? current.length
    const end = input.selectionEnd ?? current.length
    return `${current.slice(0, start)}${inserted.replace(/\D/g, '')}${current.slice(end)}`.slice(
        0,
        max,
    )
}
