import type { DesignFontId } from '@/@types/design'
import type { Category, CategorySlug } from '@/@types/product'
import { isDarkHex } from '@/utils/color'

/** A rectangle in a design view box (the illustration's 240 × 200, or a photo's pixels). */
export interface ArtworkRect {
    x: number
    y: number
    width: number
    height: number
}

/** The generated illustrations are drawn in a 240 × 200 box (`ARTWORK_VIEW_BOX`). */
export const ILLUSTRATION_VIEW = { width: 240, height: 200 } as const

/**
 * "Diseña con tu imagen": what the editor draws on and where the print goes. The background is
 * either one of the category's template photos ("Plantilla para diseñar", one per garment color,
 * uploaded by the admin) or the
 * generated illustration. `area` is in `view` units, so a placement measured on the stage maps
 * to the print area of the preview and of the printed piece.
 */
export interface DesignTemplate {
    /** Physical print size (what the DPI is computed with). */
    widthCm: number
    heightCm: number
    /** Size of the stage box: the photo's pixels, or `ILLUSTRATION_VIEW`. */
    view: { width: number; height: number }
    area: ArtworkRect
    /** The template photo, shown as-is; null draws the (tinted) illustration. */
    photo: { url: string } | null
    /** The garment color of the photo; null for the illustration. */
    color: { id: string; name: string; hex: string } | null
    /** Shown under the editor: what the area stands for. */
    hint: string
    /**
     * The print wraps around a cylinder (a mug): the editor draws on the flat wrap strip (see
     * `wrapStage`) instead of the photo, and offers "Ver en 3D", which wraps the print area
     * around a rotating mug (see `utils/mug3d.ts`). The photo, if any, only gives the color.
     */
    wrap3d: boolean
}

/** The editor's hint for a mug: the strip is the whole print around the body. */
export const WRAP_HINT =
    'La franja es todo lo que se imprime alrededor de la taza: el centro es el frente y los bordes quedan junto al asa. Mira el resultado en «Ver en 3D».'

/** View units per cm of the flat wrap stage. */
const WRAP_UNITS_PER_CM = 100
/**
 * Room around the strip on the wrap stage (cm): the guides' labels sit there, and the selected
 * layer's overflow shows faintly.
 */
const WRAP_MARGIN_CM = { x: 1, y: 0.9 } as const
/** The safe margin drawn inside the strip (cm): the print may shift this much. */
export const WRAP_SAFE_MARGIN_CM = 0.3

/**
 * The flat wrap stage of a mug: the whole print (`widthCm × heightCm`, e.g. 20 × 8.5 cm) as a
 * landscape strip with a small margin around it. The area is the strip itself, so a placement
 * of scale 1 is the full width of the print (the same space as the arte final and the 3D mug).
 */
export function wrapStage(
    widthCm: number,
    heightCm: number,
): { view: { width: number; height: number }; area: ArtworkRect } {
    const unit = WRAP_UNITS_PER_CM
    const marginX = WRAP_MARGIN_CM.x * unit
    const marginY = WRAP_MARGIN_CM.y * unit
    return {
        view: { width: widthCm * unit + 2 * marginX, height: heightCm * unit + 2 * marginY },
        area: { x: marginX, y: marginY, width: widthCm * unit, height: heightCm * unit },
    }
}

/** A generated illustration template: the print size and its area on the drawing. */
export interface IllustrationTemplate {
    widthCm: number
    heightCm: number
    area: ArtworkRect
    hint: (size: string) => string
    /** See `DesignTemplate.wrap3d`; also applies to the category's template photos. */
    wrap3d?: boolean
}

/**
 * Keyed by category slug: the fallback when a category has no template photo. The area keeps
 * the default print's aspect ratio. Mirror of backend-cups/src/designs/design-templates.ts; the
 * API's (admin-set) print size wins over these sizes when present.
 */
export const ILLUSTRATION_TEMPLATES: Readonly<Record<string, IllustrationTemplate>> = {
    mugs: {
        widthCm: 20,
        heightCm: 8.5,
        area: { x: 69, y: 94, width: 94, height: 40 },
        // Unused while `wrap3d` (the editor shows `WRAP_HINT`), kept for the shape.
        hint: (size) => `El área es la vuelta completa de la taza (${size}).`,
        wrap3d: true,
    },
    tees: {
        widthCm: 25,
        heightCm: 30,
        area: { x: 90, y: 76, width: 60, height: 72 },
        hint: (size) => `El área es el frente de la franela (${size}).`,
    },
}

const CM_FORMAT = new Intl.NumberFormat('es-VE', { maximumFractionDigits: 2 })

/** "20 × 8,5 cm" */
export function formatPrintSize(widthCm: number, heightCm: number): string {
    return `${CM_FORMAT.format(widthCm)} × ${CM_FORMAT.format(heightCm)} cm`
}

/**
 * The editor templates of a category: one per garment color photo (in the admin's order, the
 * first is the default) when it has template photos, else its generated illustration. Empty
 * when the category does not offer the editor (or is not loaded yet).
 */
