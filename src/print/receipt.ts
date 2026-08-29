import { numericBarcodeData, type PrintSections } from 'tauri-plugin-thermal-printer';
import type { Factura } from '../db/sales';
import type { BusinessData } from '../db/settings';

type Align = 'left' | 'center' | 'right';
type Size = 'normal' | 'height' | 'width' | 'double';

interface SectionStyle {
  bold?: boolean;
  underline?: boolean;
  align?: Align;
  italic?: boolean;
  invert?: boolean;
  font?: 'A' | 'B' | 'C';
  rotate?: boolean;
  upside_down?: boolean;
  size?: Size;
}

const leftStyle = (overrides: SectionStyle = {}) => ({
  bold: false,
  underline: false,
  align: 'left' as const,
  italic: false,
  invert: false,
  font: 'A' as const,
  rotate: false,
  upside_down: false,
  size: 'normal' as const,
  ...overrides,
});

const centerStyle = (overrides: SectionStyle = {}) => leftStyle({ align: 'center', ...overrides });
const rightStyle = (overrides: SectionStyle = {}) => leftStyle({ align: 'right', ...overrides });

const formatMoney = (n: number): string =>
  '$' + n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const padFolio = (id: number): string => String(id).padStart(6, '0');

export interface BuildReceiptInput {
  business: BusinessData;
  factura: Factura;
  cashier: string;
  received?: number;
  change?: number;
  isReprint?: boolean;
}

export function buildReceiptSections({
  business,
  factura,
  cashier,
  received,
  change,
  isReprint,
}: BuildReceiptInput): PrintSections[] {
  const { venta, items } = factura;

  const total = venta.total;
  const taxRate = business.tax_rate > 0 ? business.tax_rate : 0;
  const iva = taxRate > 0 ? total - total / (1 + taxRate / 100) : 0;
  const subtotal = total - iva;
  const quantitySum = items.reduce((sum, i) => sum + i.quantity, 0);

  const normalizedDate = venta.sale_date.includes('T')
    ? venta.sale_date
    : venta.sale_date.replace(' ', 'T') + 'Z';
  const facturaDate = new Date(normalizedDate);
  const fechaFormateada = facturaDate.toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const folio = padFolio(venta.id!);
  const qrData = business.website
    ? `https://${business.website.replace(/^https?:\/\//, '')}/ticket/${folio}`
    : `folio:${folio}|total:${total.toFixed(2)}`;
  const itemRows: PrintSections[] = [
    {
      Table: {
        columns: 4,
        column_widths: [5, 20, 11, 12],
        header: [
          { text: 'CANT', styles: leftStyle({ bold: true }) },
          { text: 'DESCRIPCIÓN', styles: leftStyle({ bold: true }) },
          { text: 'P.U.', styles: rightStyle({ bold: true }) },
          { text: 'TOTAL', styles: rightStyle({ bold: true }) },
        ],
        body: items.map((item) => [
          { text: String(item.quantity), styles: leftStyle() },
           { text: `${item.product_name}${item.lot_number ? ` Lote:${item.lot_number}` : ''}${item.expiration_date ? ` Vence:${item.expiration_date}` : ''}`, styles: leftStyle() },
          { text: formatMoney(item.price), styles: rightStyle() },
          { text: formatMoney(item.subtotal), styles: rightStyle() },
        ]),
        truncate: false,
        word_wrap: true,
      },
    },
  ];

  const totalsRows: PrintSections[] = [
    {
      Table: {
        columns: 2,
        column_widths: [32, 16],
        header: [],
        body: [
          [
            { text: 'SUBTOTAL:', styles: leftStyle() },
            { text: formatMoney(subtotal), styles: rightStyle() },
          ],
          ...(taxRate > 0
            ? [
                [
                  { text: `IVA (${taxRate}%):`, styles: leftStyle() },
                  { text: formatMoney(iva), styles: rightStyle() },
                ],
              ]
            : []),
          [
            { text: 'TOTAL:', styles: leftStyle({ bold: true }) },
            { text: formatMoney(total), styles: rightStyle({ bold: true }) },
          ],
        ],
        truncate: false,
      },
    },
  ];

  const paymentRows: PrintSections[] = [
    { Text: { text: 'Forma de Pago: EFECTIVO', styles: leftStyle({ bold: true }) } },
  ];
  if (received !== undefined && change !== undefined) {
    paymentRows.push({
      Table: {
        columns: 2,
        column_widths: [32, 16],
        header: [],
        body: [
          [
            { text: 'Pago con:', styles: leftStyle() },
            { text: formatMoney(received), styles: rightStyle() },
          ],
          [
            { text: 'Cambio:', styles: leftStyle() },
            { text: formatMoney(change), styles: rightStyle() },
          ],
        ],
        truncate: false,
      },
    });
  }

  return [
    { Title: { text: business.name, styles: centerStyle({ bold: true, size: 'double' }) } },
    ...(business.slogan
      ? [{ Text: { text: business.slogan, styles: centerStyle({ italic: true }) } } as PrintSections]
      : []),
    ...(business.address
      ? [{ Text: { text: business.address, styles: centerStyle() } } as PrintSections]
      : []),
    ...(business.city
      ? [{ Text: { text: business.city, styles: centerStyle() } } as PrintSections]
      : []),
    ...(business.phone
      ? [{ Text: { text: `Tel: ${business.phone}`, styles: centerStyle() } } as PrintSections]
      : []),
    ...(business.rfc
      ? [{ Text: { text: `NIT: ${business.rfc}`, styles: centerStyle() } } as PrintSections]
      : []),
    ...(business.email
      ? [{ Text: { text: business.email, styles: centerStyle() } } as PrintSections]
      : []),
    { Line: { character: '=' } },
    { Text: { text: 'RECIBO DE COMPRA', styles: centerStyle({ bold: true }) } },
    ...(isReprint ? [{ Text: { text: '*** REIMPRESIÓN ***', styles: centerStyle({ bold: true }) } } as PrintSections] : []),
    { Text: { text: `Folio: #${folio}`, styles: leftStyle() } },
    { Text: { text: `Fecha: ${fechaFormateada}`, styles: leftStyle() } },
    { Text: { text: `Cajero: ${cashier}`, styles: leftStyle() } },
    { Text: { text: `Cliente: ${venta.customer_name || 'Generico'}`, styles: leftStyle() } },
    ...(venta.customer_nit
      ? [{ Text: { text: `NIT: ${venta.customer_nit}`, styles: leftStyle() } } as PrintSections]
      : []),
    { Line: { character: '=' } },
    ...itemRows,
    { Line: { character: '=' } },
    ...totalsRows,
    { Line: { character: '=' } },
    ...paymentRows,
    { Line: { character: '-' } },
    { Text: { text: `Total de artículos: ${quantitySum}`, styles: centerStyle() } },
    ...(business.footer
      ? [{ Text: { text: business.footer, styles: centerStyle() } } as PrintSections]
      : []),
    { Line: { character: '-' } },
    { Text: { text: '¡GRACIAS POR SU COMPRA!', styles: centerStyle({ bold: true }) } },
    { Text: { text: 'Vuelva pronto', styles: centerStyle() } },
    ...(business.website
      ? [{ Text: { text: business.website, styles: centerStyle() } } as PrintSections]
      : []),
    { Qr: { data: qrData, size: 5, error_correction: 'M', model: 2, align: 'center' } },
    { Barcode: { data: numericBarcodeData(folio), barcode_type: 'CODE128', width: 2, height: 50, text_position: 'below', align: 'center' } },
    { Line: { character: '-' } },
    { Feed: { feed_type: 'lines', value: 3 } },
  ];
}
