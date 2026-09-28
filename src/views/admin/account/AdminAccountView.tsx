import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import type { AdminSession } from '@/@types/admin'
import { Alert, Button, Card, Input } from '@/components/ui'
import { NOTICE_DISMISS_MS } from '@/constants/ui.constant'
import { getErrorMessage, isApiError } from '@/services/errors'
import { formatDate } from '@/utils/formatDate'
import { AdminPageHeader } from '@/views/admin/components/AdminPageHeader'
import { useChangePassword, useSession, useUpdateMe } from '@/views/admin/hooks/useSession'
import { PasswordField } from '@/views/admin/users/components/PasswordField'
import { RoleBadge } from '@/views/admin/users/components/UserBadges'
import {
    accountNameSchema,
    changePasswordSchema,
    ROLE_DESCRIPTION,
    type AccountNameValues,
    type ChangePasswordValues,
} from '@/views/admin/users/schema/user.schema'

function SectionTitle({ title, description }: { title: string; description: string }) {
    return (
        <div className="space-y-1">
            <h2 className="font-display text-xl text-ink">{title}</h2>
            <p className="text-sm text-ink-soft">{description}</p>
        </div>
    )
}

function ProfileCard({ user }: { user: AdminSession }) {
    const updateMe = useUpdateMe()
    const [notice, setNotice] = useState<string | null>(null)
    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isDirty },
    } = useForm<AccountNameValues>({
        resolver: zodResolver(accountNameSchema),
        defaultValues: { name: user.name },
    })

    const submit = handleSubmit((values) => {
        setNotice(null)
        updateMe.mutate(values, {
            onSuccess: (session) => {
                reset({ name: session.name })
                setNotice('Guardamos tu nombre.')
            },
            onError: (error) => {
                const message = isApiError(error)
                    ? error.details.find((detail) => detail.field === 'name')?.errors[0]
                    : undefined
                if (message) setError('name', { type: 'server', message })
            },
        })
    })

    return (
        <Card className="space-y-5">
            <SectionTitle
                title="Tus datos"
                description="Tu nombre aparece en el historial de los pedidos y en los mensajes de Telegram."
            />
            {notice ? (
                <Alert
                    key={notice}
                    tone="success"
                    autoDismissMs={NOTICE_DISMISS_MS}
                    onDismiss={() => setNotice(null)}
                >
                    {notice}
                </Alert>
            ) : null}
            <form onSubmit={(event) => void submit(event)} noValidate className="space-y-5">
                <Input
                    label="Nombre"
                    autoComplete="name"
                    error={errors.name?.message}
                    {...register('name')}
                />
                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div className="space-y-1">
                        <dt className="font-semibold text-ink">Correo electrónico</dt>
                        <dd className="break-all text-ink-soft">{user.email}</dd>
                    </div>
                    <div className="space-y-1">
                        <dt className="font-semibold text-ink">Rol</dt>
                        <dd className="flex flex-wrap items-center gap-2 text-ink-soft">
                            <RoleBadge role={user.role} />
                            <span className="text-xs">{ROLE_DESCRIPTION[user.role]}</span>
                        </dd>
                    </div>
                </dl>
                <p className="text-xs text-ink-soft">
                    El correo y el rol los cambia un administrador desde Usuarios.
                </p>
                {updateMe.isError && !isApiError(updateMe.error, 400) ? (
                    <Alert>{getErrorMessage(updateMe.error)}</Alert>
                ) : null}
                <div className="flex justify-end">
                    <Button type="submit" isLoading={updateMe.isPending} disabled={!isDirty}>
                        Guardar nombre
                    </Button>
                </div>
            </form>
        </Card>
    )
}

const EMPTY_PASSWORDS: ChangePasswordValues = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
}

function PasswordCard() {
    const changePassword = useChangePassword()
    const [notice, setNotice] = useState<string | null>(null)
    const {
        control,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<ChangePasswordValues>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: EMPTY_PASSWORDS,
    })

    const submit = handleSubmit(({ currentPassword, newPassword }) => {
        setNotice(null)
        changePassword.mutate(
            { currentPassword, newPassword },
            {
                onSuccess: () => {
                    reset(EMPTY_PASSWORDS)
                    setNotice(
                        'Cambiamos tu contraseña. Cerramos tus otras sesiones abiertas; esta sigue activa.',
                    )
                },
                onError: (error) => {
                    if (!isApiError(error, 400)) return
                    for (const detail of error.details) {
                        const message = detail.errors[0]
                        if (
                            message &&
                            (detail.field === 'currentPassword' || detail.field === 'newPassword')
                        ) {
                            setError(detail.field, { type: 'server', message })
                        }
                    }
                },
            },
        )
    })

    const fields = [
        {
            name: 'currentPassword',
            label: 'Contraseña actual',
            autoComplete: 'current-password',
        },
        {
            name: 'newPassword',
            label: 'Nueva contraseña',
            autoComplete: 'new-password',
            withStrength: true,
        },
        {
            name: 'confirmPassword',
            label: 'Repite la nueva contraseña',
            autoComplete: 'new-password',
        },
    ] as const

    return (
        <Card className="space-y-5">
            <SectionTitle
                title="Contraseña"
                description="Al cambiarla se cierran tus sesiones en otros dispositivos; en este sigues dentro."
            />
            {notice ? (
                <Alert
                    key={notice}
                    tone="success"
                    autoDismissMs={NOTICE_DISMISS_MS}
                    onDismiss={() => setNotice(null)}
                >
                    {notice}
                </Alert>
            ) : null}
            <form onSubmit={(event) => void submit(event)} noValidate className="space-y-4">
                {fields.map((config) => (
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
                                autoComplete={config.autoComplete}
                                withStrength={'withStrength' in config}
                            />
                        )}
                    />
                ))}
                {changePassword.isError && !isApiError(changePassword.error, 400) ? (
                    <Alert>{getErrorMessage(changePassword.error)}</Alert>
                ) : null}
                <div className="flex justify-end">
                    <Button type="submit" isLoading={changePassword.isPending}>
                        Cambiar contraseña
                    </Button>
                </div>
            </form>
        </Card>
    )
}

/** "Mi cuenta" (any role): your name and your password. */
export function AdminAccountView() {
    const { data: user } = useSession()
    // `RequireAdmin` only renders the admin routes with a session.
    if (!user) return null

    return (
        <>
            <AdminPageHeader
                title="Mi cuenta"
                description={`Sesión iniciada como ${user.email}. Cuenta creada el ${formatDate(user.createdAt)}.`}
            />
            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
                <ProfileCard user={user} />
                <PasswordCard />
            </div>
        </>
    )
}
