import { useCallback, useRef } from 'react'

const STORAGE_KEY = 'galpa:checkout-idempotency'

interface StoredKey {
    /** Fingerprint of what the key was minted for (the order body); another body, a new key. */
    scope: string
    key: string
}

/**
 * A short fingerprint of the scope (FNV-1a, 2 × 32 bits), so session storage never holds the
 * customer's checkout data; only "same attempt or not" matters here, not secrecy.
 */
function fingerprint(scope: string): string {
    let a = 0x811c9dc5
    let b = 0x01000193
    for (let index = 0; index < scope.length; index++) {
        const code = scope.charCodeAt(index)
        a = Math.imul(a ^ code, 0x01000193) >>> 0
        b = Math.imul(b ^ code, 0x811c9dc5) >>> 0
    }
    return `${a.toString(36)}-${b.toString(36)}-${scope.length}`
}

function newKey(): string {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
    // Non-secure contexts (plain http on a LAN) have no `randomUUID`.
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function readStored(): StoredKey | null {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw) as Partial<StoredKey>
        return typeof parsed.scope === 'string' && typeof parsed.key === 'string'
            ? { scope: parsed.scope, key: parsed.key }
            : null
    } catch {
        return null
    }
}

function writeStored(value: StoredKey | null): void {
    try {
        if (value) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value))
        else sessionStorage.removeItem(STORAGE_KEY)
    } catch {
        // Private mode / storage blocked: the in-memory copy still covers this page.
    }
}

/**
 * One idempotency key per checkout attempt. It survives retries and a page reload (session
 * storage), so a request that timed out but reached the server returns the same order instead
 * of creating a second one. A different `scope` (the cart changed) gets a fresh key.
 */
export function useIdempotencyKey() {
    const memory = useRef<StoredKey | null>(null)

    /** The key for this cart, minted on first use and reused until `discard`. */
    const keyFor = useCallback((rawScope: string): string => {
        const scope = fingerprint(rawScope)
        const existing = readStored() ?? memory.current
        if (existing?.scope === scope) return existing.key
        const created = { scope, key: newKey() }
        memory.current = created
        writeStored(created)
        return created.key
    }, [])

    /** After a success (next checkout starts clean) or a reused-key refusal (mint a new one). */
    const discard = useCallback(() => {
        memory.current = null
        writeStored(null)
    }, [])

    return { keyFor, discard }
}
