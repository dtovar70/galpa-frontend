import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
    ArrowLeft,
    ArrowLeftRight,
    Download,
    FileOutput,
    Mail,
    MessageCircle,
    ReceiptText,
    Save,
    Trash2,
} from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'

import type { Quote } from '@/@types/quote'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { IdNumberField } from '@/components/shared/IdNumberField'
import { Alert, Button, Card, Input, Skeleton, Textarea } from '@/components/ui'
import { DatePicker } from '@/components/ui/DatePicker'
import {
    isQuoteConvertible,
    isQuoteEditable,
    QUOTE_MANUAL_TRANSITIONS,
    QUOTE_STATUS_LABELS,
} from '@/constants/quote.constant'
import { ADMIN_ROUTES, adminOrderPath, adminQuotePath } from '@/constants/route.constant'
import { NOTICE_DISMISS_MS } from '@/constants/ui.constant'
import { AdminQuoteService } from '@/services/AdminQuoteService'
import { getErrorMessage, isApiError } from '@/services/errors'
import { withCapitalizedWords } from '@/utils/capitalizeWords'
import { formatDateTime, formatDay, todayInCaracas } from '@/utils/formatDate'
import { useExchangeRate } from '@/utils/hooks/useExchangeRate'
import { saveBlob } from '@/utils/saveBlob'
import { AdminPageHeader } from '@/views/admin/components/AdminPageHeader'
import {
    useAdminQuote,
    useDeleteQuote,
    useQuoteWhatsApp,
    useSaveQuote,
    useSendQuote,
} from '@/views/admin/hooks/useAdminQuotes'
import { toOptionalNumber } from '@/views/admin/products/schema/product.schema'
import { QuoteConvertDialog } from '@/views/admin/quotes/components/QuoteConvertDialog'
import { QuoteItemsEditor } from '@/views/admin/quotes/components/QuoteItemsEditor'
import { QuoteStatusBadge } from '@/views/admin/quotes/components/QuoteStatusBadge'
import { QuoteStatusDialog } from '@/views/admin/quotes/components/QuoteStatusDialog'
import { QuoteTotals } from '@/views/admin/quotes/components/QuoteTotals'
import {
    emptyQuoteForm,
    QUOTE_NOTES_MAX_LENGTH,
    QUOTE_TERMS_MAX_LENGTH,
    quoteFormPath,
    quoteFormSchema,
    toQuoteFormValues,
    toQuoteInput,
    type QuoteFormValues,
} from '@/views/admin/quotes/schema/quote.schema'

const sectionTitleClass = 'text-xl text-ink'

type Dialog = 'status' | 'convert' | 'send' | 'delete' | null

/** `/admin/cotizaciones/nueva` and `/admin/cotizaciones/:code`. */
export function AdminQuoteEditorView() {
    const { code } = useParams()
    const quote = useAdminQuote(code)

    if (code && quote.isPending) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton shape="block" className="h-64" />
                <Skeleton shape="block" className="h-96" />
            </div>
        )
    }

    if (code && quote.isError) {
        return (
            <EmptyState
                title={
                    isApiError(quote.error, 404)
                        ? 'No encontramos esta cotización'
                        : 'No pudimos cargar la cotización'
                }
                description={getErrorMessage(quote.error)}
                icon={<ReceiptText className="size-6" />}
                action={
                    <Button variant="secondary" onClick={() => void quote.refetch()}>
                        Reintentar
                    </Button>
                }
            />
        )
    }

    // Remounted per quote, so the form starts from the right values.
    return <QuoteEditor key={quote.data?.code ?? 'new'} quote={quote.data} />
}

