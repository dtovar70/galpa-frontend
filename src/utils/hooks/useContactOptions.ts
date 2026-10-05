import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import type { SelectOption } from '@/components/ui'
import { queryKeys } from '@/constants/query-keys.constant'
import { CatalogService } from '@/services/CatalogService'

/**
 * The active topics and space types of the contact / advisory form
 * (`GET /catalogs/contact-options`), with their select options and a label lookup. Editing them
 * in Catálogos → Asesoría refreshes this copy.
 */
export function useContactOptions() {
    const query = useQuery({
        queryKey: queryKeys.catalogs.contactOptions(),
        queryFn: ({ signal }) => CatalogService.getContactOptions(signal),
        staleTime: 10 * 60_000,
        refetchOnWindowFocus: true,
    })
    return useMemo(() => {
        const topics = query.data?.topics ?? []
        const spaceTypes = query.data?.spaceTypes ?? []
        const labels = new Map(topics.map((topic) => [topic.code, topic.label]))
        return {
            ...query,
            topics,
            spaceTypes,
            topicOptions: topics.map((topic): SelectOption => ({
                value: topic.code,
                label: topic.label,
            })),
            spaceTypeOptions: spaceTypes.map((type): SelectOption => ({
                value: type.code,
                label: type.label,
            })),
            /** Label of an active topic, or undefined. */
            topicLabel: (code: string): string | undefined => labels.get(code),
        }
    }, [query])
}