export function designTemplatesFor(
    slug: CategorySlug,
    category: Category | undefined,
): DesignTemplate[] {
    if (!category?.designEnabled) return []
    const illustration = Object.hasOwn(ILLUSTRATION_TEMPLATES, slug)
        ? ILLUSTRATION_TEMPLATES[slug]!
        : null
    const wrap3d = illustration?.wrap3d ?? false
    const photos = category.designTemplate
    if (photos?.colors.length) {
        const { printWidthCm: widthCm, printHeightCm: heightCm } = photos
        const hint = wrap3d
            ? WRAP_HINT
            : `El área punteada es donde se imprime tu imagen (${formatPrintSize(widthCm, heightCm)}).`
        return photos.colors.map((color) => {
            const { printArea: area } = color
            // A mug is designed on its flat wrap: the photo's (front-only) area is not used.
            const geometry = wrap3d
                ? wrapStage(widthCm, heightCm)
                : {
                      view: { width: color.width, height: color.height },
                      area: {
                          x: area.x * color.width,
                          y: area.y * color.height,
                          width: area.width * color.width,
                          height: area.height * color.height,
                      },
                  }
            return {
                widthCm,
                heightCm,
                ...geometry,
                photo: { url: color.imageUrl },
                color: { id: color.id, name: color.name, hex: color.hex },
                hint,
                wrap3d,
            }
        })
    }
    if (!illustration) return []
    const widthCm = category.designPrintSize?.widthCm ?? illustration.widthCm
    const heightCm = category.designPrintSize?.heightCm ?? illustration.heightCm
    return [
        {
            widthCm,
            heightCm,
            ...(wrap3d
                ? wrapStage(widthCm, heightCm)
                : { view: ILLUSTRATION_VIEW, area: illustration.area }),
            photo: null,
            color: null,
            hint: wrap3d ? WRAP_HINT : illustration.hint(formatPrintSize(widthCm, heightCm)),
            wrap3d,
        },
    ]
}

/** Below this, a warning ("puede verse borrosa"); below `MIN_DPI`, a strong one. Never blocking. */
export const LOW_DPI = 150
export const MIN_DPI = 72

export const DESIGN_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const MAX_DESIGN_IMAGE_BYTES = 10 * 1024 * 1024
/** Width of the mockup PNG sent with the design (the height follows the view box). */
export const DESIGN_PREVIEW_WIDTH = 800
/** Pixel budget of the preview (800 × 667, the illustration's): a tall photo gets narrower. */
export const DESIGN_PREVIEW_MAX_PIXELS = 800 * 667
/** The API refuses previews above 2 MB. */
export const DESIGN_PREVIEW_MAX_BYTES = 2 * 1024 * 1024

export const DESIGN_RIGHTS_TEXT =
    'Confirmo que tengo derecho a usar estas imágenes (no son marcas o personajes registrados sin permiso).'

/** Layers per design (the API refuses more). */
export const MAX_IMAGE_LAYERS = 5
export const MAX_TEXT_LAYERS = 3
export const MAX_TEXT_LENGTH = 60
export const MAX_TEXT_LINES = 2

/**
 * The "arte final" (print-ready PNG): 200 DPI of the print size, at most 4000 px long. When the
 * PNG would not fit the storage's 10 MB (Cloudinary's free plan), it is rendered again at the
 * next of these steps; never below 100 DPI (the API's floor).
 */
export const ARTWORK_STEPS: readonly { dpi: number; maxSide: number }[] = [
    { dpi: 200, maxSide: 4000 },
    { dpi: 170, maxSide: 3500 },
    { dpi: 150, maxSide: 3000 },
    { dpi: 120, maxSide: 2500 },
    { dpi: 100, maxSide: 2500 },
]
export const ARTWORK_MIN_DPI = 100
/** Below the API's 10 MB, with room for the multipart overhead. */
export const ARTWORK_MAX_BYTES = 9.5 * 1024 * 1024

const CM_PER_INCH = 2.54

/**
 * Pixel size of the arte final of a print area at `dpi`, scaled down to `maxSide` px on the
 * long side but never below 100 DPI. Mirror of the API's `artworkSize`.
 */
export function artworkSize(
    print: { widthCm: number; heightCm: number },
    dpi = ARTWORK_STEPS[0]!.dpi,
    maxSide = ARTWORK_STEPS[0]!.maxSide,
): { width: number; height: number } {
    const inches = (cm: number) => cm / CM_PER_INCH
    const longest = Math.max(inches(print.widthCm), inches(print.heightCm))
    const effective = Math.max(Math.min(dpi, maxSide / longest), ARTWORK_MIN_DPI)
    return {
        width: Math.max(1, Math.round(inches(print.widthCm) * effective)),
        height: Math.max(1, Math.round(inches(print.heightCm) * effective)),
    }
}

export interface DesignFont {
    id: DesignFontId
    label: string
    /** CSS family name (as loaded from Google Fonts). */
    family: string
    weight: number
    /** A generic fallback while (or if) the web font does not load. */
    fallback: string
}

/**
 * The text fonts, chosen to print well by sublimation: the site's own two, plus a script, a
 * bold display, a rounded, a handwritten and a serif. Same ids as the API's allowlist.
 */
