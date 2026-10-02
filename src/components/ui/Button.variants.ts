import { cva, type VariantProps } from 'class-variance-authority'

/**
 * Shared by `Button` and `ButtonLink` so a solid CTA looks identical whether it
 * renders a `<button>` or a router `<Link>`.
 */
export const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition duration-200 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none',
    {
        variants: {
            variant: {
                /** The one blue call to action of a screen, with a faint glow. */
                primary:
                    'bg-brand-600 text-white shadow-glow hover:-translate-y-0.5 hover:bg-brand-700 active:bg-brand-800',
                secondary:
                    'border border-line-strong bg-white text-ink hover:-translate-y-0.5 hover:border-ink/30 hover:bg-page',
                /** Solid navy, for strong secondary actions on light backgrounds. */
                dark: 'bg-ink text-white hover:-translate-y-0.5 hover:bg-surface-raised',
                /** On the navy band (footer): a light outline that reads on navy. */
                'outline-light':
                    'border border-white/25 bg-white/5 text-white hover:-translate-y-0.5 hover:border-frost-400 hover:bg-white/10',
                ghost: 'text-ink hover:bg-mist',
                info: 'border border-frost-200 bg-frost-50 text-frost-800 hover:bg-frost-100',
                /** WhatsApp green (darkened for white text contrast). */
                whatsapp:
                    'bg-[#128c7e] text-white shadow-soft hover:-translate-y-0.5 hover:bg-[#0b6f63]',
                danger: 'bg-danger-600 text-white shadow-soft hover:-translate-y-0.5 hover:bg-danger-700',
            },
            size: {
                // Touch screens get a 44px target; mouse users keep the compact size.
                sm: 'h-9 px-4 text-sm pointer-coarse:h-11',
                md: 'h-11 px-5 text-[0.95rem]',
                lg: 'h-13 px-7 text-base',
            },
            fullWidth: {
                true: 'w-full',
                false: '',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'md',
            fullWidth: false,
        },
    },
)

export type ButtonVariantProps = VariantProps<typeof buttonVariants>
