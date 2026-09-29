import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ShieldCheck, X } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'

import type { AdminSession } from '@/@types/admin'
import { Alert, Button, Card, Input } from '@/components/ui'
import { NOTICE_DISMISS_MS } from '@/constants/ui.constant'
import { getErrorMessage, isApiError } from '@/services/errors'
import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/formatDate'
import { AdminPageHeader } from '@/views/admin/components/AdminPageHeader'
import {
    capabilityGroupsFor,
    type RoleCapabilityGroup,
} from '@/views/admin/constants/rolePermissions'
import { useChangePassword, useSession, useUpdateMe } from '@/views/admin/hooks/useSession'
import { PasswordField } from '@/views/admin/users/components/PasswordField'
import { RoleBadge } from '@/views/admin/users/components/UserBadges'
import {
    accountNameSchema,
    changePasswordSchema,
    ROLE_LABEL,
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

function CapabilityList({
    title,
    groups,
    allowed,
}: {
    title: string
    groups: readonly RoleCapabilityGroup[]
    allowed: boolean
}) {
    const Icon = allowed ? Check : X

    return (
        <section className="space-y-3">
            <h3 className="font-display text-base text-ink">{title}</h3>
            <div className="space-y-3">
                {groups.map(({ area, capabilities }) => (
                    <div key={area} className="space-y-1.5">
                        <p className="text-xs font-bold tracking-wide text-ink-soft uppercase">
                            {area}
                        </p>
                        <ul className="space-y-1.5 text-sm text-ink">
                            {capabilities.map(({ action }) => (
                                <li key={action} className="flex items-start gap-2">
                                    <span
                                        aria-hidden="true"
                                        className={cn(
                                            'mt-px flex size-5 shrink-0 items-center justify-center rounded-full',
                                            allowed
                                                ? 'bg-mint-200 text-ink'
                                                : 'bg-line text-ink-soft',
                                        )}
                                    >
                                        <Icon className="size-3.5" strokeWidth={2.5} />
                                    </span>
                                    {action}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </section>
    )
}

/** What your role lets you do, from the same list as Usuarios → "¿Qué puede hacer cada rol?". */
function RoleAccessCard({ user }: { user: AdminSession }) {
    const roleLabel = ROLE_LABEL[user.role]

    return (
        <Card className="space-y-5 xl:col-span-2">
            <SectionTitle
                title="Qué puedes hacer"
                description={`Tu rol es ${roleLabel}. Solo un administrador puede cambiarlo.`}
            />
            {user.role === 'ADMIN' ? (
                <p className="flex items-center gap-3 rounded-2xl bg-mint-200/50 px-4 py-3 text-sm text-ink">
                    <ShieldCheck aria-hidden="true" className="size-5 shrink-0" />
                    Tienes acceso a todo el panel.
                </p>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <CapabilityList
                        title="Puedes"
                        groups={capabilityGroupsFor(user.role, true)}
                        allowed
                    />
                    <CapabilityList
                        title="No puedes"
                        groups={capabilityGroupsFor(user.role, false)}
                        allowed={false}
                    />
                </div>
            )}
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

/** "Mi cuenta" (any role): your name, your password and what your role lets you do. */
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
                <RoleAccessCard user={user} />
            </div>
        </>
    )
}
