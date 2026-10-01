import { useId, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock } from 'lucide-react'
import {
    Controller,
    useForm,
    useWatch,
    type FieldPath,
    type Resolver,
    type UseFormSetError,
} from 'react-hook-form'

import type { AdminUser } from '@/@types/user'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Input, Select, type SelectOption } from '@/components/ui'
import { FIELD_BASE_CLASS, FIELD_HINT_CLASS, FIELD_LABEL_CLASS } from '@/components/ui/field.styles'
import { cn } from '@/utils/cn'
import { getErrorMessage, isApiError } from '@/services/errors'
import { useCreateUser, useUpdateUser } from '@/views/admin/hooks/useAdminUsers'
import { CredentialsPanel } from '@/views/admin/users/components/CredentialsPanel'
import { PasswordField } from '@/views/admin/users/components/PasswordField'
import {
    ROLE_DESCRIPTION,
    ROLE_LABEL,
    USER_ROLES,
    userCreateSchema,
    userEditSchema,
    type UserCreateValues,
} from '@/views/admin/users/schema/user.schema'

const ROLE_OPTIONS: SelectOption[] = USER_ROLES.map((role) => ({
    value: role,
    label: ROLE_LABEL[role],
    description: ROLE_DESCRIPTION[role],
}))

const FORM_FIELDS = new Set(['name', 'email', 'role', 'password'])

/**
 * Pins the API's field errors (and a taken email) on the form. Returns the message for the
 * dialog's alert when no field can show it.
 */
function applyUserErrors(error: unknown, setError: UseFormSetError<UserCreateValues>) {
    if (!isApiError(error)) return getErrorMessage(error)
    if (error.status === 409 && error.message.includes('correo')) {
        setError('email', { type: 'server', message: error.message })
        return undefined
    }
    let placed = false
    for (const detail of error.details) {
        const message = detail.errors[0]
        if (message && FORM_FIELDS.has(detail.field)) {
            setError(detail.field as FieldPath<UserCreateValues>, { type: 'server', message })
            placed = true
        }
    }
    return placed ? undefined : error.message
}

export interface UserFormDialogProps {
    isOpen: boolean
    /** Edit this user; omitted for "Nuevo usuario". */
    user?: AdminUser | null
    /** The signed-in admin: their own role is locked. */
    currentUserId: string
    onClose: () => void
    /** After a successful save (the create dialog stays open on the credentials). */
    onSaved: (message: string) => void
}

/** "Nuevo usuario" and "Editar usuario". Remounted on every open (see the `key` at the call). */
export function UserFormDialog({
    isOpen,
    user,
    currentUserId,
    onClose,
    onSaved,
}: UserFormDialogProps) {
    const isEdit = Boolean(user)
    const isSelf = user?.id === currentUserId
    const formId = useId()
    const create = useCreateUser()
    const update = useUpdateUser()
    const [formError, setFormError] = useState<string | undefined>()
    const [created, setCreated] = useState<{ email: string; password: string } | null>(null)

    const {
        register,
        control,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<UserCreateValues>({
        // The edit form has no password field: validate it with the edit schema.
        resolver: (isEdit
            ? zodResolver(userEditSchema)
            : zodResolver(userCreateSchema)) as unknown as Resolver<UserCreateValues>,
        defaultValues: {
            name: user?.name ?? '',
            email: user?.email ?? '',
            role: user?.role ?? 'EDITOR',
            password: '',
        },
    })
    const role = useWatch({ control, name: 'role' })

    const submit = handleSubmit(async (values) => {
        setFormError(undefined)
        try {
            if (user) {
                const input = isSelf
                    ? { name: values.name, email: values.email }
                    : { name: values.name, email: values.email, role: values.role }
                await update.mutateAsync({ id: user.id, input })
                onSaved(`Guardamos los cambios de ${values.name}.`)
                onClose()
                return
            }
            const saved = await create.mutateAsync({
                name: values.name,
                email: values.email,
                role: values.role,
                password: values.password,
            })
            setCreated({ email: saved.email, password: values.password })
            onSaved(`Creamos la cuenta de ${saved.name}.`)
        } catch (error) {
            setFormError(applyUserErrors(error, setError))
        }
    })

    const isSaving = create.isPending || update.isPending

    if (created) {
        return (
            <ConfirmDialog
                isOpen={isOpen}
                size="lg"
                title="Nuevo usuario"
                cancelLabel="Listo"
                // Only the "Listo" button: nothing else to confirm.
                actions={<></>}
                onClose={onClose}
            >
                <CredentialsPanel
                    kind="created"
                    email={created.email}
                    password={created.password}
                />
            </ConfirmDialog>
        )
    }

    return (
        <ConfirmDialog
            isOpen={isOpen}
            size="lg"
            title={isEdit ? 'Editar usuario' : 'Nuevo usuario'}
            description={
                isEdit
                    ? 'El nombre se ve en el historial de los pedidos y en Telegram. La contraseña se cambia con «Restablecer contraseña».'
                    : 'La persona entra con este correo y la contraseña que elijas. Al terminar verás los datos para compartírselos.'
            }
            confirmLabel={isEdit ? 'Guardar cambios' : 'Crear usuario'}
            confirmVariant="primary"
            isLoading={isSaving}
            error={formError}
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
                <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
                    <Input
                        label="Nombre"
                        autoComplete="off"
                        placeholder="Ana Pérez"
                        error={errors.name?.message}
                        {...register('name')}
                    />
                    <Input
                        label="Correo electrónico"
                        type="email"
                        autoComplete="off"
                        placeholder="ana@correo.com"
                        error={errors.email?.message}
                        {...register('email')}
                    />
                </div>
                {isSelf && user ? (
                    // Read-only: an admin never changes their own role (the API refuses too).
                    <div className="flex flex-col gap-1.5">
                        <span className={FIELD_LABEL_CLASS}>Rol</span>
                        <div
                            className={cn(
                                FIELD_BASE_CLASS,
                                'flex h-11 items-center gap-2 rounded-full bg-brand-50/40 px-4 text-ink-soft',
                            )}
                        >
                            <Lock aria-hidden="true" className="size-4 shrink-0" />
                            {ROLE_LABEL[user.role]}
                        </div>
                        <p className={FIELD_HINT_CLASS}>
                            No puedes cambiar tu propio rol. Pídeselo a otro administrador.
                        </p>
                    </div>
                ) : (
                    <Select
                        label="Rol"
                        options={ROLE_OPTIONS}
                        hint={ROLE_DESCRIPTION[role]}
                        error={errors.role?.message}
                        {...register('role')}
                    />
                )}
                {isEdit ? null : (
                    <Controller
                        control={control}
                        name="password"
                        render={({ field, fieldState }) => (
                            <PasswordField
                                label="Contraseña"
                                name={field.name}
                                inputRef={field.ref}
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                error={fieldState.error?.message}
                                autoComplete="new-password"
                                withStrength
                                withGenerator
                            />
                        )}
                    />
                )}
            </form>
        </ConfirmDialog>
    )
}
