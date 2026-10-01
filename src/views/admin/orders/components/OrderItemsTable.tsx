import { Link } from 'react-router'

import type { AdminOrder } from '@/@types/order'
import { CopyButton } from '@/components/shared/CopyButton'
import { Card } from '@/components/ui'
import { adminProductPath } from '@/constants/route.constant'
import { formatBolivares, formatRate } from '@/utils/formatBolivares'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDay } from '@/utils/formatDate'
import { OrderItemDesign } from '@/views/admin/orders/components/OrderItemDesign'

/** The ordered lines as frozen at checkout, the totals and the BCV rate used. */
export function OrderItemsTable({ order }: { order: AdminOrder }) {
    const { totals } = order
    return (
        <Card padding="md" className="space-y-4">
            <h2 className="font-display text-xl text-ink">Productos</h2>
            <ul className="divide-y divide-line">
                {order.items.map((item, index) => (
                    <li key={item.id} className="flex items-center gap-3 py-3">
                        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-blush-50">
                            {item.imageUrl ? (
                                <img
                                    src={item.imageUrl}
                                    alt=""
                                    className="size-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <span
                                    aria-hidden="true"
                                    className="font-display text-lg text-blush-400"
                                >
                                    {item.productName.charAt(0)}
                                </span>
                            )}
                        </div>
                        <div className="min-w-0 flex-1 text-sm">
                            {item.productId ? (
                                <Link
                                    to={adminProductPath(item.productId)}
                                    className="font-semibold break-words text-ink hover:text-blush-700"
                                >
                                    {item.productName}
                                </Link>
                            ) : (
                                <p className="font-semibold break-words text-ink">
                                    {item.productName}
                                </p>
                            )}
                            <p className="text-xs text-ink-soft">
                                {[
                                    item.variantLabel,
                                    `${item.quantity} × ${formatCurrency(item.unitPriceUsd)}`,
                                ]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                            {item.personalization ? (
                                <div className="mt-1.5 flex items-start gap-1 rounded-xl border border-butter-400/70 bg-butter-200/40 py-1.5 pr-1 pl-3">
                                    <p className="min-w-0 flex-1 py-1 text-sm break-words text-ink">
                                        <span className="block text-[11px] font-bold tracking-wide text-ink-soft uppercase">
                                            Personalización
                                        </span>
                                        {item.personalization}
                                    </p>
                                    <CopyButton
                                        value={item.personalization}
                                        label={`Copiar personalización de ${item.productName}`}
                                        className="size-8"
                                    />
                                </div>
                            ) : null}
                            {item.design ? (
                                <OrderItemDesign
                                    design={item.design}
                                    productName={item.productName}
                                    line={index + 1}
                                />
                            ) : null}
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-ink">
                            {formatCurrency(item.lineTotalUsd)}
                        </span>
                    </li>
                ))}
            </ul>
            <dl className="space-y-2 border-t border-line pt-4 text-sm">
                <div className="flex justify-between gap-3">
                    <dt className="text-ink-soft">Subtotal</dt>
                    <dd className="font-semibold text-ink">{formatCurrency(totals.subtotalUsd)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                    <dt className="text-ink-soft">Envío</dt>
                    <dd className="font-semibold text-ink">
                        {totals.shippingUsd === 0 ? 'Gratis' : formatCurrency(totals.shippingUsd)}
                    </dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-line pt-2">
                    <dt className="font-display text-base text-ink">Total</dt>
                    <dd className="text-right">
                        <span className="block font-display text-xl text-ink">
                            {formatCurrency(totals.totalUsd)}
                        </span>
                        <span className="font-semibold text-ink">
                            {formatBolivares(totals.totalBs)}
                        </span>
                    </dd>
                </div>
                <p className="text-xs text-ink-soft">
                    Tasa {totals.exchangeRateSourceLabel} del {formatDay(totals.exchangeRateDate)}:{' '}
                    {formatRate(totals.exchangeRate)} Bs/$ (
                    {totals.exchangeRate.toLocaleString('es-VE', { maximumFractionDigits: 4 })})
                </p>
            </dl>
        </Card>
    )
}
