import { KeyRound, Pencil, UserCheck, UserX } from 'lucide-react'

import type { AdminUser } from '@/@types/user'
import { Tooltip } from '@/components/ui'
import { cn } from '@/utils/cn'

const actionClass =
    'flex size-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-blush-100 hover:text-blush-700 focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:ring-offset-2'
/** Still focusable (aria-disabled), so keyboard users also reach the tooltip saying why. */
const blockedClass = 'cursor-not-allowed opacity-40 hover:bg-transparent hover:text-ink-soft'

export interface UserRowActionsProps {
    user: AdminUser
    isSelf: boolean
    onEdit: (user: AdminUser) => void
    onResetPassword: (user: AdminUser) => void
    onToggleActive: (user: AdminUser) => void
    className?: string
}

export function UserRowActions({
    user,
    isSelf,
    onEdit,
    onResetPassword,
    onToggleActive,
    className,
}: UserRowActionsProps) {
    const StatusIcon = user.isActive ? UserX : UserCheck
    const statusLabel = user.isActive ? 'Desactivar' : 'Activar'

    return (
        <div className={cn('flex shrink-0 items-center justify-end gap-1', className)}>
            {/* Tooltips open upwards and end-aligned: rows sit inside a clipping scroll area. */}
            <Tooltip label="Editar" placement="top">
                <button
                    type="button"
                    onClick={() => onEdit(user)}
                    aria-label={`Editar a ${user.name}`}
                    className={actionClass}
                >
                    <Pencil aria-hidden="true" className="size-4" />
                </button>
            </Tooltip>
            <Tooltip
                label={isSelf ? 'Tu contraseña se cambia en Mi cuenta' : 'Restablecer contraseña'}
                placement="top"
                align="end"
            >
                <button
                    type="button"
                    onClick={isSelf ? undefined : () => onResetPassword(user)}
                    aria-disabled={isSelf || undefined}
                    aria-label={
                        isSelf
                            ? 'Restablecer contraseña (no disponible: tu contraseña se cambia en Mi cuenta)'
                            : `Restablecer la contraseña de ${user.name}`
                    }
                    className={cn(actionClass, isSelf && blockedClass)}
                >
                    <KeyRound aria-hidden="true" className="size-4" />
                </button>
            </Tooltip>
            <Tooltip
                label={isSelf ? 'No puedes desactivar tu propia cuenta' : statusLabel}
                placement="top"
                align="end"
            >
                <button
                    type="button"
                    onClick={isSelf ? undefined : () => onToggleActive(user)}
                    aria-disabled={isSelf || undefined}
                    aria-label={
                        isSelf
                            ? 'Desactivar (no disponible: no puedes desactivar tu propia cuenta)'
                            : `${statusLabel} a ${user.name}`
                    }
                    className={cn(actionClass, isSelf && blockedClass)}
                >
                    <StatusIcon aria-hidden="true" className="size-4" />
                </button>
            </Tooltip>
        </div>
    )
}
