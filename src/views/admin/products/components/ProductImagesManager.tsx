import { useId, useRef, useState, type DragEvent } from 'react'
import { ArrowLeft, ArrowRight, GripVertical, ImagePlus, Trash2, UploadCloud } from 'lucide-react'

import type { AdminProduct } from '@/@types/admin'
import type { ProductImage } from '@/@types/product'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Alert, Button, Card, Spinner } from '@/components/ui'
import { getErrorMessage } from '@/services/errors'
import { cldSrcSet, cldUrl } from '@/utils/cloudinary'
import { cn } from '@/utils/cn'
import { moveItem } from '@/utils/moveItem'
import {
    useDeleteProductImage,
    useReorderProductImages,
    useUploadProductImages,
} from '@/views/admin/hooks/useAdminProducts'

/** Same limits the API enforces (see the products upload endpoint). */
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_FILES_PER_UPLOAD = 8

const iconButtonClass =
    'flex size-9 items-center justify-center rounded-full bg-white/95 text-ink shadow-soft transition hover:bg-blush-100 focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40'

/** Client-side check so a bad batch fails fast, with a message that names the file. */
function validateFiles(files: File[]): string | null {
    if (files.length === 0) return null
    if (files.length > MAX_FILES_PER_UPLOAD) {
        return `Puedes subir hasta ${MAX_FILES_PER_UPLOAD} imágenes a la vez. Elegiste ${files.length}.`
    }
    for (const file of files) {
        if (!ALLOWED_TYPES.has(file.type)) {
            return `"${file.name}" no es una imagen JPG, PNG o WEBP.`
        }
        if (file.size > MAX_FILE_BYTES) {
            return `"${file.name}" pesa más de 5 MB. Redúcela e intenta de nuevo.`
        }
    }
    return null
}

export interface ProductImagesManagerProps {
    product: AdminProduct
}

