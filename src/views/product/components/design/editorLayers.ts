import type {
    DesignFontId,
    DesignPlacement,
    DesignTextStyle,
    DpiLevel,
    DraftLayer,
} from '@/@types/design'
import type { DesignTemplate } from '@/constants/design.constant'
import { dpiLevelOf, effectiveDpi, type LayerBox } from '@/utils/designGeometry'
import type { LoadedDesignImage, RenderLayer } from '@/utils/designImage'
import { normalizedText, textBox } from '@/utils/designText'

/** An image layer while editing: its file and the decoded image. */
export interface EditorImageLayer {
    id: string
    type: 'image'
    placement: DesignPlacement
    file: File
    image: LoadedDesignImage
}

export interface EditorTextLayer extends DesignTextStyle {
    id: string
    type: 'text'
    placement: DesignPlacement
}

/** Bottom to top. */
export type EditorLayer = EditorImageLayer | EditorTextLayer

let counter = 0

export function newLayerId(): string {
    counter += 1
    return `layer-${Date.now().toString(36)}-${counter}`
}

/** Its box on the area (text: measured with its font, which must be loaded to be exact). */
export function boxOf(layer: EditorLayer): LayerBox {
    if (layer.type === 'image') {
        return {
            placement: layer.placement,
            width: layer.placement.scale,
            ratio: layer.image.height / layer.image.width,
        }
    }
    const { width, ratio } = textBox(layer, layer.placement.scale)
    return { placement: layer.placement, width, ratio }
}

/** "Imagen 2" (counted bottom to top among the images). */
export function imageNumberOf(layers: readonly EditorLayer[], id: string): number {
    return (
        layers.filter((layer) => layer.type === 'image').findIndex((layer) => layer.id === id) + 1
    )
}

/** "Imagen 2", "Texto: «Sofía 7»". */
export function layerLabel(layers: readonly EditorLayer[], layer: EditorLayer): string {
    if (layer.type === 'image') return `Imagen ${imageNumberOf(layers, layer.id)}`
    const text = normalizedText(layer.content).replace(/\n/g, ' / ')
    const short = [...text].length > 24 ? `${[...text].slice(0, 23).join('')}…` : text
    return `Texto: «${short || '…'}»`
}

export interface LayerDpi {
    id: string
    number: number
    dpi: number
    level: DpiLevel
}

/** The resolution of every image layer, bottom to top. */
export function imageDpis(layers: readonly EditorLayer[], template: DesignTemplate): LayerDpi[] {
    return layers
        .filter((layer): layer is EditorImageLayer => layer.type === 'image')
        .map((layer, index) => {
            const dpi = effectiveDpi(layer.image.width, layer.placement, template)
            return { id: layer.id, number: index + 1, dpi, level: dpiLevelOf(dpi) }
        })
}

export function toRenderLayers(layers: readonly EditorLayer[]): RenderLayer[] {
    return layers.map((layer) =>
        layer.type === 'image'
            ? {
                  kind: 'image',
                  element: layer.image.element,
                  ratio: layer.image.height / layer.image.width,
                  placement: layer.placement,
              }
            : {
                  kind: 'text',
                  style: { ...layer, content: normalizedText(layer.content) },
                  placement: layer.placement,
              },
    )
}

/** What the product page keeps to reopen the design (the files, not the decoded images). */
export function toDraftLayers(layers: readonly EditorLayer[]): DraftLayer[] {
    return layers.map((layer) =>
        layer.type === 'image'
            ? { id: layer.id, type: 'image', placement: layer.placement, file: layer.file }
            : {
                  id: layer.id,
                  type: 'text',
                  placement: layer.placement,
                  content: normalizedText(layer.content),
                  font: layer.font,
                  color: layer.color,
                  outline: layer.outline,
                  align: layer.align,
              },
    )
}

export function fontsOf(layers: readonly { type: string; font?: DesignFontId }[]): DesignFontId[] {
    return layers.flatMap((layer) => (layer.type === 'text' && layer.font ? [layer.font] : []))
}

/** "2 imágenes · 1 texto". */
export function layersSummary(layers: readonly { type: 'image' | 'text' }[]): string {
    const images = layers.filter((layer) => layer.type === 'image').length
    const texts = layers.length - images
    return [
        images ? `${images} ${images === 1 ? 'imagen' : 'imágenes'}` : null,
        texts ? `${texts} ${texts === 1 ? 'texto' : 'textos'}` : null,
    ]
        .filter(Boolean)
        .join(' · ')
}
