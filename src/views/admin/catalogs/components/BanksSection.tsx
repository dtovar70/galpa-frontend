import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Landmark, Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'

import type { AdminBank } from '@/@types/catalog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { Alert, Button, Card, Input, Skeleton } from '@/components/ui'
import { NOTICE_DISMISS_MS } from '@/constants/ui.constant'
import { getErrorMessage, isApiError } from '@/services/errors'
import { moveItem } from '@/utils/moveItem'
import { BankRow } from '@/views/admin/catalogs/components/BankRow'
import { bankFormSchema, type BankFormValues } from '@/views/admin/catalogs/schema/catalog.schema'
import {
    useAdminBanks,
    useCreateBank,
    useDeleteBank,
    useReorderBanks,
} from '@/views/admin/hooks/useAdminCatalogs'

const SKELETON_ROWS = 5

function NewBankForm({
    onCreated,
    onCancel,
}: {
    onCreated: (bank: AdminBank) => void
    onCancel: () => void
}) {
    const create = useCreateBank()
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<BankFormValues>({
        resolver: zodResolver(bankFormSchema),
        defaultValues: { code: '', name: '' },
    })

    const submit = handleSubmit((values) => {
        create.mutate(values, {
            onSuccess: onCreated,
            onError: (error) => {
                if (!isApiError(error)) return
                if (error.status === 409) {
                    setError('code', { type: 'server', message: error.message })
                    return
                }
                for (const detail of error.details) {
                    const message = detail.errors[0]
                    if (message && (detail.field === 'code' || detail.field === 'name')) {
                        setError(detail.field, { type: 'server', message })
                    }
                }
            },
        })
    })

    return (
        <Card>
            <form onSubmit={submit} noValidate className="space-y-5">
                <div>
                    <h3 className="text-xl font-bold text-ink">Nuevo banco</h3>
                    <p className="text-xs text-ink-soft">
                        Se añade al final de la lista, activo. El código no se puede cambiar
                        después.
                    </p>
                </div>
                <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
                    <Input
                        label="Código"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="0102"
                        error={errors.code?.message}
                        {...register('code')}
                    />
                    <Input label="Nombre" error={errors.name?.message} {...register('name')} />
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
                        Añadir banco
                    </Button>
                </div>
            </form>
        </Card>
    )
}

/**
 * "Bancos": the Venezuelan banks offered in the bank selects of the bolívar methods (the
 * customer's payment form, "Registrar pago manualmente" and Contenido → Pago). Inactive banks disappear
 * from those selects; a bank in use can be deactivated but not deleted.
 */
export function BanksSection() {
    const banks = useAdminBanks()
    const reorder = useReorderBanks()
    const remove = useDeleteBank()
    const [isCreating, setIsCreating] = useState(false)
    const [pendingDelete, setPendingDelete] = useState<AdminBank | null>(null)
    const [notice, setNotice] = useState<string | null>(null)
    const [announcement, setAnnouncement] = useState('')

    const list = banks.data ?? []

    const move = (index: number, offset: -1 | 1) => {
        const moved = list[index]
        const target = index + offset
        if (!moved || target < 0 || target >= list.length) return
        const next = moveItem(list, index, target)
        setAnnouncement(`«${moved.name}» pasó a la posición ${target + 1} de ${next.length}.`)
        reorder.mutate(next.map((bank) => bank.code))
    }

    const confirmDelete = () => {
        if (!pendingDelete) return
        const { name } = pendingDelete
        remove.mutate(pendingDelete.code, {
            onSuccess: () => {
                setPendingDelete(null)
                setNotice(`Eliminamos el banco «${name}».`)
            },
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <p className="text-sm text-ink-soft">
                    Los bancos activos aparecen, en este orden, al elegir el banco de un pago en
                    bolívares. Desactiva un banco para ocultarlo; los que ya tienen pagos no se
                    pueden eliminar.
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
                        Nuevo banco
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
                <NewBankForm
                    onCancel={() => setIsCreating(false)}
                    onCreated={(bank) => {
                        setIsCreating(false)
                        setNotice(`Añadimos «${bank.name}». Ya aparece en las listas de bancos.`)
                    }}
                />
            ) : null}

            {reorder.isError ? (
                <Alert>No pudimos guardar el nuevo orden. {getErrorMessage(reorder.error)}</Alert>
            ) : null}
            <p className="sr-only" aria-live="polite">
                {announcement}
            </p>

            {banks.isPending ? (
                Array.from({ length: SKELETON_ROWS }, (_, index) => (
                    <Skeleton key={index} shape="block" className="h-18" />
                ))
            ) : banks.isError ? (
                <EmptyState
                    title="No pudimos cargar los bancos"
                    description={getErrorMessage(banks.error)}
                    icon={<Landmark className="size-6" />}
                    action={
                        <Button variant="secondary" onClick={() => void banks.refetch()}>
                            Reintentar
                        </Button>
                    }
                />
            ) : list.length === 0 ? (
                <EmptyState
                    title="Todavía no hay bancos"
                    description="Añade al menos uno para que los clientes puedan indicar desde qué banco pagaron."
                    icon={<Landmark className="size-6" />}
                />
            ) : (
                <ol className="space-y-3" aria-label="Orden de los bancos">
                    {list.map((bank, index) => (
                        <BankRow
                            key={bank.code}
                            bank={bank}
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
                title="¿Eliminar este banco?"
                description={
                    pendingDelete ? (
                        <>
                            <strong className="font-semibold text-ink">
                                {pendingDelete.code} - {pendingDelete.name}
                            </strong>{' '}
                            dejará de aparecer en las listas de bancos. No se puede deshacer; si
                            solo quieres ocultarlo, desactívalo.
                        </>
                    ) : undefined
                }
                confirmLabel="Eliminar banco"
                isLoading={remove.isPending}
                error={remove.isError ? getErrorMessage(remove.error) : undefined}
                onConfirm={confirmDelete}
                onClose={() => setPendingDelete(null)}
            />
        </div>
    )
}
