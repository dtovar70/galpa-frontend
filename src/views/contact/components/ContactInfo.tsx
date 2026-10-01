import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import type { ReactNode } from 'react'

import { Card } from '@/components/ui'
import { formatVePhone, phoneHref, whatsappUrl } from '@/utils/content'
import { useSiteContent } from '@/utils/hooks/useSiteContent'

interface ContactChannel {
    id: string
    icon: ReactNode
    label: string
    value: string
    href?: string
}

export function ContactInfo() {
    const { contact } = useSiteContent()
    const channels: ContactChannel[] = [
        {
            id: 'email',
            icon: <Mail aria-hidden="true" className="size-5" />,
            label: 'Correo',
            value: contact.email,
            href: `mailto:${contact.email}`,
        },
        {
            id: 'phone',
            icon: <Phone aria-hidden="true" className="size-5" />,
            label: 'Teléfono',
            value: formatVePhone(contact.phone),
            href: phoneHref(contact.phone),
        },
        ...(contact.whatsapp
            ? [
                  {
                      id: 'whatsapp',
                      icon: <MessageCircle aria-hidden="true" className="size-5" />,
                      label: 'WhatsApp',
                      value: formatVePhone(contact.whatsapp),
                      href: whatsappUrl(contact.whatsapp, 'Hola, quisiera asesoría.'),
                  },
              ]
            : []),
        {
            id: 'address',
            icon: <MapPin aria-hidden="true" className="size-5" />,
            label: 'Tienda',
            value: contact.city,
        },
        {
            id: 'schedule',
            icon: <Clock aria-hidden="true" className="size-5" />,
            label: 'Horario',
            value: contact.schedule,
        },
    ]

    return (
        <ul className="grid gap-4">
            {channels.map((channel) => (
                <li key={channel.id} className="h-full">
                    <Card className="flex h-full items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ink text-brand-400">
                            {channel.icon}
                        </span>
                        <div className="min-w-0 space-y-0.5">
                            <p className="text-sm font-bold text-ink">{channel.label}</p>
                            {channel.href ? (
                                <a
                                    href={channel.href}
                                    target={channel.id === 'whatsapp' ? '_blank' : undefined}
                                    rel={channel.id === 'whatsapp' ? 'noreferrer' : undefined}
                                    className="text-sm break-words text-ink-soft transition hover:text-brand-700"
                                >
                                    {channel.value}
                                </a>
                            ) : (
                                <p className="text-sm text-ink-soft">{channel.value}</p>
                            )}
                        </div>
                    </Card>
                </li>
            ))}
        </ul>
    )
}
