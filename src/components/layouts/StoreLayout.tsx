import { Outlet } from 'react-router'

import { CartDrawer } from '@/components/layouts/CartDrawer'
import { Footer } from '@/components/layouts/Footer'
import { Header } from '@/components/layouts/Header'
import { MobileMenu } from '@/components/layouts/MobileMenu'
import { FloatingWhatsApp } from '@/components/shared/FloatingWhatsApp'
import { ScrollToTop } from '@/components/route/ScrollToTop'

export function StoreLayout() {
    return (
        <div className="flex min-h-screen flex-col overflow-x-clip">
            <ScrollToTop />
            <Header />

            <main className="flex-1">
                <Outlet />
            </main>

            <Footer />

            <FloatingWhatsApp />
            <CartDrawer />
            <MobileMenu />
        </div>
    )
}
