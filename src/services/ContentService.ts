import type { AdminContent, AdminContentSection } from '@/@types/admin'
import type { ContentSection, PublicSiteContent, SiteContent } from '@/@types/content'
import { apiClient } from '@/services/ApiClient'

const ADMIN_CONTENT = '/admin/content'

function sectionPath(section: ContentSection, suffix = ''): string {
    return `${ADMIN_CONTENT}/${encodeURIComponent(section)}${suffix}`
}

/** Editable site content: public read, admin read/replace/reset. */
export const ContentService = {
    /** The public sections, stored values merged over the defaults by the API. */
    getContent: (signal?: AbortSignal) => apiClient.get<PublicSiteContent>('/content', { signal }),

    getAdminContent: () => apiClient.get<AdminContent>(ADMIN_CONTENT),
    /** Replaces the whole section; returns it as saved. */
    updateSection: <K extends ContentSection>(section: K, value: SiteContent[K]) =>
        apiClient.put<AdminContentSection<K>>(sectionPath(section), value),
    /** ADMIN only: drops the stored value so the built-in texts are shown again. */
    resetSection: <K extends ContentSection>(section: K) =>
        apiClient.post<AdminContentSection<K>>(sectionPath(section, '/reset')),
} as const
