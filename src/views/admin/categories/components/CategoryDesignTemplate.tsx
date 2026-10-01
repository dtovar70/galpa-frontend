import { useId, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, ImageUp, Plus, Ratio, RefreshCw, Save, Trash2 } from 'lucide-react'

import type { AdminCategory, AdminDesignTemplateSettings } from '@/@types/admin'
import type { DesignPrintArea, DesignTemplateColor } from '@/@types/product'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Alert, Badge, Button, Input } from '@/components/ui'
import { FIELD_HINT_CLASS } from '@/components/ui/field.styles'
import { formatPrintSize, ILLUSTRATION_TEMPLATES } from '@/constants/design.constant'
import { NOTICE_DISMISS_MS } from '@/constants/ui.constant'
import { getErrorMessage, isApiError } from '@/services/errors'
import { cn } from '@/utils/cn'
import { toColorInputValue } from '@/utils/color'
import { moveItem } from '@/utils/moveItem'
import { aspectDiffers, fitAreaToAspect } from '@/utils/printArea'
import { PrintAreaEditor } from '@/views/admin/categories/components/PrintAreaEditor'
import {
    useAddTemplateColor,
    useDeleteTemplateColor,
    useReorderTemplateColors,
    useReplaceTemplatePhoto,
    useUpdateCategoryTemplate,
    useUpdateTemplateColor,
} from '@/views/admin/hooks/useAdminCategories'
import { useSession } from '@/views/admin/hooks/useSession'

const TEMPLATE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_TEMPLATE_BYTES = 10 * 1024 * 1024
const MIN_TEMPLATE_SIDE = 600
/** Mirrors the API's bounds for the print size. */
const PRINT_CM_MIN = 0.5
const PRINT_CM_MAX = 100
/** Mirrors the API's limit for a color name. */
const COLOR_NAME_MAX_LENGTH = 40
const HEX_6 = /^#[0-9A-Fa-f]{6}$/

/** Spanish reason to refuse a template photo before uploading it; null when it looks fine. */
async function templateFileProblem(file: File): Promise<string | null> {
    if (!TEMPLATE_TYPES.includes(file.type)) return 'La foto debe ser JPG, PNG o WEBP.'
    if (file.size > MAX_TEMPLATE_BYTES) return 'La foto puede pesar como máximo 10 MB.'
    const url = URL.createObjectURL(file)
    try {
        const image = new Image()
        image.src = url
        await image.decode()
        if (Math.min(image.naturalWidth, image.naturalHeight) < MIN_TEMPLATE_SIDE) {
            return `La foto debe medir al menos ${MIN_TEMPLATE_SIDE} px en su lado más corto (esta mide ${image.naturalWidth} × ${image.naturalHeight} px).`
        }
        return null
    } catch {
        return 'No pudimos abrir esta foto. Prueba con otro archivo JPG, PNG o WEBP.'
    } finally {
        URL.revokeObjectURL(url)
    }
}

/** "12,5" or "12.5" -> 12.5; null when it is not a valid print size. */
function parseCm(value: string): number | null {
    const normalized = value.trim().replace(',', '.')
    if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null
    const number = Number(normalized)
    return number >= PRINT_CM_MIN && number <= PRINT_CM_MAX ? number : null
}

function cmText(value: number | null): string {
    return value === null ? '' : String(value).replace('.', ',')
}

function plural(count: number, singular: string, pluralForm: string): string {
    return `${count} ${count === 1 ? singular : pluralForm}`
}

/** "  Azul   marino " -> "Azul marino" (as the API stores it). */
function cleanName(value: string): string {
    return value.trim().replace(/\s+/g, ' ')
}

/** Spanish problem with a color name, or null (the uniqueness is checked here too). */
function colorNameProblem(
    name: string,
    colors: readonly DesignTemplateColor[],
    exceptId?: string,
): string | null {
    const clean = cleanName(name)
    if (!clean) return 'Escribe el nombre del color, por ejemplo «Negro».'
    if (clean.length > COLOR_NAME_MAX_LENGTH) {
        return `El nombre puede tener hasta ${COLOR_NAME_MAX_LENGTH} caracteres.`
    }
    const taken = colors.some(
        (color) =>
            color.id !== exceptId &&
            color.name.toLocaleLowerCase('es') === clean.toLocaleLowerCase('es'),
    )
    return taken ? `Ya tienes un color llamado «${clean}» en esta plantilla.` : null
}

