import { useRef, useState } from 'react'
import { PackageOpen, Truck } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { AddToCartButton } from '@/components/shared/AddToCartButton'
import { EmptyState } from '@/components/shared/EmptyState'
import { PriceTag } from '@/components/shared/PriceTag'
import { Badge, Button, QuantityStepper } from '@/components/ui'
import { designTemplatesFor } from '@/constants/design.constant'
import { CONTAINER } from '@/constants/layout.constant'
import { categoryPath, ROUTES } from '@/constants/route.constant'
import { NotFoundError } from '@/services/ProductService'
import { MAX_LINE_QUANTITY, useCartItems } from '@/store/cartStore'
import { cartUnitsOf } from '@/utils/cartAvailability'
import { cn } from '@/utils/cn'
import { hasVariablePrice, variantPrice } from '@/utils/productPrice'
import { defaultVariant, isVariantSoldOut, stockOf } from '@/utils/productStock'
import { ProductDetailSkeleton } from '@/views/product/components/ProductDetailSkeleton'
import { ProductGallery } from '@/views/product/components/ProductGallery'
import { PersonalizationField } from '@/views/product/components/PersonalizationField'
import { ProductMeta } from '@/views/product/components/ProductMeta'
import { RelatedProducts } from '@/views/product/components/RelatedProducts'
import { StickyAddToCartBar } from '@/views/product/components/StickyAddToCartBar'
import { VariantPicker } from '@/views/product/components/VariantPicker'
import { useCategories, useCategory } from '@/views/catalog/hooks/useCategories'
import { DesignEditor } from '@/views/product/components/design/DesignEditor'
import { DesignSummary } from '@/views/product/components/design/DesignSummary'
import { MugPreviewDialog } from '@/views/product/components/design/MugPreviewDialog'
import { layersSummary } from '@/views/product/components/design/editorLayers'
import { useDesignDraft } from '@/views/product/hooks/useDesignDraft'
import { useProduct } from '@/views/product/hooks/useProduct'
import { NotFoundView } from '@/views/others/NotFoundView'
import { useShippingContent } from '@/utils/hooks/useSiteContent'
import { PRODUCT_TAG_LABELS } from '@/constants/product.constant'

const pageClass = 'space-y-16 py-10 lg:py-14'
const breadcrumbLinkClass = 'text-ink-soft transition hover:text-blush-700'