function QuoteEditor({ quote }: { quote: Quote | undefined }) {
    const navigate = useNavigate()
    const save = useSaveQuote(quote?.code)
    const rate = useExchangeRate()
    const [notice, setNotice] = useState<string | null>(null)
    const [actionError, setActionError] = useState<string | null>(null)
    const [dialog, setDialog] = useState<Dialog>(null)
    const [isDownloading, setIsDownloading] = useState(false)
    const editable = quote ? isQuoteEditable(quote.status) : true

    const {
        control,
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isDirty, isSubmitting },
    } = useForm<QuoteFormValues>({
        resolver: zodResolver(quoteFormSchema),
        defaultValues: quote ? toQuoteFormValues(quote) : emptyQuoteForm(),
    })

    // A saved change (status, send) refreshes the read-only parts; the form keeps its edits.
    useEffect(() => {
        if (quote && !isDirty) reset(toQuoteFormValues(quote))
    }, [quote, isDirty, reset])

    const submit = handleSubmit(async (values) => {
        setActionError(null)
        try {
            const saved = await save.mutateAsync(toQuoteInput(values))
            if (!quote) {
                await navigate(adminQuotePath(saved.code), { replace: true })
                return
            }
            reset(toQuoteFormValues(saved))
            setNotice('Cotización guardada.')
        } catch (error) {
            if (isApiError(error, 400) && error.details.length) {
                for (const detail of error.details) {
                    const path = quoteFormPath(detail.field)
                    const message = detail.errors[0]
                    if (path && message) setError(path, { type: 'server', message })
                }
            }
            setActionError(getErrorMessage(error, 'No pudimos guardar la cotización.'))
        }
    })

    const savedRate = quote?.exchangeRate ?? null
    const liveRate = rate.data?.available ? rate.data.rate : null
    const totalsRate = savedRate ?? liveRate
    const rateLabel = savedRate !== null ? 'Tasa de la cotización' : 'Tasa BCV de hoy'

    return (
        <>
            <AdminPageHeader
                eyebrow={
                    <Link
                        to={ADMIN_ROUTES.quotes}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft hover:text-ink"
                    >
                        <ArrowLeft aria-hidden="true" className="size-4" />
                        Cotizaciones
                    </Link>
                }
                title={quote ? quote.code : 'Nueva cotización'}
                description={
                    quote ? (
                        <span className="flex flex-wrap items-center gap-2">
                            <QuoteStatusBadge status={quote.status} size="md" />
                            <span className="text-sm">
                                Creada el {formatDateTime(quote.createdAt)}
                                {quote.createdBy ? ` por ${quote.createdBy.name}` : ''}
                                {quote.sentAt
                                    ? ` · enviada el ${formatDateTime(quote.sentAt)}`
                                    : ''}
                            </span>
                        </span>
                    ) : (
                        'Arma el presupuesto, guárdalo y envíalo al cliente en PDF.'
                    )
                }
            />

            {quote?.convertedOrderCode ? (
                <Alert tone="info" className="mb-6">
                    Convertida en el pedido{' '}
                    <Link
                        to={adminOrderPath(quote.convertedOrderCode)}
                        className="font-tech font-bold underline underline-offset-2"
                    >
                        {quote.convertedOrderCode}
                    </Link>
                    .
                </Alert>
            ) : null}
            {quote && !editable && !quote.convertedOrderCode ? (
                <Alert tone="info" className="mb-6">
                    Esta cotización está «{QUOTE_STATUS_LABELS[quote.status].toLowerCase()}»: ya no
                    se puede editar.
                </Alert>
            ) : null}

            <form
                onSubmit={submit}
                noValidate
                className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]"
            >
                <div className="min-w-0 space-y-6">
                    <Card className="@container space-y-5">
                        <h2 className={sectionTitleClass}>Cliente</h2>
                        <fieldset
                            disabled={!editable}
                            className="grid grid-cols-1 items-start gap-5 @xl:grid-cols-2"
                        >
                            <legend className="sr-only">Datos del cliente</legend>
                            <Input
                                label="Nombre y apellido"
                                autoCapitalize="words"
                                error={errors.customerName?.message}
                                {...withCapitalizedWords(register('customerName'))}
                            />
                            <Input
                                label="Empresa"
                                optional
                                error={errors.customerCompany?.message}
                                {...register('customerCompany')}
                            />
                            <Input
                                label="Correo"
                                type="email"
                                error={errors.customerEmail?.message}
                                {...register('customerEmail')}
                            />
                            <Input
                                label="Teléfono / WhatsApp"
                                type="tel"
                                placeholder="0414-1234567"
                                error={errors.customerPhone?.message}
                                {...register('customerPhone')}
                            />
                            <Controller
                                control={control}
                                name="customerIdNumber"
                                render={({ field }) => (
                                    <IdNumberField
                                        label="Cédula o RIF"
                                        optional
                                        error={errors.customerIdNumber?.message}
                                        disabled={!editable}
                                        {...field}
                                    />
                                )}
                            />
                            <Controller
                                control={control}
                                name="validUntil"
                                render={({ field }) => (
                                    <DatePicker
                                        label="Válida hasta"
                                        min={todayInCaracas()}
                                        error={errors.validUntil?.message}
                                        disabled={!editable}
                                        {...field}
                                    />
                                )}
                            />
                        </fieldset>
                    </Card>

                    <Card className="@container space-y-5">
                        <h2 className={sectionTitleClass}>Productos y servicios</h2>
                        <QuoteItemsEditor
                            control={control}
                            register={register}
                            errors={errors}
                            readOnly={!editable}
                        />
                    </Card>

                    <Card className="space-y-5">
                        <h2 className={sectionTitleClass}>Notas y condiciones</h2>
                        <fieldset disabled={!editable} className="space-y-5">
                            <legend className="sr-only">Notas y condiciones</legend>
                            <Textarea
                                label="Notas para el cliente"
                                optional
                                rows={3}
                                hint="Por ejemplo: incluye la visita técnica para medir el espacio."
                                maxLength={QUOTE_NOTES_MAX_LENGTH}
                                error={errors.notes?.message}
                                {...register('notes')}
                            />
                            <Textarea
                                label="Términos y condiciones"
                                optional
                                rows={4}
                                maxLength={QUOTE_TERMS_MAX_LENGTH}
                                error={errors.terms?.message}
                                {...register('terms')}
                            />
                        </fieldset>
                    </Card>
                </div>

                <aside className="min-w-0 space-y-6 xl:sticky xl:top-6 xl:self-start">
                    <Card className="space-y-5">
                        <h2 className={sectionTitleClass}>Totales</h2>
                        <Input
                            label="Descuento (USD)"
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="0.01"
                            disabled={!editable}
                            error={errors.discount?.message}
                            className="font-tech"
                            {...register('discount', { setValueAs: toOptionalNumber })}
                        />
                        <QuoteTotals control={control} rate={totalsRate} rateLabel={rateLabel} />
                        {quote ? (
                            <p className="text-xs text-ink-soft">
                                Válida hasta el {formatDay(quote.validUntil)}.
                            </p>
                        ) : null}

                        {actionError ? (
                            <Alert onDismiss={() => setActionError(null)}>{actionError}</Alert>
                        ) : null}
                        {notice ? (
                            <Alert
                                tone="success"
                                autoDismissMs={NOTICE_DISMISS_MS}
                                onDismiss={() => setNotice(null)}
                            >
                                {notice}
                            </Alert>
                        ) : null}

                        {editable ? (
                            <Button
                                type="submit"
                                fullWidth
                                isLoading={isSubmitting}
                                disabled={Boolean(quote) && !isDirty}
                                leadingIcon={<Save aria-hidden="true" className="size-4" />}
                            >
                                {quote ? 'Guardar cambios' : 'Guardar cotización'}
                            </Button>
                        ) : null}
                    </Card>

                    {quote ? (
                        <QuoteActions
                            quote={quote}
                            isDirty={isDirty}
                            isDownloading={isDownloading}
                            onDownload={async () => {
                                setActionError(null)
                                setIsDownloading(true)
                                try {
                                    saveBlob(
                                        await AdminQuoteService.getPdf(quote.code),
                                        `cotizacion-${quote.code}.pdf`,
                                    )
                                } catch (error) {
                                    setActionError(getErrorMessage(error))
                                } finally {
                                    setIsDownloading(false)
                                }
                            }}
                            onError={setActionError}
                            onOpen={setDialog}
                        />
                    ) : null}
                </aside>
            </form>

            {quote ? (
                <>
                    <QuoteStatusDialog
                        quote={quote}
                        isOpen={dialog === 'status'}
                        onClose={() => setDialog(null)}
                    />
                    <QuoteConvertDialog
                        quote={quote}
                        isOpen={dialog === 'convert'}
                        onClose={() => setDialog(null)}
                    />
                    <SendQuoteDialog
                        quote={quote}
                        isOpen={dialog === 'send'}
                        onClose={() => setDialog(null)}
                        onSent={() => setNotice(`Enviamos la cotización a ${quote.customerEmail}.`)}
                    />
                    <DeleteQuoteDialog
                        quote={quote}
                        isOpen={dialog === 'delete'}
                        onClose={() => setDialog(null)}
                    />
                </>
            ) : null}
        </>
    )
}

