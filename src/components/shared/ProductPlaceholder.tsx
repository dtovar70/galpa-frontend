import type { JSX } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import type { PlaceholderArt } from '@/constants/category.constant'
import { cn } from '@/utils/cn'

const placeholderVariants = cva(
    'flex aspect-square w-full items-center justify-center bg-linear-to-br from-mist to-white text-brand-600 select-none',
    {
        variants: {
            size: {
                sm: 'max-w-16 rounded-xl',
                md: 'max-w-60 rounded-2xl',
                lg: 'max-w-full rounded-2xl',
            },
        },
        defaultVariants: { size: 'md' },
    },
)

const GEAR_TEETH = Array.from({ length: 8 }, (_, index) => index * 45)

/** Split wall unit with its louver and the air leaving it. */
function SplitArt() {
    return (
        <>
            <rect x="28" y="58" width="144" height="56" rx="12" />
            <path d="M40 100h120" />
            <path d="M48 108h104" opacity="0.5" />
            <circle cx="150" cy="74" r="3" fill="currentColor" stroke="none" />
            <path d="M44 72h52" opacity="0.4" />
            <g className="text-frost-400" stroke="currentColor">
                <path d="M62 128c6 8 6 16 0 24" />
                <path d="M100 128c6 8 6 16 0 24" />
                <path d="M138 128c6 8 6 16 0 24" />
            </g>
        </>
    )
}

/** Ceiling cassette seen from below: frame, grille and the four air slots. */
function CassetteArt() {
    return (
        <>
            <path d="M30 40h140" opacity="0.4" />
            <rect x="44" y="52" width="112" height="112" rx="12" />
            <rect x="74" y="82" width="52" height="52" rx="6" />
            <path d="M84 94h32M84 104h32M84 114h32M84 124h32" opacity="0.5" />
            <path d="M62 66h76M62 150h76M58 70v76M142 70v76" />
        </>
    )
}

/** A gear with a wrench across it: spare parts. */
function PartArt() {
    return (
        <>
            <g transform="translate(88 104)">
                {GEAR_TEETH.map((angle) => (
                    <rect
                        key={angle}
                        x="-6"
                        y="-46"
                        width="12"
                        height="14"
                        rx="3"
                        transform={`rotate(${angle})`}
                    />
                ))}
                <circle r="34" />
                <circle r="12" />
            </g>
            <path d="M118 152l34-34a16 16 0 1 0 -10-10l-34 34" />
            <path d="M150 92l8-8" opacity="0.5" />
        </>
    )
}

/** A box with a coiled copper line: accessories and installation material. */
function AccessoryArt() {
    return (
        <>
            <path d="M40 92l50-22 50 22-50 22z" />
            <path d="M40 92v48l50 22 50-22V92" />
            <path d="M90 114v48" />
            <g className="text-frost-400" stroke="currentColor">
                <ellipse cx="150" cy="70" rx="22" ry="9" />
                <ellipse cx="150" cy="60" rx="22" ry="9" opacity="0.6" />
                <path d="M128 70v26" />
            </g>
        </>
    )
}

const ARTWORK: Record<PlaceholderArt, () => JSX.Element> = {
    split: SplitArt,
    cassette: CassetteArt,
    part: PartArt,
    accessory: AccessoryArt,
}

export interface ProductPlaceholderProps extends VariantProps<typeof placeholderVariants> {
    art: PlaceholderArt
    /** Accessible name; empty keeps it decorative (the product name is already next to it). */
    label?: string
    className?: string
}

/** Line-art stand-in for a product without photos, drawn per category. */
export function ProductPlaceholder({ art, label, size, className }: ProductPlaceholderProps) {
    const Art = ARTWORK[art]
    return (
        <div
            role={label ? 'img' : undefined}
            aria-label={label || undefined}
            aria-hidden={label ? undefined : true}
            className={cn(placeholderVariants({ size }), className)}
        >
            <svg
                viewBox="0 0 200 200"
                fill="none"
                stroke="currentColor"
                strokeWidth={size === 'sm' ? 8 : 4}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3/5 w-3/5"
            >
                <Art />
            </svg>
        </div>
    )
}