export function ProductImagesManager({ product }: ProductImagesManagerProps) {
    const inputId = useId()
    const inputRef = useRef<HTMLInputElement>(null)
    const [isDragOver, setIsDragOver] = useState(false)
    const [draggedId, setDraggedId] = useState<string | null>(null)
    const [clientError, setClientError] = useState<string | null>(null)
    const [pendingDelete, setPendingDelete] = useState<ProductImage | null>(null)
    const [uploadCount, setUploadCount] = useState(0)

    const upload = useUploadProductImages(product.id)
    const reorder = useReorderProductImages(product.id)
    const removeImage = useDeleteProductImage(product.id)

    const images = product.images
    const isBusy = upload.isPending || reorder.isPending || removeImage.isPending

    const startUpload = (files: File[]) => {
        setClientError(null)
        upload.reset()
        const problem = validateFiles(files)
        if (problem) {
            setClientError(problem)
            return
        }
        if (files.length === 0) return
        setUploadCount(files.length)
        upload.mutate(files)
    }

    const persistOrder = (next: ProductImage[]) => {
        reorder.mutate(next.map((image) => image.id))
    }

    const move = (index: number, offset: -1 | 1) => {
        const target = index + offset
        if (target < 0 || target >= images.length) return
        persistOrder(moveItem(images, index, target))
    }

    const handleDropZoneDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        setIsDragOver(false)
        // Reordering drags carry no files; only react to files from the desktop.
        if (draggedId || upload.isPending) return
        startUpload(Array.from(event.dataTransfer.files))
    }

    const handleThumbDrop = (targetId: string) => {
        const from = images.findIndex((image) => image.id === draggedId)
        const to = images.findIndex((image) => image.id === targetId)
        setDraggedId(null)
        if (from < 0 || to < 0 || from === to) return
        persistOrder(moveItem(images, from, to))
    }

    const confirmDelete = () => {
        if (!pendingDelete) return
        removeImage.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
    }

    const errorMessage =
        clientError ??
        (upload.isError ? getErrorMessage(upload.error) : null) ??
        (reorder.isError ? getErrorMessage(reorder.error) : null)

    return (
        <Card className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="font-display text-xl text-ink">Fotos</h2>
                    <p className="text-sm text-ink-soft">
                        La primera foto es la portada del producto en la tienda. Sin fotos se
                        muestra la ilustración.
                    </p>
                </div>
                {reorder.isPending ? (
                    <span className="flex items-center gap-2 text-sm text-ink-soft">
                        <Spinner size="sm" label="Guardando el orden" />
                        Guardando orden…
                    </span>
                ) : null}
            </div>

            <div
                onDragOver={(event) => {
                    if (draggedId) return
                    event.preventDefault()
                    setIsDragOver(true)
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDropZoneDrop}
                className={cn(
                    'flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed px-6 py-8 text-center transition',
                    isDragOver ? 'border-blush-400 bg-blush-50' : 'border-blush-200 bg-cream',
                )}
            >
                {upload.isPending ? (
                    <>
                        <Spinner size="lg" className="text-blush-500" label="Subiendo imágenes" />
                        <p className="font-semibold text-ink">
                            Subiendo {uploadCount} {uploadCount === 1 ? 'imagen' : 'imágenes'}…
                        </p>
                    </>
                ) : (
                    <>
                        <span
                            aria-hidden="true"
                            className="flex size-12 items-center justify-center rounded-full bg-white text-blush-500 shadow-soft"
                        >
                            <UploadCloud className="size-6" />
                        </span>
                        <p className="font-semibold text-ink">Arrastra tus fotos aquí</p>
                        <p className="text-sm text-ink-soft">
                            JPG, PNG o WEBP · hasta 5 MB cada una · máximo {MAX_FILES_PER_UPLOAD}{' '}
                            por vez
                        </p>
                        <input
                            ref={inputRef}
                            id={inputId}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            className="sr-only"
                            onChange={(event) => {
                                startUpload(Array.from(event.target.files ?? []))
                                event.target.value = ''
                            }}
                        />
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => inputRef.current?.click()}
                            leadingIcon={<ImagePlus aria-hidden="true" className="size-4" />}
                        >
                            Elegir archivos
                        </Button>
                    </>
                )}
            </div>

            {errorMessage ? <Alert>{errorMessage}</Alert> : null}

            {images.length === 0 ? (
                <p className="text-sm text-ink-soft">Este producto todavía no tiene fotos.</p>
            ) : (
                <ol className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {images.map((image, index) => (
                        <li
                            key={image.id}
                            draggable={!isBusy}
                            onDragStart={(event) => {
                                event.dataTransfer.effectAllowed = 'move'
                                event.dataTransfer.setData('text/plain', image.id)
                                setDraggedId(image.id)
                            }}
                            onDragEnd={() => setDraggedId(null)}
                            onDragOver={(event) => {
                                if (!draggedId) return
                                event.preventDefault()
                                event.dataTransfer.dropEffect = 'move'
                            }}
                            onDrop={(event) => {
                                if (!draggedId) return
                                event.preventDefault()
                                handleThumbDrop(image.id)
                            }}
                            className={cn(
                                'group relative overflow-hidden rounded-2xl border-2 bg-white transition',
                                draggedId === image.id
                                    ? 'border-blush-400 opacity-50'
                                    : 'border-line',
                                !isBusy && 'cursor-grab active:cursor-grabbing',
                            )}
                        >
                            <img
                                src={cldUrl(image.url, 480)}
                                srcSet={cldSrcSet(image.url, [160, 320, 480])}
                                sizes="(min-width: 640px) 10rem, 45vw"
                                alt={image.alt ?? `Foto ${index + 1} de ${product.name}`}
                                loading="lazy"
                                decoding="async"
                                draggable={false}
                                className="aspect-square w-full object-cover"
                            />

                            <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-xs font-bold text-ink shadow-soft">
                                <GripVertical
                                    aria-hidden="true"
                                    className="size-3.5 text-ink-soft"
                                />
                                {index === 0 ? 'Portada' : index + 1}
                            </span>

                            <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-1">
                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => move(index, -1)}
                                        disabled={isBusy || index === 0}
                                        aria-label={`Mover la foto ${index + 1} antes`}
                                        className={iconButtonClass}
                                    >
                                        <ArrowLeft aria-hidden="true" className="size-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => move(index, 1)}
                                        disabled={isBusy || index === images.length - 1}
                                        aria-label={`Mover la foto ${index + 1} después`}
                                        className={iconButtonClass}
                                    >
                                        <ArrowRight aria-hidden="true" className="size-4" />
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        removeImage.reset()
                                        setPendingDelete(image)
                                    }}
                                    disabled={isBusy}
                                    aria-label={`Eliminar la foto ${index + 1}`}
                                    className={cn(iconButtonClass, 'text-blush-700')}
                                >
                                    <Trash2 aria-hidden="true" className="size-4" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ol>
            )}

            <ConfirmDialog
                isOpen={pendingDelete !== null}
                title="¿Eliminar esta foto?"
                description="La foto se borra de la tienda y del almacenamiento. No se puede deshacer."
                confirmLabel="Eliminar foto"
                isLoading={removeImage.isPending}
                error={removeImage.isError ? getErrorMessage(removeImage.error) : undefined}
                onConfirm={confirmDelete}
                onClose={() => setPendingDelete(null)}
            />
        </Card>
    )
}
