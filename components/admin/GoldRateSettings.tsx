'use client';

import { useEffect, useState } from 'react';
import { Coins, Save, CheckCircle2 } from 'lucide-react';

export default function GoldRateSettings() {
  const [rate, setRate] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings/gold-rate');
        const data = await res.json();
        if (res.ok && data.ok) setRate(data.rate || 0);
      } catch {
        /* keep 0 */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/settings/gold-rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate }),
      });
      const data = await res.json();
      if (res.ok && data.ok) setSaved(true);
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-[rgba(184,137,58,0.18)] p-5 md:p-6">
      <h2 className="display text-sm tracking-[3px] uppercase text-[#1a1410] mb-1 pb-3 border-b border-[rgba(184,137,58,0.18)] flex items-center gap-2">
        <Coins size={16} className="text-[#b8893a]" /> Today&apos;s Gold Rate
      </h2>
      <p className="text-xs text-[#9a8c75] mt-3 mb-4">
        Used by any product with &quot;Use dynamic gold-rate pricing&quot; enabled: price = weight (g) × this rate + making charge.
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="luxury-label">₹ per gram</label>
          <input
            type="number"
            min={0}
            value={rate}
            onChange={(e) => { setRate(Number(e.target.value)); setSaved(false); }}
            disabled={loading}
            className="luxury-input"
          />
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading}
          className="px-5 py-3 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[2px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410] inline-flex items-center gap-2 disabled:opacity-50 self-end"
        >
          <Save size={14} /> {saving ? 'Saving...' : 'Update Rate'}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-[#3d6b5a] font-semibold">
            <CheckCircle2 size={14} /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
