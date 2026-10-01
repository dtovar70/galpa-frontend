import { Suspense, type ReactElement } from 'react'
import { Navigate, type RouteObject } from 'react-router'

import { StoreLayout } from '@/components/layouts/StoreLayout'
import { RouteError } from '@/components/route/RouteError'
import { RouteFallback } from '@/components/route/RouteFallback'
import { ADMIN_ROUTES, DEV_ROUTES, ROUTES } from '@/constants/route.constant'
import { LoaderPreviewView } from '@/views/others/LoaderPreviewView'
import {
    AboutView,
    AdminCatalogsView,
    AdminCategoriesView,
    AdminContentView,
    AdminExchangeRateView,
    AdminLoginView,
    AdminPasswordRecoveryView,
    AdminOrderDetailView,
    AdminOrdersView,
    AdminProductCreateView,
    AdminProductEditView,
    AdminProductsView,
    AdminQuoteEditorView,
    AdminQuotesView,
    AdminShell,
    AdminTelegramView,
    AdminUsersView,
    AdminAccountView,
    CartView,
    CatalogView,
    CheckoutView,
    ContactView,
    HomeView,
    MyOrdersView,
    NotFoundView,
    OrderLookupView,
    OrderView,
    ProductDetailView,
} from '@/views'

/** Every lazy view gets the same fallback, so routes stay declarative. */
function withSuspense(view: ReactElement): ReactElement {
    return <Suspense fallback={<RouteFallback />}>{view}</Suspense>
}

/**
 * `import.meta.env.DEV` is replaced by a literal at build time, so this whole branch — and
 * the sandbox view it imports — is dead code the bundler strips from production.
 */
const devRoutes: RouteObject[] = import.meta.env.DEV
    ? [{ path: DEV_ROUTES.loaderPreview, element: <LoaderPreviewView /> }]
    : []

export const routes: RouteObject[] = [
    {
        path: ROUTES.home,
        element: <StoreLayout />,
        errorElement: <RouteError />,
        children: [
            { index: true, element: withSuspense(<HomeView />) },
            { path: ROUTES.catalog, element: withSuspense(<CatalogView />) },
            { path: ROUTES.catalogByCategory, element: withSuspense(<CatalogView />) },
            { path: ROUTES.product, element: withSuspense(<ProductDetailView />) },
            { path: ROUTES.cart, element: withSuspense(<CartView />) },
            { path: ROUTES.checkout, element: withSuspense(<CheckoutView />) },
            { path: ROUTES.order, element: withSuspense(<OrderView />) },
            { path: ROUTES.myOrders, element: withSuspense(<MyOrdersView />) },
            { path: ROUTES.orderLookup, element: withSuspense(<OrderLookupView />) },
            { path: ROUTES.about, element: withSuspense(<AboutView />) },
            { path: ROUTES.contact, element: withSuspense(<ContactView />) },
            { path: ROUTES.legacyContact, element: <Navigate to={ROUTES.contact} replace /> },
            ...devRoutes,
            { path: ROUTES.notFound, element: withSuspense(<NotFoundView />) },
        ],
    },
    /*
     * Back office, outside `StoreLayout` so none of the storefront chrome renders there.
     * Everything below `/admin` except the login page sits behind `RequireAdmin`.
     */
    {
        path: ADMIN_ROUTES.login,
        element: withSuspense(<AdminLoginView />),
        errorElement: <RouteError />,
    },
    {
        path: ADMIN_ROUTES.recover,
        element: withSuspense(<AdminPasswordRecoveryView />),
        errorElement: <RouteError />,
    },
    {
        path: ADMIN_ROUTES.root,
        element: withSuspense(<AdminShell />),
        errorElement: <RouteError />,
        children: [
            { index: true, element: <Navigate to={ADMIN_ROUTES.orders} replace /> },
            { path: ADMIN_ROUTES.orders, element: withSuspense(<AdminOrdersView />) },
            { path: ADMIN_ROUTES.orderDetail, element: withSuspense(<AdminOrderDetailView />) },
            { path: ADMIN_ROUTES.exchangeRate, element: withSuspense(<AdminExchangeRateView />) },
            { path: ADMIN_ROUTES.products, element: withSuspense(<AdminProductsView />) },
            { path: ADMIN_ROUTES.productNew, element: withSuspense(<AdminProductCreateView />) },
            { path: ADMIN_ROUTES.productEdit, element: withSuspense(<AdminProductEditView />) },
            { path: ADMIN_ROUTES.quotes, element: withSuspense(<AdminQuotesView />) },
            { path: ADMIN_ROUTES.quoteNew, element: withSuspense(<AdminQuoteEditorView />) },
            { path: ADMIN_ROUTES.quoteDetail, element: withSuspense(<AdminQuoteEditorView />) },
            { path: ADMIN_ROUTES.categories, element: withSuspense(<AdminCategoriesView />) },
            { path: ADMIN_ROUTES.content, element: withSuspense(<AdminContentView />) },
            { path: ADMIN_ROUTES.catalogs, element: withSuspense(<AdminCatalogsView />) },
            { path: ADMIN_ROUTES.telegram, element: withSuspense(<AdminTelegramView />) },
            { path: ADMIN_ROUTES.users, element: withSuspense(<AdminUsersView />) },
            { path: ADMIN_ROUTES.account, element: withSuspense(<AdminAccountView />) },
            { path: '*', element: <Navigate to={ADMIN_ROUTES.orders} replace /> },
        ],
    },
]
