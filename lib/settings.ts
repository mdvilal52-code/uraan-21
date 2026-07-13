// Browser-persisted store settings (localStorage), so the admin Settings page
// actually saves and reloads its values without a backend. These are store
// preferences only — toggling a payment method here does NOT enable real
// payment processing (that still requires Razorpay keys; checkout stays in
// demo mode until then).
import { WHATSAPP_NUMBER } from '@/lib/whatsapp';
import { BUSINESS_NAME, BUSINESS_ADDRESS_INLINE } from '@/lib/business';

export type SettingsData = {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  currency: string;
  taxRate: number;
  shippingFlat: number;
  freeShippingThreshold: number;
  codCharges: number;
  enableUPI: boolean;
  enableCards: boolean;
  enableNetbanking: boolean;
  enableWallet: boolean;
  enableCOD: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  whatsappNumber: string;
  whatsappOrderUpdates: boolean;
  crmProvider: string;
};

export const DEFAULT_SETTINGS: SettingsData = {
  storeName: BUSINESS_NAME,
  storeEmail: 'info@omgauriputra.com',
  storePhone: '+91 98765 43210',
  storeAddress: BUSINESS_ADDRESS_INLINE,
  currency: 'INR',
  taxRate: 3,
  shippingFlat: 99,
  freeShippingThreshold: 1999,
  codCharges: 50,
  enableUPI: true,
  enableCards: true,
  enableNetbanking: true,
  enableWallet: true,
  enableCOD: true,
  emailNotifications: true,
  smsNotifications: true,
  whatsappNumber: WHATSAPP_NUMBER,
  whatsappOrderUpdates: true,
  crmProvider: 'HubSpot',
};

const KEY = 'ogp_settings';

function read(): Partial<SettingsData> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Partial<SettingsData>) : null;
  } catch {
    return null;
  }
}

/** Saved settings merged over the defaults (so new fields get sensible values). */
export function getSettings(): SettingsData {
  const stored = read();
  return stored ? { ...DEFAULT_SETTINGS, ...stored } : DEFAULT_SETTINGS;
}

export function saveSettings(settings: SettingsData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}
