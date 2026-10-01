import { useRef, useState } from 'react'
import { PackageOpen, Truck } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { AddToCartButton } from '@/components/shared/AddToCartButton'
import { AvailabilityBadge } from '@/components/shared/AvailabilityBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { PriceTag } from '@/components/shared/PriceTag'
import { ProductSpecChips } from '@/components/shared/ProductSpecChips'
import { BsApproximation } from '@/components/shared/BsApproximation'
import { Badge, Button, QuantityStepper } from '@/components/ui'
import { CONTAINER } from '@/constants/layout.constant'
import { leadTimeText, PRODUCT_TAG_LABELS, PRODUCT_TAG_TONES } from '@/constants/product.constant'
import { categoryPath, ROUTES } from '@/constants/route.constant'
import { NotFoundError } from '@/services/ProductService'
import { MAX_LINE_QUANTITY, useCartItems } from '@/store/cartStore'
import { cartUnitsOf } from '@/utils/cartAvailability'
import { cn } from '@/utils/cn'
import { useShippingContent } from '@/utils/hooks/useSiteContent'
import { hasVariablePrice, variantPrice } from '@/utils/productPrice'
import { defaultVariant, isOnOrder, isVariantSoldOut, stockOf } from '@/utils/productStock'
import { useCategory } from '@/views/catalog/hooks/useCategories'
import { NotFoundView } from '@/views/others/NotFoundView'
import { ProductAdvisory } from '@/views/product/components/ProductAdvisory'
import { ProductDetailSkeleton } from '@/views/product/components/ProductDetailSkeleton'
import { ProductGallery } from '@/views/product/components/ProductGallery'
import { ProductMeta } from '@/views/product/components/ProductMeta'
import { ProductSpecsTable } from '@/views/product/components/ProductSpecsTable'
import { RelatedProducts } from '@/views/product/components/RelatedProducts'
import { StickyAddToCartBar } from '@/views/product/components/StickyAddToCartBar'
import { VariantPicker } from '@/views/product/components/VariantPicker'
import { useProduct } from '@/views/product/hooks/useProduct'

const pageClass = 'space-y-16 py-10 lg:py-14'
const breadcrumbLinkClass = 'text-ink-soft transition hover:text-brand-700'

