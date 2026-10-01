import { useEffect, useId, useMemo, useRef, useState, type DragEvent } from 'react'
import { ImageUp, Maximize2, Minimize2, Rotate3d, RotateCcw, Type, X } from 'lucide-react'

import type { CartDesign, DesignPlacement, DesignTextStyle, DraftLayer } from '@/@types/design'
import type { Product, ProductVariant } from '@/@types/product'
import { CheckboxField } from '@/components/shared/CheckboxField'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Alert, Button, Spinner } from '@/components/ui'
import { FIELD_HINT_CLASS } from '@/components/ui/field.styles'
import {
    DESIGN_RIGHTS_TEXT,
    MAX_IMAGE_LAYERS,
    MAX_TEXT_LAYERS,
    designApproximationNotes,
    type DesignTemplate,
} from '@/constants/design.constant'
import { categoryTheme } from '@/constants/theme.constant'
import { DesignService, type DesignUploadLayer } from '@/services/DesignService'
import { getErrorMessage } from '@/services/errors'
import { cn } from '@/utils/cn'
import { isDarkHex } from '@/utils/color'
import { CENTERED, fillPlacement, fitPlacement, normalizePlacement } from '@/utils/designGeometry'
import {
    designFileProblem,
    loadDesignImage,
    releaseDesignImage,
    renderDesignArtwork,
    renderDesignPreview,
    renderMugPreview,
    type LoadedDesignImage,
} from '@/utils/designImage'
import { prepareDesignImage } from '@/utils/imageResize'
import {
    ensureDesignFonts,
    normalizedText,
    preloadDesignFonts,
    textProblem,
} from '@/utils/designText'
import { DesignColorSwatches } from '@/views/product/components/design/DesignColorSwatches'
import { DesignControls } from '@/views/product/components/design/DesignControls'
import { DesignLayers } from '@/views/product/components/design/DesignLayers'
import { DesignResolution } from '@/views/product/components/design/DesignResolution'
import { DesignStage } from '@/views/product/components/design/DesignStage'
import { DesignTextControls } from '@/views/product/components/design/DesignTextControls'
import { MugPreview3D } from '@/views/product/components/design/MugPreview3D'
import {
    fontsOf,
    imageDpis,
    layerLabel,
    layersSummary,
    newLayerId,
    toDraftLayers,
    toRenderLayers,
    type EditorImageLayer,
    type EditorLayer,
} from '@/views/product/components/design/editorLayers'

export interface DesignEditorResult {
    design: CartDesign
    /** Kept by the product page so "Editar diseño" reopens every layer. */
    layers: DraftLayer[]
    /** The rendered mockup, for an instant thumbnail. */
    previewBlob: Blob
    /** The lowest DPI among the images; null for a design with only text. */
    dpi: number | null
    /** The garment color (template) it was made on; null for the illustration. */
    colorId: string | null
}

export interface DesignEditorProps {
    isOpen: boolean
    onClose: () => void
    product: Product
    variant: ProductVariant | undefined
    /** Body color of the illustration mockup (the selected variant's, if any); unused with a photo. */
    color: string
    accentColor?: string
    /**
     * What to draw on: one per garment color (the first is the default), or the single
     * illustration. Never empty.
     */
    templates: DesignTemplate[]
    /** The design being edited, or null for a new one. */
    initial: { layers: DraftLayer[]; colorId?: string | null } | null
    onSaved: (result: DesignEditorResult) => void
}

/** The stage's two views for a mug: the flat editor and the rotating 3D mug. */
const STAGE_VIEWS = [
    { value: 'edit', label: 'Editar' },
    { value: '3d', label: 'Ver en 3D' },
] as const
type StageView = (typeof STAGE_VIEWS)[number]['value']

const REOPEN_FAILED =
    'No pudimos volver a abrir las imágenes de tu diseño (pasa si recargaste la página o si el archivo ya no está en tu equipo). Empieza de nuevo y súbelas otra vez.'

