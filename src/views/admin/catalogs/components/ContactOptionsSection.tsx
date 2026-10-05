import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { MessageSquareText, Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'

import type { AdminContactOption, ContactOptionKind } from '@/@types/catalog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { Alert, Button, Card, Input, Skeleton } from '@/components/ui'
import { NOTICE_DISMISS_MS } from '@/constants/ui.constant'
import { getErrorMessage, isApiError } from '@/services/errors'
import { moveItem } from '@/utils/moveItem'
import { ContactOptionRow } from '@/views/admin/catalogs/components/ContactOptionRow'
import {
    contactOptionFormSchema,
    type ContactOptionFormValues,
} from '@/views/admin/catalogs/schema/catalog.schema'
import {
    useAdminContactOptions,
    useCreateContactOption,
    useDeleteContactOption,
    useReorderContactOptions,
} from '@/views/admin/hooks/useAdminCatalogs'

const SKELETON_ROWS = 3

interface ListCopy {
    title: string
    description: string
    /** "tema" / "tipo de espacio", for buttons and messages. */
    noun: string
    /** Every active option but one may be turned off (the form needs a topic). */
    keepsOneActive: boolean
}

const LISTS: Record<ContactOptionKind, ListCopy> = {
    'contact-topics': {
        title: 'Temas',
        description:
            'La lista «¿En qué te ayudamos?» del formulario. Debe quedar al menos un tema activo.',
        noun: 'tema',
        keepsOneActive: true,
    },
    'space-types': {
        title: 'Tipos de espacio',
        description:
            'La lista opcional «Tipo de espacio». Si desactivas todos, el formulario deja de preguntarlo.',
        noun: 'tipo de espacio',
        keepsOneActive: false,
    },
}

function NewOptionForm({
    kind,
    noun,
    onCreated,
    onCancel,
}: {
    kind: ContactOptionKind
    noun: string
    onCreated: (option: AdminContactOption) => void
    onCancel: () => void
}) {
    const create = useCreateContactOption(kind)
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<ContactOptionFormValues>({
        resolver: zodResolver(contactOptionFormSchema),
        defaultValues: { label: '' },
    })

    const submit = handleSubmit((values) => {
        create.mutate(values, {
            onSuccess: onCreated,
            onError: (error) => {
                const message = isApiError(error)
                    ? error.details.find((detail) => detail.field === 'label')?.errors[0]
                    : undefined
                if (message) setError('label', { type: 'server', message })
            },
        })
    })

    return (
        <Card>
            <form onSubmit={submit} noValidate className="space-y-4">
                <p className="text-xs text-ink-soft">
                    Se añade al final de la lista, activo. Su código se genera con el nombre.
                </p>
                <Input
                    label={`Nombre del nuevo ${noun}`}
                    error={errors.label?.message}
                    {...register('label')}
                />
                {create.isError && !isApiError(create.error, 400) ? (
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
                        Añadir
                    </Button>
                </div>
            </form>
        </Card>
    )
}

/** One list of the contact form: add, rename, (de)activate, reorder and delete its options. */
function ContactOptionList({ kind }: { kind: ContactOptionKind }) {
    const copy = LISTS[kind]
    const query = useAdminContactOptions(kind)
    const reorder = useReorderContactOptions(kind)
    const remove = useDeleteContactOption(kind)
    const [isCreating, setIsCreating] = useState(false)
    const [pendingDelete, setPendingDelete] = useState<AdminContactOption | null>(null)
    const [notice, setNotice] = useState<string | null>(null)
    const [announcement, setAnnouncement] = useState('')
    const titleId = `catalog-${kind}-title`

    const list = query.data ?? []
    const activeCount = list.filter((option) => option.isActive).length

    const move = (index: number, offset: -1 | 1) => {
        const moved = list[index]
        const target = index + offset
        if (!moved || target < 0 || target >= list.length) return
        const next = moveItem(list, index, target)
        setAnnouncement(`«${moved.label}» pasó a la posición ${target + 1} de ${next.length}.`)
        reorder.mutate(next.map((option) => option.code))
    }

    const confirmDelete = () => {
        if (!pendingDelete) return
        const { label } = pendingDelete
        remove.mutate(pendingDelete.code, {
            onSuccess: () => {
                setPendingDelete(null)
                setNotice(`Eliminamos «${label}».`)
            },
        })
    }

    return (
        <section className="space-y-4" aria-labelledby={titleId}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                    <h2 id={titleId} className="text-2xl font-bold text-ink">
                        {copy.title}
                    </h2>
                    <p className="text-sm text-ink-soft">{copy.description}</p>
                </div>
                {isCreating ? null : (
                    <Button
                        className="shrink-0"
                        variant="secondary"
                        onClick={() => {
                            setNotice(null)
                            setIsCreating(true)
                        }}
                        leadingIcon={<Plus aria-hidden="true" className="size-4" />}
                    >
                        Nuevo {copy.noun}
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
                <NewOptionForm
                    kind={kind}
                    noun={copy.noun}
                    onCancel={() => setIsCreating(false)}
                    onCreated={(option) => {
                        setIsCreating(false)
                        setNotice(`Añadimos «${option.label}». Ya aparece en el formulario.`)
                    }}
                />
            ) : null}

            {reorder.isError ? (
                <Alert>No pudimos guardar el nuevo orden. {getErrorMessage(reorder.error)}</Alert>
            ) : null}
            <p className="sr-only" aria-live="polite">
                {announcement}
            </p>

            {query.isPending ? (
                Array.from({ length: SKELETON_ROWS }, (_, index) => (
                    <Skeleton key={index} shape="block" className="h-16" />
                ))
            ) : query.isError ? (
                <EmptyState
                    title={`No pudimos cargar la lista de ${copy.title.toLowerCase()}`}
                    description={getErrorMessage(query.error)}
                    icon={<MessageSquareText className="size-6" />}
                    action={
                        <Button variant="secondary" onClick={() => void query.refetch()}>
                            Reintentar
                        </Button>
                    }
                />
            ) : list.length === 0 ? (
                <EmptyState
                    title={`Todavía no hay ${copy.title.toLowerCase()}`}
                    description={`Añade uno para ofrecerlo en el formulario.`}
                    icon={<MessageSquareText className="size-6" />}
                />
            ) : (
                <ol className="space-y-3" aria-labelledby={titleId}>
                    {list.map((option, index) => (
                        <ContactOptionRow
                            key={option.code}
                            kind={kind}
                            option={option}
                            index={index}
                            total={list.length}
                            isBusy={reorder.isPending}
                            lockedReason={
                                copy.keepsOneActive && option.isActive && activeCount <= 1
                                    ? `Es el único ${copy.noun} activo: activa otro antes de desactivarlo o eliminarlo.`
                                    : null
                            }
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
                title={`¿Eliminar este ${copy.noun}?`}
                description={
                    pendingDelete ? (
                        <>
                            <strong className="font-semibold text-ink">
                                {pendingDelete.label}
                            </strong>{' '}
                            dejará de aparecer en el formulario. No se puede deshacer; si solo
                            quieres ocultarlo, desactívalo.
                        </>
                    ) : undefined
                }
                confirmLabel="Eliminar"
                isLoading={remove.isPending}
                error={remove.isError ? getErrorMessage(remove.error) : undefined}
                onConfirm={confirmDelete}
                onClose={() => setPendingDelete(null)}
            />
        </section>
    )
}

/**
 * "Asesoría": the topics and space types of the advisory / contact form. Fully editable:
 * messages are not stored, so options can be renamed, turned off or deleted at any time.
 */
export function ContactOptionsSection() {
    return (
        <div className="space-y-10">
            <Alert tone="info">
                Estas son las opciones del formulario de asesoría y contacto. Los cambios se ven de
                inmediato en la tienda y en los avisos que recibes por correo y Telegram.
            </Alert>
            <ContactOptionList kind="contact-topics" />
            <ContactOptionList kind="space-types" />
        </div>
    )
}
