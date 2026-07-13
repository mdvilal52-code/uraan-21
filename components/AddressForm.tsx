'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { Address, AddressInput, AddressType } from '@/lib/addresses';
import { validateAddress } from '@/lib/addresses';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  editing: Address | null; // null = "add new"
  onSaved: (address: Address) => void;
};

const ADDRESS_TYPES: AddressType[] = ['Home', 'Work', 'Other'];

const emptyForm: AddressInput = {
  fullName: '',
  mobile: '',
  alternateMobile: '',
  houseNo: '',
  street: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  addressType: 'Home',
  isDefault: false,
};

function toForm(a: Address): AddressInput {
  return {
    fullName: a.fullName,
    mobile: a.mobile,
    alternateMobile: a.alternateMobile || '',
    houseNo: a.houseNo,
    street: a.street,
    landmark: a.landmark || '',
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    country: a.country,
    addressType: a.addressType,
    isDefault: a.isDefault,
  };
}

export default function AddressForm({ isOpen, onClose, email, editing, onSaved }: Props) {
  const [form, setForm] = useState<AddressInput>(editing ? toForm(editing) : emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [openedFor, setOpenedFor] = useState<string | null>(null);

  // Re-seed the form whenever the modal opens for a different address (or a
  // fresh "add") without needing a key-based remount of the whole component.
  const target = editing?.id || 'new';
  if (isOpen && openedFor !== target) {
    setForm(editing ? toForm(editing) : emptyForm);
    setError('');
    setOpenedFor(target);
  }

  if (!isOpen) return null;

  const set = <K extends keyof AddressInput>(key: K, value: AddressInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return; // prevent duplicate submissions

    const validationError = validateAddress(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const res = await fetch(editing ? `/api/addresses/${editing.id}` : '/api/addresses', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, email }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'Could not save address.');
        return;
      }
      onSaved(data.address as Address);
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(184,137,58,0.18)] sticky top-0 bg-white z-10">
          <h3 className="display text-sm tracking-[3px] uppercase text-[#1a1410]">
            {editing ? 'Edit Address' : 'Add New Address'}
          </h3>
          <button onClick={onClose} aria-label="Close" className="text-[#6b5d4c] hover:text-[#1a1410]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="luxury-label">Full Name *</label>
              <input type="text" required value={form.fullName} onChange={(e) => set('fullName', e.target.value)} className="luxury-input" />
            </div>
            <div>
              <label className="luxury-label">Mobile Number *</label>
              <input type="tel" required value={form.mobile} onChange={(e) => set('mobile', e.target.value)} className="luxury-input" placeholder="10 digit mobile" />
            </div>
            <div>
              <label className="luxury-label">Alternate Mobile</label>
              <input type="tel" value={form.alternateMobile} onChange={(e) => set('alternateMobile', e.target.value)} className="luxury-input" />
            </div>
            <div className="md:col-span-2">
              <label className="luxury-label">House / Flat No *</label>
              <input type="text" required value={form.houseNo} onChange={(e) => set('houseNo', e.target.value)} className="luxury-input" />
            </div>
            <div className="md:col-span-2">
              <label className="luxury-label">Street / Area *</label>
              <input type="text" required value={form.street} onChange={(e) => set('street', e.target.value)} className="luxury-input" />
            </div>
            <div className="md:col-span-2">
              <label className="luxury-label">Landmark</label>
              <input type="text" value={form.landmark} onChange={(e) => set('landmark', e.target.value)} className="luxury-input" />
            </div>
            <div>
              <label className="luxury-label">City *</label>
              <input type="text" required value={form.city} onChange={(e) => set('city', e.target.value)} className="luxury-input" />
            </div>
            <div>
              <label className="luxury-label">State *</label>
              <input type="text" required value={form.state} onChange={(e) => set('state', e.target.value)} className="luxury-input" />
            </div>
            <div>
              <label className="luxury-label">Pincode *</label>
              <input type="text" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={form.pincode} onChange={(e) => set('pincode', e.target.value.replace(/[^0-9]/g, ''))} className="luxury-input" />
            </div>
            <div>
              <label className="luxury-label">Country *</label>
              <input type="text" required value={form.country} onChange={(e) => set('country', e.target.value)} className="luxury-input" />
            </div>
          </div>

          <div>
            <label className="luxury-label">Address Type</label>
            <div className="flex gap-2">
              {ADDRESS_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('addressType', t)}
                  className={`px-4 py-2 text-[11px] tracking-[1px] uppercase font-semibold border ${
                    form.addressType === t
                      ? 'bg-[#1a1410] text-[#e8d49b] border-[#1a1410]'
                      : 'border-[rgba(184,137,58,0.32)] text-[#1a1410]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm text-[#1a1410]">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => set('isDefault', e.target.checked)} className="accent-[#b8893a]" />
            Set as default address
          </label>

          {error && (
            <div className="px-4 py-3 text-sm bg-[#7a2e2e]/10 text-[#7a2e2e] border border-[#7a2e2e]/30">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[2px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410] disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Save Address'}
            </button>
            <button type="button" onClick={onClose} className="px-6 py-3 border border-[#1a1410] text-[11px] tracking-[2px] uppercase font-semibold">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
