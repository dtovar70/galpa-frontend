import { Check, ChevronDown, ShieldCheck, X } from 'lucide-react'

import type { UserRole } from '@/@types/admin'
import { cn } from '@/utils/cn'
import { ROLE_CAPABILITIES, roleCan } from '@/views/admin/constants/rolePermissions'
import { ROLE_LABEL, USER_ROLES } from '@/views/admin/users/schema/user.schema'

/** Phones get a short column header; the full name stays for screen readers. */
const SHORT_ROLE_LABEL: Record<UserRole, string> = {
    ADMIN: 'Admin',
    EDITOR: 'Editor',
}

function Allowed({ allowed }: { allowed: boolean }) {
    return (
        <span
            className={cn(
                'inline-flex size-7 items-center justify-center rounded-full',
                allowed ? 'bg-brand-100 text-ink' : 'bg-line text-ink-soft',
            )}
        >
            {allowed ? (
                <Check aria-hidden="true" className="size-4" strokeWidth={2.5} />
            ) : (
                <X aria-hidden="true" className="size-4" />
            )}
            <span className="sr-only">{allowed ? 'Sí' : 'No'}</span>
        </span>
    )
}

/**
 * "¿Qué puede hacer cada rol?": a collapsible comparison of both roles, from the same list the
 * API enforces (see `rolePermissions.ts`). Three narrow columns, so it fits a 360px phone.
 */
export function RolePermissionsTable({ className }: { className?: string }) {
    return (
        <details
            className={cn(
                'group overflow-hidden rounded-2xl border border-line bg-white shadow-soft',
                className,
            )}
        >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 text-base font-bold text-ink transition hover:bg-brand-50/60 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none focus-visible:ring-inset [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-3">
                    <ShieldCheck aria-hidden="true" className="size-5 shrink-0 text-brand-600" />
                    ¿Qué puede hacer cada rol?
                </span>
                <ChevronDown
                    aria-hidden="true"
                    className="size-5 shrink-0 text-brand-600 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                />
            </summary>
            <div className="border-t border-line">
                <table className="w-full table-fixed text-sm">
                    <caption className="sr-only">Permisos de cada rol en el panel</caption>
                    <colgroup>
                        <col />
                        <col className="w-18 sm:w-32" />
                        <col className="w-18 sm:w-32" />
                    </colgroup>
                    <thead className="bg-page">
                        <tr>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-bold tracking-wide text-ink-soft uppercase sm:px-5"
                            >
                                Módulo / acción
                            </th>
                            {USER_ROLES.map((role) => (
                                <th
                                    key={role}
                                    scope="col"
                                    className="px-1 py-3 text-center text-xs font-bold tracking-wide text-ink-soft uppercase"
                                >
                                    <span aria-hidden="true" className="sm:hidden">
                                        {SHORT_ROLE_LABEL[role]}
                                    </span>
                                    <span className="max-sm:sr-only">{ROLE_LABEL[role]}</span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    {ROLE_CAPABILITIES.map(({ area, capabilities }) => (
                        <tbody key={area} className="border-t border-line">
                            <tr>
                                <th
                                    scope="colgroup"
                                    colSpan={3}
                                    className="bg-page px-4 pt-3 pb-1.5 text-left text-sm font-semibold text-brand-700 sm:px-5"
                                >
                                    {area}
                                </th>
                            </tr>
                            {capabilities.map((capability) => (
                                <tr key={capability.action} className="border-t border-line/70">
                                    <th
                                        scope="row"
                                        className="px-4 py-2.5 text-left font-normal break-words text-ink sm:px-5"
                                    >
                                        {capability.action}
                                    </th>
                                    {USER_ROLES.map((role) => (
                                        <td key={role} className="px-1 py-2.5 text-center">
                                            <Allowed allowed={roleCan(capability, role)} />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    ))}
                </table>
                <p className="border-t border-line px-4 py-3 text-xs text-ink-soft sm:px-5">
                    Solo un administrador cambia el rol de una cuenta. El servidor aplica estos
                    permisos en cada acción.
                </p>
            </div>
        </details>
    )
}
