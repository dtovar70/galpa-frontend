import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

import type { DraftLayer } from '@/@types/design'
import { Alert, Spinner } from '@/components/ui'
import {
    loadDesignImage,
    releaseDesignImage,
    type LoadedDesignImage,
    type RenderLayer,
} from '@/utils/designImage'
import { ensureDesignFonts } from '@/utils/designText'
import {
    fontsOf,
    toRenderLayers,
    type EditorLayer,
} from '@/views/product/components/design/editorLayers'
import { MugPreview3D } from '@/views/product/components/design/MugPreview3D'

export interface MugPreviewDialogProps {
    isOpen: boolean
    onClose: () => void
    /** The saved design's layers (with the image files, kept in memory by the product page). */
    layers: readonly DraftLayer[]
    print: { widthCm: number; heightCm: number }
    bodyColor: string
}

/**
 * "Ver en 3D" from the product page: the saved mug design on the rotating mug. The image files
 * are decoded again while it is open and released when it closes. A native `<dialog>` like
 * ProofViewer (focus trap and Escape for free).
 */
export function MugPreviewDialog({
    isOpen,
    onClose,
    layers,
    print,
    bodyColor,
}: MugPreviewDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null)

    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return
        if (isOpen && !dialog.open) dialog.showModal()
        if (!isOpen && dialog.open) dialog.close()
    }, [isOpen])

    return (
        <dialog
            ref={dialogRef}
            aria-label="Tu taza en 3D"
            onCancel={(event) => {
                event.preventDefault()
                onClose()
            }}
            onClose={(event) => {
                if (event.target === event.currentTarget && isOpen) onClose()
            }}
            onClick={(event) => {
                if (event.target === event.currentTarget) onClose()
            }}
            className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-3xl bg-cream p-0 text-ink shadow-lift backdrop:bg-ink/60 backdrop:backdrop-blur-sm"
        >
            {isOpen ? (
                <div className="flex flex-col">
                    <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
                        <p className="font-display text-base">Tu taza en 3D</p>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Cerrar"
                            className="flex size-9 items-center justify-center rounded-full hover:bg-blush-100 focus-visible:ring-2 focus-visible:ring-blush-400"
                        >
                            <X aria-hidden="true" className="size-5" />
                        </button>
                    </div>
                    <div className="p-4 [--stage-max-h:60dvh]">
                        <SavedMug layers={layers} print={print} bodyColor={bodyColor} />
                    </div>
                </div>
            ) : null}
        </dialog>
    )
}

/** Decodes the saved layers, then shows them on the mug. */
function SavedMug({
    layers,
    print,
    bodyColor,
}: Pick<MugPreviewDialogProps, 'layers' | 'print' | 'bodyColor'>) {
    const [renderLayers, setRenderLayers] = useState<RenderLayer[] | null>(null)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        let cancelled = false
        const loaded: LoadedDesignImage[] = []
        const decode = async () => {
            const decoded: EditorLayer[] = []
            for (const layer of layers) {
                if (layer.type === 'text') {
                    decoded.push(layer)
                    continue
                }
                const image = await loadDesignImage(layer.file)
                if (cancelled) {
                    // Closed meanwhile: the cleanup has run already.
                    releaseDesignImage(image)
                    return null
                }
                loaded.push(image)
                decoded.push({ ...layer, image })
            }
            await ensureDesignFonts(fontsOf(decoded))
            return decoded
        }
        decode()
            .then((decoded) => {
                if (!cancelled && decoded) setRenderLayers(toRenderLayers(decoded))
            })
            .catch(() => {
                if (!cancelled) setFailed(true)
            })
        return () => {
            cancelled = true
            for (const image of loaded) releaseDesignImage(image)
        }
    }, [layers])

    if (failed) {
        return (
            <Alert>
                No pudimos abrir las imágenes de tu diseño para verlo en 3D. Igual puedes agregarlo
                al carrito.
            </Alert>
        )
    }
    if (!renderLayers) {
        return (
            <div className="flex aspect-[4/3] items-center justify-center">
                <Spinner size="lg" className="text-blush-500" label="Preparando tu taza" />
            </div>
        )
    }
    return (
        <MugPreview3D
            layers={renderLayers}
            print={print}
            bodyColor={bodyColor}
            className="rounded-3xl border border-line bg-white py-2"
        />
    )
}
