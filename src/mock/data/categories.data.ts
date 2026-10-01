import type { Category } from '@/@types/product'
import { products } from '@/mock/data/products.data'
import { PALETTE } from '@/constants/theme.constant'
import { ILLUSTRATION_TEMPLATES } from '@/constants/design.constant'

type CategorySeed = Omit<
    Category,
    'productCount' | 'designEnabled' | 'designTemplate' | 'designPrintSize'
>

const categorySeeds: CategorySeed[] = [
    {
        slug: 'mugs',
        name: 'Tazas',
        tagline: 'Tu mañana, con tu diseño',
        description:
            'Cerámica sublimada a 180 °C: el diseño queda fundido en la taza, así que aguanta microondas, lavavajillas y años de café.',
        colorHex: PALETTE.blush300,
    },
    {
        slug: 'tees',
        name: 'Franelas',
        tagline: 'Se pone y se nota',
        description:
            'Algodón suave con estampado que no se agrieta ni se despega. Cortes unisex, crop y oversize, de la talla S a la XXL.',
        colorHex: PALETTE.sky300,
    },
    {
        slug: 'keychains',
        name: 'Llaveros',
        tagline: 'El detalle que se lleva puesto',
        description:
            'Acrílico, madera o metal con tu nombre, tu foto o tu mascota. El regalo pequeño que siempre termina en las llaves de todos.',
        colorHex: PALETTE.lilac400,
    },
]

export const categories: Category[] = categorySeeds.map((seed) => ({
    ...seed,
    productCount: products.filter((product) => product.category === seed.slug).length,
    // Like the API before any template photo: the illustration templates only.
    designEnabled: Object.hasOwn(ILLUSTRATION_TEMPLATES, seed.slug),
    designTemplate: null,
    designPrintSize: Object.hasOwn(ILLUSTRATION_TEMPLATES, seed.slug)
        ? {
              widthCm: ILLUSTRATION_TEMPLATES[seed.slug]!.widthCm,
              heightCm: ILLUSTRATION_TEMPLATES[seed.slug]!.heightCm,
          }
        : null,
}))
