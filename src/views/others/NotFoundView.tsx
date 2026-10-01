import { ProductPlaceholder } from '@/components/shared/ProductPlaceholder'
import { ButtonLink } from '@/components/ui'
import { CONTAINER } from '@/constants/layout.constant'
import { ROUTES } from '@/constants/route.constant'
import { cn } from '@/utils/cn'

export function NotFoundView() {
    return (
        <section className={cn(CONTAINER, 'relative isolate py-20 lg:py-28')}>
            <div
                aria-hidden="true"
                className="absolute top-10 left-1/2 -z-10 size-80 -translate-x-1/2 rounded-full bg-brand-100 opacity-70 blur-3xl"
            />

            <div className="mx-auto flex max-w-xl flex-col items-center gap-7 text-center">
                <div className="relative w-48">
                    <ProductPlaceholder art="split" size="lg" className="shadow-soft" />
                    <span className="absolute -top-3 -right-3 rounded-lg bg-ink px-3 py-1 font-tech text-sm font-bold text-brand-400">
                        404
                    </span>
                </div>

                <h1 className="text-4xl font-extrabold tracking-tight text-balance text-ink sm:text-5xl">
                    Esta página se fue <span className="text-brand-600">con el aire</span>
                </h1>

                <p className="text-lg text-ink-soft">
                    No existe o cambió de lugar. Nuestro catálogo y nuestros asesores siguen aquí
                    para ayudarte.
                </p>

                <div className="flex flex-wrap justify-center gap-3">
                    <ButtonLink to={ROUTES.home} size="lg">
                        Volver al inicio
                    </ButtonLink>
                    <ButtonLink to={ROUTES.catalog} size="lg" variant="secondary">
                        Ver el catálogo
                    </ButtonLink>
                </div>
            </div>
        </section>
    )
}
