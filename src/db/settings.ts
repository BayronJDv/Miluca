const PRINTER_STORAGE_KEY = 'gualcala.selected_printer';
const BUSINESS_STORAGE_KEY = 'gualcala.business_data';

export interface BusinessData {
  name: string;
  rfc: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  slogan: string;
  footer: string;
  tax_rate: number;
}

export const DEFAULT_BUSINESS_DATA: BusinessData = {
  name: 'Mi Empresa',
  rfc: '',
  address: '',
  city: '',
  phone: '',
  email: '',
  website: '',
  slogan: 'Comprometidos con la mejor atención',
  footer: 'Comprobante impreso por medio electrónico. El precio de los artículos incluye los impuestos que correspondan.',
  tax_rate: 0,
};

function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getSelectedPrinter(): string {
  const store = safeLocalStorage();
  if (!store) return '';
  return store.getItem(PRINTER_STORAGE_KEY) ?? '';
}

export function setSelectedPrinter(printerName: string): void {
  const store = safeLocalStorage();
  if (!store) return;
  if (printerName) {
    store.setItem(PRINTER_STORAGE_KEY, printerName);
  } else {
    store.removeItem(PRINTER_STORAGE_KEY);
  }
}

export function getBusinessData(): BusinessData {
  const store = safeLocalStorage();
  if (!store) return DEFAULT_BUSINESS_DATA;

  try {
    const raw = store.getItem(BUSINESS_STORAGE_KEY);
    if (!raw) return DEFAULT_BUSINESS_DATA;
    const parsed = JSON.parse(raw) as Partial<BusinessData>;
    return {
      ...DEFAULT_BUSINESS_DATA,
      ...parsed,
      tax_rate: typeof parsed.tax_rate === 'number' && isFinite(parsed.tax_rate) ? parsed.tax_rate : DEFAULT_BUSINESS_DATA.tax_rate,
    };
  } catch {
    return DEFAULT_BUSINESS_DATA;
  }
}

export function setBusinessData(data: BusinessData): void {
  const store = safeLocalStorage();
  if (!store) return;
  store.setItem(BUSINESS_STORAGE_KEY, JSON.stringify(data));
}