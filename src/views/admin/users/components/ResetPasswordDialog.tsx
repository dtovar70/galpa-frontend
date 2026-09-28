import { useId, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import type { AdminUser } from '@/@types/user'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Alert } from '@/components/ui'
import { getErrorMessage, isApiError } from '@/services/errors'
import { useSetUserPassword } from '@/views/admin/hooks/useAdminUsers'
import { CredentialsPanel } from '@/views/admin/users/components/CredentialsPanel'
import { PasswordField } from '@/views/admin/users/components/PasswordField'
import {
    resetPasswordSchema,
    type ResetPasswordValues,
} from '@/views/admin/users/schema/user.schema'

export interface ResetPasswordDialogProps {
    user: AdminUser | null
    onClose: () => void
    onDone: (message: string) => void
}

/** "Restablecer contraseña": sets a new password and closes every session of that user. */
export function ResetPasswordDialog({ user, onClose, onDone }: ResetPasswordDialogProps) {
    const formId = useId()
    const setPassword = useSetUserPassword()
    const [saved, setSaved] = useState<string | null>(null)
    const {
        control,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<ResetPasswordValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { password: '' },
    })

    const submit = handleSubmit(async ({ password }) => {
        if (!user) return
        try {
            await setPassword.mutateAsync({ id: user.id, password })
            setSaved(password)
            onDone(`Cambiamos la contraseña de ${user.name} y cerramos sus sesiones.`)
        } catch (error) {
            const detail = isApiError(error)
                ? error.details.find((item) => item.field === 'password')?.errors[0]
                : undefined
            if (detail) setError('password', { type: 'server', message: detail })
        }
    })

    if (user && saved) {
        return (
            <ConfirmDialog
                isOpen
                size="lg"
                title="Restablecer contraseña"
                cancelLabel="Listo"
                actions={<></>}
                onClose={onClose}
            >
                <CredentialsPanel kind="reset" email={user.email} password={saved} />
            </ConfirmDialog>
        )
    }

    const serverError =
        setPassword.isError && !isApiError(setPassword.error, 400)
            ? getErrorMessage(setPassword.error)
            : undefined

    return (
        <ConfirmDialog
            isOpen={user !== null}
            size="lg"
            title="Restablecer contraseña"
            description={
                user ? (
                    <>
                        Nueva contraseña para <strong className="text-ink">{user.name}</strong> (
                        {user.email}).
                    </>
                ) : undefined
            }
            confirmLabel="Cambiar contraseña"
            confirmVariant="primary"
            isLoading={setPassword.isPending}
            error={serverError}
            onConfirm={() => {
                const form = document.getElementById(formId)
                if (form instanceof HTMLFormElement) form.requestSubmit()
            }}
            onClose={onClose}
        >
            <form
                id={formId}
                onSubmit={(event) => void submit(event)}
                noValidate
                className="space-y-4"
            >
                <Alert tone="info">
                    Se cerrarán todas las sesiones abiertas de esta persona: tendrá que entrar de
                    nuevo con la contraseña nueva.
                </Alert>
                <Controller
                    control={control}
                    name="password"
                    render={({ field }) => (
                        <PasswordField
                            label="Nueva contraseña"
                            name={field.name}
                            inputRef={field.ref}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            error={errors.password?.message}
                            autoComplete="new-password"
                            withStrength
                            withGenerator
                        />
                    )}
                />
            </form>
        </ConfirmDialog>
    )
}
