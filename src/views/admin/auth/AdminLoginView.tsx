import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { LogIn } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router'

import { RouteFallback } from '@/components/route/RouteFallback'
import { Alert, Button, Input } from '@/components/ui'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { isSessionEndReason, SESSION_END_NOTICES } from '@/configs/session.config'
import { ADMIN_ROUTES, adminLoginState, type AdminLoginNotice } from '@/constants/route.constant'
import { NOTICE_DISMISS_MS } from '@/constants/ui.constant'
import { getErrorMessage, isApiError } from '@/services/errors'
import { useSessionStore } from '@/store/sessionStore'
import { useSiteContent } from '@/utils/hooks/useSiteContent'
import { AdminAuthCard } from '@/views/admin/auth/components/AdminAuthCard'
import {
    LOGIN_PASSWORD_MAX_LENGTH,
    loginSchema,
    type LoginValues,
} from '@/views/admin/auth/schema/login.schema'
import { useLogin, useSession } from '@/views/admin/hooks/useSession'

/**
 * Only admin paths are honored (never the login page itself), so `next` can never bounce
 * the user off-site or into a loop. Anything else falls back to the orders page.
 */
function resolveNext(next: string | null | undefined): string {
    if (!next || !next.startsWith(`${ADMIN_ROUTES.root}/`) || next.startsWith('//')) {
        return ADMIN_ROUTES.orders
    }
    return next.startsWith(ADMIN_ROUTES.login) ? ADMIN_ROUTES.orders : next
}

/** One-time success notices other pages send along (`notice` in the navigation state). */
const LOGIN_NOTICES: Record<AdminLoginNotice, string> = {
    'password-reset': 'Tu contraseña se cambió. Inicia sesión con la nueva.',
}

interface LoginStateFields {
    next: string | null
    reason: string | null
    notice: AdminLoginNotice | null
}

/** Navigation state is untyped (`unknown`): read only the string fields we expect. */
function readLoginState(state: unknown): LoginStateFields {
    if (typeof state !== 'object' || state === null) {
        return { next: null, reason: null, notice: null }
    }
    const { next, reason, notice } = state as Record<string, unknown>
    return {
        next: typeof next === 'string' ? next : null,
        reason: typeof reason === 'string' ? reason : null,
        notice:
            typeof notice === 'string' && Object.hasOwn(LOGIN_NOTICES, notice)
                ? (notice as AdminLoginNotice)
                : null,
    }
}

function loginErrorMessage(error: unknown): string {
    if (isApiError(error, 429)) {
        return `${error.message} Por seguridad limitamos los intentos de inicio de sesión.`
    }
    return getErrorMessage(error, 'No pudimos iniciar sesión. Intenta de nuevo.')
}

export function AdminLoginView() {
    const { general } = useSiteContent()
    const location = useLocation()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const fromState = readLoginState(location.state)
    // Old links and bookmarks may still carry `?next=` / `?reason=`: honor them this once.
    const hasLegacyQuery = searchParams.has('next') || searchParams.has('reason')
    const next = resolveNext(fromState.next ?? searchParams.get('next'))
    const endReason = fromState.reason ?? searchParams.get('reason')
    const endNotice = isSessionEndReason(endReason) ? SESSION_END_NOTICES[endReason] : null
    const successNotice = fromState.notice ? LOGIN_NOTICES[fromState.notice] : null
    const setEndReason = useSessionStore((state) => state.setEndReason)
    const { data: user, isPending: isCheckingSession } = useSession()
    const login = useLogin()
    /** Counts submits, so a repeated error remounts its alert with a fresh countdown. */
    const [attempt, setAttempt] = useState(0)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    })

    // The reason already travelled in the navigation state; forget it so a later redirect
    // starts clean.
    useEffect(() => {
        setEndReason(null)
    }, [setEndReason])

    // The address bar always reads a plain `/admin/login`: legacy query params move into
    // the navigation state and the URL is replaced with the clean one.
    const legacyReason = hasLegacyQuery && isSessionEndReason(endReason) ? endReason : undefined
    useEffect(() => {
        if (!hasLegacyQuery) return
        void navigate(ADMIN_ROUTES.login, {
            replace: true,
            state: adminLoginState(next, legacyReason),
        })
    }, [hasLegacyQuery, navigate, next, legacyReason])

    /** Hides the notice but keeps `next`, so logging in still returns the admin there. */
    const dismissNotice = () => {
        void navigate(ADMIN_ROUTES.login, { replace: true, state: adminLoginState(next) })
    }

    const onSubmit = handleSubmit((values) => {
        setAttempt((count) => count + 1)
        login.mutate(values, {
            onSuccess: () => void navigate(next, { replace: true }),
        })
    })

    const errorMessage = login.isError ? loginErrorMessage(login.error) : null

    if (isCheckingSession) return <RouteFallback message="Verificando tu sesión…" />
    if (user && !login.isPending) return <Navigate to={next} replace />

    return (
        <AdminAuthCard
            title="Panel de administración"
            subtitle={general.brandName}
            footer={<p>¿No recuerdas tu correo? Pídeselo a un administrador.</p>}
        >
            <form onSubmit={onSubmit} noValidate className="space-y-5">
                {successNotice ? (
                    <Alert
                        tone="success"
                        autoDismissMs={NOTICE_DISMISS_MS}
                        onDismiss={dismissNotice}
                    >
                        {successNotice}
                    </Alert>
                ) : null}
                {endNotice ? (
                    <Alert tone="info" autoDismissMs={NOTICE_DISMISS_MS} onDismiss={dismissNotice}>
                        {endNotice}
                    </Alert>
                ) : null}
                {errorMessage ? (
                    // Like the success notices: it drains away, pauses on hover and can be
                    // closed; clearing the mutation error is what removes it.
                    <Alert
                        key={`${attempt}:${errorMessage}`}
                        autoDismissMs={NOTICE_DISMISS_MS}
                        onDismiss={login.reset}
                    >
                        {errorMessage}
                    </Alert>
                ) : null}

                <fieldset className="space-y-5" disabled={login.isPending}>
                    <legend className="sr-only">Inicia sesión</legend>
                    <Input
                        label="Correo"
                        type="email"
                        autoComplete="username"
                        autoFocus
                        error={errors.email?.message}
                        {...register('email')}
                    />
                    <PasswordInput
                        label="Contraseña"
                        autoComplete="current-password"
                        maxLength={LOGIN_PASSWORD_MAX_LENGTH}
                        error={errors.password?.message}
                        {...register('password')}
                    />
                    <p className="-mt-2 text-right text-sm">
                        <Link
                            to={ADMIN_ROUTES.recover}
                            className="font-semibold text-blush-600 underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-blush-400"
                        >
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </p>
                </fieldset>

                <Button
                    type="submit"
                    fullWidth
                    isLoading={login.isPending}
                    leadingIcon={<LogIn aria-hidden="true" className="size-4" />}
                >
                    Iniciar sesión
                </Button>
            </form>
        </AdminAuthCard>
    )
}