/**
 * "Diseña con tu imagen": full screen on phones, a large modal on bigger screens. Built on the
 * native `<dialog>` like ConfirmDialog (focus trap and Escape for free); its content only
 * exists while open, so every opening starts from `initial`.
 */
export function DesignEditor(props: DesignEditorProps) {
    const { isOpen, onClose } = props
    const dialogRef = useRef<HTMLDialogElement>(null)
    const titleId = useId()

    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return
        if (isOpen && !dialog.open) dialog.showModal()
        if (!isOpen && dialog.open) dialog.close()
    }, [isOpen])

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby={titleId}
            onCancel={(event) => {
                event.preventDefault()
                onClose()
            }}
            onClose={(event) => {
                if (event.target === event.currentTarget && isOpen) onClose()
            }}
            className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-cream p-0 text-ink backdrop:bg-ink/50 backdrop:backdrop-blur-sm sm:m-auto sm:h-[min(92dvh,58rem)] sm:w-[calc(100%-2rem)] sm:max-w-5xl sm:rounded-3xl sm:shadow-lift"
        >
            {isOpen ? <EditorBody {...props} titleId={titleId} /> : null}
        </dialog>
    )
}

/** Fields that open the on-screen keyboard (not sliders, color pickers or checkboxes). */
function isTextEntry(target: EventTarget): boolean {
    if (target instanceof HTMLTextAreaElement) return true
    return (
        target instanceof HTMLInputElement &&
        ['text', 'search', 'email', 'tel', 'url', 'number'].includes(target.type)
    )
}

