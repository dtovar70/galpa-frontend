import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Smartphone } from 'lucide-react'
import { useForm } from 'react-hook-form'

import type { AdminMobilePrefix } from '@/@types/catalog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { Alert, Button, Card, Input, Skeleton } from '@/components/ui'
import { NOTICE_DISMISS_MS } from '@/constants/ui.constant'
import { getErrorMessage, isApiError } from '@/services/errors'
import { rejectNonDigits } from '@/utils/digitInput'
import { moveItem } from '@/utils/moveItem'
import { MobilePrefixRow } from '@/views/admin/catalogs/components/MobilePrefixRow'
import {
    mobilePrefixFormSchema,
    type MobilePrefixFormValues,
} from '@/views/admin/catalogs/schema/catalog.schema'
import {
    useAdminMobilePrefixes,
    useCreateMobilePrefix,
    useDeleteMobilePrefix,
    useReorderMobilePrefixes,
} from '@/views/admin/hooks/useAdminCatalogs'

const SKELETON_ROWS = 5

function NewMobilePrefixForm({
    onCreated,
    onCancel,
}: {
    onCreated: (prefix: AdminMobilePrefix) => void
    onCancel: () => void
}) {
    const create = useCreateMobilePrefix()
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<MobilePrefixFormValues>({
        resolver: zodResolver(mobilePrefixFormSchema),
        defaultValues: { code: '' },
    })

    const submit = handleSubmit((values) => {
        create.mutate(values, {
            onSuccess: onCreated,
            onError: (error) => {
                if (!isApiError(error)) return
                const message =
                    error.status === 409
                        ? error.message
                        : error.details.find((detail) => detail.field === 'code')?.errors[0]
                if (message) setError('code', { type: 'server', message })
            },
        })
    })

    return (
        <Card>
            <form onSubmit={submit} noValidate className="space-y-5">
                <div>
                    <h3 className="text-xl font-bold text-ink">Nuevo código</h3>
                    <p className="text-xs text-ink-soft">
                        Se añade al final de la lista, activo. El código no se puede cambiar
                        después.
                    </p>
                </div>
                <div className="max-w-60">
                    <Input
                        label="Código"
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={4}
                        placeholder="0426"
                        onBeforeInput={rejectNonDigits}
                        error={errors.code?.message}
                        {...register('code')}
                    />
                </div>
                {create.isError &&
                !isApiError(create.error, 400) &&
                !isApiError(create.error, 409) ? (
                    <Alert>{getErrorMessage(create.error)}</Alert>
                ) : null}
                <div className="flex flex-wrap justify-end gap-3">
                    <Button variant="secondary" onClick={onCancel} disabled={create.isPending}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        isLoading={create.isPending}
                        leadingIcon={<Plus aria-hidden="true" className="size-4" />}
                    >
                        Añadir código
                    </Button>
                </div>
            </form>
        </Card>
    )
}

/**
 * "Códigos de celular": the operator codes (0412, 0414…) offered by every mobile phone field
 * (Contenido → payment phone and WhatsApp, the checkout, the payment forms). An inactive code
 * disappears from those selects and is refused for new saves; stored numbers keep showing.
 */
export function MobilePrefixesSection() {
    const prefixes = useAdminMobilePrefixes()
    const reorder = useReorderMobilePrefixes()
    const remove = useDeleteMobilePrefix()
    const [isCreating, setIsCreating] = useState(false)
    const [pendingDelete, setPendingDelete] = useState<AdminMobilePrefix | null>(null)
    const [notice, setNotice] = useState<string | null>(null)
    const [announcement, setAnnouncement] = useState('')

    const list = prefixes.data ?? []

    const move = (index: number, offset: -1 | 1) => {
        const moved = list[index]
        const target = index + offset
        if (!moved || target < 0 || target >= list.length) return
        const next = moveItem(list, index, target)
        setAnnouncement(`«${moved.code}» pasó a la posición ${target + 1} de ${next.length}.`)
        reorder.mutate(next.map((prefix) => prefix.code))
    }

    const confirmDelete = () => {
        if (!pendingDelete) return
        const { code } = pendingDelete
        remove.mutate(code, {
            onSuccess: () => {
                setPendingDelete(null)
                setNotice(`Eliminamos el código ${code}.`)
            },
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <p className="text-sm text-ink-soft">
                    Los códigos activos aparecen, en este orden, al escribir un celular: el WhatsApp
                    y el teléfono de pago de la tienda, el teléfono del cliente y el del pagador.
                    Desactiva un código para dejar de aceptarlo; los números ya guardados se siguen
                    mostrando.
                </p>
                {isCreating ? null : (
                    <Button
                        className="shrink-0"
                        onClick={() => {
                            setNotice(null)
                            setIsCreating(true)
                        }}
                        leadingIcon={<Plus aria-hidden="true" className="size-4" />}
                    >
                        Nuevo código
                    </Button>
                )}
            </div>

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

            {isCreating ? (
                <NewMobilePrefixForm
                    onCancel={() => setIsCreating(false)}
                    onCreated={(prefix) => {
                        setIsCreating(false)
                        setNotice(
                            `Añadimos el código ${prefix.code}. Ya aparece en los campos de celular.`,
                        )
                    }}
                />
            ) : null}

            {reorder.isError ? (
                <Alert>No pudimos guardar el nuevo orden. {getErrorMessage(reorder.error)}</Alert>
            ) : null}
            <p className="sr-only" aria-live="polite">
                {announcement}
            </p>

            {prefixes.isPending ? (
                Array.from({ length: SKELETON_ROWS }, (_, index) => (
                    <Skeleton key={index} shape="block" className="h-18" />
                ))
            ) : prefixes.isError ? (
                <EmptyState
                    title="No pudimos cargar los códigos"
                    description={getErrorMessage(prefixes.error)}
                    icon={<Smartphone className="size-6" />}
                    action={
                        <Button variant="secondary" onClick={() => void prefixes.refetch()}>
                            Reintentar
                        </Button>
                    }
                />
            ) : list.length === 0 ? (
                <EmptyState
                    title="Todavía no hay códigos"
                    description="Añade al menos uno para que se puedan escribir números de celular."
                    icon={<Smartphone className="size-6" />}
                />
            ) : (
                <ol className="space-y-3" aria-label="Orden de los códigos de celular">
                    {list.map((prefix, index) => (
                        <MobilePrefixRow
                            key={prefix.code}
                            prefix={prefix}
                            index={index}
                            total={list.length}
                            isBusy={reorder.isPending}
                            onMove={move}
                            onDelete={(target) => {
                                remove.reset()
                                setNotice(null)
                                setPendingDelete(target)
                            }}
                        />
                    ))}
                </ol>
            )}

            <ConfirmDialog
                isOpen={pendingDelete !== null}
                title="¿Eliminar este código?"
                description={
                    pendingDelete ? (
                        <>
                            <strong className="font-semibold text-ink">{pendingDelete.code}</strong>{' '}
                            dejará de aparecer en los campos de celular. Los números ya guardados no
                            cambian. No se puede deshacer; si solo quieres ocultarlo, desactívalo.
                        </>
                    ) : undefined
                }
                confirmLabel="Eliminar código"
                isLoading={remove.isPending}
                error={remove.isError ? getErrorMessage(remove.error) : undefined}
                onConfirm={confirmDelete}
                onClose={() => setPendingDelete(null)}
            />
        </div>
    )
}
