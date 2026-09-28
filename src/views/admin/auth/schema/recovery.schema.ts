import { z } from 'zod'

import {
    TEXT_INPUT_MAX_LENGTH as MAX_TEXT,
    TEXT_INPUT_MAX_MESSAGE as MAX_TEXT_MESSAGE,
} from '@/constants/ui.constant'
import { newPasswordSchema } from '@/views/admin/users/schema/user.schema'

/** Step 1: the account's email. */
export const recoveryEmailSchema = z.object({
    email: z
        .string()
        .trim()
        .toLowerCase()
        .min(1, 'Escribe tu correo')
        .max(MAX_TEXT, MAX_TEXT_MESSAGE)
        .pipe(z.email('Escribe un correo válido, por ejemplo hola@correo.com')),
})
export type RecoveryEmailValues = z.infer<typeof recoveryEmailSchema>

export const RESET_CODE_LENGTH = 6

/** Keeps digits only, at most `RESET_CODE_LENGTH` of them, as a string ("012345" stays so). */
export function toResetCode(raw: string): string {
    return raw.replace(/\D/g, '').slice(0, RESET_CODE_LENGTH)
}

/** Step 2: the code from Telegram and the new password (same policy as the API). */
export const recoveryResetSchema = z
    .object({
        code: z
            .string()
            .trim()
            .regex(/^\d{6}$/, 'Escribe los 6 dígitos del código'),
        newPassword: newPasswordSchema,
        confirmPassword: z.string().min(1, 'Repite la nueva contraseña'),
    })
    .refine((values) => values.newPassword === values.confirmPassword, {
        path: ['confirmPassword'],
        message: 'Las contraseñas no coinciden',
    })
export type RecoveryResetValues = z.infer<typeof recoveryResetSchema>
