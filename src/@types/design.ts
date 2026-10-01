/**
 * Where a layer sits, relative to the print area (same shape as the API's LayerPlacement):
 * `x`/`y` offset of the layer center from the area center as fractions of the area's width and
 * height; `scale` image width ÷ area width (text: font size ÷ `TEXT_FONT_RATIO` area widths);
 * `rotation` degrees clockwise.
 */
export interface DesignPlacement {
    x: number
    y: number
    scale: number
    rotation: number
}

export type DpiLevel = 'ok' | 'low' | 'veryLow'

/** Ids of the editor's fonts (the API's allowlist, see DESIGN_FONTS). */
export type DesignFontId =
    'fredoka' | 'jakarta' | 'pacifico' | 'bebas' | 'baloo' | 'caveat' | 'playfair'
export type TextOutline = 'none' | 'white' | 'black'
export type TextAlign = 'left' | 'center' | 'right'

/** What a text layer draws (shared by the stage and the canvas exports). */
export interface DesignTextStyle {
    /** 1–60 characters, at most 2 lines. */
    content: string
    font: DesignFontId
    /** `#RRGGBB`. */
    color: string
    outline: TextOutline
    align: TextAlign
}

/** An image layer kept by the product page: the file itself, so "Editar diseño" reopens it. */
export interface DraftImageLayer {
    id: string
    type: 'image'
    placement: DesignPlacement
    file: File
}

export interface DraftTextLayer extends DesignTextStyle {
    id: string
    type: 'text'
    placement: DesignPlacement
}

/** A design's layers, bottom to top. */
export type DraftLayer = DraftImageLayer | DraftTextLayer

/** One layer of `POST /designs`'s answer. */
export interface CreatedDesignLayer {
    index: number
    type: 'image' | 'text'
    dpi: number | null
    dpiLevel: DpiLevel | null
}

/** `POST /designs`. `previewToken` is only returned here. */
export interface CreatedDesign {
    id: string
    previewToken: string
    /** API path (no `/api` prefix) that shows the preview to whoever holds the token. */
    previewPath: string
    previewUrl: string
    /** The lowest DPI among the image layers; null for a design with only text. */
    dpiEstimate: number | null
    dpiLevel: DpiLevel | null
    layers: CreatedDesignLayer[]
    /** The garment color it was made on; null with an illustration template. */
    color: GarmentColor | null
}

/** A garment color as recorded on a design ("Negro", `#1F2937`). Not stock-tracked. */
export interface GarmentColor {
    name: string
    hex: string
}

/** What a cart line keeps of its design (persisted in localStorage with the cart). */
export interface CartDesign {
    id: string
    /** `/designs/<id>/preview?t=<token>`: the token is what lets this browser see it. */
    previewPath: string
    dpiLevel?: DpiLevel
    /** The garment color chosen in the editor, when the template has colors. */
    color?: GarmentColor
}
