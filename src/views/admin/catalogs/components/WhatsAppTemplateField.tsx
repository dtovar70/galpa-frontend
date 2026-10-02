import { useRef, type ChangeEvent, type FocusEvent } from 'react'
import { MessageCircle } from 'lucide-react'

import { Textarea, Tooltip } from '@/components/ui'
import { useSiteContent } from '@/utils/hooks/useSiteContent'
import {
    WHATSAPP_PLACEHOLDERS,
    WHATSAPP_TEMPLATE_MAX_LENGTH,
    renderWhatsAppTemplate,
    sampleWhatsAppValues,
} from '@/views/admin/catalogs/utils/whatsappTemplate'

export interface WhatsAppTemplateFieldProps {
    name: string
    value: string
    error?: string
    /** `{comprobante}` is only offered where a receipt exists. */
    allowsReceipt: boolean
    /** The form library's ref callback (`register(...).ref`). */
    fieldRef: (element: HTMLTextAreaElement | null) => void
    onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void
    onBlur: (event: FocusEvent<HTMLTextAreaElement>) => void
    /** Writes a new value (placeholder inserted at the cursor). */
    onInsert: (value: string) => void
}

const URL_PATTERN = /(https?:\/\/\S+)/g

/** A rendered message with its links styled like WhatsApp does. */
function MessageText({ text }: { text: string }) {
    return (
        <>
            {text.split(URL_PATTERN).map((part, index) =>
                index % 2 === 1 ? (
                    <span key={index} className="break-all text-[#027eb5] underline">
                        {part}
                    </span>
                ) : (
                    <span key={index}>{part}</span>
                ),
            )}
        </>
    )
}

/**
 * The "Avisar por WhatsApp" message of a status: a textarea with a counter, the placeholders as
 * chips that insert at the cursor, and a chat-bubble preview filled with sample data.
 */
export function WhatsAppTemplateField({
    name,
    value,
    error,
    allowsReceipt,
    fieldRef,
    onChange,
    onBlur,
    onInsert,
}: WhatsAppTemplateFieldProps) {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)
    const { general } = useSiteContent()
    const placeholders = WHATSAPP_PLACEHOLDERS.filter(
        (placeholder) => allowsReceipt || placeholder.name !== 'comprobante',
    )
    const preview = renderWhatsAppTemplate(value, sampleWhatsAppValues(general.brandName))

    const insert = (placeholder: string) => {
        const textarea = textareaRef.current
        const token = `{${placeholder}}`
        const start = textarea?.selectionStart ?? value.length
        const end = textarea?.selectionEnd ?? value.length
        const next = `${value.slice(0, start)}${token}${value.slice(end)}`
        if (next.length > WHATSAPP_TEMPLATE_MAX_LENGTH) return
        onInsert(next)
        requestAnimationFrame(() => {
            textarea?.focus()
            textarea?.setSelectionRange(start + token.length, start + token.length)
        })
    }

    const setRefs = (element: HTMLTextAreaElement | null) => {
        textareaRef.current = element
        fieldRef(element)
    }

    return (
        <div className="grid grid-cols-1 items-start gap-5 @2xl:grid-cols-2">
            <div className="space-y-3">
                <Textarea
                    label="Mensaje de WhatsApp"
                    rows={6}
                    maxLength={WHATSAPP_TEMPLATE_MAX_LENGTH}
                    showCount
                    hint="Se usa en «Avisar por WhatsApp» del detalle del pedido. Toca un marcador para insertarlo."
                    error={error}
                    name={name}
                    value={value}
                    ref={setRefs}
                    onChange={onChange}
                    onBlur={onBlur}
                />
                <div className="flex flex-wrap gap-1.5" aria-label="Marcadores disponibles">
                    {placeholders.map((placeholder) => (
                        <Tooltip
                            key={placeholder.name}
                            label={placeholder.description}
                            placement="top"
                        >
                            <button
                                type="button"
                                onClick={() => insert(placeholder.name)}
                                aria-label={`Insertar {${placeholder.name}}: ${placeholder.description}`}
                                className="rounded-full border border-line bg-white px-2.5 py-1 font-mono text-xs text-ink transition hover:border-brand-300 hover:bg-brand-50 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                            >
                                {`{${placeholder.name}}`}
                            </button>
                        </Tooltip>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-sm font-semibold text-ink">Vista previa con datos de ejemplo</p>
                <div className="rounded-2xl bg-[#efeae2] p-4">
                    <div className="ml-auto max-w-[92%] rounded-2xl rounded-tr-sm bg-[#d9fdd3] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line text-[#111b21] shadow-sm">
                        {preview ? (
                            <MessageText text={preview} />
                        ) : (
                            <span className="text-ink-soft">Escribe el mensaje…</span>
                        )}
                    </div>
                    <p className="mt-2 flex items-center justify-end gap-1 text-[11px] text-[#667781]">
                        <MessageCircle aria-hidden="true" className="size-3" />
                        Así lo verá el cliente
                    </p>
                </div>
            </div>
        </div>
    )
}
