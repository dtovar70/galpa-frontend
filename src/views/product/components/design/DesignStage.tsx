import {
    useEffect,
    useId,
    useRef,
    useState,
    type CSSProperties,
    type PointerEvent,
    type RefObject,
} from 'react'

import type { DesignPlacement, DesignTextStyle } from '@/@types/design'
import type { CategorySlug } from '@/@types/product'
import { ProductIllustration } from '@/components/shared/ProductIllustration'
import { categorySurface } from '@/components/shared/illustration/artwork'
import { WRAP_SAFE_MARGIN_CM, type DesignTemplate } from '@/constants/design.constant'
import { cn } from '@/utils/cn'
import { isDarkHex, toColorInputValue } from '@/utils/color'
import { areaStyle, layerContains, layerStyle, type LayerBox } from '@/utils/designGeometry'
import { drawTextBlock, layoutText, TEXT_FONT_RATIO } from '@/utils/designText'
import { boxOf, type EditorLayer } from '@/views/product/components/design/editorLayers'
import { useDesignGestures } from '@/views/product/components/design/useDesignGestures'

export interface DesignStageProps {
    category: CategorySlug
    color: string
    accentColor?: string
    template: DesignTemplate
    /** Bottom to top. */
    layers: EditorLayer[]
    selectedId: string | null
    onSelect: (id: string) => void
    /** The selected layer's new placement. */
    onChange: (placement: DesignPlacement) => void
    /** Bumped when a font finishes loading, so the texts are measured and drawn again. */
    fontsVersion: number
    /** Wraps the mockup SVG (illustration only), so the editor can draw it into the preview. */
    mockupRef: RefObject<HTMLDivElement | null>
    disabled?: boolean
}

/** Largest share of the viewport height a (tall) template photo may take. */
/** Largest side of a text layer's canvas on the stage (device pixels). */
const MAX_TEXT_CANVAS = 2048

/**
 * A text layer on the stage: a canvas drawn with the same code as the exports, at the stage's
 * resolution, sized like an image (width in % of the area, height from its own shape).
 */
