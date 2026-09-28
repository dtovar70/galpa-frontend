import { lazy } from 'react'

/**
 * Lazy barrel consumed by `routes.config`: every view ships in its own chunk so the
 * first paint only loads the layout plus the matched route.
 */
export const HomeView = lazy(() =>
    import('@/views/home/HomeView').then((module) => ({ default: module.HomeView })),
)

export const CatalogView = lazy(() =>
    import('@/views/catalog/CatalogView').then((module) => ({ default: module.CatalogView })),
)

export const ProductDetailView = lazy(() =>
    import('@/views/product/ProductDetailView').then((module) => ({
        default: module.ProductDetailView,
    })),
)

export const CartView = lazy(() =>
    import('@/views/cart/CartView').then((module) => ({ default: module.CartView })),
)

export const CheckoutView = lazy(() =>
    import('@/views/checkout/CheckoutView').then((module) => ({ default: module.CheckoutView })),
)

export const OrderView = lazy(() =>
    import('@/views/order/OrderView').then((module) => ({ default: module.OrderView })),
)

export const MyOrdersView = lazy(() =>
    import('@/views/order/MyOrdersView').then((module) => ({ default: module.MyOrdersView })),
)

export const AboutView = lazy(() =>
    import('@/views/about/AboutView').then((module) => ({ default: module.AboutView })),
)

export const ContactView = lazy(() =>
    import('@/views/contact/ContactView').then((module) => ({ default: module.ContactView })),
)

export const NotFoundView = lazy(() =>
    import('@/views/others/NotFoundView').then((module) => ({ default: module.NotFoundView })),
)

/*
 * Back office: its own chunks, so storefront visitors never download the admin code.
 */
export const AdminShell = lazy(() =>
    import('@/views/admin/AdminShell').then((module) => ({ default: module.AdminShell })),
)

export const AdminPasswordRecoveryView = lazy(() =>
    import('@/views/admin/auth/AdminPasswordRecoveryView').then((module) => ({
        default: module.AdminPasswordRecoveryView,
    })),
)

export const AdminLoginView = lazy(() =>
    import('@/views/admin/auth/AdminLoginView').then((module) => ({
        default: module.AdminLoginView,
    })),
)

export const AdminProductsView = lazy(() =>
    import('@/views/admin/products/AdminProductsView').then((module) => ({
        default: module.AdminProductsView,
    })),
)

export const AdminProductCreateView = lazy(() =>
    import('@/views/admin/products/AdminProductCreateView').then((module) => ({
        default: module.AdminProductCreateView,
    })),
)

export const AdminProductEditView = lazy(() =>
    import('@/views/admin/products/AdminProductEditView').then((module) => ({
        default: module.AdminProductEditView,
    })),
)

export const AdminCategoriesView = lazy(() =>
    import('@/views/admin/categories/AdminCategoriesView').then((module) => ({
        default: module.AdminCategoriesView,
    })),
)

export const AdminContentView = lazy(() =>
    import('@/views/admin/content/AdminContentView').then((module) => ({
        default: module.AdminContentView,
    })),
)

export const AdminCatalogsView = lazy(() =>
    import('@/views/admin/catalogs/AdminCatalogsView').then((module) => ({
        default: module.AdminCatalogsView,
    })),
)

export const AdminTelegramView = lazy(() =>
    import('@/views/admin/telegram/AdminTelegramView').then((module) => ({
        default: module.AdminTelegramView,
    })),
)

export const AdminUsersView = lazy(() =>
    import('@/views/admin/users/AdminUsersView').then((module) => ({
        default: module.AdminUsersView,
    })),
)

export const AdminAccountView = lazy(() =>
    import('@/views/admin/account/AdminAccountView').then((module) => ({
        default: module.AdminAccountView,
    })),
)

export const AdminOrdersView = lazy(() =>
    import('@/views/admin/orders/AdminOrdersView').then((module) => ({
        default: module.AdminOrdersView,
    })),
)

export const AdminOrderDetailView = lazy(() =>
    import('@/views/admin/orders/AdminOrderDetailView').then((module) => ({
        default: module.AdminOrderDetailView,
    })),
)

export const AdminExchangeRateView = lazy(() =>
    import('@/views/admin/exchange-rate/AdminExchangeRateView').then((module) => ({
        default: module.AdminExchangeRateView,
    })),
)
