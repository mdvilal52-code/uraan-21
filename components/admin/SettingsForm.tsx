'use client';

import { useEffect, useState } from 'react';
import { Save, Store, Mail, Phone, MapPin, Globe, CreditCard, MessageCircle, Check } from 'lucide-react';
import { type SettingsData, DEFAULT_SETTINGS, getSettings, saveSettings } from '@/lib/settings';
import { MAPS_VIEW_URL } from '@/lib/business';

export default function SettingsForm() {
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  // Load any previously saved settings (localStorage) after mount, so server
  // and first client render both use the defaults — no hydration mismatch.
  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Store Info */}
      <div className="bg-white border border-[rgba(184,137,58,0.18)] p-5 md:p-6">
        <h3 className="display text-sm tracking-[3px] uppercase text-[#1a1410] mb-5 pb-3 border-b border-[rgba(184,137,58,0.18)] flex items-center gap-2">
          <Store size={14} className="text-[#b8893a]" /> Store Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="luxury-label">Store Name</label>
            <input
              type="text"
              value={settings.storeName}
              onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
              className="luxury-input"
            />
          </div>

          <div>
            <label className="luxury-label">Email</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8c75]" />
              <input
                type="email"
                value={settings.storeEmail}
                onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })}
                className="luxury-input !pl-9"
              />
            </div>
          </div>

          <div>
            <label className="luxury-label">Phone</label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8c75]" />
              <input
                type="tel"
                value={settings.storePhone}
                onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
                className="luxury-input !pl-9"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="luxury-label">Address</label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-3 text-[#9a8c75]" />
              <textarea
                rows={2}
                value={settings.storeAddress}
                onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
                className="luxury-input !pl-9"
              />
            </div>
            <a
              href={MAPS_VIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-1.5 text-[11px] font-semibold text-[#b8893a] hover:underline"
            >
              Preview default address on Google Maps
            </a>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white border border-[rgba(184,137,58,0.18)] p-5 md:p-6">
        <h3 className="display text-sm tracking-[3px] uppercase text-[#1a1410] mb-5 pb-3 border-b border-[rgba(184,137,58,0.18)] flex items-center gap-2">
          <Globe size={14} className="text-[#b8893a]" /> Pricing & Shipping
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="luxury-label">Currency</label>
            <select
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              className="luxury-input"
            >
              <option value="INR">₹ INR (Indian Rupee)</option>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
              <option value="GBP">£ GBP</option>
            </select>
          </div>

          <div>
            <label className="luxury-label">GST / Tax Rate (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={settings.taxRate}
              onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })}
              className="luxury-input"
            />
          </div>

          <div>
            <label className="luxury-label">Standard Shipping (₹)</label>
            <input
              type="number"
              min={0}
              value={settings.shippingFlat}
              onChange={(e) => setSettings({ ...settings, shippingFlat: Number(e.target.value) })}
              className="luxury-input"
            />
          </div>

          <div>
            <label className="luxury-label">Free Shipping Above (₹)</label>
            <input
              type="number"
              min={0}
              value={settings.freeShippingThreshold}
              onChange={(e) => setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })}
              className="luxury-input"
            />
          </div>

          <div>
            <label className="luxury-label">COD Charges (₹)</label>
            <input
              type="number"
              min={0}
              value={settings.codCharges}
              onChange={(e) => setSettings({ ...settings, codCharges: Number(e.target.value) })}
              className="luxury-input"
            />
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white border border-[rgba(184,137,58,0.18)] p-5 md:p-6">
        <h3 className="display text-sm tracking-[3px] uppercase text-[#1a1410] mb-5 pb-3 border-b border-[rgba(184,137,58,0.18)] flex items-center gap-2">
          <CreditCard size={14} className="text-[#b8893a]" /> Payment Methods
        </h3>

        <div className="space-y-3">
          {[
            { key: 'enableCards' as const, label: 'Credit / Debit Cards' },
            { key: 'enableUPI' as const, label: 'UPI Payments' },
            { key: 'enableNetbanking' as const, label: 'Net Banking' },
            { key: 'enableWallet' as const, label: 'Wallets (Paytm, etc.)' },
            { key: 'enableCOD' as const, label: 'Cash on Delivery (COD)' },
          ].map((p) => (
            <label
              key={p.key}
              className="flex items-center justify-between p-3 bg-[#fbf8f1] cursor-pointer hover:bg-[#f8f2e6]"
            >
              <span className="text-sm text-[#1a1410] font-medium">{p.label}</span>
              <input
                type="checkbox"
                checked={settings[p.key]}
                onChange={(e) => setSettings({ ...settings, [p.key]: e.target.checked })}
                className="accent-[#b8893a]"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white border border-[rgba(184,137,58,0.18)] p-5 md:p-6">
        <h3 className="display text-sm tracking-[3px] uppercase text-[#1a1410] mb-5 pb-3 border-b border-[rgba(184,137,58,0.18)]">
          Notifications
        </h3>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 bg-[#fbf8f1] cursor-pointer hover:bg-[#f8f2e6]">
            <span className="text-sm text-[#1a1410] font-medium">Email notifications for new orders</span>
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
              className="accent-[#b8893a]"
            />
          </label>
          <label className="flex items-center justify-between p-3 bg-[#fbf8f1] cursor-pointer hover:bg-[#f8f2e6]">
            <span className="text-sm text-[#1a1410] font-medium">SMS notifications for new orders</span>
            <input
              type="checkbox"
              checked={settings.smsNotifications}
              onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
              className="accent-[#b8893a]"
            />
          </label>
        </div>
      </div>

      {/* Integrations: WhatsApp & CRM */}
      <div className="bg-white border border-[rgba(184,137,58,0.18)] p-5 md:p-6">
        <h3 className="display text-sm tracking-[3px] uppercase text-[#1a1410] mb-5 pb-3 border-b border-[rgba(184,137,58,0.18)] flex items-center gap-2">
          <MessageCircle size={14} className="text-[#b8893a]" /> Integrations · WhatsApp & CRM
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="luxury-label">WhatsApp Business Number</label>
            <div className="relative">
              <MessageCircle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8c75]" />
              <input
                type="tel"
                value={settings.whatsappNumber}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                className="luxury-input !pl-9"
                placeholder="9188519XXXXX"
              />
            </div>
          </div>

          <div>
            <label className="luxury-label">CRM Provider</label>
            <select
              value={settings.crmProvider}
              onChange={(e) => setSettings({ ...settings, crmProvider: e.target.value })}
              className="luxury-input"
            >
              <option value="HubSpot">HubSpot</option>
              <option value="Zoho">Zoho CRM</option>
              <option value="None">None (in-app only)</option>
            </select>
          </div>
        </div>

        <label className="flex items-center justify-between p-3 bg-[#fbf8f1] cursor-pointer hover:bg-[#f8f2e6] mt-4">
          <span className="text-sm text-[#1a1410] font-medium">
            Send order status updates to customers on WhatsApp
          </span>
          <input
            type="checkbox"
            checked={settings.whatsappOrderUpdates}
            onChange={(e) => setSettings({ ...settings, whatsappOrderUpdates: e.target.checked })}
            className="accent-[#b8893a]"
          />
        </label>

        <p className="text-[11px] text-[#9a8c75] mt-3 leading-relaxed">
          Live sending uses the WhatsApp Cloud API and your CRM. Add{' '}
          <code className="text-[#b8893a]">WHATSAPP_TOKEN</code>,{' '}
          <code className="text-[#b8893a]">WHATSAPP_PHONE_NUMBER_ID</code> and{' '}
          <code className="text-[#b8893a]">HUBSPOT_*</code> to your server environment variables.
          Until then, the panel falls back to wa.me click-to-chat links.
        </p>
      </div>

      <div className="flex justify-end items-center gap-3">
        {saved && (
          <span className="text-[11px] tracking-[1px] uppercase text-[#3d6b5a] font-semibold inline-flex items-center gap-1">
            <Check size={14} /> Saved
          </span>
        )}
        <button
          type="submit"
          className="px-8 py-3 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[2px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410] inline-flex items-center gap-2"
        >
          <Save size={14} /> Save All Settings
        </button>
      </div>
    </form>
  );
}