import { RefreshCw } from 'lucide-react'

import type { TelegramBotMode, TelegramBotStatus } from '@/@types/telegram'
import { Alert, Badge, Button, Card } from '@/components/ui'
import { cn } from '@/utils/cn'
import { LinkChatPanel } from '@/views/admin/telegram/components/LinkChatPanel'
import { telegramUserUrl } from '@/views/admin/telegram/utils/telegram'

const MODE_LABEL: Record<TelegramBotMode, string> = {
    polling: 'Polling',
    webhook: 'Webhook',
}

export interface BotStatusCardProps {
    bot: TelegramBotStatus
    isRefreshing: boolean
    onRefresh: () => void
}

/** Whether the bot is up, who it is, and the "Vincular un chat" flow. */
export function BotStatusCard({ bot, isRefreshing, onRefresh }: BotStatusCardProps) {
    return (
        <Card padding="none" className="space-y-5 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                    <h2 className="font-display text-xl text-ink">Bot de Telegram</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={bot.connected ? 'mint' : 'neutral'} size="sm">
                            <span
                                aria-hidden="true"
                                className={cn(
                                    'size-2 rounded-full',
                                    bot.connected
                                        ? 'bg-mint-400 ring-2 ring-white'
                                        : 'bg-ink-soft/60',
                                )}
                            />
                            {bot.connected ? 'Conectado' : 'Desconectado'}
                        </Badge>
                        <Badge tone="sky" size="sm">
                            {MODE_LABEL[bot.mode]}
                        </Badge>
                        {bot.enabled ? null : (
                            <Badge tone="butter" size="sm">
                                Apagado
                            </Badge>
                        )}
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    aria-label="Actualizar estado del bot"
                    className="shrink-0 px-3"
                >
                    <RefreshCw
                        aria-hidden="true"
                        className={cn(
                            'size-4 motion-safe:transition',
                            isRefreshing && 'motion-safe:animate-spin',
                        )}
                    />
                    <span className="hidden sm:inline">Actualizar</span>
                </Button>
            </div>

            {bot.username || bot.name ? (
                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    {bot.username ? (
                        <div className="min-w-0">
                            <dt className="text-xs text-ink-soft">Usuario</dt>
                            <dd className="font-semibold break-all">
                                <a
                                    href={telegramUserUrl(bot.username)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sky-700 hover:underline"
                                >
                                    @{bot.username}
                                </a>
                            </dd>
                        </div>
                    ) : null}
                    {bot.name ? (
                        <div className="min-w-0">
                            <dt className="text-xs text-ink-soft">Nombre</dt>
                            <dd className="font-semibold break-words text-ink">{bot.name}</dd>
                        </div>
                    ) : null}
                </dl>
            ) : null}

            {!bot.connected && bot.error ? <Alert>{bot.error}</Alert> : null}
            {!bot.connected && !bot.error ? (
                <Alert>El bot no está conectado. Revisa su configuración e intenta de nuevo.</Alert>
            ) : null}

            <LinkChatPanel connected={bot.connected} botUsername={bot.username} />
        </Card>
    )
}
