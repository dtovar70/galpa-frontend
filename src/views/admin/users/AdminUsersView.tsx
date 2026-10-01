import { useEffect, useState } from 'react'
import { Lock, Plus, Search, Users, X } from 'lucide-react'
import { useSearchParams } from 'react-router'

import type { AdminUser } from '@/@types/user'
import { EmptyState } from '@/components/shared/EmptyState'
import { Alert, Button, Card, Input, Skeleton, Spinner } from '@/components/ui'
import { NOTICE_DISMISS_MS } from '@/constants/ui.constant'
import { getErrorMessage } from '@/services/errors'
import { cn } from '@/utils/cn'
import { formatDateTime } from '@/utils/formatDate'
import { useDebouncedValue } from '@/utils/hooks/useDebouncedValue'
import { CatalogPagination } from '@/views/catalog/components/CatalogPagination'
import { AdminPageHeader } from '@/views/admin/components/AdminPageHeader'
import { useAdminUsers } from '@/views/admin/hooks/useAdminUsers'
import { useSession } from '@/views/admin/hooks/useSession'
import { ResetPasswordDialog } from '@/views/admin/users/components/ResetPasswordDialog'
import { RolePermissionsTable } from '@/views/admin/users/components/RolePermissionsTable'
import { RoleBadge, StatusBadge } from '@/views/admin/users/components/UserBadges'
import { UserFormDialog } from '@/views/admin/users/components/UserFormDialog'
import { UserRowActions } from '@/views/admin/users/components/UserRowActions'
import { UserStatusDialog } from '@/views/admin/users/components/UserStatusDialog'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 350
const SKELETON_ROWS = 4

const headerCellClass =
    'px-4 py-3 text-left text-xs font-bold tracking-wide text-ink-soft uppercase'
const cellClass = 'px-4 py-3 align-middle'
/** Pinned right, like the products table, with its own background for what slides under. */
const actionsCellClass = 'sticky right-0 bg-white px-3 transition group-hover:bg-cream'

function initialOf(name: string): string {
    return name.trim().charAt(0).toUpperCase() || '?'
}

function lastAccess(user: AdminUser): string {
    return user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Nunca'
}

/** "2 chats", "1 de 2 activos" or "—". */
function telegramSummary(user: AdminUser): string {
    const { telegramChatCount: total, activeTelegramChatCount: active } = user
    if (total === 0) return '—'
    if (active === total) return total === 1 ? '1 chat' : `${total} chats`
    return `${active} de ${total} activos`
}

function UserIdentity({ user, isSelf }: { user: AdminUser; isSelf: boolean }) {
    return (
        <div className="flex min-w-0 items-center gap-3">
            <span
                aria-hidden="true"
                className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-full font-display font-semibold ring-1',
                    user.isActive
                        ? 'bg-blush-100 text-blush-700 ring-blush-200'
                        : 'bg-line/60 text-ink-soft ring-line',
                )}
            >
                {initialOf(user.name)}
            </span>
            <div className="min-w-0">
                <p className="font-display text-base leading-snug break-words text-ink">
                    {user.name}
                    {isSelf ? (
                        <span className="ml-1.5 font-sans text-xs font-semibold text-blush-700">
                            (tú)
                        </span>
                    ) : null}
                </p>
                <p className="truncate text-xs text-ink-soft" title={user.email}>
                    {user.email}
                </p>
            </div>
        </div>
    )
}

