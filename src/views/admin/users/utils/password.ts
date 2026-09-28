/** Same rules as the API (`src/auth/password-policy.ts`). */
export const PASSWORD_MIN_LENGTH = 10
export const PASSWORD_MAX_LENGTH = 200
export const GENERATED_PASSWORD_LENGTH = 14

const LETTER = /\p{L}/u
const DIGIT = /[0-9]/

export const PASSWORD_RULES = [
    {
        label: `Al menos ${PASSWORD_MIN_LENGTH} caracteres`,
        test: (value: string) => value.length >= PASSWORD_MIN_LENGTH,
    },
    { label: 'Una letra', test: (value: string) => LETTER.test(value) },
    { label: 'Un número', test: (value: string) => DIGIT.test(value) },
] as const

export function hasLetter(value: string): boolean {
    return LETTER.test(value)
}

export function hasDigit(value: string): boolean {
    return DIGIT.test(value)
}

/*
 * No look-alike characters (0/O, 1/l/I), so a password read aloud or typed from a phone
 * screen comes out right. The symbols are ones every keyboard and chat app handles.
 */
const LOWER = 'abcdefghijkmnopqrstuvwxyz'
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const DIGITS = '23456789'
const SYMBOLS = '-_.!?#'
const ALL = LOWER + UPPER + DIGITS + SYMBOLS

/** Uniform index in [0, max) from the platform CSPRNG (rejection sampling, no modulo bias). */
function randomIndex(max: number): number {
    const limit = Math.floor(0x1_0000_0000 / max) * max
    const buffer = new Uint32Array(1)
    for (;;) {
        crypto.getRandomValues(buffer)
        const value = buffer[0] as number
        if (value < limit) return value % max
    }
}

function pick(alphabet: string): string {
    return alphabet.charAt(randomIndex(alphabet.length))
}

/** A random password with lowercase, uppercase, a digit and a symbol, in random order. */
export function generatePassword(length = GENERATED_PASSWORD_LENGTH): string {
    const characters = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SYMBOLS)]
    while (characters.length < length) characters.push(pick(ALL))
    for (let index = characters.length - 1; index > 0; index -= 1) {
        const other = randomIndex(index + 1)
        ;[characters[index], characters[other]] = [
            characters[other] as string,
            characters[index] as string,
        ]
    }
    return characters.join('')
}

export type PasswordStrength = 0 | 1 | 2 | 3 | 4

export const STRENGTH_LABEL: Record<PasswordStrength, string> = {
    0: 'Muy débil',
    1: 'Débil',
    2: 'Aceptable',
    3: 'Buena',
    4: 'Muy buena',
}

/**
 * A rough hint, not a guarantee: length counts most, then variety of character kinds. A
 * password that breaks the policy never rates above "Débil".
 */
export function passwordStrength(value: string): PasswordStrength {
    if (!value) return 0
    const kinds = [/[a-z]/, /[A-Z]/, DIGIT, /[^A-Za-z0-9]/].filter((kind) =>
        kind.test(value),
    ).length
    const meetsPolicy = PASSWORD_RULES.every((rule) => rule.test(value))
    if (!meetsPolicy) return value.length >= 6 ? 1 : 0
    // Repeating one character ("aaaaaaaaa1") is not much of a password.
    if (new Set(value).size <= 3) return 1
    let score = 2
    if (value.length >= 12 && kinds >= 3) score += 1
    if (value.length >= 14 && kinds >= 3) score += 1
    if (value.length >= 20) score = Math.max(score, 3)
    return Math.min(score, 4) as PasswordStrength
}
