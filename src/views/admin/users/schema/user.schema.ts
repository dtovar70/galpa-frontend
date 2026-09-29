import { z } from 'zod'

import type { UserRole } from '@/@types/admin'
import {
    TEXT_INPUT_MAX_LENGTH as MAX_TEXT,
    TEXT_INPUT_MAX_MESSAGE as MAX_TEXT_MESSAGE,
} from '@/constants/ui.constant'
import {
    hasDigit,
    hasLetter,
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
} from '@/views/admin/users/utils/password'

export const USER_ROLES = ['ADMIN', 'EDITOR'] as const satisfies readonly UserRole[]

export const ROLE_LABEL: Record<UserRole, string> = {
    ADMIN: 'Administrador',
    EDITOR: 'Editor',
}

/** Short, for the role picker; the full list lives in `views/admin/constants/rolePermissions`. */
export const ROLE_DESCRIPTION: Record<UserRole, string> = {
    ADMIN: 'Todo: usuarios, catálogos, Telegram, tasa manual y eliminar.',
    EDITOR: 'Pedidos, productos, categorías, contenido y tasa. No elimina, no cancela pedidos ni toca usuarios, catálogos o Telegram.',
}

/** Mirrors the API's password policy (10–200 characters, a letter and a number). */
export const newPasswordSchema = z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Usa al menos ${PASSWORD_MIN_LENGTH} caracteres`)
    .max(PASSWORD_MAX_LENGTH, `Máximo ${PASSWORD_MAX_LENGTH} caracteres`)
    .refine(hasLetter, 'Incluye al menos una letra')
    .refine(hasDigit, 'Incluye al menos un número')

export const userNameSchema = z
    .string()
    .trim()
    .min(1, 'Escribe el nombre')
    .max(MAX_TEXT, MAX_TEXT_MESSAGE)

const emailSchema = z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Escribe el correo')
    .max(MAX_TEXT, MAX_TEXT_MESSAGE)
    .pipe(z.email('Escribe un correo válido, por ejemplo ana@correo.com'))

/** "Editar usuario" (mirrors `UpdateUserDto`). */
export const userEditSchema = z.object({
    name: userNameSchema,
    email: emailSchema,
    role: z.enum(USER_ROLES),
})

/** "Nuevo usuario" (mirrors `CreateUserDto`). */
export const userCreateSchema = userEditSchema.extend({ password: newPasswordSchema })

export type UserEditValues = z.infer<typeof userEditSchema>
export type UserCreateValues = z.infer<typeof userCreateSchema>

export const resetPasswordSchema = z.object({ password: newPasswordSchema })
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

/** "Mi cuenta" → Contraseña. */
export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Escribe tu contraseña actual'),
        newPassword: newPasswordSchema,
        confirmPassword: z.string().min(1, 'Repite la nueva contraseña'),
    })
    .refine((values) => values.newPassword === values.confirmPassword, {
        path: ['confirmPassword'],
        message: 'Las contraseñas no coinciden',
    })
    .refine((values) => values.newPassword !== values.currentPassword, {
        path: ['newPassword'],
        message: 'Debe ser distinta de la actual',
    })

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>

export const accountNameSchema = z.object({ name: userNameSchema })
export type AccountNameValues = z.infer<typeof accountNameSchema>
