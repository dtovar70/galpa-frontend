import type { AdminUser } from '@/@types/user'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { getErrorMessage } from '@/services/errors'
import { useSetUserActive } from '@/views/admin/hooks/useAdminUsers'

export interface UserStatusDialogProps {
    user: AdminUser | null
    onClose: () => void
    onDone: (message: string) => void
}

function chats(count: number): string {
    return count === 1 ? '1 chat de Telegram' : `${count} chats de Telegram`
}

/** Desactivar / Activar. There is no delete: deactivating keeps the whole history. */
export function UserStatusDialog({ user, onClose, onDone }: UserStatusDialogProps) {
    const setActive = useSetUserActive()
    const deactivating = user?.isActive ?? true

    const confirm = () => {
        if (!user) return
        setActive.mutate(
            { id: user.id, isActive: !user.isActive },
            {
                onSuccess: (result) => {
                    onDone(
                        result.isActive
                            ? `Activamos a ${result.name}: ya puede entrar al panel.`
                            : `Desactivamos a ${result.name}. Cerramos sus sesiones${
                                  result.telegramChatsDeactivated
                                      ? ` y apagamos ${chats(result.telegramChatsDeactivated)} que había vinculado`
                                      : ''
                              }.`,
                    )
                    onClose()
                },
            },
        )
    }

    return (
        <ConfirmDialog
            isOpen={user !== null}
            title={deactivating ? '¿Desactivar este usuario?' : '¿Activar este usuario?'}
            description={
                user ? (
                    deactivating ? (
                        <div className="space-y-2">
                            <p>
                                <strong className="text-ink">{user.name}</strong> no podrá entrar al
                                panel y sus sesiones abiertas se cierran ahora mismo.
                                {user.activeTelegramChatCount > 0
                                    ? ` También dejarán de llegarle los pagos a los ${chats(user.activeTelegramChatCount)} que vinculó.`
                                    : ''}
                            </p>
                            <p>
                                Los usuarios no se eliminan: los pedidos, notas y aprobaciones
                                siguen mostrando quién hizo cada cosa. Puedes activarlo de nuevo
                                cuando quieras.
                            </p>
                        </div>
                    ) : (
                        <p>
                            <strong className="text-ink">{user.name}</strong> podrá entrar otra vez
                            con su contraseña de siempre.
                            {user.telegramChatCount > 0
                                ? ' Sus chats de Telegram siguen apagados hasta que escriban al bot o se vinculen de nuevo.'
                                : ''}
                        </p>
                    )
                ) : undefined
            }
            confirmLabel={deactivating ? 'Desactivar usuario' : 'Activar usuario'}
            confirmVariant={deactivating ? 'danger' : 'primary'}
            isLoading={setActive.isPending}
            error={setActive.isError ? getErrorMessage(setActive.error) : undefined}
            onConfirm={confirm}
            onClose={() => {
                setActive.reset()
                onClose()
            }}
        />
    )
}
