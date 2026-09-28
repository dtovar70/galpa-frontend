import { KeyRound } from 'lucide-react'

import { CopyButton } from '@/components/shared/CopyButton'
import { ADMIN_ROUTES } from '@/constants/route.constant'

export interface CredentialsPanelProps {
    email: string
    password: string
    /** "created" for a new account, "reset" after "Restablecer contraseña". */
    kind: 'created' | 'reset'
}

function CredentialRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center gap-2 rounded-2xl border-2 border-line bg-white py-1.5 pr-1.5 pl-4">
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-ink-soft">{label}</p>
                <p className="font-mono text-sm break-all text-ink">{value}</p>
            </div>
            <CopyButton value={value} label={`Copiar ${label.toLowerCase()}`} />
        </div>
    )
}

/**
 * Shown once, right after creating an account or resetting a password: the API never returns
 * the password again, so this is the only chance to copy it.
 */
export function CredentialsPanel({ email, password, kind }: CredentialsPanelProps) {
    const loginUrl = `${window.location.origin}${ADMIN_ROUTES.login}`
    const message = `Tu acceso al panel de Manada Russo:\n${loginUrl}\nCorreo: ${email}\nContraseña: ${password}\n\nCuando entres, cámbiala desde «Mi cuenta».`

    return (
        <div className="space-y-4 rounded-3xl border-2 border-mint-400/60 bg-mint-200/30 p-4 sm:p-5">
            <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-ink">
                    <KeyRound aria-hidden="true" className="size-4" />
                </span>
                <div className="space-y-1 text-sm">
                    <p className="font-display text-base text-ink">
                        {kind === 'created'
                            ? 'Cuenta creada. Copia estos datos ahora'
                            : 'Contraseña nueva. Cópiala ahora'}
                    </p>
                    <p className="text-ink-soft">
                        No la volveremos a mostrar. Compártela solo por un canal privado (en persona
                        o por mensaje directo, nunca en un grupo) y pídele que la cambie desde «Mi
                        cuenta» al entrar.
                    </p>
                </div>
            </div>
            <div className="space-y-2">
                <CredentialRow label="Correo" value={email} />
                <CredentialRow label="Contraseña" value={password} />
            </div>
            <CopyButton value={message} label="Copiar mensaje con el acceso">
                Copiar mensaje con el acceso
            </CopyButton>
        </div>
    )
}
