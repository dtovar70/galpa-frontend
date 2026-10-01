import { Card, Skeleton } from '@/components/ui'

export function ProductCardSkeleton() {
    return (
        <Card padding="none" className="flex h-full flex-col overflow-hidden">
            <Skeleton shape="block" className="aspect-square h-auto w-full rounded-none" />
            <div className="flex flex-1 flex-col gap-3 p-3 sm:p-5">
                <Skeleton className="w-4/5" />
                <Skeleton className="w-1/3" />
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton shape="block" className="h-9 w-24 rounded-full" />
                </div>
            </div>
        </Card>
    )
}