interface QuoteActionsProps {
    quote: Quote
    /** Unsaved edits: the PDF, the email and WhatsApp would send the stored version. */
    isDirty: boolean
    isDownloading: boolean
    onDownload: () => Promise<void>
    onError: (message: string | null) => void
    onOpen: (dialog: Dialog) => void
}

function QuoteActions({
    quote,
    isDirty,
    isDownloading,
    onDownload,
    onError,
    onOpen,
}: QuoteActionsProps) {
    const whatsapp = useQuoteWhatsApp(quote.code)
    const canSend = isQuoteEditable(quote.status)

    const openWhatsApp = () => {
        onError(null)
        // Opened before the request, inside the click, so popup blockers let it through.
        const target = window.open('', '_blank')
        whatsapp.mutate(undefined, {
            onSuccess: ({ url }) => {
                if (target) target.location.href = url
                else window.location.href = url
            },
            onError: (error) => {
                target?.close()
                onError(getErrorMessage(error, 'No pudimos preparar el mensaje de WhatsApp.'))
            },
        })
    }

    return (
        <Card className="space-y-3">
            <h2 className={sectionTitleClass}>Acciones</h2>
            {isDirty ? (
                <p className="text-xs font-semibold text-warning-800">
                    Guarda los cambios antes de descargar o enviar la cotización.
                </p>
            ) : null}
            <div className="grid gap-2">
                <Button
                    variant="secondary"
                    fullWidth
                    disabled={isDirty}
                    isLoading={isDownloading}
                    onClick={() => void onDownload()}
                    leadingIcon={<Download aria-hidden="true" className="size-4" />}
                >
                    Descargar PDF
                </Button>
                {canSend ? (
                    <Button
                        variant="secondary"
                        fullWidth
                        disabled={isDirty}
                        onClick={() => onOpen('send')}
                        leadingIcon={<Mail aria-hidden="true" className="size-4" />}
                    >
                        Enviar por correo
                    </Button>
                ) : null}
                <Button
                    variant="whatsapp"
                    fullWidth
                    disabled={isDirty}
                    isLoading={whatsapp.isPending}
                    onClick={openWhatsApp}
                    leadingIcon={<MessageCircle aria-hidden="true" className="size-4" />}
                >
                    Enviar por WhatsApp
                </Button>
                {QUOTE_MANUAL_TRANSITIONS[quote.status].length > 0 ? (
                    <Button
                        variant="ghost"
                        fullWidth
                        onClick={() => onOpen('status')}
                        disabled={isDirty}
                        leadingIcon={<ArrowLeftRight aria-hidden="true" className="size-4" />}
                    >
                        Cambiar estado
                    </Button>
                ) : null}
                {isQuoteConvertible(quote.status) ? (
                    <Button
                        variant="dark"
                        fullWidth
                        disabled={isDirty}
                        onClick={() => onOpen('convert')}
                        leadingIcon={<FileOutput aria-hidden="true" className="size-4" />}
                    >
                        Convertir en pedido
                    </Button>
                ) : null}
                {quote.status === 'BORRADOR' ? (
                    <Button
                        variant="ghost"
                        fullWidth
                        onClick={() => onOpen('delete')}
                        className="text-danger-700 hover:bg-danger-50"
                        leadingIcon={<Trash2 aria-hidden="true" className="size-4" />}
                    >
                        Eliminar borrador
                    </Button>
                ) : null}
            </div>
        </Card>
    )
}