function TextCanvas({
    style,
    placement,
    width,
    areaWidth,
    fontsVersion,
}: {
    style: DesignTextStyle
    placement: DesignPlacement
    width: number
    areaWidth: number
    fontsVersion: number
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const { content, font, color, outline, align } = style

    useEffect(() => {
        const canvas = canvasRef.current
        const context = canvas?.getContext('2d')
        if (!canvas || !context || areaWidth <= 0) return
        const textStyle = { content, font, color, outline, align }
        const ratio = window.devicePixelRatio || 1
        let fontPx = placement.scale * TEXT_FONT_RATIO * areaWidth * ratio
        let block = layoutText(context, textStyle, fontPx)
        const largest = Math.max(block.width, block.height)
        if (largest > MAX_TEXT_CANVAS) {
            fontPx *= MAX_TEXT_CANVAS / largest
            block = layoutText(context, textStyle, fontPx)
        }
        canvas.width = Math.max(1, Math.ceil(block.width))
        canvas.height = Math.max(1, Math.ceil(block.height))
        context.clearRect(0, 0, canvas.width, canvas.height)
        drawTextBlock(context, textStyle, block)
    }, [content, font, color, outline, align, placement.scale, areaWidth, fontsVersion])

    return (
        <canvas
            ref={canvasRef}
            className="absolute h-auto will-change-transform"
            style={layerStyle(placement, width)}
        />
    )
}

function LayerVisual({
    layer,
    box,
    areaWidth,
    fontsVersion,
}: {
    layer: EditorLayer
    box: LayerBox
    areaWidth: number
    fontsVersion: number
}) {
    if (layer.type === 'image') {
        return (
            <img
                src={layer.image.url}
                alt=""
                draggable={false}
                className="absolute will-change-transform"
                style={layerStyle(layer.placement)}
            />
        )
    }
    return (
        <TextCanvas
            style={layer}
            placement={layer.placement}
            width={box.width}
            areaWidth={areaWidth}
            fontsVersion={fontsVersion}
        />
    )
}

/**
 * The guides of the flat wrap (a mug): the front in the middle, the handle's side at both ends
 * (they meet behind the handle), and the safe margin. Drawn over the layers, inside the strip.
 */
function WrapGuides({ template, dark }: { template: DesignTemplate; dark: boolean }) {
    const line = dark ? 'rgba(255, 255, 255, 0.55)' : 'rgba(45, 25, 35, 0.3)'
    const insetX = `${(WRAP_SAFE_MARGIN_CM / template.widthCm) * 100}%`
    const insetY = `${(WRAP_SAFE_MARGIN_CM / template.heightCm) * 100}%`
    const label =
        'absolute text-[9px] leading-none font-semibold whitespace-nowrap text-ink-soft sm:text-[10px]'
    return (
        <>
            <span
                className="absolute rounded-[2px] border border-dashed opacity-60"
                style={{
                    left: insetX,
                    right: insetX,
                    top: insetY,
                    bottom: insetY,
                    borderColor: line,
                }}
            />
            <span
                className="absolute inset-y-0 left-1/2 border-l border-dashed"
                style={{ borderColor: line }}
            />
            <span className={cn(label, 'bottom-full left-1/2 mb-0.5 -translate-x-1/2')}>
                Frente
            </span>
            <span
                className={cn(
                    label,
                    'top-1/2 right-full mr-0.5 -translate-y-1/2 rotate-180 [writing-mode:vertical-rl]',
                )}
            >
                Lado del asa
            </span>
            <span
                className={cn(
                    label,
                    'top-1/2 left-full ml-0.5 -translate-y-1/2 [writing-mode:vertical-rl]',
                )}
            >
                Lado del asa
            </span>
        </>
    )
}

/**
 * The product (the category's template photo as-is, or the illustration tinted with the
 * product's color and without its print text), the dashed print area and the customer's layers
 * clipped inside it. A mug (`template.wrap3d`) is drawn as its flat wrap instead: the whole
 * print as a strip of the mug's color, so a layer's size on it is its real share of the print
 * (the photo only shows the front, and "Ver en 3D" shows the result). The selected layer gets a frame and a faint "ghost" of what falls outside
 * the area; a tap selects the topmost layer under the finger, and the gestures move it.
 */
export function DesignStage({
    category,
    color,
    accentColor,
    template,
    layers,
    selectedId,
    onSelect,
    onChange,
    fontsVersion,
    mockupRef,
    disabled = false,
}: DesignStageProps) {
    const stageRef = useRef<HTMLDivElement>(null)
    const areaRef = useRef<HTMLDivElement>(null)
    const hintId = useId()
    const surface = categorySurface(category, accentColor ?? color)
    const { view } = template
    const wrap = template.wrap3d
    // The flat wrap does not use the photo (it only shows the front of the mug).
    const photo = wrap ? null : template.photo
    // The mug's color, as in "Ver en 3D": the template's color, else the product's.
    const bodyHex = toColorInputValue(template.color?.hex ?? color)
    const [failedPhoto, setFailedPhoto] = useState<string | null>(null)
    const [areaWidth, setAreaWidth] = useState(0)
    const selected = layers.find((layer) => layer.id === selectedId) ?? null
    const interactive = selected !== null && !disabled
    const handlers = useDesignGestures(
        stageRef,
        areaRef,
        selected?.placement ?? { x: 0, y: 0, scale: 1, rotation: 0 },
        onChange,
        interactive,
    )
    const area = areaStyle(template.area, view)
    // Measured on every render: a `fontsVersion` bump re-measures the texts with their font.
    const boxes = new Map(layers.map((layer) => [layer.id, boxOf(layer)] as const))
    // The stage keeps its proportion ("object-contain"): as wide as the column allows, but never
    // taller than `--stage-max-h` (set by the editor: compact on phones, where it stays pinned
    // above the controls). The photo needs its own aspect ratio; the drawing brings one.
    const ratio = view.width / view.height
    const photoBox: CSSProperties = {
        ...(photo || wrap ? { aspectRatio: `${view.width} / ${view.height}` } : {}),
        width: `min(100%, calc(var(--stage-max-h, 60dvh) * ${ratio}))`,
    }

    // The texts are drawn at the area's real size (sharp at any zoom of the stage).
    useEffect(() => {
        const element = areaRef.current
        if (!element) return
        const measure = () => setAreaWidth(element.getBoundingClientRect().width)
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(element)
        return () => observer.disconnect()
    }, [])

    const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
        if (disabled) return
        const rect = areaRef.current?.getBoundingClientRect()
        // Only the first finger picks a layer; a second one pinches the selected layer.
        if (rect && event.isPrimary && rect.width > 0) {
            const point = { x: event.clientX - rect.left, y: event.clientY - rect.top }
            const hit = [...layers]
                .reverse()
                .find((layer) =>
                    layerContains(boxes.get(layer.id)!, point, rect.width, rect.height),
                )
            if (hit && hit.id !== selectedId) onSelect(hit.id)
        }
        handlers.onPointerDown(event)
    }

    const selectedBox = selected ? boxes.get(selected.id)! : null

    return (
        <div
            className={cn(
                'overflow-hidden rounded-3xl border border-line',
                photo ? 'bg-white' : wrap ? 'bg-blush-50' : surface.className,
            )}
            style={photo || wrap ? undefined : surface.style}
        >
            <div
                ref={stageRef}
                role={interactive ? 'application' : undefined}
                aria-roledescription={interactive ? 'Editor de diseño' : undefined}
                aria-label={
                    interactive
                        ? 'Tu diseño sobre el producto. Arrastra la capa elegida para moverla.'
                        : wrap
                          ? 'La franja que se imprime alrededor de la taza'
                          : 'Vista del producto con el área de impresión'
                }
                aria-describedby={interactive ? hintId : undefined}
                tabIndex={interactive ? 0 : -1}
                style={photoBox}
                {...handlers}
                onPointerDown={onPointerDown}
                className={cn(
                    'relative mx-auto w-full max-w-xl outline-none select-none focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:ring-inset',
                    interactive && 'cursor-grab touch-none active:cursor-grabbing',
                )}
            >
                <div
                    ref={mockupRef}
                    aria-hidden="true"
                    className={cn((photo || wrap) && 'size-full')}
                >
                    {wrap ? (
                        <div
                            className="absolute rounded-[3px] shadow-soft ring-1 ring-ink/10"
                            style={{ ...area, backgroundColor: bodyHex }}
                        />
                    ) : photo ? (
                        // Same crossOrigin as the preview export (see loadTemplatePhoto), so the
                        // cached copy is CORS-enabled when the canvas draws it.
                        <img
                            src={photo.url}
                            alt=""
                            crossOrigin="anonymous"
                            draggable={false}
                            onError={() => setFailedPhoto(photo.url)}
                            className="block size-full object-contain"
                        />
                    ) : (
                        <ProductIllustration
                            category={category}
                            color={color}
                            accentColor={accentColor}
                            printText=""
                            size="lg"
                            className="block"
                        />
                    )}
                </div>
                {photo && failedPhoto === photo.url ? (
                    <p className="absolute inset-x-4 top-4 rounded-2xl bg-white/90 px-3 py-2 text-center text-xs text-ink-soft shadow-soft">
                        No pudimos cargar la foto del producto. Igual puedes armar tu diseño en el
                        área de impresión.
                    </p>
                ) : null}

                {/* What the selected layer has outside the print area, faint, only as a guide. */}
                {selected && selectedBox ? (
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute opacity-25"
                        style={area}
                    >
                        <LayerVisual
                            layer={selected}
                            box={selectedBox}
                            areaWidth={areaWidth}
                            fontsVersion={fontsVersion}
                        />
                    </div>
                ) : null}
                <div
                    ref={areaRef}
                    aria-hidden="true"
                    className="pointer-events-none absolute overflow-hidden"
                    style={area}
                >
                    {layers.map((layer) => (
                        <LayerVisual
                            key={layer.id}
                            layer={layer}
                            box={boxes.get(layer.id)!}
                            areaWidth={areaWidth}
                            fontsVersion={fontsVersion}
                        />
                    ))}
                </div>

                <div
                    aria-hidden="true"
                    className={cn(
                        'pointer-events-none absolute rounded-[3px]',
                        !wrap && 'border-2 border-dashed border-blush-500/80',
                    )}
                    style={area}
                >
                    {wrap ? (
                        <WrapGuides template={template} dark={isDarkHex(bodyHex)} />
                    ) : (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-2 text-[10px] font-semibold whitespace-nowrap text-blush-700 shadow-soft">
                            Área de impresión
                        </span>
                    )}
                    {selected && selectedBox && layers.length > 1 ? (
                        <span
                            className="absolute rounded-sm outline-2 outline-offset-2 outline-sky-500/90 outline-dashed"
                            style={{
                                ...layerStyle(selected.placement, selectedBox.width),
                                aspectRatio: `1 / ${selectedBox.ratio}`,
                            }}
                        />
                    ) : null}
                </div>
            </div>
            {interactive ? (
                <p id={hintId} className="sr-only">
                    Usa las flechas para mover la capa elegida (con Mayúsculas, más rápido), + y −
                    para cambiar su tamaño, y los corchetes para girarla.
                </p>
            ) : null}
        </div>
    )
}