export function ProductDetailView() {
    const { slug = '' } = useParams()
    const { data: product, isPending, isError, error, refetch } = useProduct(slug)
    const { data: categories } = useCategories()
    const [chosenVariantId, setChosenVariantId] = useState<string | null>(null)
    const [quantity, setQuantity] = useState(1)
    // Tied to the slug, so a related product opened from here starts empty.
    const [draft, setDraft] = useState({ slug, text: '' })
    const personalization = draft.slug === slug ? draft.text : ''
    const shipping = useShippingContent()
    const cartItems = useCartItems()
    const category = useCategory(product?.category)
    const accentColor = category?.colorHex
    const designDraft = useDesignDraft(slug)
    const [editor, setEditor] = useState<'new' | 'edit' | null>(null)
    // Tied to the design's id, so a later design never opens with the dialog already up.
    const [mug3dDesignId, setMug3dDesignId] = useState<string | null>(null)
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
        chosenVariant && !isVariantSoldOut(chosenVariant) ? chosenVariant : defaultVariant(product)
    const unitPrice = variantPrice(product, selectedVariant)
    const isVariablePrice = hasVariablePrice(product)
    const stockLeft = stockOf(product, selectedVariant)
    // Every cart line of this version (other texts included) shares its stock.
    const inCart = selectedVariant ? cartUnitsOf(cartItems, product.id, selectedVariant.id) : 0
    const addable = Math.max(0, stockLeft - inCart)
    const maxQuantity = Math.max(1, Math.min(addable, MAX_LINE_QUANTITY))
    const safeQuantity = Math.min(quantity, maxQuantity)
    const personalizable = product.tags.includes('personalizable')
    // "Diseña con tu imagen": personalizable products of a designable category (its template
    // photos, one per garment color, else its generated illustration).
    const designTemplates = personalizable ? designTemplatesFor(product.category, category) : []
    const canDesign = designTemplates.length > 0
    const savedDesign = canDesign ? designDraft.draft : null
    const draftVariant = savedDesign
        ? product.variants.find((variant) => variant.id === savedDesign.variantId)
        : undefined
    const designMismatch =
        savedDesign !== null && savedDesign.variantId !== (selectedVariant?.id ?? null)
    const mockupColor = selectedVariant?.colorHex ?? product.colorHex
    // The template the saved design was made on (its garment color), for "Ver en 3D".
    const savedTemplate = savedDesign
        ? (designTemplates.find(
              (template) => template.color && template.color.id === savedDesign.colorId,
          ) ?? designTemplates[0])
        : undefined
    const mug3d =
        savedDesign && savedTemplate?.wrap3d && savedDesign.layers.length
            ? {
                  designId: savedDesign.design.id,
                  layers: savedDesign.layers,
                  print: savedTemplate,
                  bodyColor: savedTemplate.color?.hex ?? mockupColor,
              }
            : null

    return (
        <div className={cn(CONTAINER, pageClass)}>
            <nav aria-label="Ruta de navegación" className="text-sm">
                <ol className="flex flex-wrap items-center gap-2">
                    <li>
                        <Link to={ROUTES.home} className={breadcrumbLinkClass}>
                            Inicio
                        </Link>
                    </li>
                    <li aria-hidden="true" className="text-line">
                        /
                    </li>
                    <li>
                        <Link to={ROUTES.catalog} className={breadcrumbLinkClass}>
                            Catálogo
                        </Link>
                    </li>
                    <li aria-hidden="true" className="text-line">
                        /
                    </li>
                    <li>
                        <Link to={categoryPath(product.category)} className={breadcrumbLinkClass}>
                            {(categories ?? []).find(
                                (category) => category.slug === product.category,
                            )?.name ?? 'Categoría'}
                        </Link>
                    </li>
                </ol>
            </nav>

            <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
                <ProductGallery
                    product={product}
                    selectedVariant={selectedVariant}
                    onSelectVariant={setChosenVariantId}
                />

                <div className="space-y-6">
                    <ul className="flex flex-wrap gap-2">
                        {product.tags.map((tag) => (
                            <li key={tag}>
                                <Badge size="sm">{PRODUCT_TAG_LABELS[tag]}</Badge>
                            </li>
                        ))}
                    </ul>

                    <h1 className="font-display text-4xl tracking-tight text-ink sm:text-5xl">
                        {product.name}
                    </h1>

                    <div>
                        <PriceTag
                            price={unitPrice}
                            compareAtPrice={product.compareAtPrice}
                            size="lg"
                        />
                        {isVariablePrice && selectedVariant ? (
                            <p className="mt-1 text-xs text-ink-soft">
                                Precio para «{selectedVariant.label}». Varía según la versión que
                                elijas.
                            </p>
                        ) : null}
                    </div>

                    <p className="text-ink-soft">{product.description}</p>

                    <VariantPicker
                        variants={product.variants}
                        basePrice={product.price}
                        selectedVariantId={selectedVariant?.id}
                        onSelect={setChosenVariantId}
                    />

                    {personalizable ? (
                        <PersonalizationField
                            productName={product.name}
                            printText={product.printText}
                            value={personalization}
                            onChange={(text) => setDraft({ slug, text })}
                            withDesign={savedDesign !== null}
                        />
                    ) : null}

                    {canDesign ? (
                        savedDesign ? (
                            <DesignSummary
                                previewUrl={savedDesign.previewUrl}
                                summary={layersSummary(savedDesign.layers)}
                                dpi={savedDesign.dpi}
                                dpiLevel={savedDesign.design.dpiLevel ?? 'ok'}
                                color={savedDesign.design.color ?? null}
                                otherVariantLabel={
                                    designMismatch
                                        ? (draftVariant?.label ?? 'otra versión')
                                        : undefined
                                }
                                onEdit={() => setEditor('edit')}
                                onRemove={designDraft.clear}
                                onView3d={
                                    mug3d ? () => setMug3dDesignId(mug3d.designId) : undefined
                                }
                            />
                        ) : (
                            <div className="space-y-1.5">
                                <Button variant="outline-sky" onClick={() => setEditor('new')}>
                                    <span aria-hidden="true">🎨</span> Diseñar con mi imagen
                                </Button>
                                <p className="text-sm text-ink-soft">
                                    Sube tus fotos o tu logo, agrega un texto, ubícalos en el
                                    producto y mira cómo queda antes de pedirlo.
                                </p>
                            </div>
                        )
                    ) : null}

                    <div ref={addRowRef} className="flex flex-wrap items-center gap-3">
                        <QuantityStepper
                            value={safeQuantity}
                            max={maxQuantity}
                            disabled={addable === 0}
                            onChange={setQuantity}
                        />

                        {selectedVariant ? (
                            <AddToCartButton
                                product={product}
                                variantId={selectedVariant.id}
                                quantity={safeQuantity}
                                personalization={personalizable ? personalization : undefined}
                                design={savedDesign && !designMismatch ? savedDesign.design : null}
                                onAdded={savedDesign ? designDraft.clear : undefined}
                                disabled={designMismatch}
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
                                ? ': no quedan más unidades de esta versión.'
                                : ` · puedes agregar ${Math.min(addable, MAX_LINE_QUANTITY)} más.`}
                        </p>
                    ) : null}

                    <p className="flex items-center gap-2 text-sm text-ink-soft">
                        <Truck aria-hidden="true" className="size-4 text-blush-500" />
                        {shipping.freeShippingText} · {shipping.productionCopy}
                    </p>
                </div>
            </div>

            {selectedVariant ? (
                <StickyAddToCartBar
                    anchorRef={addRowRef}
                    price={unitPrice}
                    compareAtPrice={product.compareAtPrice}
                >
                    <AddToCartButton
                        product={product}
                        variantId={selectedVariant.id}
                        quantity={safeQuantity}
                        personalization={personalizable ? personalization : undefined}
                        design={savedDesign && !designMismatch ? savedDesign.design : null}
                        onAdded={savedDesign ? designDraft.clear : undefined}
                        disabled={designMismatch}
                        label="Agregar al carrito"
                        className="px-4"
                    />
                </StickyAddToCartBar>
            ) : null}

            {canDesign ? (
                <DesignEditor
                    isOpen={editor !== null}
                    onClose={() => setEditor(null)}
                    product={product}
                    variant={selectedVariant}
                    color={mockupColor}
                    accentColor={accentColor}
                    templates={designTemplates}
                    initial={editor === 'edit' ? savedDesign : null}
                    onSaved={(result) => {
                        designDraft.save(selectedVariant?.id ?? null, result)
                        setEditor(null)
                    }}
                />
            ) : null}

            {mug3d ? (
                <MugPreviewDialog
                    isOpen={mug3dDesignId === mug3d.designId}
                    onClose={() => setMug3dDesignId(null)}
                    layers={mug3d.layers}
                    print={mug3d.print}
                    bodyColor={mug3d.bodyColor}
                />
            ) : null}

            <ProductMeta product={product} />

            <RelatedProducts slug={product.slug} />
        </div>
    )
}