/** Field errors of a failed request, keyed by field. */
function fieldErrors(error: unknown): Record<string, string> {
    if (!isApiError(error)) return {}
    return Object.fromEntries(error.details.map((detail) => [detail.field, detail.errors[0] ?? '']))
}

const CM_ERROR = `Escribe una medida entre ${cmText(PRINT_CM_MIN)} y ${PRINT_CM_MAX} cm, con hasta 2 decimales.`
const HEX_ERROR = 'Escribe el color en formato #RRGGBB, por ejemplo #1F2937.'

/** A round garment swatch; white gets a visible border. */
function Swatch({ hex, className }: { hex: string; className?: string }) {
    return (
        <span
            aria-hidden="true"
            className={cn('inline-block shrink-0 rounded-full border border-line', className)}
            style={{ backgroundColor: toColorInputValue(hex) }}
        />
    )
}

export interface CategoryDesignTemplateProps {
    category: AdminCategory
}

/**
 * "Plantilla para diseñar": one photo of the blank product per garment color that customers
 * place their image on, where the print goes on each, and the real print size (shared by every
 * color). Saved apart from the category's texts. Only admins change it; editors see the colors.
 */
export function CategoryDesignTemplate({ category }: CategoryDesignTemplateProps) {
    const settings = category.designTemplateSettings
    const titleId = useId()
    const tabsId = useId()
    const [selectedId, setSelectedId] = useState<string | 'new' | null>(null)
    const [notice, setNotice] = useState<string | null>(null)

    const { data: session } = useSession()
    // Like deleting a category, the API only lets admins change the template.
    const canEdit = session?.role === 'ADMIN'

    const { colors } = settings
    const hasPhotos = colors.length > 0
    const atLimit = colors.length >= settings.maxColors
    const count = category.personalizableProductCount
    const missingSize =
        hasPhotos && (settings.printWidthCm === null || settings.printHeightCm === null)
    // The chosen tab, else the first color, else the "Agregar color" form.
    const selected =
        selectedId === 'new' && !atLimit
            ? null
            : (colors.find((color) => color.id === selectedId) ?? colors[0] ?? null)
    const showAddForm = canEdit && !atLimit && (selectedId === 'new' || !hasPhotos)
    // Mugs: the customer designs on the flat wrap and sees it in 3D (see `DesignTemplate.wrap3d`).
    const wrapTemplate = Object.hasOwn(ILLUSTRATION_TEMPLATES, category.slug)
        ? ILLUSTRATION_TEMPLATES[category.slug]!
        : null
    const wrapSize = wrapTemplate?.wrap3d
        ? formatPrintSize(
              settings.printWidthCm ?? wrapTemplate.widthCm,
              settings.printHeightCm ?? wrapTemplate.heightCm,
          )
        : null

    return (
        <section aria-labelledby={titleId} className="space-y-4 border-t border-line pt-6">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                    <h3 id={titleId} className="font-display text-lg text-ink">
                        Plantilla para diseñar
                    </h3>
                    <p className="text-sm text-ink-soft">
                        Sube una foto por cada color de prenda que ofreces, todas de frente y con el
                        mismo encuadre. Los clientes eligen el color y ponen su imagen sobre la
                        foto.
                    </p>
                </div>
                <Badge tone={category.designEnabled ? 'mint' : 'neutral'} size="sm">
                    {category.designEnabled ? 'Diseño activo' : 'Sin diseño'}
                </Badge>
            </div>

            {settings.designDisabled ? (
                <Alert tone="info">
                    Los llaveros no tienen «Diseñar con mi imagen» por ahora: vienen en formas
                    distintas (redondo, corazón…) y el área de impresión todavía es rectangular, así
                    que el diseño podría quedar fuera del llavero. Tus clientes los personalizan con
                    el campo de texto o enviándote la foto por WhatsApp. Las fotos que subas aquí se
                    guardan, pero no se usan.
                </Alert>
            ) : null}

            <p className={FIELD_HINT_CLASS}>
                {count === 0
                    ? 'Ningún producto de esta categoría está marcado como «personalizable»: marca los que quieras ofrecer con «Diseñar con mi imagen».'
                    : `La usarán ${plural(count, 'producto personalizable', 'productos personalizables')} de esta categoría (contando los ocultos).`}
                {!hasPhotos && settings.hasIllustration
                    ? ' Mientras no subas una foto, los clientes ven una ilustración genérica del producto.'
                    : ''}{' '}
                El color no descuenta inventario; el stock sigue siendo por versión.
            </p>

            {wrapSize ? (
                <Alert tone="info">
                    En tazas, el cliente diseña sobre la franja completa ({wrapSize}) y ve el
                    resultado en 3D. La foto de cada color se usa como referencia del color de la
                    taza; el área de impresión de la foto no se usa.
                </Alert>
            ) : null}
            {session && !canEdit ? (
                <Alert tone="info">
                    Solo un administrador puede cambiar la plantilla para diseñar.
                </Alert>
            ) : null}
            {canEdit && missingSize ? (
                <Alert tone="info">
                    Escribe el tamaño de impresión en cm y guarda: hasta entonces los clientes no
                    pueden diseñar sobre estas fotos.
                </Alert>
            ) : null}
            {notice ? (
                <Alert
                    key={notice}
                    tone="success"
                    autoDismissMs={NOTICE_DISMISS_MS}
                    onDismiss={() => setNotice(null)}
                >
                    {notice}
                </Alert>
            ) : null}

            {hasPhotos || canEdit ? (
                <div
                    role="tablist"
                    aria-label="Colores de la prenda"
                    className="flex flex-wrap items-center gap-2"
                >
                    {colors.map((color) => {
                        const isSelected = canEdit && !showAddForm && selected?.id === color.id
                        return (
                            <button
                                key={color.id}
                                type="button"
                                role="tab"
                                id={`${tabsId}-${color.id}`}
                                aria-selected={isSelected}
                                aria-controls={`${tabsId}-panel`}
                                onClick={() => setSelectedId(color.id)}
                                disabled={!canEdit}
                                className={cn(
                                    'flex h-10 items-center gap-2 rounded-full border-2 px-3 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-blush-400 disabled:cursor-default',
                                    isSelected
                                        ? 'border-blush-400 bg-blush-50 text-ink'
                                        : 'border-line bg-white text-ink-soft hover:border-blush-200',
                                )}
                            >
                                <Swatch hex={color.hex} className="size-5" />
                                {color.name}
                            </button>
                        )
                    })}
                    {canEdit ? (
                        <button
                            type="button"
                            role="tab"
                            aria-selected={showAddForm}
                            aria-controls={`${tabsId}-panel`}
                            onClick={() => setSelectedId('new')}
                            disabled={atLimit}
                            title={
                                atLimit
                                    ? `Puedes ofrecer como máximo ${settings.maxColors} colores.`
                                    : undefined
                            }
                            className={cn(
                                'flex h-10 items-center gap-1.5 rounded-full border-2 border-dashed px-3 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-blush-400 disabled:cursor-not-allowed disabled:opacity-50',
                                showAddForm
                                    ? 'border-blush-400 bg-blush-50 text-ink'
                                    : 'border-line text-blush-700 hover:border-blush-200',
                            )}
                        >
                            <Plus aria-hidden="true" className="size-4" />
                            Agregar color
                        </button>
                    ) : null}
                </div>
            ) : null}
            {canEdit ? (
                <p className={FIELD_HINT_CLASS}>
                    {colors.length} de {settings.maxColors} colores. El primero es el que ven los
                    clientes al abrir el editor.
                </p>
            ) : null}

            {canEdit ? (
                <div
                    id={`${tabsId}-panel`}
                    role="tabpanel"
                    aria-labelledby={
                        selected && !showAddForm ? `${tabsId}-${selected.id}` : undefined
                    }
                    aria-label={showAddForm ? 'Agregar color' : undefined}
                >
                    {showAddForm ? (
                        <AddColorForm
                            slug={category.slug}
                            colors={colors}
                            isFirst={!hasPhotos}
                            onAdded={(color, next) => {
                                setSelectedId(color.id)
                                setNotice(
                                    `Agregamos el color «${color.name}». ${next ? 'Revisa' : 'Ahora ubica'} el área de impresión y guarda.`,
                                )
                            }}
                        />
                    ) : selected ? (
                        <ColorPanel
                            // A saved change (or a new photo) starts the form from stored values.
                            key={JSON.stringify(selected)}
                            slug={category.slug}
                            color={selected}
                            colors={colors}
                            settings={settings}
                            hasIllustration={settings.hasIllustration}
                            onNotice={setNotice}
                            onRemoved={() => setSelectedId(null)}
                        />
                    ) : null}
                </div>
            ) : null}

            {canEdit && (hasPhotos || settings.hasIllustration) ? (
                <PrintSizeForm
                    key={`${settings.printWidthCm}-${settings.printHeightCm}`}
                    slug={category.slug}
                    settings={settings}
                    onSaved={() => setNotice('Tamaño de impresión guardado.')}
                />
            ) : null}
        </section>
    )
}

