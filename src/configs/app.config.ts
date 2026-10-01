import { ROUTES } from '@/constants/route.constant'

export interface NavLink {
    label: string
    to: string
}

/**
 * Measured at 1024px (the narrowest width with the desktop nav): the category names are long
 * ("Aires Residenciales"), so the header lists two and "Catálogo" reaches the rest.
 */
const HEADER_CATEGORY_LIMIT = 2

/**
 * App configuration that is not editable content. The brand name, texts, contact data,
 * socials and shipping values live in the site content (`useSiteContent`), edited from
 * /admin/contenido.
 */
export const appConfig = {
    /** Short brand name for tight spots (logo wordmark, loader); the full name is content. */
    brandShortName: 'Galpa',
    /**
     * Main navigation. The categories come from the API and are slotted in between these two
     * groups (see `useNavLinks`), so a category created in the admin shows up on its own.
     */
    navLinks: {
        before: [
            { label: 'Inicio', to: ROUTES.home },
            { label: 'Catálogo', to: ROUTES.catalog },
        ] satisfies NavLink[],
        after: [
            { label: 'Nosotros', to: ROUTES.about },
            { label: 'Asesoría', to: ROUTES.contact },
        ] satisfies NavLink[],
    },
    /**
     * How many categories (in admin order) each menu lists. The desktop header only has room
     * for a few next to the other links; "Catálogo" reaches the rest. The mobile menu is a
     * scrolling drawer, so it lists them all.
     */
    categoryLinkLimits: {
        header: HEADER_CATEGORY_LIMIT,
        footer: 8,
    },
} as const
