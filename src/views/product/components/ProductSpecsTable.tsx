import type { Product, ProductSpec } from '@/@types/product'
import { formatBtu } from '@/constants/product.constant'

/** The structured fields first (capacity, voltage…), then the free rows of the "ficha técnica". */
function specRows(product: Product): ProductSpec[] {
    const rows: ProductSpec[] = [{ label: 'Marca', value: product.brand }]
    if (product.model) rows.push({ label: 'Modelo', value: product.model })
    if (product.sku) rows.push({ label: 'SKU', value: product.sku })
    if (product.btu !== null) rows.push({ label: 'Capacidad', value: formatBtu(product.btu) })
    if (product.voltage) rows.push({ label: 'Voltaje', value: product.voltage })
    if (product.isInverter !== null) {
        rows.push({ label: 'Tecnología', value: product.isInverter ? 'Inverter' : 'Convencional' })
    }
    if (product.refrigerant) rows.push({ label: 'Refrigerante', value: product.refrigerant })
    return [...rows, ...product.specs]
}

export interface ProductSpecsTableProps {
    product: Product
}

/** "Ficha técnica": two columns, zebra rows, figures in the technical face. */
export function ProductSpecsTable({ product }: ProductSpecsTableProps) {
    const rows = specRows(product)

    return (
        <section aria-labelledby="specs-heading" className="space-y-4">
            <h2 id="specs-heading" className="text-xl text-ink">
                Ficha técnica
            </h2>
            <div className="overflow-hidden rounded-2xl border border-line bg-white">
                <table className="w-full text-sm">
                    <tbody>
                        {rows.map((row, index) => (
                            <tr
                                key={`${row.label}-${index}`}
                                className="border-b border-line last:border-b-0 even:bg-page"
                            >
                                <th
                                    scope="row"
                                    className="w-2/5 px-4 py-3 text-left align-top font-semibold text-ink-soft sm:w-1/3"
                                >
                                    {row.label}
                                </th>
                                <td className="px-4 py-3 font-tech font-medium text-ink">
                                    {row.value}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}
