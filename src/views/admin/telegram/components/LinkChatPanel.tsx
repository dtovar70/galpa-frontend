import { useState } from 'react'
import { ExternalLink, Link2, RotateCcw } from 'lucide-react'

import type { TelegramChat, TelegramLinkCode } from '@/@types/telegram'
import { CopyButton } from '@/components/shared/CopyButton'
import { Alert, Button, buttonVariants } from '@/components/ui'
import { getErrorMessage } from '@/services/errors'
import { cn } from '@/utils/cn'
import { useCountdown } from '@/utils/hooks/useCountdown'
import { useAdminTelegram, useCreateTelegramLinkCode } from '@/views/admin/hooks/useAdminTelegram'
import { chatDisplayName, formatClock } from '@/views/admin/telegram/utils/telegram'

interface OpenLink {
    code: TelegramLinkCode
    /** Local deadline (from `expiresInSeconds`), so a skewed device clock does not matter. */
    deadline: string
    /** When the API issued the code, on the API's clock. */
    issuedAt: number
    /** Chats already linked when the code was issued. */
    knownIds: ReadonlySet<string>
}

/** The chat linked with the open code: one that was not there before, or re-linked since. */
function findLinkedChat(link: OpenLink, chats: TelegramChat[]): TelegramChat | undefined {
    return chats.find(
        (chat) => !link.knownIds.has(chat.id) || Date.parse(chat.linkedAt) >= link.issuedAt,
    )
}

export interface LinkChatPanelProps {
    connected: boolean
    botUsername: string | null
}

/**
 * "Vincular un chat": asks the API for a one-time code, shows how to send it to the bot and
 * polls the chat list while the code is valid. The first chat linked in that window replaces
 * the code with a success notice and stops the polling.
 */
export function LinkChatPanel({ connected, botUsername }: LinkChatPanelProps) {
    const create = useCreateTelegramLinkCode()
    const [link, setLink] = useState<OpenLink | null>(null)
    const remaining = useCountdown(link?.deadline)

    // Same cache entry as the page: polling here refreshes the list below too. It stops once a
    // chat shows up or the code expires.
    const isCodeOpen = link !== null && remaining > 0
    const { data } = useAdminTelegram({
        pollWhile: isCodeOpen
            ? (overview) => !overview || !findLinkedChat(link, overview.chats)
            : undefined,
    })
    const linkedChat = link && data ? findLinkedChat(link, data.chats) : undefined
    const isPolling = isCodeOpen && !linkedChat

    const generate = () => {
        create.mutate(undefined, {
            onSuccess: (code) => {
                const expiresAt = Date.parse(code.expiresAt)
                setLink({
                    code,
                    deadline: new Date(Date.now() + code.expiresInSeconds * 1000).toISOString(),
                    issuedAt: expiresAt - code.expiresInSeconds * 1000,
                    knownIds: new Set(data?.chats.map((chat) => chat.id)),
                })
            },
        })
    }

    const bot = link?.code.botUsername ?? botUsername
    const command = link ? `/start ${link.code.code}` : ''
    const minutesLeft = Math.ceil(remaining / 60_000)

    return (
        <div className="space-y-4">
            {linkedChat ? null : (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button
                        onClick={generate}
                        isLoading={create.isPending}
                        disabled={!connected || create.isPending}
                        leadingIcon={<Link2 aria-hidden="true" className="size-4" />}
                    >
                        {link ? 'Generar otro código' : 'Vincular un chat'}
                    </Button>
                    {connected ? null : (
                        <p className="text-xs text-ink-soft">
                            Disponible cuando el bot esté conectado.
                        </p>
                    )}
                </div>
            )}

            {create.isError ? <Alert>{getErrorMessage(create.error)}</Alert> : null}

            {link && linkedChat ? (
                <Alert tone="success" onDismiss={() => setLink(null)}>
                    <p className="font-semibold">¡Listo! Chat vinculado 🎉</p>
                    <p className="mt-1 font-normal text-ink-soft">
                        {chatDisplayName(linkedChat)} ya recibe los pagos por verificar.
                    </p>
                </Alert>
            ) : link && remaining <= 0 ? (
                <Alert tone="info" onDismiss={() => setLink(null)}>
                    <p>El código venció. Genera uno nuevo.</p>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="mt-3"
                        onClick={generate}
                        isLoading={create.isPending}
                        disabled={!connected || create.isPending}
                        leadingIcon={<RotateCcw aria-hidden="true" className="size-4" />}
                    >
                        Generar código
                    </Button>
                </Alert>
            ) : link ? (
                <Alert tone="info" onDismiss={() => setLink(null)}>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-bold tracking-wide text-sky-800 uppercase">
                                Tu código
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                                <span className="font-display text-4xl tracking-[0.2em] text-ink tabular-nums sm:text-5xl">
                                    {link.code.code}
                                </span>
                                <CopyButton value={link.code.code} label="Copiar código" />
                            </div>
                        </div>

                        <p className="font-normal text-ink">
                            Abre <strong className="font-semibold">@{bot}</strong> en Telegram y
                            envía{' '}
                            <span className="inline-flex items-center gap-1 align-middle">
                                <code className="rounded-lg bg-white px-2 py-0.5 font-mono text-sm font-semibold break-all text-ink">
                                    {command}
                                </code>
                                <CopyButton
                                    value={command}
                                    label="Copiar comando"
                                    className="size-8"
                                />
                            </span>
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                            <a
                                href={link.code.deepLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(buttonVariants({ size: 'sm' }))}
                            >
                                <ExternalLink aria-hidden="true" className="size-4" />
                                Abrir en Telegram
                                <span className="sr-only"> (se abre en una pestaña nueva)</span>
                            </a>
                            <p className="text-sm font-normal text-sky-900">
                                <span aria-hidden="true">
                                    El código vence en{' '}
                                    <span className="font-semibold tabular-nums">
                                        {formatClock(remaining)}
                                    </span>
                                </span>
                                <span className="sr-only">
                                    El código vence en{' '}
                                    {minutesLeft === 1 ? '1 minuto' : `${minutesLeft} minutos`}
                                </span>
                            </p>
                        </div>

                        {isPolling ? (
                            <p className="text-xs font-normal text-ink-soft">
                                Esperando tu mensaje en Telegram… esta página se actualiza sola.
                            </p>
                        ) : null}
                    </div>
                </Alert>
            ) : null}
        </div>
    )
}
