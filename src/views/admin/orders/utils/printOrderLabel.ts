export interface OrderLabel {
    code: string
    customerName: string
    brandName: string
    /** PNG data URL of the order QR. */
    qrPngDataUrl: string
}

function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;')
}

/**
 * A print-only page with one 6×4 cm label: the QR, the order code, the customer's name and the
 * brand. On screen it shows centered on grey; `@page` sizes the printout to the label.
 */
export function orderLabelHtml(label: OrderLabel): string {
    const code = escapeHtml(label.code)
    return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Etiqueta ${code}</title>
<style>
@page { size: 60mm 40mm; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; }
body { font-family: 'Manrope', 'Segoe UI', system-ui, sans-serif; color: #000; }
.label { width: 60mm; height: 40mm; padding: 2.5mm; display: flex; align-items: center; gap: 2mm; background: #fff; overflow: hidden; }
.qr { width: 31mm; height: 31mm; flex: none; image-rendering: pixelated; }
.text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1.2mm; }
.brand { font-size: 5.5pt; line-height: 1.15; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
.code { font-size: 9.5pt; font-weight: 800; white-space: nowrap; }
.name { font-size: 7.5pt; line-height: 1.2; overflow-wrap: anywhere; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.hint { font-size: 5.5pt; color: #333; }
@media screen {
  body { min-height: 100vh; display: grid; place-items: center; background: #ececec; }
  .label { box-shadow: 0 1px 8px rgba(0, 0, 0, 0.18); border-radius: 1.5mm; }
}
</style>
</head>
<body>
<div class="label">
  <img class="qr" src="${label.qrPngDataUrl}" alt="QR del pedido ${code}" />
  <div class="text">
    <span class="brand">${escapeHtml(label.brandName)}</span>
    <span class="code">${code}</span>
    <span class="name">${escapeHtml(label.customerName)}</span>
    <span class="hint">Escanea para ver el pedido</span>
  </div>
</div>
<script>
window.addEventListener('load', function () { window.focus(); window.print(); });
</script>
</body>
</html>`
}

/**
 * Opens the label in a new window and prints it. Must run inside the click handler (popup
 * blockers); returns false when the browser blocked the window.
 */
export function printOrderLabel(label: OrderLabel): boolean {
    const target = window.open('', '_blank', 'width=480,height=360')
    if (!target) return false
    target.document.open()
    target.document.write(orderLabelHtml(label))
    target.document.close()
    return true
}
