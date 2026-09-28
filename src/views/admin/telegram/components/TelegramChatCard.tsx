import { useState } from 'react'
import { Send, Unlink } from 'lucide-react'

import type { TelegramChat } from '@/@types/telegram'
import { Alert, Badge, Button, Card, Switch } from '@/components/ui'
import { NOTICE_DISMISS_MS } from '@/constants/ui.constant'
import { getErrorMessage } from '@/services/errors'
import { cn } from '@/utils/cn'
import { formatDate, formatDateTime } from '@/utils/formatDate'
import { useSendTelegramTest, useUpdateTelegramChat } from '@/views/admin/hooks/useAdminTelegram'
import { chatDisplayName, telegramUserUrl } from '@/views/admin/telegram/utils/telegram'

export interface TelegramChatCardProps {
    chat: TelegramChat
    /** Test messages need a connected bot. */
    botConnected: boolean
    onUnlink: (chat: TelegramChat) => void
}

/** One linked chat: who it is, the "Nuevos pedidos" switch, a test message and unlinking. */
export function TelegramChatCard({ chat, botConnected, onUnlink }: TelegramChatCardProps) {
    const update = useUpdateTelegramChat()
    const test = useSendTelegramTest()
    const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

    const name = chatDisplayName(chat)
    const initial = name.replace(/^@/, '').charAt(0).toUpperCase() || '?'

    const toggleOrders = (notifyNewOrders: boolean) => {
        setNotice(null)
        update.mutate(
            { id: chat.id, notifyNewOrders },
            {
                onError: (error) =>
                    setNotice({
                        tone: 'error',
                        text: `No pudimos guardar el cambio. ${getErrorMessage(error)}`,
                    }),
            },
        )
    }

    const sendTest = () => {
        setNotice(null)
        test.mutate(chat.id, {
            onSuccess: () =>
                setNotice({
                    tone: 'success',
                    text: `Mensaje de prueba enviado a ${name}. Revisa Telegram 📬`,
                }),
            onError: (error) => setNotice({ tone: 'error', text: getErrorMessage(error) }),
        })
    }

    return (
        <Card padding="none" className={cn('p-4 sm:p-5', !chat.isActive && 'bg-cream')}>
            <div className="flex items-start gap-3">
                <span
                    aria-hidden="true"
                    className={cn(
                        'flex size-11 shrink-0 items-center justify-center rounded-full font-display text-lg',
                        chat.isActive ? 'bg-sky-100 text-sky-700' : 'bg-line text-ink-soft',
                    )}
                >
                    {initial}
                </span>

                <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="min-w-0 font-semibold break-words text-ink">{name}</h3>
                        {chat.firstName && chat.username ? (
                            <a
                                href={telegramUserUrl(chat.username)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="min-w-0 text-sm break-all text-sky-700 hover:underline"
                            >
                                @{chat.username}
                            </a>
                        ) : null}
                        {chat.isActive ? null : (
                            <Badge tone="neutral" size="sm">
                                Inactivo
                            </Badge>
                        )}
                    </div>

                    <p className="text-xs text-ink-soft">
                        Vinculado el {formatDate(chat.linkedAt)}
                        {chat.linkedBy
                            ? ` por ${chat.linkedBy.name}${chat.linkedBy.isActive === false ? ' (cuenta desactivada)' : ''}`
                            : ''}
                        {chat.lastSeenAt ? (
                            <>
                                <span aria-hidden="true" className="hidden sm:inline">
                                    {' · '}
                                </span>
                                <br className="sm:hidden" />
                                Última actividad: {formatDateTime(chat.lastSeenAt)}
                            </>
                        ) : null}
                    </p>

                    {chat.isActive ? null : (
                        <p className="text-xs text-blush-800">
                            Inactivo: el chat bloqueó al bot, así que no le llegan los avisos.
                            Desbloquéalo en Telegram y escríbele /ayuda para reactivarlo.
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Switch
                        label={`Avisar a ${name} de cada pedido nuevo`}
                        checked={chat.notifyNewOrders}
                        disabled={update.isPending}
                        onChange={toggleOrders}
                    />
                    <span aria-hidden="true" className="text-sm font-semibold text-ink">
                        Nuevos pedidos
                    </span>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={sendTest}
                        isLoading={test.isPending}
                        disabled={!botConnected || test.isPending}
                        leadingIcon={<Send aria-hidden="true" className="size-4" />}
                    >
                        Enviar mensaje de prueba
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUnlink(chat)}
                        className="text-blush-800 hover:bg-blush-50"
                        leadingIcon={<Unlink aria-hidden="true" className="size-4" />}
                    >
                        Desvincular
                    </Button>
                </div>
            </div>

            {notice ? (
                <Alert
                    key={notice.text}
                    tone={notice.tone}
                    className="mt-4"
                    onDismiss={() => setNotice(null)}
                    autoDismissMs={notice.tone === 'success' ? NOTICE_DISMISS_MS : undefined}
                >
                    {notice.text}
                </Alert>
            ) : null}
        </Card>
    )
}