export function ProductDetailView() {
    const { slug = '' } = useParams()
    const { data: product, isPending, isError, error, refetch } = useProduct(slug)
    const [chosenVariantId, setChosenVariantId] = useState<string | null>(null)
    const [quantity, setQuantity] = useState(1)
    const shipping = useShippingContent()
    const cartItems = useCartItems()
    const category = useCategory(product?.category)
    const addRowRef = useRef<HTMLDivElement>(null)

    if (error instanceof NotFoundError) return <NotFoundView />

    if (isPending) {
        return (
            <div className={cn(CONTAINER, pageClass)}>
                <h1 className="sr-only">Cargando producto</h1>
                <ProductDetailSkeleton />
            </div>
        )
    }

    if (isError) {
        return (
            <div className={cn(CONTAINER, pageClass)}>
                <h1 className="sr-only">Producto no disponible</h1>
                <EmptyState
                    title="No pudimos cargar este producto"
                    description="Revisa tu conexión e inténtalo de nuevo."
                    icon={<PackageOpen className="size-6" />}
                    action={
                        <Button variant="secondary" onClick={() => void refetch()}>
                            Reintentar
                        </Button>
                    }
                />
            </div>
        )
    }

    // A sold-out version is never selected; with every version sold out the first one is
    // shown and "Agregar al carrito" reads "Agotado".
    const chosenVariant = product.variants.find((variant) => variant.id === chosenVariantId)
    const selectedVariant =
        chosenVariant && !isVariantSoldOut(product, chosenVariant)
            ? chosenVariant
            : defaultVariant(product)
    const unitPrice = variantPrice(product, selectedVariant)
    const isVariablePrice = hasVariablePrice(product)
    const onOrder = isOnOrder(product)
    const stockLeft = stockOf(product, selectedVariant)
    // A product without variants is bought as it is; one with variants needs a version.
    const canAdd = product.variants.length === 0 || selectedVariant !== undefined
    const inCart = canAdd ? cartUnitsOf(cartItems, product.id, selectedVariant?.id) : 0
    const addable = Math.max(0, Math.min(stockLeft, MAX_LINE_QUANTITY) - inCart)
    const maxQuantity = Math.max(1, addable)
    const safeQuantity = Math.min(quantity, maxQuantity)
    const leadTime = onOrder ? leadTimeText(product.leadTimeDays) : null

    return (
        <div className={cn(CONTAINER, pageClass)}>
            <nav aria-label="Ruta de navegación" className="text-sm">
                <ol className="flex flex-wrap items-center gap-2">
                    <li>
                        <Link to={ROUTES.home} className={breadcrumbLinkClass}>
                            Inicio
                        </Link>
                    </li>
                    <li aria-hidden="true" className="text-line-strong">
                        /
                    </li>
                    <li>
                        <Link to={ROUTES.catalog} className={breadcrumbLinkClass}>
                            Catálogo
                        </Link>
                    </li>
                    <li aria-hidden="true" className="text-line-strong">
                        /
                    </li>
                    <li>
                        <Link to={categoryPath(product.category)} className={breadcrumbLinkClass}>
                            {category?.name ?? 'Categoría'}
                        </Link>
                    </li>
                </ol>
            </nav>

            <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
                <ProductGallery product={product} />

                <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-2">
                        <AvailabilityBadge product={product} size="md" />
                        {product.tags.map((tag) => (
                            <Badge key={tag} tone={PRODUCT_TAG_TONES[tag]} size="md">
                                {PRODUCT_TAG_LABELS[tag]}
                            </Badge>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-bold tracking-[0.14em] text-brand-700 uppercase">
                            {product.brand}
                        </p>
                        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                            {product.name}
                        </h1>
                        {product.model || product.sku ? (
                            <p className="flex flex-wrap gap-x-4 gap-y-1 font-tech text-sm text-ink-muted">
                                {product.model ? <span>Modelo: {product.model}</span> : null}
                                {product.sku ? <span>SKU: {product.sku}</span> : null}
                            </p>
                        ) : null}
                    </div>

                    <ProductSpecChips product={product} showVoltage />

                    <div className="space-y-1">
                        <PriceTag
                            price={unitPrice}
                            compareAtPrice={product.compareAtPrice}
                            size="lg"
                        />
                        <BsApproximation usd={unitPrice} className="text-left" />
                        {isVariablePrice && selectedVariant ? (
                            <p className="text-xs text-ink-soft">
                                Precio para «{selectedVariant.label}». Varía según la versión que
                                elijas.
                            </p>
                        ) : null}
                    </div>

                    {product.description ? (
                        <p className="leading-relaxed text-ink-soft">{product.description}</p>
                    ) : null}

                    <VariantPicker
                        product={product}
                        variants={product.variants}
                        selectedVariantId={selectedVariant?.id}
                        onSelect={setChosenVariantId}
                    />

                    {onOrder ? (
                        <div className="rounded-xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-900">
                            <p className="font-semibold">
                                Equipo bajo pedido{leadTime ? ` · ${leadTime}` : ''}
                            </p>
                            <p className="mt-1 text-warning-900/80">
                                Lo traemos especialmente para ti. Te avisaremos cuando llegue a
                                nuestro almacén para coordinar la entrega.
                            </p>
                        </div>
                    ) : null}

                    <div ref={addRowRef} className="flex flex-wrap items-center gap-3">
                        <QuantityStepper
                            value={safeQuantity}
                            max={maxQuantity}
                            disabled={addable === 0}
                            onChange={setQuantity}
                        />

                        {canAdd ? (
                            <AddToCartButton
                                product={product}
                                variantId={selectedVariant?.id ?? null}
                                quantity={safeQuantity}
                                size="lg"
                                label="Agregar al carrito"
                                // Phones: the button takes the rest of the row, or a row of
                                // its own when it does not fit next to the stepper.
                                className="flex-1 basis-48 px-5 sm:flex-none sm:basis-auto sm:px-8"
                            />
                        ) : null}
                    </div>

                    {inCart > 0 && stockLeft > 0 ? (
                        <p role="status" className="-mt-3 text-sm text-ink-soft">
                            Ya tienes {inCart} en el carrito
                            {addable === 0
                                ? ': no puedes agregar más unidades de esta versión.'
                                : ` · puedes agregar ${addable} más.`}
                        </p>
                    ) : null}

                    <p className="flex items-start gap-2 text-sm text-ink-soft">
                        <Truck
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0 text-brand-600"
                        />
                        <span>
                            {shipping.freeShippingText}. {shipping.dispatchCopy}
                        </span>
                    </p>

                    <ProductAdvisory product={product} />
                </div>
            </div>

            {canAdd ? (
                <StickyAddToCartBar
                    anchorRef={addRowRef}
                    price={unitPrice}
                    compareAtPrice={product.compareAtPrice}
                >
                    <AddToCartButton
                        product={product}
                        variantId={selectedVariant?.id ?? null}
                        quantity={safeQuantity}
                        label="Agregar al carrito"
                        className="px-4"
                    />
                </StickyAddToCartBar>
            ) : null}

            <div className="grid gap-12 lg:grid-cols-2 lg:gap-14">
                <ProductSpecsTable product={product} />
                <ProductMeta product={product} />
            </div>

            <RelatedProducts slug={product.slug} />
        </div>
    )
}
