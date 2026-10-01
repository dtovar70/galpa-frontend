import { useState, type ClipboardEvent, type FormEvent } from 'react'
import { Landmark, RefreshCw } from 'lucide-react'

import type { RateSyncResult } from '@/@types/exchange-rate'
import { EmptyState } from '@/components/shared/EmptyState'
import { Alert, Badge, Button, Card, Input, Skeleton } from '@/components/ui'
import { DatePicker } from '@/components/ui/DatePicker'
import { NOTICE_DISMISS_MS } from '@/constants/ui.constant'
import { getErrorMessage, isApiError } from '@/services/errors'
import { cn } from '@/utils/cn'
import { formatRate } from '@/utils/formatBolivares'
import { formatDateTime, formatDay, todayInCaracas } from '@/utils/formatDate'
import { AdminPageHeader } from '@/views/admin/components/AdminPageHeader'
import {
    useAdminExchangeRate,
    useRefreshRate,
    useSetManualRate,
} from '@/views/admin/hooks/useAdminExchangeRate'
import { useSession } from '@/views/admin/hooks/useSession'

/**
 * The BCV publishes each rate with the next business day as its "fecha valor" (on a Friday,
 * Monday's), so a manual rate may carry a date a few days ahead of today.
 */
const VALUE_DATE_LOOKAHEAD_DAYS = 7

function latestValueDate(): string {
    const date = new Date(`${todayInCaracas()}T00:00:00Z`)
    date.setUTCDate(date.getUTCDate() + VALUE_DATE_LOOKAHEAD_DAYS)
    return date.toISOString().slice(0, 10)
}

/** Ends a sentence without doubling the period of "12:00 a. m.". */
function withPeriod(text: string): string {
    return text.endsWith('.') ? text : `${text}.`
}

const headerCellClass =
    'px-4 py-3 text-left text-xs font-bold tracking-wide text-ink-soft uppercase'
const cellClass = 'px-4 py-3 align-middle'

function syncMessage(sync: RateSyncResult): { tone: 'success' | 'error' | 'info'; text: string } {
    const winner = sync.attempts.find((attempt) => attempt.ok)
    if (sync.outcome === 'failed') {
        return {
            tone: 'error',
            text: `Ninguna fuente respondió: ${sync.attempts.map((attempt) => `${attempt.source} (${attempt.error ?? 'error'})`).join(', ')}.`,
        }
    }
    const rate = winner?.rate
        ? `${formatRate(winner.rate)} Bs/$ del ${formatDay(winner.effectiveDate ?? '')}`
        : ''
    return sync.outcome === 'stored'
        ? { tone: 'success', text: `Nueva tasa guardada: ${rate}.` }
        : { tone: 'info', text: `La tasa no cambió (${rate}).` }
}

/*
 * The manual rate mirrors the API's `ManualRateDto`: more than 0, at most 100.000.000 (the
 * providers' MAX_PLAUSIBLE_RATE) and 4 decimals. The field takes digits and one decimal comma.
 */
const RATE_MAX = 100_000_000
const RATE_MAX_INTEGER_DIGITS = 9
const RATE_MAX_DECIMALS = 4
/** "100000000,0000" */
const RATE_MAX_LENGTH = RATE_MAX_INTEGER_DIGITS + 1 + RATE_MAX_DECIMALS

/** Rates the way the field takes them: no thousands separator, comma, 4 decimals. */
const rateFieldFormatter = new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: RATE_MAX_DECIMALS,
    maximumFractionDigits: RATE_MAX_DECIMALS,
    useGrouping: false,
})

/**
 * Keeps what a rate can hold while typing: digits and one decimal comma (a dot becomes the
 * comma), up to 9 integer digits and 4 decimals. Anything else is dropped. "85x7.0" -> "857,0"
 */
function sanitizeRateInput(value: string): string {
    const [integer = '', ...rest] = value
        .replace(/\./g, ',')
        .replace(/[^\d,]/g, '')
        .split(',')
    const head = integer.slice(0, RATE_MAX_INTEGER_DIGITS)
    return rest.length ? `${head},${rest.join('').slice(0, RATE_MAX_DECIMALS)}` : head
}

/**
 * A pasted rate may come formatted: "857.0058", "Bs 1.234,56", "1,234.56". With both marks the
 * last one is the decimal; a mark repeated alone is a thousands separator.
 */
function normalizePastedRate(text: string): string {
    const kept = text.replace(/[^\d.,]/g, '')
    const lastMark = Math.max(kept.lastIndexOf('.'), kept.lastIndexOf(','))
    if (lastMark === -1) return kept
    const mark = kept.charAt(lastMark)
    const hasBoth = kept.includes('.') && kept.includes(',')
    const repeated = kept.split(mark).length > 2
    if (!hasBoth && repeated) return kept.replace(/[.,]/g, '')
    return `${kept.slice(0, lastMark).replace(/[.,]/g, '')},${kept.slice(lastMark + 1)}`
}

