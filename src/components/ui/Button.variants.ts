import { cva, type VariantProps } from 'class-variance-authority'

/**
 * Shared by `Button` and `ButtonLink` so a solid CTA looks identical whether it
 * renders a `<button>` or a router `<Link>`.
 */
export const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition duration-200 focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none',
    {
        variants: {
            variant: {
                primary:
                    'bg-blush-700 text-white shadow-soft hover:-translate-y-0.5 hover:bg-blush-800 active:bg-blush-900',
                secondary:
                    'border-2 border-ink/10 bg-white text-ink hover:-translate-y-0.5 hover:border-ink/20',
                ghost: 'text-ink hover:bg-blush-50',
                'outline-sky': 'border-2 border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100',
                /** WhatsApp green (darkened for white text contrast). */
                whatsapp:
                    'bg-[#128c7e] text-white shadow-soft hover:-translate-y-0.5 hover:bg-[#0b6f63]',
                danger: 'bg-blush-800 text-white shadow-soft hover:-translate-y-0.5 hover:bg-blush-900',
            },
            size: {
                // Touch screens get a 44px target; mouse users keep the compact size.
                sm: 'h-9 px-4 text-sm pointer-coarse:h-11',
                md: 'h-11 px-6 text-base',
                lg: 'h-14 px-8 text-lg',
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