export const DESIGN_FONTS: readonly DesignFont[] = [
    { id: 'fredoka', label: 'Fredoka', family: 'Fredoka', weight: 600, fallback: 'sans-serif' },
    {
        id: 'jakarta',
        label: 'Plus Jakarta Sans',
        family: 'Plus Jakarta Sans',
        weight: 800,
        fallback: 'sans-serif',
    },
    { id: 'pacifico', label: 'Pacifico', family: 'Pacifico', weight: 400, fallback: 'cursive' },
    { id: 'bebas', label: 'Bebas Neue', family: 'Bebas Neue', weight: 400, fallback: 'sans-serif' },
    { id: 'baloo', label: 'Baloo 2', family: 'Baloo 2', weight: 700, fallback: 'sans-serif' },
    { id: 'caveat', label: 'Caveat', family: 'Caveat', weight: 700, fallback: 'cursive' },
    {
        id: 'playfair',
        label: 'Playfair Display',
        family: 'Playfair Display',
        weight: 700,
        fallback: 'serif',
    },
]

/** The fonts the site does not load already (index.html has Fredoka and Plus Jakarta Sans). */
export const DESIGN_FONTS_STYLESHEET =
    'https://fonts.googleapis.com/css2?family=Baloo+2:wght@700&family=Bebas+Neue&family=Caveat:wght@700&family=Pacifico&family=Playfair+Display:wght@700&display=swap'

export function designFont(id: DesignFontId): DesignFont {
    return DESIGN_FONTS.find((font) => font.id === id) ?? DESIGN_FONTS[0]!
}

/** Text colors: white, black, the brand pinks and a few bright print-friendly ones. */
export const TEXT_COLORS: readonly { hex: string; name: string }[] = [
    { hex: '#FFFFFF', name: 'Blanco' },
    { hex: '#000000', name: 'Negro' },
    { hex: '#E75F9B', name: 'Rosado Manada' },
    { hex: '#FF8FB8', name: 'Rosado claro' },
    { hex: '#C44A80', name: 'Fucsia' },
    { hex: '#E4572E', name: 'Rojo' },
    { hex: '#FFC93C', name: 'Amarillo' },
    { hex: '#2BB57D', name: 'Verde' },
    { hex: '#3E9BE0', name: 'Azul' },
    { hex: '#7B5CD6', name: 'Morado' },
]

export const TEXT_OUTLINE_OPTIONS = [
    { value: 'none', label: 'Sin borde' },
    { value: 'white', label: 'Blanco' },
    { value: 'black', label: 'Negro' },
] as const

export const TEXT_ALIGN_OPTIONS = [
    { value: 'left', label: 'Izquierda' },
    { value: 'center', label: 'Centro' },
    { value: 'right', label: 'Derecha' },
] as const

/** How the customer-facing copy names a category's product, with its Spanish agreement. */
export interface ProductNoun {
    /** "taza" */
    singular: string
    /** "tazas" */
    plural: string
    feminine: boolean
}

const PRODUCT_NOUNS: Record<string, ProductNoun> = {
    mugs: { singular: 'taza', plural: 'tazas', feminine: true },
    tees: { singular: 'franela', plural: 'franelas', feminine: true },
    keychains: { singular: 'llavero', plural: 'llaveros', feminine: false },
}

/** "taza", "franela", "llavero"; any other category is "producto". */
export function productNounFor(category: string): ProductNoun {
    return PRODUCT_NOUNS[category] ?? { singular: 'producto', plural: 'productos', feminine: false }
}

/** "la taza" / "el llavero". */
export function withArticle(noun: ProductNoun): string {
    return `${noun.feminine ? 'la' : 'el'} ${noun.singular}`
}

/**
 * "Antes de continuar": what the customer should expect from the print. The color note speaks
 * of a dark product when the chosen color is dark; otherwise it stays general. Worded for the
 * product's category (taza, franela, llavero…).
 */
export function designApproximationNotes(
    garmentHex: string | null,
    lowResolution: boolean,
    category: string,
): string[] {
    const noun = productNounFor(category)
    const f = noun.feminine
    const darkOne = `${f ? 'una' : 'un'} ${noun.singular} ${f ? 'oscura' : 'oscuro'} como ${f ? 'esta' : 'este'}`
    const darkMany = `${noun.plural} ${f ? 'oscuras' : 'oscuros'}`
    return [
        'La vista previa es una referencia: el resultado real puede variar un poco.',
        garmentHex && isDarkHex(garmentHex)
            ? `Los colores cambian según la pantalla, el material y el color de ${withArticle(noun)}: sobre ${darkOne}, tu imagen se verá más apagada que en la pantalla.`
            : `Los colores cambian según la pantalla, el material y el color de ${withArticle(noun)}: sobre ${darkMany} la imagen se ve más apagada, y sobre blanco los colores salen más vivos.`,
        ...(lowResolution
            ? ['Tu imagen tiene poca resolución, así que puede verse borrosa al imprimir.']
            : []),
        'Si vemos algo que pueda salir mal, te escribimos antes de imprimir.',
    ]
}