function EditorBody({
    onClose,
    product,
    variant,
    color,
    accentColor,
    templates,
    initial,
    onSaved,
    titleId,
}: DesignEditorProps & { titleId: string }) {
    const inputId = useId()
    const addInputRef = useRef<HTMLInputElement>(null)
    const replaceInputRef = useRef<HTMLInputElement>(null)
    const mockupRef = useRef<HTMLDivElement>(null)
    const abortRef = useRef<AbortController | null>(null)
    /** Every decoded image, released when the editor closes. */
    const loadedRef = useRef(new Set<LoadedDesignImage>())
    const hasInitialImages = initial?.layers.some((layer) => layer.type === 'image') ?? false
    const [layers, setLayers] = useState<EditorLayer[]>(() =>
        hasInitialImages ? [] : (initial?.layers.filter((layer) => layer.type === 'text') ?? []),
    )
    const [selectedId, setSelectedId] = useState<string | null>(
        hasInitialImages ? null : (initial?.layers.at(-1)?.id ?? null),
    )
    const [rights, setRights] = useState(initial !== null)
    const [isDecoding, setIsDecoding] = useState(hasInitialImages)
    const [reopenFailed, setReopenFailed] = useState(false)
    // Phones: shrink the pinned product to see more controls (wide screens show both side by side).
    const [isPreviewSmall, setIsPreviewSmall] = useState(false)
    const [isTyping, setIsTyping] = useState(false)
    const [isOver, setIsOver] = useState(false)
    const [progress, setProgress] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isConfirming, setIsConfirming] = useState(false)
    const [fontsVersion, setFontsVersion] = useState(0)
    const [stageView, setStageView] = useState<StageView>('edit')
    const [colorId, setColorId] = useState<string | null>(
        initial?.colorId ?? templates[0]?.color?.id ?? null,
    )
    // The chosen garment color's photo (a color removed meanwhile falls back to the first).
    const template =
        templates.find((candidate) => candidate.color && candidate.color.id === colorId) ??
        templates[0]!
    const colors = templates.flatMap((candidate) => (candidate.color ? [candidate.color] : []))
    // Mugs: "Editar" shows the flat wrap (the whole print as a strip) and "Ver en 3D" wraps it
    // around a rotating mug; the controls keep working there (the mug redraws with every
    // change) and the flat stage stays mounted underneath, hidden.
    const is3d = template.wrap3d && stageView === '3d'
    const mugColor = template.color?.hex ?? color
    const renderLayers = useMemo(() => toRenderLayers(layers), [layers])

    const selected = layers.find((layer) => layer.id === selectedId) ?? null
    const images = layers.filter((layer): layer is EditorImageLayer => layer.type === 'image')
    const texts = layers.length - images.length
    const dpis = imageDpis(layers, template)
    const selectedDpi = dpis.find((entry) => entry.id === selectedId) ?? null
    const lowDpis = dpis.filter((entry) => entry.level !== 'ok')
    const textInvalid = layers.some((layer) => layer.type === 'text' && textProblem(layer.content))
    const needsRights = images.length > 0 && !rights
    const isSaving = progress !== null
    const fontsKey = [...new Set(fontsOf(layers))].sort().join(',')

    // The text fonts come from Google Fonts: a canvas only draws them once loaded.
    useEffect(() => preloadDesignFonts(), [])
    useEffect(() => {
        if (!fontsKey) return
        let cancelled = false
        void ensureDesignFonts(fontsKey.split(',') as DesignTextStyle['font'][]).then(() => {
            if (!cancelled) setFontsVersion((version) => version + 1)
        })
        return () => {
            cancelled = true
        }
    }, [fontsKey])

    // Reopening "Editar diseño": decode every kept file again.
    useEffect(() => {
        if (!initial || !hasInitialImages) return
        let cancelled = false
        const decode = async () => {
            const decoded: EditorLayer[] = []
            for (const layer of initial.layers) {
                if (layer.type === 'text') {
                    decoded.push(layer)
                    continue
                }
                const image = await loadDesignImage(layer.file)
                if (cancelled) {
                    releaseDesignImage(image)
                    return decoded
                }
                loadedRef.current.add(image)
                decoded.push({ ...layer, image })
            }
            return decoded
        }
        decode()
            .then((decoded) => {
                if (cancelled) return
                setLayers(decoded)
                setSelectedId(decoded.at(-1)?.id ?? null)
            })
            .catch(() => {
                if (!cancelled) setReopenFailed(true)
            })
            .finally(() => {
                if (!cancelled) setIsDecoding(false)
            })
        return () => {
            cancelled = true
        }
    }, [initial, hasInitialImages])

    // Frees the decoded images and cancels an upload when the editor closes.
    useEffect(() => {
        const loaded = loadedRef.current
        return () => {
            abortRef.current?.abort()
            for (const image of loaded) releaseDesignImage(image)
            loaded.clear()
        }
    }, [])

    /** Releases an image once no layer uses it any more. */
    const releaseUnused = (next: EditorLayer[]) => {
        const used = new Set(next.flatMap((layer) => (layer.type === 'image' ? [layer.image] : [])))
        for (const image of loadedRef.current) {
            if (!used.has(image)) {
                releaseDesignImage(image)
                loadedRef.current.delete(image)
            }
        }
    }

    const commitLayers = (next: EditorLayer[]) => {
        setLayers(next)
        releaseUnused(next)
    }

    const updateLayer = (id: string, change: (layer: EditorLayer) => EditorLayer) =>
        setLayers((current) => current.map((layer) => (layer.id === id ? change(layer) : layer)))

    const setSelectedPlacement = (placement: DesignPlacement) => {
        if (!selectedId) return
        updateLayer(selectedId, (layer) => ({ ...layer, placement }))
    }

    const decodeAll = async (files: File[]) => {
        const decoded: LoadedDesignImage[] = []
        const prepared: File[] = []
        for (const file of files) {
            // Shrunk to the arte final's ceiling before it becomes the layer original: lighter
            // uploads and far less memory on phones (a 12 MP photo is ~48 MB decoded).
            const typeProblem = designFileProblem(file, { ignoreSize: true })
            if (typeProblem) throw new Error(typeProblem)
            const ready = await prepareDesignImage(file)
            const image = await loadDesignImage(ready)
            loadedRef.current.add(image)
            decoded.push(image)
            prepared.push(ready)
        }
        return { decoded, prepared }
    }

    const addImages = async (candidates: File[]) => {
        if (!candidates.length || isSaving) return
        setError(null)
        const room = MAX_IMAGE_LAYERS - images.length
        const files = candidates.slice(0, Math.max(0, room))
        if (candidates.length > room) {
            setError(`Puedes usar hasta ${MAX_IMAGE_LAYERS} imágenes por diseño.`)
        }
        if (!files.length) return
        setIsDecoding(true)
        try {
            const { decoded, prepared } = await decodeAll(files)
            const added: EditorLayer[] = decoded.map((image, index) => ({
                id: newLayerId(),
                type: 'image',
                file: prepared[index]!,
                image,
                placement: fitPlacement(image.height / image.width, template.area, 0),
            }))
            setLayers((current) => [...current, ...added])
            setSelectedId(added.at(-1)!.id)
            // The rights are confirmed again for every new image.
            setRights(false)
        } catch (reason) {
            setError(getErrorMessage(reason))
        } finally {
            setIsDecoding(false)
            if (addInputRef.current) addInputRef.current.value = ''
        }
    }

    const replaceImage = async (file: File | undefined) => {
        const target = selected?.type === 'image' ? selected : null
        if (!file || !target || isSaving) return
        setError(null)
        setIsDecoding(true)
        try {
            const {
                decoded: [image],
                prepared: [ready],
            } = await decodeAll([file])
            const next = layers.map((layer) =>
                layer.id === target.id
                    ? {
                          ...target,
                          file: ready!,
                          image: image!,
                          placement: fitPlacement(
                              image!.height / image!.width,
                              template.area,
                              target.placement.rotation,
                          ),
                      }
                    : layer,
            )
            commitLayers(next)
            setRights(false)
        } catch (reason) {
            setError(getErrorMessage(reason))
        } finally {
            setIsDecoding(false)
            if (replaceInputRef.current) replaceInputRef.current.value = ''
        }
    }

    const addText = () => {
        if (texts >= MAX_TEXT_LAYERS || isSaving) return
        const dark = template.color ? isDarkHex(template.color.hex) : false
        const layer: EditorLayer = {
            id: newLayerId(),
            type: 'text',
            placement: CENTERED,
            content: 'Tu texto',
            font: 'fredoka',
            color: dark ? '#FFFFFF' : '#E75F9B',
            outline: 'none',
            align: 'center',
        }
        setLayers((current) => [...current, layer])
        setSelectedId(layer.id)
        setError(null)
    }

    const moveLayer = (id: string, step: 1 | -1) => {
        const index = layers.findIndex((layer) => layer.id === id)
        const target = index + step
        if (index < 0 || target < 0 || target >= layers.length) return
        const next = [...layers]
        ;[next[index], next[target]] = [next[target]!, next[index]!]
        setLayers(next)
    }

    const duplicateLayer = (id: string) => {
        const index = layers.findIndex((layer) => layer.id === id)
        const source = layers[index]
        if (!source) return
        if (
            source.type === 'image' ? images.length >= MAX_IMAGE_LAYERS : texts >= MAX_TEXT_LAYERS
        ) {
            return
        }
        const copy: EditorLayer = {
            ...source,
            id: newLayerId(),
            placement: normalizePlacement({
                ...source.placement,
                x: source.placement.x + 0.05,
                y: source.placement.y + 0.05,
            }),
        }
        const next = [...layers]
        next.splice(index + 1, 0, copy)
        setLayers(next)
        setSelectedId(copy.id)
    }

    const deleteLayer = (id: string) => {
        const next = layers.filter((layer) => layer.id !== id)
        commitLayers(next)
        if (selectedId === id) setSelectedId(next.at(-1)?.id ?? null)
        setError(null)
    }

    const startOver = () => {
        commitLayers([])
        setSelectedId(null)
        setReopenFailed(false)
        setRights(false)
        setError(null)
    }

    const onDrop = (event: DragEvent<HTMLElement>) => {
        event.preventDefault()
        setIsOver(false)
        void addImages([...event.dataTransfer.files])
    }

    const save = async () => {
        if (!layers.length || needsRights || textInvalid || isSaving) return
        setError(null)
        setProgress(0)
        const controller = new AbortController()
        abortRef.current = controller
        try {
            await ensureDesignFonts(fontsOf(layers))
            // A mug: a snapshot of the 3D mug (its front, the handle showing). Else the photo or
            // the illustration with the layers in its print area.
            const previewBlob = template.wrap3d
                ? await renderMugPreview({
                      layers: renderLayers,
                      print: template,
                      bodyColor: mugColor,
                      background: '#FFFFFF',
                  })
                : await renderDesignPreview({
                      backdrop: template.photo
                          ? { kind: 'photo', url: template.photo.url }
                          : { kind: 'svg', svg: mockupRef.current?.querySelector('svg') ?? null },
                      view: template.view,
                      layers: renderLayers,
                      area: template.area,
                      // The photo is shown as-is (white behind a transparent one); the
                      // illustration sits on the category's tinted surface.
                      background: template.photo
                          ? '#FFFFFF'
                          : categoryTheme(product.category, accentColor ?? color).surface,
                  })
            const artwork = await renderDesignArtwork(renderLayers, template)
            let assetIndex = 0
            const uploadLayers: DesignUploadLayer[] = layers.map((layer, z) =>
                layer.type === 'image'
                    ? { type: 'image', z, placement: layer.placement, assetIndex: assetIndex++ }
                    : {
                          type: 'text',
                          z,
                          placement: layer.placement,
                          content: normalizedText(layer.content),
                          font: layer.font,
                          color: layer.color,
                          outline: layer.outline,
                          align: layer.align,
                      },
            )
            const created = await DesignService.upload(
                {
                    productId: product.id,
                    variantId: variant?.id,
                    templateColorId: template.color?.id,
                    layers: uploadLayers,
                    originals: images.map((layer) => layer.file),
                    artwork,
                    preview: previewBlob,
                },
                setProgress,
                controller.signal,
            )
            onSaved({
                design: {
                    id: created.id,
                    previewPath: created.previewPath,
                    ...(created.dpiLevel ? { dpiLevel: created.dpiLevel } : {}),
                    ...(created.color ? { color: created.color } : {}),
                },
                layers: toDraftLayers(layers),
                previewBlob,
                dpi: created.dpiEstimate,
                colorId: template.color?.id ?? null,
            })
        } catch (reason) {
            if (reason instanceof DOMException && reason.name === 'AbortError') return
            setError(getErrorMessage(reason, 'No pudimos guardar tu diseño. Intenta de nuevo.'))
        } finally {
            setProgress(null)
        }
    }

    const percent = Math.round((progress ?? 0) * 100)
    const canSave = layers.length > 0 && !needsRights && !textInvalid && !isSaving && !isDecoding

    return (
        <div className="flex h-full flex-col">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
                <div className="min-w-0">
                    <h2 id={titleId} className="font-display text-xl">
                        Diseña con tu imagen
                    </h2>
                    <p className="truncate text-xs text-ink-soft">
                        {product.name}
                        {variant ? ` · ${variant.label}` : ''}
                        {template.color && colors.length > 1 ? ` · ${template.color.name}` : ''}
                        {layers.length ? ` · ${layersSummary(layers)}` : ''}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar el editor"
                    className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-blush-100 focus-visible:ring-2 focus-visible:ring-blush-400"
                >
                    <X aria-hidden="true" className="size-5" />
                </button>
            </div>

            <div
                className="scroll-soft min-h-0 flex-1 overflow-y-auto overscroll-contain"
                // Phones: the on-screen keyboard eats half the screen, so the pinned product
                // shrinks while a text field has focus.
                onFocus={(event) => {
                    if (isTextEntry(event.target)) setIsTyping(true)
                }}
                onBlur={(event) => {
                    if (isTextEntry(event.target)) setIsTyping(false)
                }}
            >
                <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
                    {/* Phones: the colors scroll away so the pinned product can stay small. */}
                    {colors.length > 1 && template.color ? (
                        <div className="lg:hidden">
                            <DesignColorSwatches
                                category={product.category}
                                colors={colors}
                                selectedId={template.color.id}
                                onChange={setColorId}
                                disabled={isSaving}
                            />
                        </div>
                    ) : null}
                    {/*
                      The product stays in view while the controls scroll: pinned at the top of
                      the scroll area (compact on phones) and beside the controls on wide screens,
                      so every change can be seen without scrolling back up.
                    */}
                    <div
                        className={cn(
                            'sticky top-0 z-10 -mx-4 space-y-3 bg-cream px-4 pb-3 shadow-[0_10px_12px_-12px_rgb(0_0_0/0.25)] sm:-mx-6',
                            isPreviewSmall || isTyping
                                ? '[--stage-max-h:16dvh]'
                                : '[--stage-max-h:30dvh]',
                            'sm:px-6 lg:mx-0 lg:self-start lg:bg-transparent lg:px-0 lg:pb-0 lg:shadow-none lg:[--stage-max-h:60dvh]',
                        )}
                        onDragOver={(event) => {
                            event.preventDefault()
                            setIsOver(true)
                        }}
                        onDragLeave={() => setIsOver(false)}
                        onDrop={onDrop}
                    >
                        {template.wrap3d ? (
                            <div
                                role="radiogroup"
                                aria-label="Vista del diseño"
                                className="mx-auto grid max-w-xs grid-cols-2 gap-1 rounded-full bg-blush-50 p-1"
                            >
                                {STAGE_VIEWS.map((option) => {
                                    const checked = option.value === stageView
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            role="radio"
                                            aria-checked={checked}
                                            onClick={() => setStageView(option.value)}
                                            className={cn(
                                                'flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-sm transition focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:outline-none',
                                                checked
                                                    ? 'bg-white font-semibold text-ink shadow-soft'
                                                    : 'text-ink-soft hover:text-ink',
                                            )}
                                        >
                                            {option.value === '3d' ? (
                                                <Rotate3d aria-hidden="true" className="size-4" />
                                            ) : null}
                                            {option.label}
                                        </button>
                                    )
                                })}
                            </div>
                        ) : null}
                        {colors.length > 1 && template.color ? (
                            <div className="hidden lg:block">
                                <DesignColorSwatches
                                    category={product.category}
                                    colors={colors}
                                    selectedId={template.color.id}
                                    onChange={setColorId}
                                    disabled={isSaving}
                                />
                            </div>
                        ) : null}
                        <div
                            className={cn(
                                'relative',
                                isOver && 'rounded-3xl ring-4 ring-blush-300',
                            )}
                        >
                            {is3d ? (
                                <MugPreview3D
                                    layers={renderLayers}
                                    print={template}
                                    bodyColor={mugColor}
                                    redrawKey={fontsVersion}
                                    className="rounded-3xl border border-line bg-white py-2"
                                />
                            ) : null}
                            <div className={cn(is3d && 'hidden')}>
                                <DesignStage
                                    category={product.category}
                                    color={color}
                                    accentColor={accentColor}
                                    template={template}
                                    layers={layers}
                                    selectedId={selectedId}
                                    onSelect={setSelectedId}
                                    onChange={setSelectedPlacement}
                                    fontsVersion={fontsVersion}
                                    mockupRef={mockupRef}
                                    disabled={isSaving}
                                />
                            </div>
                            {isDecoding ? (
                                <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-white/60">
                                    <Spinner
                                        size="lg"
                                        className="text-blush-500"
                                        label="Abriendo tus imágenes"
                                    />
                                </div>
                            ) : null}
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsPreviewSmall((value) => !value)}
                            aria-pressed={isPreviewSmall}
                            className="mx-auto flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-ink-soft hover:bg-blush-100 hover:text-ink lg:hidden"
                        >
                            {isPreviewSmall ? (
                                <Maximize2 aria-hidden="true" className="size-3.5" />
                            ) : (
                                <Minimize2 aria-hidden="true" className="size-3.5" />
                            )}
                            {isPreviewSmall ? 'Agrandar la vista' : 'Achicar la vista'}
                        </button>
                        <p className={cn(FIELD_HINT_CLASS, 'hidden lg:block')}>
                            {is3d
                                ? 'Arrastra la taza para girarla. Los cambios que hagas a tus capas se ven aquí al momento.'
                                : template.hint}{' '}
                            {layers.length && !is3d
                                ? 'Toca una capa para elegirla y arrástrala para moverla; pellizca o usa los controles para cambiar su tamaño y girarla.'
                                : ''}
                        </p>
                    </div>

                    <div className="space-y-5">
                        <p className={cn(FIELD_HINT_CLASS, 'lg:hidden')}>
                            {is3d
                                ? 'Arrastra la taza para girarla; los cambios a tus capas se ven al momento. Para mover una capa con el dedo, vuelve a «Editar».'
                                : layers.length
                                  ? template.wrap3d
                                      ? `Toca una capa en la franja para elegirla y arrástrala para moverla; pellizca para cambiar su tamaño. ${template.hint}`
                                      : 'Toca una capa en la vista para elegirla y arrástrala para moverla; pellizca para cambiar su tamaño.'
                                  : template.hint}
                        </p>
                        {reopenFailed ? (
                            <div className="space-y-2">
                                <Alert>{REOPEN_FAILED}</Alert>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    leadingIcon={
                                        <RotateCcw aria-hidden="true" className="size-4" />
                                    }
                                    onClick={startOver}
                                >
                                    Empezar de nuevo
                                </Button>
                            </div>
                        ) : layers.length ? (
                            <DesignLayers
                                layers={layers}
                                selectedId={selectedId}
                                onSelect={setSelectedId}
                                onMove={moveLayer}
                                onDuplicate={duplicateLayer}
                                onDelete={deleteLayer}
                                onAddImage={() => addInputRef.current?.click()}
                                onAddText={addText}
                                disabled={isSaving || isDecoding}
                            />
                        ) : isDecoding ? null : (
                            <div className="space-y-3">
                                <label
                                    htmlFor={inputId}
                                    className={cn(
                                        'flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition',
                                        isOver
                                            ? 'border-blush-400 bg-blush-50'
                                            : 'border-line bg-white hover:border-blush-200',
                                    )}
                                >
                                    <ImageUp aria-hidden="true" className="size-8 text-blush-500" />
                                    <span className="text-sm font-semibold text-ink">
                                        Arrastra tus imágenes aquí o toca para elegirlas
                                    </span>
                                    <span className={FIELD_HINT_CLASS}>
                                        JPG, PNG o WEBP, hasta 10 MB cada una · máximo{' '}
                                        {MAX_IMAGE_LAYERS}
                                    </span>
                                </label>
                                <Button
                                    variant="secondary"
                                    fullWidth
                                    leadingIcon={<Type aria-hidden="true" className="size-4" />}
                                    onClick={addText}
                                >
                                    O empieza con un texto
                                </Button>
                            </div>
                        )}

                        <input
                            ref={addInputRef}
                            id={inputId}
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/webp"
                            className="sr-only"
                            tabIndex={layers.length ? -1 : 0}
                            disabled={isSaving}
                            onChange={(event) => void addImages([...(event.target.files ?? [])])}
                        />
                        <input
                            ref={replaceInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="sr-only"
                            tabIndex={-1}
                            aria-hidden="true"
                            disabled={isSaving}
                            onChange={(event) => void replaceImage(event.target.files?.[0])}
                        />

                        {selected ? (
                            <section
                                aria-label={`Ajustes de ${layerLabel(layers, selected)}`}
                                className="space-y-4 rounded-2xl border-2 border-line bg-white/60 p-3"
                            >
                                <p className="text-sm font-semibold text-ink">
                                    {layerLabel(layers, selected)}
                                </p>
                                {selected.type === 'text' ? (
                                    <DesignTextControls
                                        value={selected}
                                        onChange={(change) =>
                                            updateLayer(selected.id, (layer) => ({
                                                ...layer,
                                                ...change,
                                            }))
                                        }
                                        disabled={isSaving}
                                    />
                                ) : null}
                                <DesignControls
                                    placement={selected.placement}
                                    onChange={setSelectedPlacement}
                                    onCenter={() =>
                                        setSelectedPlacement({ ...selected.placement, x: 0, y: 0 })
                                    }
                                    {...(selected.type === 'image'
                                        ? {
                                              onFit: () =>
                                                  setSelectedPlacement(
                                                      fitPlacement(
                                                          selected.image.height /
                                                              selected.image.width,
                                                          template.area,
                                                          selected.placement.rotation,
                                                      ),
                                                  ),
                                              onFill: () =>
                                                  setSelectedPlacement(
                                                      fillPlacement(
                                                          selected.image.height /
                                                              selected.image.width,
                                                          template.area,
                                                          selected.placement.rotation,
                                                      ),
                                                  ),
                                              onReplace: () => replaceInputRef.current?.click(),
                                          }
                                        : {})}
                                    disabled={isSaving}
                                />
                                {selectedDpi ? (
                                    <DesignResolution
                                        dpi={selectedDpi.dpi}
                                        level={selectedDpi.level}
                                    />
                                ) : null}
                            </section>
                        ) : null}

                        {lowDpis.length && (images.length > 1 || !selectedDpi) ? (
                            <Alert tone="error">
                                Poca resolución en{' '}
                                {lowDpis
                                    .map((entry) => `Imagen ${entry.number} (${entry.dpi} DPI)`)
                                    .join(', ')}
                                : puede verse borrosa al imprimir. Achícala o usa una imagen más
                                grande.
                            </Alert>
                        ) : null}

                        {images.length ? (
                            <CheckboxField
                                checked={rights}
                                onChange={setRights}
                                disabled={isSaving}
                            >
                                {DESIGN_RIGHTS_TEXT}
                            </CheckboxField>
                        ) : null}

                        {error ? <Alert>{error}</Alert> : null}
                    </div>
                </div>
            </div>

            <div className="shrink-0 space-y-2 border-t border-line px-4 py-3 sm:px-6">
                {isSaving ? (
                    <div
                        role="progressbar"
                        aria-label="Subiendo tu diseño"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={percent}
                        className="h-1.5 overflow-hidden rounded-full bg-blush-100"
                    >
                        <div
                            className="h-full rounded-full bg-blush-400 transition-[width]"
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                ) : null}
                {needsRights ? (
                    <p className={FIELD_HINT_CLASS}>Marca la casilla de derechos para continuar.</p>
                ) : textInvalid ? (
                    <p className={FIELD_HINT_CLASS}>Revisa tus textos para continuar.</p>
                ) : null}
                {/* Side by side even on phones: one row keeps the preview area tall. */}
                <div className="flex items-center gap-2 sm:justify-end">
                    <Button variant="secondary" onClick={onClose} className="shrink-0">
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => {
                            if (canSave) setIsConfirming(true)
                        }}
                        isLoading={isSaving}
                        disabled={!canSave}
                        className="min-w-0 flex-1 px-4 sm:flex-none sm:px-6"
                    >
                        {isSaving ? `Subiendo tu diseño… ${percent} %` : 'Usar este diseño'}
                    </Button>
                </div>
            </div>

            <ConfirmDialog
                isOpen={isConfirming}
                title="Antes de continuar"
                description={
                    <ul className="list-disc space-y-2 pl-5">
                        {designApproximationNotes(
                            template.color?.hex ?? null,
                            lowDpis.length > 0,
                            product.category,
                        ).map((note) => (
                            <li key={note}>{note}</li>
                        ))}
                    </ul>
                }
                cancelLabel="Revisar diseño"
                confirmLabel="Entendido, continuar"
                confirmVariant="primary"
                onConfirm={() => {
                    setIsConfirming(false)
                    void save()
                }}
                onClose={() => setIsConfirming(false)}
            />
        </div>
    )
}