/** "857,0058" -> 857.0058 (the field only ever holds digits and one comma). */
function parseRate(value: string): number {
    return /^\d+(?:,\d{1,4})?$/.test(value) ? Number(value.replace(',', '.')) : Number.NaN
}

export function AdminExchangeRateView() {
    const { data, isPending, isError, error, refetch } = useAdminExchangeRate()
    const { data: session } = useSession()
    const isAdmin = session?.role === 'ADMIN'
    const refresh = useRefreshRate()
    const setManual = useSetManualRate()
    const [rateInput, setRateInput] = useState('')
    const [dateInput, setDateInput] = useState(todayInCaracas())
    const [rateError, setRateError] = useState<string | undefined>()
    const [notice, setNotice] = useState<{
        tone: 'success' | 'error' | 'info'
        text: string
    } | null>(null)

    const current = data?.current
    const currentRateText = current ? rateFieldFormatter.format(current.rate) : undefined
    const rateExample = currentRateText ?? '36,5000'

    /* Pasting replaces the selection with the normalized rate, e.g. "857.0058" -> "857,0058". */
    const pasteRate = (event: ClipboardEvent<HTMLInputElement>) => {
        event.preventDefault()
        const input = event.currentTarget
        const start = input.selectionStart ?? input.value.length
        const end = input.selectionEnd ?? start
        const pasted = normalizePastedRate(event.clipboardData.getData('text'))
        setRateInput(
            sanitizeRateInput(input.value.slice(0, start) + pasted + input.value.slice(end)),
        )
    }

    const submitManual = (event: FormEvent) => {
        event.preventDefault()
        const rate = parseRate(rateInput)
        if (!(rate > 0)) {
            setRateError(
                `Escribe un precio mayor que 0, con hasta 4 decimales (por ejemplo ${rateExample}).`,
            )
            return
        }
        if (rate > RATE_MAX) {
            setRateError('El precio no puede pasar de 100.000.000 Bs.')
            return
        }
        setRateError(undefined)
        setManual.mutate(
            { rate, effectiveDate: dateInput || undefined },
            {
                onSuccess: () => {
                    setRateInput('')
                    setNotice({
                        tone: 'success',
                        text: 'Tasa manual guardada. Ya se usa en la tienda.',
                    })
                },
                onError: (mutationError) => {
                    const detail = isApiError(mutationError)
                        ? mutationError.details[0]?.errors[0]
                        : undefined
                    setRateError(detail ?? getErrorMessage(mutationError))
                },
            },
        )
    }

    const runRefresh = () => {
        refresh.mutate(undefined, {
            onSuccess: (result) => setNotice(syncMessage(result.sync)),
            onError: (refreshError) =>
                setNotice({ tone: 'error', text: getErrorMessage(refreshError) }),
        })
    }

    return (
        <>
            <AdminPageHeader
                title="Tasa BCV"
                description="La tienda convierte los pedidos a bolívares con la tasa oficial del BCV."
                actions={
                    <Button
                        variant="secondary"
                        onClick={runRefresh}
                        isLoading={refresh.isPending}
                        leadingIcon={<RefreshCw aria-hidden="true" className="size-4" />}
                    >
                        Actualizar ahora
                    </Button>
                }
            />

            {notice ? (
                <Alert
                    tone={notice.tone}
                    className="mb-6"
                    onDismiss={() => setNotice(null)}
                    autoDismissMs={notice.tone === 'error' ? undefined : NOTICE_DISMISS_MS}
                >
                    {notice.text}
                </Alert>
            ) : null}

            {isPending ? (
                <div className="space-y-6">
                    <Skeleton shape="block" className="h-40" />
                    <Skeleton shape="block" className="h-64" />
                </div>
            ) : isError ? (
                <EmptyState
                    title="No pudimos cargar la tasa"
                    description={getErrorMessage(error)}
                    icon={<Landmark className="size-6" />}
                    action={
                        <Button variant="secondary" onClick={() => void refetch()}>
                            Reintentar
                        </Button>
                    }
                />
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <Card padding="md" className="space-y-3">
                            <h2 className="text-xl font-bold text-ink">Tasa vigente</h2>
                            {current ? (
                                <>
                                    <p className="text-4xl font-bold text-ink">
                                        {formatRate(current.rate)}{' '}
                                        <span className="text-lg text-ink-soft">Bs/$</span>
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
                                        <Badge
                                            tone={current.isManual ? 'warning' : 'info'}
                                            size="sm"
                                        >
                                            {current.sourceLabel}
                                        </Badge>
                                        <span>Fecha valor {formatDay(current.effectiveDate)}</span>
                                    </div>
                                    <p className="text-sm text-ink-soft">
                                        Exacta:{' '}
                                        {current.rate.toLocaleString('es-VE', {
                                            maximumFractionDigits: 4,
                                        })}{' '}
                                        · obtenida el {formatDateTime(current.fetchedAt)}
                                        {current.createdBy ? ` por ${current.createdBy.name}` : ''}
                                    </p>
                                    {current.isStale ? (
                                        <Alert>
                                            Esta tasa venció el{' '}
                                            {withPeriod(formatDateTime(current.usableUntil))} La
                                            tienda no acepta pedidos hasta que haya una más
                                            reciente.
                                        </Alert>
                                    ) : (
                                        <p className="text-xs text-ink-soft">
                                            Se reemplaza sola cuando el BCV publique una nueva. Si
                                            no llega ninguna, los pedidos se pausan el{' '}
                                            {withPeriod(formatDateTime(current.usableUntil))}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <Alert>
                                    Todavía no hay ninguna tasa guardada: la tienda no puede recibir
                                    pedidos. Usa “Actualizar ahora” o fija una tasa manual.
                                </Alert>
                            )}
                            <p className="text-xs text-ink-soft">
                                Se consulta sola cada{' '}
                                {Math.round(data.syncIntervalMinutes / 60) || 1} h (primero
                                bcv.org.ve y, si no responde, DolarApi).
                                {data.lastSync
                                    ? ` Última consulta: ${withPeriod(formatDateTime(data.lastSync.at))}`
                                    : ''}
                            </p>
                        </Card>

                        <Card padding="md" className="space-y-3">
                            <h2 className="text-xl font-bold text-ink">Tasa manual</h2>
                            <p className="text-sm text-ink-soft">
                                Úsala si el BCV no responde. Se aplica de inmediato y se mantiene
                                hasta que el BCV publique una tasa distinta, que la reemplaza sola.
                            </p>
                            {isAdmin ? (
                                <form
                                    onSubmit={submitManual}
                                    noValidate
                                    className="@container space-y-4"
                                >
                                    {/* Side by side only on a wide card, so "25 sep 2026" never
                                        truncates; tops aligned, so hints of different lengths
                                        never push one field down. */}
                                    <div className="grid grid-cols-1 items-start gap-x-4 gap-y-3 @lg:grid-cols-2">
                                        <Input
                                            label="Precio del dólar en bolívares"
                                            hint="Cuántos Bs cuesta 1$ según el BCV."
                                            inputMode="decimal"
                                            autoComplete="off"
                                            maxLength={RATE_MAX_LENGTH}
                                            placeholder={
                                                currentRateText
                                                    ? `Actual: ${currentRateText}`
                                                    : '0,0000'
                                            }
                                            value={rateInput}
                                            error={rateError}
                                            onChange={(event) =>
                                                setRateInput(sanitizeRateInput(event.target.value))
                                            }
                                            onPaste={pasteRate}
                                        />
                                        <DatePicker
                                            label="Fecha valor"
                                            max={latestValueDate()}
                                            hint="El BCV publica la tasa con la fecha del próximo día hábil."
                                            value={dateInput}
                                            onChange={setDateInput}
                                        />
                                    </div>
                                    <Button type="submit" isLoading={setManual.isPending}>
                                        Guardar tasa manual
                                    </Button>
                                </form>
                            ) : (
                                <p className="text-sm font-semibold text-ink-soft">
                                    Solo un administrador puede fijar una tasa manual.
                                </p>
                            )}
                        </Card>
                    </div>

                    <Card padding="none" className="overflow-hidden">
                        <h2 className="px-4 pt-4 pb-2 text-xl font-bold text-ink">Últimas tasas</h2>
                        {data.history.length === 0 ? (
                            <p className="px-4 pb-4 text-sm text-ink-soft">
                                Sin registros todavía.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[32rem] text-sm">
                                    <thead className="border-y border-line bg-page">
                                        <tr>
                                            <th scope="col" className={headerCellClass}>
                                                Fecha valor
                                            </th>
                                            <th
                                                scope="col"
                                                className={`${headerCellClass} text-right`}
                                            >
                                                Tasa
                                            </th>
                                            <th scope="col" className={headerCellClass}>
                                                Fuente
                                            </th>
                                            <th scope="col" className={headerCellClass}>
                                                Obtenida
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-line">
                                        {data.history.map((entry, index) => (
                                            <tr
                                                key={entry.id}
                                                className={cn(index === 0 && 'bg-brand-100/20')}
                                            >
                                                <td className={cellClass}>
                                                    {formatDay(entry.effectiveDate)}
                                                </td>
                                                <td
                                                    className={`${cellClass} text-right font-semibold tabular-nums`}
                                                >
                                                    {entry.rate.toLocaleString('es-VE', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 4,
                                                    })}
                                                </td>
                                                <td className={cellClass}>
                                                    {entry.sourceLabel}
                                                    {entry.createdBy
                                                        ? ` · ${entry.createdBy.name}`
                                                        : ''}
                                                </td>
                                                <td className={`${cellClass} text-ink-soft`}>
                                                    {formatDateTime(entry.fetchedAt)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </>
    )
}
