import type { PublicOrder } from '@/@types/order'
import { OnOrderNote } from '@/components/shared/OnOrderNote'
import { Card } from '@/components/ui'
import { DELIVERY_METHOD_LABELS } from '@/constants/order.constant'
import { isBolivarMethod } from '@/constants/payment.constant'
import { cldSrcSet, cldUrl } from '@/utils/cloudinary'
import { formatBolivares } from '@/utils/formatBolivares'
import { formatCurrency } from '@/utils/formatCurrency'

/** What was ordered, as frozen when the order was placed, and the totals. */
export function OrderItemsCard({ order }: { order: PublicOrder }) {
    const { totals } = order
    const paysInBolivares = isBolivarMethod(order.paymentMethod)

    return (
        <Card padding="lg" className="space-y-5">
            <h2 className="text-xl text-ink">Tu pedido</h2>
            <ul className="space-y-3">
                {order.items.map((item, index) => (
                    <li
                        key={`${item.productSlug ?? item.productName}-${index}`}
                        className="flex items-center gap-3"
                    >
                        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-white">
                            {item.imageUrl ? (
                                <img
                                    src={cldUrl(item.imageUrl, 96)}
                                    srcSet={cldSrcSet(item.imageUrl, [48, 96, 144])}
                                    sizes="48px"
                                    alt=""
                                    className="size-full object-contain"
                                    loading="lazy"
                                    decoding="async"
                                />
                            ) : (
                                <span
                                    aria-hidden="true"
                                    className="text-lg font-bold text-brand-600"
                                >
                                    {(item.brand ?? item.productName).charAt(0)}
                                </span>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm leading-snug font-semibold break-words text-ink">
                                {item.productName}
                            </p>
                            <p className="text-xs text-ink-soft">
                                {[item.brand, item.model, item.variantLabel, `${item.quantity} u.`]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                            {item.productId && item.stockMode === 'ON_ORDER' ? (
                                <OnOrderNote leadTimeDays={null} className="mt-0.5" />
                            ) : null}
                        </div>
                        <span className="shrink-0 font-tech text-sm font-semibold text-ink">
                            {formatCurrency(item.lineTotalUsd)}
                        </span>
                    </li>
                ))}
            </ul>
            <dl className="space-y-2 border-t border-line pt-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                    <dt className="text-ink-soft">Subtotal</dt>
                    <dd className="font-tech font-semibold text-ink">
                        {formatCurrency(totals.subtotalUsd)}
                    </dd>
                </div>
                {totals.discountUsd > 0 ? (
                    <div className="flex items-center justify-between gap-3">
                        <dt className="text-ink-soft">Descuento</dt>
                        <dd className="font-tech font-semibold text-ink">
                            −{formatCurrency(totals.discountUsd)}
                        </dd>
                    </div>
                ) : null}
                <div className="flex items-center justify-between gap-3">
                    <dt className="text-ink-soft">
                        {DELIVERY_METHOD_LABELS[order.customer.deliveryMethod]}
                    </dt>
                    <dd className="font-tech font-semibold text-ink">
                        {totals.shippingUsd === 0 ? 'Gratis' : formatCurrency(totals.shippingUsd)}
                    </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <dt className="text-ink-soft">Pago</dt>
                    <dd className="font-semibold text-ink">{order.paymentMethodLabel}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-t border-line pt-3">
                    <dt className="text-base font-bold text-ink">Total</dt>
                    <dd className="text-right">
                        <span className="block font-tech text-2xl font-bold text-ink">
                            {paysInBolivares
                                ? formatBolivares(totals.totalBs)
                                : formatCurrency(totals.totalUsd)}
                        </span>
                        <span className="font-tech text-sm font-semibold text-ink-soft">
                            {paysInBolivares
                                ? formatCurrency(totals.totalUsd)
                                : formatBolivares(totals.totalBs)}
                        </span>
                    </dd>
                </div>
            </dl>
            {order.wantsInstallation ? (
                <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-900">
                    Pediste asesoría para la instalación: un asesor te contactará para coordinarla.
                </p>
            ) : null}
        </Card>
    )
}
