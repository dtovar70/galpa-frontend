import type { UserRole } from '@/@types/admin'

/**
 * What each admin role may do, in plain words for the panel (Usuarios and Mi cuenta).
 *
 * Mirrors the API, which is the one that actually enforces it:
 * - `@Roles(...)` on the controllers in `backend-cups/src/<module>/*.controller.ts` (class and
 *   method level).
 * - `adminRoles` in `backend-cups/src/orders/order-status.ts` (cancelling and reactivating a
 *   cancelled order are ADMIN only).
 * Update this list whenever one of those changes.
 */
export interface RoleCapability {
    action: string
    roles: readonly UserRole[]
}

export interface RoleCapabilityGroup {
    area: string
    capabilities: readonly RoleCapability[]
}

const BOTH: readonly UserRole[] = ['ADMIN', 'EDITOR']
const ADMIN_ONLY: readonly UserRole[] = ['ADMIN']

export const ROLE_CAPABILITIES: readonly RoleCapabilityGroup[] = [
    {
        area: 'Pedidos',
        capabilities: [
            { action: 'Ver pedidos y comprobantes de pago', roles: BOTH },
            { action: 'Verificar o rechazar pagos', roles: BOTH },
            { action: 'Avanzar el estado (producción, envío, entrega)', roles: BOTH },
            { action: 'Registrar un pago recibido por WhatsApp', roles: BOTH },
            { action: 'Reactivar un pedido vencido', roles: BOTH },
            { action: 'Marcar un reembolso como hecho', roles: BOTH },
            { action: 'Notas, enlaces del cliente, WhatsApp y comprobante PDF', roles: BOTH },
            { action: 'Cancelar pedidos', roles: ADMIN_ONLY },
            { action: 'Reactivar un pedido cancelado', roles: ADMIN_ONLY },
        ],
    },
    {
        area: 'Productos',
        capabilities: [
            { action: 'Crear y editar productos y sus fotos', roles: BOTH },
            { action: 'Ocultar o mostrar productos en la tienda', roles: BOTH },
            { action: 'Eliminar productos', roles: ADMIN_ONLY },
        ],
    },
    {
        area: 'Categorías',
        capabilities: [
            { action: 'Crear, editar y ordenar categorías', roles: BOTH },
            { action: 'Eliminar categorías', roles: ADMIN_ONLY },
        ],
    },
    {
        area: 'Contenido',
        capabilities: [
            { action: 'Editar los textos e imágenes de la tienda', roles: BOTH },
            { action: 'Restaurar una sección a sus valores originales', roles: ADMIN_ONLY },
        ],
    },
    {
        area: 'Tasa BCV',
        capabilities: [
            { action: 'Ver la tasa y usar «Actualizar ahora»', roles: BOTH },
            { action: 'Fijar una tasa manual', roles: ADMIN_ONLY },
        ],
    },
    {
        area: 'Administración',
        capabilities: [
            { action: 'Cambiar tu nombre y tu contraseña (Mi cuenta)', roles: BOTH },
            { action: 'Catálogos: estados, bancos y prefijos', roles: ADMIN_ONLY },
            { action: 'Usuarios: crear, editar y desactivar cuentas', roles: ADMIN_ONLY },
            { action: 'Telegram: vincular chats y notificaciones', roles: ADMIN_ONLY },
        ],
    },
]

export function roleCan(capability: RoleCapability, role: UserRole): boolean {
    return capability.roles.includes(role)
}

/** The areas and actions `role` has (`allowed: true`) or lacks; areas left empty are dropped. */
export function capabilityGroupsFor(role: UserRole, allowed: boolean): RoleCapabilityGroup[] {
    return ROLE_CAPABILITIES.map(({ area, capabilities }) => ({
        area,
        capabilities: capabilities.filter((capability) => roleCan(capability, role) === allowed),
    })).filter((group) => group.capabilities.length > 0)
}
