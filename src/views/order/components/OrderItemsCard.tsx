import type { OrderStatus, PublicOrder } from '@/@types/order'
import { DesignBadge, GarmentColorNote } from '@/components/shared/DesignBadge'
import { ProofViewer } from '@/components/shared/ProofViewer'
import { WhatsAppInlineLink } from '@/components/shared/WhatsAppInlineLink'
import { Card } from '@/components/ui'
import { DELIVERY_METHOD_LABELS } from '@/constants/order.constant'
import { cldSrcSet, cldUrl } from '@/utils/cloudinary'
import { formatBolivares } from '@/utils/formatBolivares'
import { DesignService } from '@/services/DesignService'
import { formatCurrency } from '@/utils/formatCurrency'

/** Past these the pieces are made (or the order is closed): no more personalization notes. */
const FINISHED: readonly OrderStatus[] = ['ENVIADO', 'ENTREGADO', 'CANCELADO', 'EXPIRADO']

/**
 * What was ordered, as frozen when the order was placed, and the totals. Lines with the
 * customer's own image show its preview (opened with the order's private token).
 */
export function OrderItemsCard({ order, token }: { order: PublicOrder; token: string }) {
    const { totals } = order
    return (
        <Card tone="cream" padding="lg" className="space-y-5">
            <h2 className="font-display text-xl text-ink">Tu pedido</h2>
            <ul className="space-y-3">
                {order.items.map((item, index) => (
                    <li key={`${item.productSlug}-${index}`} className="flex items-center gap-3">
                        {item.design ? (
                            <ProofViewer
                                src={`${DesignService.url(item.design.previewPath)}?t=${encodeURIComponent(token)}`}
                                title={`Tu diseño para ${item.productName}`}
                                thumbLabel="Ver diseño"
                            />
                        ) : (
                            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white">
                                {item.imageUrl ? (
                                    <img
                                        src={cldUrl(item.imageUrl, 96)}
                                        srcSet={cldSrcSet(item.imageUrl, [48, 96, 144])}
                                        sizes="48px"
                                        alt=""
                                        className="size-full object-cover"
                                        loading="lazy"
                                        decoding="async"
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
                        )}
                        <div className="min-w-0 flex-1">
                            <p className="font-display text-sm leading-snug break-words text-ink">
                                {item.productName}
                            </p>
                            {item.design ? <DesignBadge className="my-0.5" /> : null}
                            {item.design?.color ? (
                                <GarmentColorNote color={item.design.color} className="mb-0.5" />
                            ) : null}
                            <p className="text-xs text-ink-soft">
                                {[item.variantLabel, `${item.quantity} u.`]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                            {item.personalization ? (
                                <p className="text-xs break-words text-ink">
                                    <span className="text-ink-soft">Personalización:</span> “
                                    {item.personalization}”
                                </p>
                            ) : null}
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-ink">
                            {formatCurrency(item.lineTotalUsd)}
                        </span>
                    </li>
                ))}
            </ul>
            <dl className="space-y-2 border-t border-line pt-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                    <dt className="text-ink-soft">Subtotal</dt>
                    <dd className="font-semibold text-ink">{formatCurrency(totals.subtotalUsd)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <dt className="text-ink-soft">
                        {DELIVERY_METHOD_LABELS[order.customer.deliveryMethod]}
                    </dt>
                    <dd className="font-semibold text-ink">
                        {totals.shippingUsd === 0 ? 'Gratis' : formatCurrency(totals.shippingUsd)}
                    </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-t border-line pt-3">
                    <dt className="font-display text-base text-ink">Total</dt>
                    <dd className="text-right">
                        <span className="block font-display text-2xl text-ink">
                            {formatCurrency(totals.totalUsd)}
                        </span>
                        <span className="text-sm font-semibold text-ink-soft">
                            {formatBolivares(totals.totalBs)}
                        </span>
                    </dd>
                </div>
            </dl>
            {FINISHED.includes(order.status) ? null : (
                <p className="border-t border-line pt-4 text-sm text-ink-soft">
                    ¿Quieres especificar algo más de tu personalización?{' '}
                    <WhatsAppInlineLink
                        message={`Hola, quiero darles más detalles de la personalización de mi pedido ${order.code}.`}
                    >
                        Escríbenos por WhatsApp
                    </WhatsAppInlineLink>{' '}
                    con tu código {order.code}.
                </p>
            )}
        </Card>
    )
}
