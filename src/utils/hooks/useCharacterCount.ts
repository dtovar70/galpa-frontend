import { useCallback, useState, type ChangeEvent, type Ref } from 'react'

import { CHARACTER_COUNT_MIN_LIMIT, CHARACTER_COUNT_THRESHOLD } from '@/constants/ui.constant'

type TextField = HTMLInputElement | HTMLTextAreaElement

export interface CharacterCountOptions<E extends TextField> {
    ref?: Ref<E>
    /** The controlled value, if any; otherwise the length is read from the element. */
    value?: unknown
    onChange?: (event: ChangeEvent<E>) => void
    maxLength?: number
    /** Show the counter at any length (e.g. a short code field). */
    alwaysShow?: boolean
}

export interface CharacterCount {
    length: number
    maxLength: number
}

function assignRef<E>(ref: Ref<E> | undefined, node: E | null) {
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
}

/**
 * Character counter for a text field, controlled (`value`) or not (react-hook-form's
 * `register`). Returns a callback ref (`bindElement`) and change handler to put on the
 * element, plus the count to show: only past `CHARACTER_COUNT_THRESHOLD` of the limit, unless `alwaysShow`.
 */
export function useCharacterCount<E extends TextField>({
    ref,
    value,
    onChange,
    maxLength,
    alwaysShow = false,
}: CharacterCountOptions<E>) {
    const [typedLength, setTypedLength] = useState(0)
    const length = value !== undefined && value !== null ? String(value).length : typedLength

    // react-hook-form writes default and `reset` values straight into the element through its
    // ref (a new callback on every render), so the length is re-read whenever it is attached.
    const bindElement = useCallback(
        (node: E | null) => {
            assignRef(ref, node)
            if (node) setTypedLength(node.value.length)
        },
        [ref],
    )

    const handleChange = useCallback(
        (event: ChangeEvent<E>) => {
            setTypedLength(event.target.value.length)
            onChange?.(event)
        },
        [onChange],
    )

    const isVisible =
        maxLength !== undefined &&
        (alwaysShow ||
            (maxLength >= CHARACTER_COUNT_MIN_LIMIT &&
                length > maxLength * CHARACTER_COUNT_THRESHOLD))

    const count: CharacterCount | null = isVisible ? { length, maxLength } : null
    return { bindElement, handleChange, count }
}
