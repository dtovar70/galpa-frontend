import { useState, type FormEvent } from 'react'

import type { AdminOrder } from '@/@types/order'
import { Alert, Button, Card, Textarea } from '@/components/ui'
import { getErrorMessage } from '@/services/errors'
import { formatDateTime } from '@/utils/formatDate'
import { useAddOrderNote } from '@/views/admin/hooks/useAdminOrders'

const MAX_NOTE = 1000

/** Internal notes of the team. The customer never sees them. */
export function OrderNotes({ order }: { order: AdminOrder }) {
    const addNote = useAddOrderNote(order.code)
    const [body, setBody] = useState('')

    const submit = (event: FormEvent) => {
        event.preventDefault()
        if (!body.trim()) return
        addNote.mutate(body.trim(), { onSuccess: () => setBody('') })
    }

    return (
        <Card padding="md" className="space-y-4">
            <div>
                <h2 className="text-xl font-bold text-ink">Notas internas</h2>
                <p className="text-xs text-ink-soft">Solo las ve el equipo, nunca el cliente.</p>
            </div>
            <form onSubmit={submit} className="space-y-3">
                <Textarea
                    label="Nueva nota"
                    hideLabel
                    rows={3}
                    maxLength={MAX_NOTE}
                    placeholder="Ej. Coordinar la entrega en horario de la tarde"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                />
                {addNote.isError ? <Alert>{getErrorMessage(addNote.error)}</Alert> : null}
                <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    isLoading={addNote.isPending}
                    disabled={!body.trim() || addNote.isPending}
                >
                    Agregar nota
                </Button>
            </form>
            {order.notes.length ? (
                <ul className="space-y-2">
                    {order.notes.map((note) => (
                        <li key={note.id} className="rounded-2xl bg-page px-4 py-3 text-sm">
                            <p className="break-words whitespace-pre-line text-ink">{note.body}</p>
                            <p className="mt-1 text-xs text-ink-soft">
                                {note.author?.name ?? 'Usuario eliminado'} ·{' '}
                                {formatDateTime(note.createdAt)}
                            </p>
                        </li>
                    ))}
                </ul>
            ) : null}
        </Card>
    )
}