interface AddColorFormProps {
    slug: string
    colors: DesignTemplateColor[]
    /** No color yet: suggest "Blanco". */
    isFirst: boolean
    /** `next`: it was not the first color (its area was copied from the first one). */
    onAdded: (color: DesignTemplateColor, next: boolean) => void
}

/** "Agregar color": name, swatch and photo, uploaded together. */
function AddColorForm({ slug, colors, isFirst, onAdded }: AddColorFormProps) {
    const inputId = useId()
    const inputRef = useRef<HTMLInputElement>(null)
    const add = useAddTemplateColor(slug)
    const [name, setName] = useState(isFirst ? 'Blanco' : '')
    const [hex, setHex] = useState(isFirst ? '#FFFFFF' : '#1F2937')
    const [file, setFile] = useState<File | null>(null)
    const [fileError, setFileError] = useState<string | null>(null)
    const [isChecking, setIsChecking] = useState(false)
    const [showErrors, setShowErrors] = useState(false)
    const [serverErrors, setServerErrors] = useState<Record<string, string>>({})

    const isBusy = add.isPending || isChecking
    const nameError = serverErrors.colorName ?? (showErrors ? colorNameProblem(name, colors) : null)
    const hexError = serverErrors.colorHex ?? (showErrors && !HEX_6.test(hex) ? HEX_ERROR : null)

    const choose = async (candidate: File | undefined) => {
        if (inputRef.current) inputRef.current.value = ''
        if (!candidate || isBusy) return
        setFileError(null)
        setIsChecking(true)
        const problem = await templateFileProblem(candidate)
        setIsChecking(false)
        if (problem) {
            setFileError(problem)
            setFile(null)
            return
        }
        setFile(candidate)
    }

    const submit = (event: FormEvent) => {
        event.preventDefault()
        setShowErrors(true)
        setServerErrors({})
        if (colorNameProblem(name, colors) || !HEX_6.test(hex)) return
        if (!file) {
            setFileError('Elige la foto de la prenda en este color.')
            return
        }
        const known = new Set(colors.map((color) => color.id))
        add.mutate(
            { colorName: cleanName(name), colorHex: hex.toUpperCase(), file },
            {
                onSuccess: (category) => {
                    const created = category.designTemplateSettings.colors.find(
                        (color) => !known.has(color.id),
                    )
                    if (created) onAdded(created, known.size > 0)
                },
                onError: (error) => setServerErrors(fieldErrors(error)),
            },
        )
    }

    return (
        <form
            onSubmit={submit}
            noValidate
            className="space-y-4 rounded-2xl border border-line bg-white p-4"
        >
            <div className="grid items-start gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <Input
                    label="Nombre del color"
                    placeholder="Negro"
                    value={name}
                    maxLength={COLOR_NAME_MAX_LENGTH}
                    onChange={(event) => setName(event.target.value)}
                    error={nameError ?? undefined}
                    disabled={isBusy}
                />
                <HexField value={hex} onChange={setHex} error={hexError} disabled={isBusy} />
            </div>

            <input
                ref={inputRef}
                id={inputId}
                type="file"
                accept={TEMPLATE_TYPES.join(',')}
                className="sr-only"
                disabled={isBusy}
                onChange={(event) => void choose(event.target.files?.[0])}
            />
            <label
                htmlFor={inputId}
                className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line bg-cream/40 px-4 py-6 text-center transition hover:border-blush-200"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                    event.preventDefault()
                    void choose(event.dataTransfer.files[0])
                }}
            >
                <ImageUp aria-hidden="true" className="size-8 text-blush-500" />
                <span className="text-sm font-semibold break-all text-ink">
                    {isChecking
                        ? 'Revisando la foto…'
                        : file
                          ? file.name
                          : 'Elige o arrastra la foto de la prenda en este color'}
                </span>
                <span className={FIELD_HINT_CLASS}>
                    JPG, PNG o WEBP, hasta 10 MB y de al menos {MIN_TEMPLATE_SIDE} px por lado. De
                    frente, sin estampado y con el mismo encuadre que los demás colores.
                </span>
            </label>

            {fileError ? <Alert>{fileError}</Alert> : null}
            {serverErrors.file ? <Alert>{serverErrors.file}</Alert> : null}
            {add.isError && !Object.keys(serverErrors).length ? (
                <Alert>{getErrorMessage(add.error)}</Alert>
            ) : null}

            <div className="flex justify-end">
                <Button
                    type="submit"
                    isLoading={add.isPending}
                    disabled={isBusy}
                    leadingIcon={<Plus aria-hidden="true" className="size-4" />}
                >
                    {add.isPending ? 'Subiendo la foto…' : 'Agregar color'}
                </Button>
            </div>
        </form>
    )
}

