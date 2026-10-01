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
