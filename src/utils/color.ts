const HEX_3 = /^#[0-9A-Fa-f]{3}$/
const HEX_6 = /^#[0-9A-Fa-f]{6}$/

/**
 * `<input type="color">` only understands #RRGGBB: #ABC is expanded and anything invalid
 * (a half-typed value, for instance) falls back to white.
 */
export function toColorInputValue(hex: string | undefined): string {
    if (hex && HEX_6.test(hex)) return hex
    if (hex && HEX_3.test(hex)) {
        const [, r, g, b] = hex
        return `#${r}${r}${g}${g}${b}${b}`
    }
    return '#FFFFFF'
}

function toRgb(hex: string): [number, number, number] {
    const full = toColorInputValue(hex)
    return [1, 3, 5].map((start) => Number.parseInt(full.slice(start, start + 2), 16)) as [
        number,
        number,
        number,
    ]
}

/** Blends `hex` towards `target` by `amount` (0 keeps `hex`, 1 returns `target`). */
export function mixHex(hex: string, target: string, amount: number): string {
    const from = toRgb(hex)
    const to = toRgb(target)
    const channels = from.map((value, index) =>
        Math.round(value + ((to[index] ?? value) - value) * amount),
    )
    return `#${channels.map((value) => value.toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

/** A dark color (perceived lightness under half), e.g. a black or navy garment. */
export function isDarkHex(hex: string): boolean {
    const [r, g, b] = toRgb(hex)
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5
}
