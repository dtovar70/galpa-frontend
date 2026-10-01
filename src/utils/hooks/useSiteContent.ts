import { useCallback, useMemo } from 'react'
import { queryOptions, useQuery } from '@tanstack/react-query'

import type { SiteContent } from '@/@types/content'
import { DEFAULT_SITE_CONTENT } from '@/configs/content.defaults'
import { queryKeys } from '@/constants/query-keys.constant'
import { ContentService } from '@/services/ContentService'
import {
    fillPlaceholders,
    placeholderValues,
    resolveSiteContent,
    type PlaceholderValues,
} from '@/utils/content'

/** How long the first render waits for the content before falling back to the defaults. */
export const SITE_CONTENT_TIMEOUT_MS = 1500

export const siteContentQueryOptions = queryOptions({
    queryKey: queryKeys.content,
    queryFn: ({ signal }) => ContentService.getContent(signal),
    // Texts change rarely; the admin invalidates this key after every save.
    staleTime: 10 * 60_000,
    gcTime: Infinity,
    refetchOnWindowFocus: true,
    select: resolveSiteContent,
})

export function useSiteContentQuery() {
    return useQuery(siteContentQueryOptions)
}

/**
 * The site's editable texts and business data. Never undefined: until the API answers (and
 * whenever it cannot be reached) it is the built-in defaults, identical to the API's.
 */
export function useSiteContent(): SiteContent {
    return useSiteContentQuery().data ?? DEFAULT_SITE_CONTENT
}

/** Fills `{envioGratis}`, `{marca}`… with the current content. */
export function useFillPlaceholders(): (text: string, extra?: PlaceholderValues) => string {
    const content = useSiteContent()
    const values = useMemo(() => placeholderValues(content), [content])
    return useCallback(
        (text: string, extra?: PlaceholderValues) =>
            fillPlaceholders(text, extra ? { ...values, ...extra } : values),
        [values],
    )
}

/** Shipping settings plus the rendered free-shipping line ("Envío gratis desde $500"). */
export function useShippingContent() {
    const { shipping } = useSiteContent()
    const fill = useFillPlaceholders()
    return { ...shipping, freeShippingText: fill(shipping.freeShippingCopy) }
}