/** The swatch: a color picker next to its `#RRGGBB` text. */
function HexField({
    value,
    onChange,
    error,
    disabled,
}: {
    value: string
    onChange: (hex: string) => void
    error: string | null
    disabled: boolean
}) {
    return (
        <div className="flex items-start gap-2">
            <input
                type="color"
                aria-label="Elegir el color"
                value={toColorInputValue(value)}
                onChange={(event) => onChange(event.target.value.toUpperCase())}
                disabled={disabled}
                className="mt-7 size-11 shrink-0 cursor-pointer rounded-full border-2 border-line bg-white p-1"
            />
            <div className="w-32">
                <Input
                    label="Código"
                    value={value}
                    maxLength={7}
                    onChange={(event) => onChange(event.target.value.trim().toUpperCase())}
                    error={error ?? undefined}
                    disabled={disabled}
                />
            </div>
        </div>
    )
}

interface ColorPanelProps {
    slug: string
    color: DesignTemplateColor
    colors: DesignTemplateColor[]
    settings: AdminDesignTemplateSettings
    hasIllustration: boolean
    onNotice: (notice: string) => void
    onRemoved: () => void
}

/** One color: its name and swatch, its print area on the photo, and its photo actions. */
function ColorPanel({
    slug,
    color,
    colors,
    settings,
    hasIllustration,
    onNotice,
    onRemoved,
}: ColorPanelProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const update = useUpdateTemplateColor(slug)
    const replace = useReplaceTemplatePhoto(slug)
    const remove = useDeleteTemplateColor(slug)
    const reorder = useReorderTemplateColors(slug)
    const [name, setName] = useState(color.name)
    const [hex, setHex] = useState(color.hex)
    const [area, setArea] = useState<DesignPrintArea>(color.printArea)
    const [fileError, setFileError] = useState<string | null>(null)
    const [isChecking, setIsChecking] = useState(false)
    const [isConfirmingRemove, setIsConfirmingRemove] = useState(false)
    const [showErrors, setShowErrors] = useState(false)
    const [serverErrors, setServerErrors] = useState<Record<string, string>>({})

    const index = colors.findIndex((candidate) => candidate.id === color.id)
    const isBusy =
        update.isPending || replace.isPending || remove.isPending || reorder.isPending || isChecking
    const photo = { url: color.imageUrl, width: color.width, height: color.height }
    const { printWidthCm: widthCm, printHeightCm: heightCm } = settings
    const printAspect = widthCm && heightCm ? heightCm / widthCm : null
    const differs = printAspect ? aspectDiffers(area, photo, printAspect) : false
    const isDirty =
        name !== color.name ||
        hex !== color.hex ||
        JSON.stringify(area) !== JSON.stringify(color.printArea)
    const nameError =
        serverErrors.colorName ?? (showErrors ? colorNameProblem(name, colors, color.id) : null)
    const hexError = serverErrors.colorHex ?? (showErrors && !HEX_6.test(hex) ? HEX_ERROR : null)
    const areaError = Object.entries(serverErrors).find(([field]) =>
        field.startsWith('printArea'),
    )?.[1]
    const isLast = colors.length === 1

    const submit = (event: FormEvent) => {
        event.preventDefault()
        setShowErrors(true)
        setServerErrors({})
        if (colorNameProblem(name, colors, color.id) || !HEX_6.test(hex)) return
        update.mutate(
            {
                colorId: color.id,
                input: {
                    ...(cleanName(name) !== color.name ? { colorName: cleanName(name) } : {}),
                    ...(hex.toUpperCase() !== color.hex ? { colorHex: hex.toUpperCase() } : {}),
                    printArea: area,
                },
            },
            {
                onSuccess: () => onNotice(`Guardamos el color «${cleanName(name)}».`),
                onError: (error) => setServerErrors(fieldErrors(error)),
            },
        )
    }

    const choosePhoto = async (candidate: File | undefined) => {
        if (inputRef.current) inputRef.current.value = ''
        if (!candidate || isBusy) return
        setFileError(null)
        setIsChecking(true)
        const problem = await templateFileProblem(candidate)
        setIsChecking(false)
        if (problem) {
            setFileError(problem)
            return
        }
        replace.mutate(
            { colorId: color.id, file: candidate },
            {
                onSuccess: () =>
                    onNotice(
                        'Reemplazamos la foto. Revisa que el área de impresión siga en su sitio.',
                    ),
            },
        )
    }

    const move = (step: -1 | 1) => {
        const ids = moveItem(
            colors.map((candidate) => candidate.id),
            index,
            index + step,
        )
        reorder.mutate(ids)
    }

    return (
        <form onSubmit={submit} noValidate className="space-y-4">
            <div className="grid items-start gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <Input
                    label="Nombre del color"
                    value={name}
                    maxLength={COLOR_NAME_MAX_LENGTH}
                    onChange={(event) => setName(event.target.value)}
                    error={nameError ?? undefined}
                    disabled={isBusy}
                />
                <HexField value={hex} onChange={setHex} error={hexError} disabled={isBusy} />
            </div>

            <div className="space-y-2">
                <PrintAreaEditor
                    imageUrl={photo.url}
                    photoWidth={photo.width}
                    photoHeight={photo.height}
                    area={area}
                    onChange={setArea}
                    disabled={isBusy}
                />
                <p className={FIELD_HINT_CLASS}>
                    Arrastra el rectángulo hasta donde se imprime y ajústalo desde sus esquinas. Con
                    el teclado: flechas para moverlo, Alt + flechas para cambiar su tamaño.
                </p>
            </div>

            {differs && widthCm && heightCm && printAspect ? (
                <Alert tone="info">
                    <span className="block">
                        El rectángulo no tiene la misma proporción que la impresión (
                        {formatPrintSize(widthCm, heightCm)}): los clientes verían el área con otra
                        forma. Puedes guardarlo así o ajustarlo.
                    </span>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="mt-2"
                        onClick={() => setArea(fitAreaToAspect(area, photo, printAspect))}
                        leadingIcon={<Ratio aria-hidden="true" className="size-4" />}
                    >
                        Ajustar proporción
                    </Button>
                </Alert>
            ) : null}

            {areaError ? <Alert>{areaError}</Alert> : null}
            {fileError ? <Alert>{fileError}</Alert> : null}
            {[update, replace, reorder].map((mutation, key) =>
                mutation.isError && !Object.keys(serverErrors).length ? (
                    <Alert key={key}>{getErrorMessage(mutation.error)}</Alert>
                ) : null,
            )}

            <input
                ref={inputRef}
                type="file"
                accept={TEMPLATE_TYPES.join(',')}
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                disabled={isBusy}
                onChange={(event) => void choosePhoto(event.target.files?.[0])}
            />
            <div className="flex flex-wrap items-center gap-2">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => inputRef.current?.click()}
                    isLoading={replace.isPending || isChecking}
                    disabled={isBusy}
                    leadingIcon={<RefreshCw aria-hidden="true" className="size-4" />}
                >
                    Reemplazar foto
                </Button>
                {colors.length > 1 ? (
                    <>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => move(-1)}
                            disabled={isBusy || index <= 0}
                            aria-label={`Mover «${color.name}» antes`}
                            leadingIcon={<ArrowLeft aria-hidden="true" className="size-4" />}
                        >
                            Antes
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => move(1)}
                            disabled={isBusy || index >= colors.length - 1}
                            aria-label={`Mover «${color.name}» después`}
                            leadingIcon={<ArrowRight aria-hidden="true" className="size-4" />}
                        >
                            Después
                        </Button>
                    </>
                ) : null}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        remove.reset()
                        setIsConfirmingRemove(true)
                    }}
                    disabled={isBusy}
                    leadingIcon={<Trash2 aria-hidden="true" className="size-4" />}
                >
                    Eliminar color
                </Button>
                <Button
                    type="submit"
                    className="ml-auto"
                    disabled={!isDirty || isBusy}
                    isLoading={update.isPending}
                    leadingIcon={<Save aria-hidden="true" className="size-4" />}
                >
                    Guardar color
                </Button>
            </div>

            <ConfirmDialog
                isOpen={isConfirmingRemove}
                title={`¿Eliminar el color «${color.name}»?`}
                description={
                    isLast
                        ? hasIllustration
                            ? 'Es el único color: los clientes volverán a ver la ilustración genérica del producto al diseñar.'
                            : 'Es el único color: los productos de esta categoría dejarán de ofrecer «Diseñar con mi imagen» hasta que agregues otro.'
                        : 'Borramos su foto. Los pedidos que ya se hicieron en este color lo conservan.'
                }
                confirmLabel="Eliminar color"
                isLoading={remove.isPending}
                error={remove.isError ? getErrorMessage(remove.error) : undefined}
                onConfirm={() =>
                    remove.mutate(color.id, {
                        onSuccess: () => {
                            setIsConfirmingRemove(false)
                            onRemoved()
                            onNotice(`Eliminamos el color «${color.name}».`)
                        },
                    })
                }
                onClose={() => setIsConfirmingRemove(false)}
            />
        </form>
    )
}

