import { useState } from 'react'
import { Lock, MessageCircleQuestion, Send } from 'lucide-react'

import type { TelegramChat } from '@/@types/telegram'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { Alert, Button, Card, Skeleton } from '@/components/ui'
import { NOTICE_DISMISS_MS } from '@/constants/ui.constant'
import { getErrorMessage } from '@/services/errors'
import { AdminPageHeader } from '@/views/admin/components/AdminPageHeader'
import { useAdminTelegram, useUnlinkTelegramChat } from '@/views/admin/hooks/useAdminTelegram'
import { useSession } from '@/views/admin/hooks/useSession'
import { BotStatusCard } from '@/views/admin/telegram/components/BotStatusCard'
import { TelegramChatCard } from '@/views/admin/telegram/components/TelegramChatCard'
import { chatDisplayName } from '@/views/admin/telegram/utils/telegram'

const TITLE = 'Telegram'
const DESCRIPTION = 'Recibe los pagos por verificar en Telegram y apruébalos desde el chat.'

function TelegramHelp() {
    return (
        <Card tone="sky" elevation="none" padding="none" className="space-y-3 p-5">
            <h2 className="flex items-center gap-2 font-display text-lg text-ink">
                <MessageCircleQuestion aria-hidden="true" className="size-5 text-sky-700" />
                ¿Cómo funciona?
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-sm text-ink-soft marker:text-sky-400">
                <li>
                    Cada pago por verificar llega a <strong>todos</strong> los chats vinculados.
                </li>
                <li>
                    Con <strong>Nuevos pedidos</strong> activo, ese chat también recibe un aviso por
                    cada pedido nuevo.
                </li>
                <li>
                    Si apruebas un pago desde Telegram, la web se actualiza al instante: el pedido y
                    el cliente lo ven confirmado.
                </li>
                <li>Desvincula un chat para que deje de recibir avisos.</li>
            </ul>
        </Card>
    )
}

/**
 * "Telegram" (ADMIN only): the bot's status, linking a chat with a one-time code, and the
 * chats that receive the payments to verify.
 */
export function AdminTelegramView() {
    const { data: session } = useSession()
    const isAdmin = session?.role === 'ADMIN'
    const telegram = useAdminTelegram({ enabled: isAdmin })
    const unlink = useUnlinkTelegramChat()
    const [pendingUnlink, setPendingUnlink] = useState<TelegramChat | null>(null)
    const [notice, setNotice] = useState<string | null>(null)

    if (session && !isAdmin) {
        return (
            <>
                <AdminPageHeader title={TITLE} />
                <EmptyState
                    title="Solo un administrador puede configurar Telegram"
                    description="Pide a un administrador que vincule tu chat para recibir los pagos."
                    icon={<Lock className="size-6" />}
                />
            </>
        )
    }

    const confirmUnlink = () => {
        if (!pendingUnlink) return
        const name = chatDisplayName(pendingUnlink)
        unlink.mutate(pendingUnlink.id, {
            onSuccess: () => {
                setPendingUnlink(null)
                setNotice(`Desvinculamos a ${name}. Ya no recibirá avisos.`)
            },
        })
    }

    const chats = telegram.data?.chats ?? []
    const bot = telegram.data?.bot

    return (
        <>
            <AdminPageHeader title={TITLE} description={DESCRIPTION} />

            {notice ? (
                <Alert
                    key={notice}
                    tone="success"
                    className="mb-6"
                    autoDismissMs={NOTICE_DISMISS_MS}
                    onDismiss={() => setNotice(null)}
                >
                    {notice}
                </Alert>
            ) : null}

            {telegram.isPending ? (
                <div className="space-y-6">
                    <Skeleton shape="block" className="h-48" />
                    <Skeleton shape="block" className="h-32" />
                    <Skeleton shape="block" className="h-32" />
                </div>
            ) : telegram.isError || !bot ? (
                <EmptyState
                    title="No pudimos cargar Telegram"
                    description={getErrorMessage(telegram.error)}
                    icon={<Send className="size-6" />}
                    action={
                        <Button variant="secondary" onClick={() => void telegram.refetch()}>
                            Reintentar
                        </Button>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
                    <div className="min-w-0 space-y-8">
                        <BotStatusCard
                            bot={bot}
                            isRefreshing={telegram.isFetching}
                            onRefresh={() => void telegram.refetch()}
                        />

                        <section aria-labelledby="telegram-chats-title" className="space-y-4">
                            <div className="flex items-baseline justify-between gap-3">
                                <h2
                                    id="telegram-chats-title"
                                    className="font-display text-xl text-ink"
                                >
                                    Chats vinculados
                                </h2>
                                {chats.length > 0 ? (
                                    <span className="text-sm text-ink-soft tabular-nums">
                                        {chats.length === 1 ? '1 chat' : `${chats.length} chats`}
                                    </span>
                                ) : null}
                            </div>

                            {chats.length === 0 ? (
                                <EmptyState
                                    title="Aún no hay chats vinculados"
                                    description="Vincula el tuyo para recibir los pagos al instante."
                                    icon={<Send className="size-6" />}
                                />
                            ) : (
                                <ul className="space-y-3">
                                    {chats.map((chat) => (
                                        <li key={chat.id}>
                                            <TelegramChatCard
                                                chat={chat}
                                                botConnected={bot.connected}
                                                onUnlink={(target) => {
                                                    unlink.reset()
                                                    setNotice(null)
                                                    setPendingUnlink(target)
                                                }}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </div>

                    <aside className="min-w-0">
                        <TelegramHelp />
                    </aside>
                </div>
            )}

            <ConfirmDialog
                isOpen={pendingUnlink !== null}
                title="¿Desvincular este chat?"
                description={
                    pendingUnlink ? (
                        <>
                            <strong className="font-semibold text-ink">
                                {chatDisplayName(pendingUnlink)}
                            </strong>{' '}
                            dejará de recibir avisos y no podrá aprobar pagos.
                        </>
                    ) : undefined
                }
                confirmLabel="Desvincular"
                isLoading={unlink.isPending}
                error={unlink.isError ? getErrorMessage(unlink.error) : undefined}
                onConfirm={confirmUnlink}
                onClose={() => setPendingUnlink(null)}
            />
        </>
    )
}
