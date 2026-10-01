/**
 * Admin session timeout. The idle limit and the prompt countdown come from the API
 * (`session.idleMinutes` / `session.promptSeconds` in `/auth/me`, login and refresh, set by
 * `SESSION_IDLE_MINUTES` / `SESSION_PROMPT_SECONDS`); everything else lives here.
 */
export const sessionTimeoutConfig = {
    /**
     * `idle`: the limit counts from the admin's last activity, and the session is extended
     * in the background while they work. `fixed`: the limit counts from login or from the
     * last "Sí, continuar", no matter what the admin does in between.
     */
    mode: 'idle' as 'idle' | 'fixed',
    /** Used only if the API response lacks the settings (e.g. an older API). */
    fallbackIdleMinutes: 30,
    fallbackPromptSeconds: 30,
    /** Activity events closer together than this count once. */
    activityThrottleMs: 1_000,
    /** Other tabs hear about local activity at most this often. */
    activityBroadcastMs: 5_000,
    /** Background refresh once the token has lived this fraction of its lifetime… */
    refreshAfterTokenFraction: 0.5,
    /** …and never more often than this. */
    minRefreshIntervalMs: 2 * 60_000,
    /** Longest sleep between re-checks, so clock jumps and throttled tabs are caught soon. */
    maxTimerDelayMs: 15_000,
    /** Seconds left at which screen readers hear the countdown. */
    announceAtSeconds: [30, 10, 5] as const,
    /** Cross-tab sync: BroadcastChannel name and localStorage fallback key. */
    channelName: 'galpa-admin-session',
    storageKey: 'galpa-admin-session-sync',
} as const

/** Why the admin was sent back to the login page (`reason` in the login page's navigation state). */
export type SessionEndReason = 'inactividad'

export const SESSION_END_NOTICES: Record<SessionEndReason, string> = {
    inactividad: 'Cerramos tu sesión por inactividad. Vuelve a iniciar sesión para continuar.',
}

export function isSessionEndReason(value: string | null): value is SessionEndReason {
    return value !== null && Object.hasOwn(SESSION_END_NOTICES, value)
}
