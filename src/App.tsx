import { MotionConfig } from 'motion/react'
import { createBrowserRouter, RouterProvider } from 'react-router'

import { SiteContentGate } from '@/components/route/SiteContentGate'
import { routes } from '@/configs/routes.config'

const router = createBrowserRouter(routes)

export function App() {
    return (
        // Every `motion` animation follows the visitor's "reduce motion" setting.
        <MotionConfig reducedMotion="user">
            <SiteContentGate>
                <RouterProvider router={router} />
            </SiteContentGate>
        </MotionConfig>
    )
}