interface QuoteDialogProps {
    quote: Quote
    isOpen: boolean
    onClose: () => void
}

function SendQuoteDialog({
    quote,
    isOpen,
    onClose,
    onSent,
}: QuoteDialogProps & { onSent: () => void }) {
    const send = useSendQuote(quote.code)
    const close = () => {
        send.reset()
        onClose()
    }
    return (
        <ConfirmDialog
            isOpen={isOpen}
            title="¿Enviar la cotización por correo?"
            description={`Le enviaremos el PDF a ${quote.customerEmail}. La cotización quedará como «Enviada».`}
            confirmLabel="Enviar"
            confirmVariant="primary"
            isLoading={send.isPending}
            error={send.isError ? getErrorMessage(send.error) : undefined}
            onConfirm={() =>
                send.mutate(undefined, {
                    onSuccess: () => {
                        close()
                        onSent()
                    },
                })
            }
            onClose={close}
        />
    )
}

function DeleteQuoteDialog({ quote, isOpen, onClose }: QuoteDialogProps) {
    const remove = useDeleteQuote()
    const navigate = useNavigate()
    const close = () => {
        remove.reset()
        onClose()
    }
    return (
        <ConfirmDialog
            isOpen={isOpen}
            title={`¿Eliminar el borrador ${quote.code}?`}
            description="No se puede deshacer."
            confirmLabel="Eliminar"
            isLoading={remove.isPending}
            error={remove.isError ? getErrorMessage(remove.error) : undefined}
            onConfirm={() =>
                remove.mutate(quote.code, {
                    onSuccess: () => {
                        close()
                        void navigate(ADMIN_ROUTES.quotes, { replace: true })
                    },
                })
            }
            onClose={close}
        />
    )
}
