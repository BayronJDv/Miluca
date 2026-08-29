import { print_thermal_printer, ENCODE, type PrintJobRequest } from 'tauri-plugin-thermal-printer';
import type { Factura } from '../db/sales';
import { getSelectedPrinter, getBusinessData } from '../db/settings';
import { buildReceiptSections } from './receipt';

export interface ImprimirFacturaInput {
  factura: Factura;
  cashier: string;
  received?: number;
  change?: number;
  isReprint?: boolean;
}

export async function imprimirFactura({
  factura,
  cashier,
  received,
  change,
  isReprint,
}: ImprimirFacturaInput): Promise<void> {
  const printer = getSelectedPrinter();
  if (!printer) { alert('No hay una impresora seleccionada. Configúrala en la sección de Configuración.'); return; }
  const business = getBusinessData();
  const sections = buildReceiptSections({ business, factura, cashier, received, change, isReprint });
  try {
    const request: PrintJobRequest = { printer, paper_size: 'Mm72', options: { code_page: 6, encode: ENCODE.WINDOWS_1252, use_gbk: false }, sections };
    await print_thermal_printer(request);
  } catch (error) { console.error('Error al imprimir:', error); alert('Error al imprimir el recibo: ' + error); }
}
