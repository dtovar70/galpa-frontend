import type { UserRole } from '@/@types/admin'
import { Badge } from '@/components/ui'
import { ROLE_LABEL } from '@/views/admin/users/schema/user.schema'

export function RoleBadge({ role }: { role: UserRole }) {
    return (
        <Badge size="sm" tone={role === 'ADMIN' ? 'solid' : 'info'}>
            {ROLE_LABEL[role]}
        </Badge>
    )
}

export function StatusBadge({ isActive }: { isActive: boolean }) {
    return (
        <Badge size="sm" tone={isActive ? 'brand' : 'neutral'}>
            {isActive ? 'Activo' : 'Inactivo'}
        </Badge>
    )
}
