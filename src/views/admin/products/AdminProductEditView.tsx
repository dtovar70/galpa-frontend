import { useState } from 'react'
import { ExternalLink, PackageOpen } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router'

import { EmptyState } from '@/components/shared/EmptyState'
import { Alert, Button, ButtonLink, buttonVariants, Card, Skeleton } from '@/components/ui'
import { NOTICE_DISMISS_MS } from '@/constants/ui.constant'
import { ADMIN_ROUTES, productPath } from '@/constants/route.constant'
import { getErrorMessage, isApiError } from '@/services/errors'
import { AdminPageHeader } from '@/views/admin/components/AdminPageHeader'
import { useAdminProduct, useUpdateProduct } from '@/views/admin/hooks/useAdminProducts'
import { BackToProducts } from '@/views/admin/products/components/BackToProducts'
import { ProductForm } from '@/views/admin/products/components/ProductForm'
import { ProductImagesManager } from '@/views/admin/products/components/ProductImagesManager'
import type { ProductInput } from '@/@types/admin'
import {
    readProductsListUrl,
    toProductFormValues,
    type ProductCreatedState,
    type ProductSavedState,
} from '@/views/admin/products/schema/product.schema'

function isCreatedState(state: unknown): state is ProductCreatedState {
    return typeof state === 'object' && state !== null && 'created' in state
}

export function AdminProductEditView() {
    const { id = '' } = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const product = useAdminProduct(id)
    const updateProduct = useUpdateProduct(id)
    const [showCreatedNotice, setShowCreatedNotice] = useState(() => isCreatedState(location.state))
    // Read once: the list URL (with its search and page) the admin came from, if any.
    const [listUrl] = useState(() => readProductsListUrl(location.state))

    /**
     * A successful save goes back to the list (same search and page), which shows the notice.
     * Photos are not part of this form: they save on their own and never navigate.
     */
    const handleSubmit = async (input: ProductInput) => {
        const saved = await updateProduct.mutateAsync(input)
        await navigate(listUrl, {
            replace: true,
            state: {
                savedNotice: `Guardamos «${saved.name}». La tienda ya muestra la versión nueva.`,
            } satisfies ProductSavedState,
        })
        return saved
    }

    if (product.isPending) {
        return (
            <div className="space-y-6">
                <h1 className="sr-only">Cargando producto</h1>
                <Skeleton className="h-10 w-2/3" />
                <Skeleton shape="block" className="h-48" />
                <Skeleton shape="block" className="h-96" />
            </div>
        )
    }

    if (product.isError) {
        const isMissing = isApiError(product.error, 404)
        return (
            <>
                <AdminPageHeader
                    eyebrow={<BackToProducts to={listUrl} />}
                    title="Editar producto"
                />
                <EmptyState
                    title={isMissing ? 'No encontramos este producto' : 'No pudimos cargarlo'}
                    description={
                        isMissing
                            ? 'Puede que alguien lo haya eliminado.'
                            : getErrorMessage(product.error)
                    }
                    icon={<PackageOpen className="size-6" />}
                    action={
                        isMissing ? (
                            <ButtonLink to={ADMIN_ROUTES.products}>Ver productos</ButtonLink>
                        ) : (
                            <Button variant="secondary" onClick={() => void product.refetch()}>
                                Reintentar
                            </Button>
                        )
                    }
                />
            </>
        )
    }

    const current = product.data

    return (
        <>
            <AdminPageHeader
                eyebrow={<BackToProducts to={listUrl} />}
                title={current.name}
                description={current.isActive ? 'Visible en la tienda' : 'Oculto en la tienda'}
                actions={
                    current.isActive ? (
                        <a
                            href={productPath(current.slug)}
                            target="_blank"
                            rel="noreferrer"
                            className={buttonVariants({ variant: 'secondary' })}
                        >
                            <ExternalLink aria-hidden="true" className="size-4" />
                            Ver en la tienda
                        </a>
                    ) : null
                }
            />

            <div className="space-y-6">
                {showCreatedNotice ? (
                    <Alert
                        tone="success"
                        autoDismissMs={NOTICE_DISMISS_MS}
                        onDismiss={() => setShowCreatedNotice(false)}
                    >
                        Producto creado. Ahora puedes agregarle fotos.
                    </Alert>
                ) : null}

                <ProductImagesManager product={current} />

                <Card tone="muted" elevation="none" padding="sm" className="text-sm text-ink-soft">
                    Los cambios de abajo se guardan con el botón “Guardar cambios”. Las fotos se
                    guardan al instante.
                </Card>

                {/* Keyed by id so moving between products starts from fresh form state. */}
                <ProductForm
                    key={current.id}
                    mode="edit"
                    initialValues={toProductFormValues(current)}
                    onSubmit={handleSubmit}
                />
            </div>
        </>
    )
}
