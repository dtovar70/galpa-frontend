import type { PaymentContent } from '@/@types/content'
import type { PaymentMethod, PublicOrder } from '@/@types/order'
import { CopyButton } from '@/components/shared/CopyButton'
import {
    isBolivarMethod,
    PAYMENT_METHOD_ICONS,
    paymentMethodLabel,
} from '@/constants/payment.constant'
import { formatBolivares, formatRate, formatVeNumber } from '@/utils/formatBolivares'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDay } from '@/utils/formatDate'

interface Row {
    label: string
    display: string
    /** What the copy button puts on the clipboard (bank apps want plain digits). */
    copy: string
}

const ACCOUNT_TYPE_LABELS = { CORRIENTE: 'Corriente', AHORRO: 'Ahorro' } as const

function digits(value: string): string {
    return value.replace(/\D/g, '')
}

function idCopy(value: string): string {
    return value.replace(/[^\dA-Z]/gi, '')
}

/** The store's account rows for `method` (empty values are left out). */
function accountRows(method: PaymentMethod, payment: PaymentContent): Row[] {
    switch (method) {
        case 'PAGO_MOVIL': {
            const m = payment.pagoMovil
            return [
                { label: 'Banco', display: `${m.bankCode} - ${m.bankName}`, copy: m.bankCode },
                { label: 'Teléfono', display: m.phone, copy: digits(m.phone) },
                { label: 'Cédula / RIF', display: m.idNumber, copy: idCopy(m.idNumber) },
                { label: 'Titular', display: m.holderName, copy: m.holderName },
            ]
        }
        case 'TRANSFERENCIA': {
            const m = payment.transfer
            return [
                { label: 'Banco', display: `${m.bankCode} - ${m.bankName}`, copy: m.bankCode },
                {
                    label: 'Número de cuenta',
                    display: m.accountNumber,
                    copy: digits(m.accountNumber),
                },
                {
                    label: 'Tipo de cuenta',
                    display: ACCOUNT_TYPE_LABELS[m.accountType],
                    copy: ACCOUNT_TYPE_LABELS[m.accountType],
                },
                { label: 'Cédula / RIF', display: m.idNumber, copy: idCopy(m.idNumber) },
                { label: 'Titular', display: m.holderName, copy: m.holderName },
            ]
        }
        case 'ZELLE': {
            const m = payment.zelle
            return [
                { label: 'Correo Zelle', display: m.email, copy: m.email },
                { label: 'Titular', display: m.holderName, copy: m.holderName },
            ]
        }
        case 'BINANCE': {
            const m = payment.binance
            const rows: Row[] = [{ label: 'Binance Pay ID', display: m.payId, copy: m.payId }]
            if (m.email) rows.push({ label: 'Correo', display: m.email, copy: m.email })
            rows.push({ label: 'Titular', display: m.holderName, copy: m.holderName })
            return rows
        }
    }
}

export interface PaymentInstructionsCardProps {
    order: PublicOrder
    payment: PaymentContent
}

/** Where and how much to pay with the order's method, each value one tap from the clipboard. */
export function PaymentInstructionsCard({ order, payment }: PaymentInstructionsCardProps) {
    const { totals, paymentMethod: method } = order
    const Icon = PAYMENT_METHOD_ICONS[method]
    const inBolivares = isBolivarMethod(method)
    const amount: Row = inBolivares
        ? {
              label: 'Monto exacto',
              display: formatBolivares(totals.totalBs),
              copy: formatVeNumber(totals.totalBs),
          }
        : {
              label: 'Monto exacto',
              display: formatCurrency(totals.totalUsd),
              copy: totals.totalUsd.toFixed(2),
          }
    const rows = accountRows(method, payment).filter((row) => row.display.trim() !== '')
    const concept: Row = { label: 'Concepto', display: `Pedido ${order.code}`, copy: order.code }
    const everything = [
        paymentMethodLabel(method),
        ...[...rows, amount, concept].map((row) => `${row.label}: ${row.display}`),
    ].join('\n')

    return (
        <div className="@container space-y-4 rounded-2xl border border-line bg-white p-5 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-ink text-brand-400">
                        <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <p className="text-lg font-bold text-ink">{paymentMethodLabel(method)}</p>
                </div>
                <CopyButton value={everything} label="Copiar todos los datos">
                    Copiar todo
                </CopyButton>
            </div>

            <dl className="grid grid-cols-1 gap-2.5 @md:grid-cols-2">
                {[...rows, concept].map((row) => (
                    <div
                        key={row.label}
                        className="flex min-w-0 items-center gap-2 rounded-xl bg-page px-4 py-2.5"
                    >
                        <div className="min-w-0 flex-1">
                            <dt className="text-xs text-ink-soft">{row.label}</dt>
                            <dd className="font-semibold break-words text-ink">{row.display}</dd>
                        </div>
                        <CopyButton value={row.copy} label={`Copiar ${row.label.toLowerCase()}`} />
                    </div>
                ))}
                <div className="flex min-w-0 items-center gap-2 rounded-xl border-2 border-brand-500 bg-brand-50 px-4 py-3 @md:col-span-2">
                    <div className="min-w-0 flex-1">
                        <dt className="text-xs font-semibold text-brand-800">{amount.label}</dt>
                        <dd className="font-tech text-2xl font-bold break-words text-ink">
                            {amount.display}
                        </dd>
                    </div>
                    <CopyButton value={amount.copy} label="Copiar el monto exacto" />
                </div>
            </dl>

            <p className="text-xs text-ink-soft">
                {inBolivares ? (
                    <>
                        Total {formatCurrency(totals.totalUsd)} · Tasa BCV del{' '}
                        {formatDay(totals.exchangeRateDate)}: {formatRate(totals.exchangeRate)}{' '}
                        Bs/$. El monto en bolívares se mantiene durante todo el plazo de pago.
                    </>
                ) : (
                    'Envía el monto exacto en dólares. Las comisiones de tu plataforma corren por tu cuenta.'
                )}
            </p>
            {payment.instructions ? (
                <p className="text-sm break-words whitespace-pre-line text-ink-soft">
                    {payment.instructions}
                </p>
            ) : null}
        </div>
    )
}