export function AdminUsersView() {
    const [searchParams, setSearchParams] = useSearchParams()
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const search = searchParams.get('q') ?? ''
    const [searchInput, setSearchInput] = useState(search)
    const debouncedSearch = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS)

    const { data: session } = useSession()
    const currentUserId = session?.id ?? ''
    const isAdmin = session?.role === 'ADMIN'
    const users = useAdminUsers(
        { search: search || undefined, page, pageSize: PAGE_SIZE },
        { enabled: isAdmin },
    )

    const [notice, setNotice] = useState<string | null>(null)
    const [formState, setFormState] = useState<{ user: AdminUser | null; key: number } | null>(null)
    const [resetUser, setResetUser] = useState<AdminUser | null>(null)
    const [statusUser, setStatusUser] = useState<AdminUser | null>(null)

    // The URL is the source of truth, so a reload or "back" keeps the search and the page.
    useEffect(() => {
        if (debouncedSearch === search) return
        setSearchParams(
            (current) => {
                const next = new URLSearchParams(current)
                if (debouncedSearch) next.set('q', debouncedSearch)
                else next.delete('q')
                next.delete('page')
                return next
            },
            { replace: true },
        )
    }, [debouncedSearch, search, setSearchParams])

    const goToPage = (nextPage: number) => {
        setSearchParams((current) => {
            const next = new URLSearchParams(current)
            if (nextPage > 1) next.set('page', String(nextPage))
            else next.delete('page')
            return next
        })
    }

    if (session && !isAdmin) {
        return (
            <>
                <AdminPageHeader title="Usuarios" />
                <EmptyState
                    title="Solo un administrador puede gestionar usuarios"
                    description="Para cambiar tu nombre o tu contraseña, entra en «Mi cuenta» desde tu nombre en el menú."
                    icon={<Lock className="size-6" />}
                />
            </>
        )
    }

    const openForm = (user: AdminUser | null) => setFormState({ user, key: Date.now() })
    const items = users.data?.items ?? []
    const actions = {
        onEdit: (user: AdminUser) => openForm(user),
        onResetPassword: setResetUser,
        onToggleActive: setStatusUser,
    }

    return (
        <>
            <AdminPageHeader
                title="Usuarios"
                description="Las cuentas que entran al panel. Cada acción queda registrada con el nombre de quien la hizo."
                actions={
                    <Button
                        onClick={() => openForm(null)}
                        leadingIcon={<Plus aria-hidden="true" className="size-4" />}
                    >
                        Nuevo usuario
                    </Button>
                }
            />

            <Alert tone="info" className="mb-6">
                Los usuarios no se eliminan: <strong>desactiva</strong> la cuenta de quien ya no
                trabaja contigo. No podrá entrar, sus sesiones se cierran y sus chats de Telegram
                dejan de recibir pagos, pero el historial de pedidos sigue mostrando quién hizo cada
                cosa.
            </Alert>

            <RolePermissionsTable className="mb-6" />

            <div className="mb-6 flex items-center gap-3">
                <div className="w-full max-w-md">
                    <Input
                        label="Buscar usuarios"
                        hideLabel
                        type="search"
                        placeholder="Buscar por nombre o correo"
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        leadingIcon={<Search className="size-4" />}
                        trailingAction={
                            searchInput ? (
                                <button
                                    type="button"
                                    onClick={() => setSearchInput('')}
                                    aria-label="Limpiar búsqueda"
                                    className="flex size-8 items-center justify-center rounded-full text-ink-soft hover:bg-blush-100"
                                >
                                    <X aria-hidden="true" className="size-4" />
                                </button>
                            ) : null
                        }
                    />
                </div>
                {users.isFetching && !users.isPending ? (
                    <Spinner size="sm" className="text-blush-500" label="Actualizando la lista" />
                ) : null}
            </div>

            {notice ? (
                <Alert
                    key={notice}
                    tone="success"
                    className="mb-6"
                    autoDismissMs={NOTICE_DISMISS_MS}
                    onDismiss={() => setNotice(null)}
                >
                    {notice}
                </Alert>
            ) : null}

            {users.isPending ? (
                <Card padding="none" className="divide-y divide-line overflow-hidden">
                    {Array.from({ length: SKELETON_ROWS }, (_, index) => (
                        <div key={index} className="flex items-center gap-4 p-4">
                            <Skeleton shape="block" className="size-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="w-1/3" />
                                <Skeleton className="h-3 w-1/4" />
                            </div>
                        </div>
                    ))}
                </Card>
            ) : users.isError ? (
                <EmptyState
                    title="No pudimos cargar los usuarios"
                    description={getErrorMessage(users.error)}
                    icon={<Users className="size-6" />}
                    action={
                        <Button variant="secondary" onClick={() => void users.refetch()}>
                            Reintentar
                        </Button>
                    }
                />
            ) : items.length === 0 ? (
                <EmptyState
                    title="Ningún usuario coincide"
                    description={`No encontramos usuarios para “${search}”.`}
                    icon={<Users className="size-6" />}
                    action={
                        <Button variant="secondary" onClick={() => setSearchInput('')}>
                            Limpiar búsqueda
                        </Button>
                    }
                />
            ) : (
                /* Table or cards by the width the list actually gets (see the products list). */
                <div className="@container">
                    <Card padding="none" className="hidden overflow-hidden @5xl:block">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[60rem] table-fixed text-sm">
                                <colgroup>
                                    <col />
                                    <col className="w-34" />
                                    <col className="w-26" />
                                    <col className="w-48" />
                                    <col className="w-28" />
                                    <col className="w-36" />
                                </colgroup>
                                <thead className="border-b border-line bg-blush-50/60">
                                    <tr>
                                        <th scope="col" className={headerCellClass}>
                                            Usuario
                                        </th>
                                        <th scope="col" className={headerCellClass}>
                                            Rol
                                        </th>
                                        <th scope="col" className={headerCellClass}>
                                            Estado
                                        </th>
                                        <th scope="col" className={headerCellClass}>
                                            Último acceso
                                        </th>
                                        <th scope="col" className={headerCellClass}>
                                            Telegram
                                        </th>
                                        <th
                                            scope="col"
                                            className={cn(
                                                headerCellClass,
                                                actionsCellClass,
                                                'bg-linear-to-r from-blush-50/60 to-blush-50/60 text-center',
                                            )}
                                        >
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {items.map((user) => {
                                        const isSelf = user.id === currentUserId
                                        return (
                                            <tr
                                                key={user.id}
                                                className="group transition hover:bg-cream"
                                            >
                                                <td className={cellClass}>
                                                    <UserIdentity user={user} isSelf={isSelf} />
                                                </td>
                                                <td className={cellClass}>
                                                    <RoleBadge role={user.role} />
                                                </td>
                                                <td className={cellClass}>
                                                    <StatusBadge isActive={user.isActive} />
                                                </td>
                                                <td
                                                    className={cn(
                                                        cellClass,
                                                        'whitespace-nowrap text-ink-soft tabular-nums',
                                                    )}
                                                >
                                                    {lastAccess(user)}
                                                </td>
                                                <td className={cn(cellClass, 'text-ink-soft')}>
                                                    {telegramSummary(user)}
                                                </td>
                                                <td className={cn(cellClass, actionsCellClass)}>
                                                    <UserRowActions
                                                        user={user}
                                                        isSelf={isSelf}
                                                        {...actions}
                                                        className="justify-center"
                                                    />
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Narrow containers: one card per user, two across when there is room. */}
                    <ul className="grid grid-cols-1 gap-3 @xl:grid-cols-2 @5xl:hidden">
                        {items.map((user) => {
                            const isSelf = user.id === currentUserId
                            return (
                                <li key={user.id}>
                                    <Card padding="sm" className="flex h-full flex-col gap-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <UserIdentity user={user} isSelf={isSelf} />
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <RoleBadge role={user.role} />
                                            <StatusBadge isActive={user.isActive} />
                                        </div>
                                        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
                                            <dt className="text-ink-soft">Último acceso</dt>
                                            <dd className="text-ink tabular-nums">
                                                {lastAccess(user)}
                                            </dd>
                                            <dt className="text-ink-soft">Telegram</dt>
                                            <dd className="text-ink">{telegramSummary(user)}</dd>
                                        </dl>
                                        <div className="mt-auto flex justify-end border-t border-line pt-2">
                                            <UserRowActions
                                                user={user}
                                                isSelf={isSelf}
                                                {...actions}
                                            />
                                        </div>
                                    </Card>
                                </li>
                            )
                        })}
                    </ul>

                    <div className="mt-8">
                        <CatalogPagination
                            page={users.data?.page ?? page}
                            totalPages={users.data?.totalPages ?? 1}
                            onPageChange={goToPage}
                        />
                    </div>
                </div>
            )}

            {formState ? (
                <UserFormDialog
                    key={formState.key}
                    isOpen
                    user={formState.user}
                    currentUserId={currentUserId}
                    onSaved={setNotice}
                    onClose={() => setFormState(null)}
                />
            ) : null}
            <ResetPasswordDialog
                key={resetUser?.id ?? 'closed'}
                user={resetUser}
                onDone={setNotice}
                onClose={() => setResetUser(null)}
            />
            <UserStatusDialog
                user={statusUser}
                onDone={setNotice}
                onClose={() => setStatusUser(null)}
            />
        </>
    )
}