interface PrintSizeFormProps {
    slug: string
    settings: AdminDesignTemplateSettings
    onSaved: () => void
}

/** The real size of the print, the same for every color. */
function PrintSizeForm({ slug, settings, onSaved }: PrintSizeFormProps) {
    const update = useUpdateCategoryTemplate(slug)
    const [widthText, setWidthText] = useState(cmText(settings.printWidthCm))
    const [heightText, setHeightText] = useState(cmText(settings.printHeightCm))
    const [showErrors, setShowErrors] = useState(false)
    const [serverErrors, setServerErrors] = useState<Record<string, string>>({})

    const widthCm = parseCm(widthText)
    const heightCm = parseCm(heightText)
    const isDirty =
        widthText !== cmText(settings.printWidthCm) || heightText !== cmText(settings.printHeightCm)

    const submit = (event: FormEvent) => {
        event.preventDefault()
        setShowErrors(true)
        setServerErrors({})
        if (widthCm === null || heightCm === null) return
        update.mutate(
            { printWidthCm: widthCm, printHeightCm: heightCm },
            { onSuccess: onSaved, onError: (error) => setServerErrors(fieldErrors(error)) },
        )
    }

    const widthError =
        serverErrors.printWidthCm ?? (showErrors && widthCm === null ? CM_ERROR : undefined)
    const heightError =
        serverErrors.printHeightCm ?? (showErrors && heightCm === null ? CM_ERROR : undefined)

    return (
        <form onSubmit={submit} noValidate className="space-y-3 border-t border-line pt-4">
            <div className="grid grid-cols-2 items-start gap-3 sm:max-w-md">
                <Input
                    label="Ancho de impresión (cm)"
                    inputMode="decimal"
                    value={widthText}
                    onChange={(event) => setWidthText(event.target.value)}
                    error={widthError}
                    disabled={update.isPending}
                />
                <Input
                    label="Alto de impresión (cm)"
                    inputMode="decimal"
                    value={heightText}
                    onChange={(event) => setHeightText(event.target.value)}
                    error={heightError}
                    disabled={update.isPending}
                />
            </div>
            <p className={FIELD_HINT_CLASS}>
                La medida real del área que se imprime en el producto, igual para todos los colores.
                Con ella calculamos si la imagen del cliente tiene buena resolución.
            </p>
            {update.isError && !Object.keys(serverErrors).length ? (
                <Alert>{getErrorMessage(update.error)}</Alert>
            ) : null}
            <div className="flex justify-end">
                <Button
                    type="submit"
                    variant="secondary"
                    disabled={!isDirty || update.isPending}
                    isLoading={update.isPending}
                    leadingIcon={<Save aria-hidden="true" className="size-4" />}
                >
                    Guardar tamaño
                </Button>
            </div>
        </form>
    )
}
