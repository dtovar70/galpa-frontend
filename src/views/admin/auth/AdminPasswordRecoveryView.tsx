import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, KeyRound, Send } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'

import { Alert, Button, Input } from '@/components/ui'
import { ADMIN_ROUTES, adminLoginState } from '@/constants/route.constant'
import { AuthService } from '@/services/AuthService'
import { getErrorMessage, isApiError } from '@/services/errors'
import { useSiteContent } from '@/utils/hooks/useSiteContent'
import { AdminAuthCard } from '@/views/admin/auth/components/AdminAuthCard'
import { ResetCodeInput } from '@/views/admin/auth/components/ResetCodeInput'
import {
    recoveryEmailSchema,
    recoveryResetSchema,
    type RecoveryEmailValues,
    type RecoveryResetValues,
} from '@/views/admin/auth/schema/recovery.schema'
import { PasswordField } from '@/views/admin/users/components/PasswordField'

/** Shown after every request, whether or not the email can receive a code. */
const RECOVERY_SENT_MESSAGE =
    'Si el correo pertenece a una cuenta activa con Telegram vinculado, te enviamos un código de 6 dígitos a Telegram. Vence en 10 minutos.'
const NO_TELEGRAM_NOTE =
    '¿No tienes Telegram vinculado? Pídele a un administrador que restablezca tu contraseña desde Usuarios.'

const linkClass =
    'font-semibold text-blush-600 underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-blush-400'

function BackToLogin() {
    return (
        <Link to={ADMIN_ROUTES.login} className={`inline-flex items-center gap-1.5 ${linkClass}`}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            Volver a iniciar sesión
        </Link>
    )
}

function EmailStep({
    defaultEmail,
    onSent,
}: {
    defaultEmail: string
    onSent: (email: string) => void
}) {
    const request = useMutation({ mutationFn: AuthService.requestPasswordReset })
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RecoveryEmailValues>({
        resolver: zodResolver(recoveryEmailSchema),
        defaultValues: { email: defaultEmail },
    })

    const submit = handleSubmit(({ email }) => {
        request.mutate(email, { onSuccess: () => onSent(email) })
    })

    return (
        <form onSubmit={(event) => void submit(event)} noValidate className="space-y-5">
            <p className="text-sm text-ink-soft">
                Escribe el correo con el que entras al panel. Si tu cuenta tiene Telegram vinculado,
                el bot te enviará un código de 6 dígitos para crear una contraseña nueva.
            </p>
            {request.isError ? (
                <Alert onDismiss={request.reset}>{getErrorMessage(request.error)}</Alert>
            ) : null}
            <Input
                label="Correo"
                type="email"
                autoComplete="username"
                autoFocus
                disabled={request.isPending}
                error={errors.email?.message}
                {...register('email')}
            />
            <Button
                type="submit"
                fullWidth
                isLoading={request.isPending}
                leadingIcon={<Send aria-hidden="true" className="size-4" />}
            >
                Enviar código
            </Button>
            <p className="text-sm text-ink-soft">{NO_TELEGRAM_NOTE}</p>
        </form>
    )
}

const EMPTY_RESET: RecoveryResetValues = { code: '', newPassword: '', confirmPassword: '' }

function ResetStep({
    email,
    onChangeEmail,
    onDone,
}: {
    email: string
    onChangeEmail: () => void
    onDone: () => void
}) {
    const confirm = useMutation({ mutationFn: AuthService.confirmPasswordReset })
    const {
        control,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<RecoveryResetValues>({
        resolver: zodResolver(recoveryResetSchema),
        defaultValues: EMPTY_RESET,
    })

    const submit = handleSubmit(({ code, newPassword }) => {
        confirm.mutate(
            { email, code, newPassword },
            {
                onSuccess: onDone,
                onError: (error) => {
                    if (!isApiError(error, 400)) return
                    for (const detail of error.details) {
                        const message = detail.errors[0]
                        if (
                            message &&
                            (detail.field === 'code' || detail.field === 'newPassword')
                        ) {
                            setError(detail.field, { type: 'server', message })
                        }
                    }
                },
            },
        )
    })

    const passwordFields = [
        { name: 'newPassword', label: 'Nueva contraseña', withStrength: true },
        { name: 'confirmPassword', label: 'Repite la nueva contraseña', withStrength: false },
    ] as const

    return (
        <form onSubmit={(event) => void submit(event)} noValidate className="space-y-5">
            <Alert tone="info">
                <p>{RECOVERY_SENT_MESSAGE}</p>
                <p className="mt-2 font-normal">{NO_TELEGRAM_NOTE}</p>
            </Alert>
            <p className="text-sm break-words text-ink-soft">
                Código para <span className="font-semibold text-ink">{email}</span> ·{' '}
                <button type="button" onClick={onChangeEmail} className={linkClass}>
                    Cambiar correo o pedir otro código
                </button>
            </p>
            {confirm.isError && !isApiError(confirm.error, 400) ? (
                <Alert onDismiss={confirm.reset}>{getErrorMessage(confirm.error)}</Alert>
            ) : null}
            <fieldset className="space-y-4" disabled={confirm.isPending}>
                <legend className="sr-only">Código y nueva contraseña</legend>
                <Controller
                    control={control}
                    name="code"
                    render={({ field }) => (
                        <ResetCodeInput
                            name={field.name}
                            inputRef={field.ref}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            error={errors.code?.message}
                        />
                    )}
                />
                {passwordFields.map((config) => (
                    <Controller
                        key={config.name}
                        control={control}
                        name={config.name}
                        render={({ field }) => (
                            <PasswordField
                                label={config.label}
                                name={field.name}
                                inputRef={field.ref}
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                error={errors[config.name]?.message}
                                autoComplete="new-password"
                                withStrength={config.withStrength}
                            />
                        )}
                    />
                ))}
            </fieldset>
            <Button
                type="submit"
                fullWidth
                isLoading={confirm.isPending}
                leadingIcon={<KeyRound aria-hidden="true" className="size-4" />}
            >
                Cambiar contraseña
            </Button>
        </form>
    )
}

/**
 * "¿Olvidaste tu contraseña?" (`/admin/recuperar`): the email, then the code the Telegram bot
 * sent plus the new password. Both steps live in component state, so the address bar stays a
 * plain `/admin/recuperar` (like the login page). Success goes back to the login page with a
 * notice: resetting never signs the user in.
 */
export function AdminPasswordRecoveryView() {
    const { general } = useSiteContent()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [step, setStep] = useState<'email' | 'code'>('email')

    return (
        <AdminAuthCard
            title="Recupera tu acceso"
            subtitle={general.brandName}
            footer={<BackToLogin />}
        >
            {step === 'email' ? (
                <EmailStep
                    defaultEmail={email}
                    onSent={(sentTo) => {
                        setEmail(sentTo)
                        setStep('code')
                    }}
                />
            ) : (
                <ResetStep
                    email={email}
                    onChangeEmail={() => setStep('email')}
                    onDone={() =>
                        void navigate(ADMIN_ROUTES.login, {
                            replace: true,
                            state: adminLoginState(undefined, undefined, 'password-reset'),
                        })
                    }
                />
            )}
        </AdminAuthCard>
    )
}
