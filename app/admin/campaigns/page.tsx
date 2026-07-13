'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageCircle, Mail, Send, Users, Contact, Loader2 } from 'lucide-react';
import type { CampaignLog, CampaignChannel } from '@/lib/campaigns';

type Lead = { id: string; name: string; email: string; phone?: string };
type Customer = { id: string; name: string; email: string; phone: string };

type RecipientSource = { key: string; name: string; email?: string; phone?: string };

export default function AdminCampaignsPage() {
  const [channel, setChannel] = useState<CampaignChannel>('whatsapp');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [logs, setLogs] = useState<CampaignLog[]>([]);
  const [logsConfigured, setLogsConfigured] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/leads');
        const data = await res.json();
        if (res.ok && Array.isArray(data.leads)) setLeads(data.leads as Lead[]);
      } catch {
        /* ignore */
      }
      try {
        const res = await fetch('/api/customers');
        const data = await res.json();
        if (res.ok && Array.isArray(data.customers)) setCustomers(data.customers as Customer[]);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const loadLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      if (res.ok) {
        setLogsConfigured(Boolean(data.configured));
        setLogs((data.logs || []) as CampaignLog[]);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const leadSources: RecipientSource[] = useMemo(
    () => leads.map((l) => ({ key: `lead:${l.id}`, name: l.name, email: l.email, phone: l.phone })),
    [leads]
  );
  const customerSources: RecipientSource[] = useMemo(
    () => customers.map((c) => ({ key: `customer:${c.id}`, name: c.name, email: c.email, phone: c.phone })),
    [customers]
  );

  // Only recipients usable for the currently selected channel can actually be
  // selected — a lead with no phone can't receive a WhatsApp campaign, etc.
  const usable = (s: RecipientSource) => (channel === 'whatsapp' ? Boolean(s.phone) : Boolean(s.email));

  const toggle = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAll = (sources: RecipientSource[]) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      sources.filter(usable).forEach((s) => next.add(s.key));
      return next;
    });
  };

  const clearAll = () => setSelectedKeys(new Set());

  const allSources = [...leadSources, ...customerSources];
  const selectedRecipients = allSources.filter((s) => selectedKeys.has(s.key) && usable(s));

  const handleSend = async () => {
    setResult(null);
    if (!message.trim()) {
      setResult({ type: 'error', text: 'Please write a message.' });
      return;
    }
    if (channel === 'email' && !subject.trim()) {
      setResult({ type: 'error', text: 'Please add a subject for email campaigns.' });
      return;
    }
    if (selectedRecipients.length === 0) {
      setResult({ type: 'error', text: 'Please select at least one recipient.' });
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          subject: channel === 'email' ? subject : undefined,
          message,
          recipients: selectedRecipients.map((r) => ({ name: r.name, phone: r.phone, email: r.email })),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        const base = `Sent ${data.sentCount} of ${selectedRecipients.length} — ${data.failedCount} failed.`;
        setResult({
          type: data.failedCount > 0 ? 'error' : 'success',
          text: data.warning ? `${base} ${data.warning}` : base,
        });
        await loadLogs();
      } else {
        setResult({ type: 'error', text: data.error || 'Could not send campaign.' });
      }
    } catch {
      setResult({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="serif text-3xl text-[#1a1410] mb-1">Campaigns</h1>
        <p className="text-sm text-[#6b5d4c]">Send bulk WhatsApp or email messages to leads and customers.</p>
      </div>

      <div className="bg-white border border-[rgba(184,137,58,0.18)] p-5 mb-5">
        <h3 className="display text-sm tracking-[3px] uppercase text-[#1a1410] mb-4">Compose</h3>

        <div className="flex gap-3 mb-4">
          <button
            type="button"
            onClick={() => setChannel('whatsapp')}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[11px] tracking-[1.5px] uppercase font-semibold border ${
              channel === 'whatsapp'
                ? 'bg-[#16796F] text-white border-[#16796F]'
                : 'border-[rgba(184,137,58,0.32)] text-[#1a1410]'
            }`}
          >
            <MessageCircle size={14} /> WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setChannel('email')}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[11px] tracking-[1.5px] uppercase font-semibold border ${
              channel === 'email'
                ? 'bg-[#1a1410] text-[#e8d49b] border-[#1a1410]'
                : 'border-[rgba(184,137,58,0.32)] text-[#1a1410]'
            }`}
          >
            <Mail size={14} /> Email
          </button>
        </div>

        {channel === 'email' && (
          <div className="mb-4">
            <label className="luxury-label">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="luxury-input"
              placeholder="e.g., Festive Sale is Live!"
            />
          </div>
        )}

        <div className="mb-2">
          <label className="luxury-label">Message *</label>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="luxury-input"
            placeholder="Write your message here..."
          />
          <p className="text-[10px] text-[#9a8c75] mt-1">
            Use <code className="font-mono">{'{{name}}'}</code> to personalise per recipient (falls back to
            &quot;there&quot; if unknown).
          </p>
        </div>

        <div className="mt-5 pt-5 border-t border-[rgba(184,137,58,0.18)]">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h4 className="display text-xs tracking-[2px] uppercase text-[#1a1410]">
              Recipients ({selectedRecipients.length} selected)
            </h4>
            <button type="button" onClick={clearAll} className="text-[10px] tracking-[1px] uppercase text-[#7a2e2e] font-semibold hover:underline">
              Clear selection
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RecipientList
              title="Leads"
              icon={Contact}
              sources={leadSources}
              usable={usable}
              selectedKeys={selectedKeys}
              onToggle={toggle}
              onSelectAll={() => selectAll(leadSources)}
            />
            <RecipientList
              title="Customers"
              icon={Users}
              sources={customerSources}
              usable={usable}
              selectedKeys={selectedKeys}
              onToggle={toggle}
              onSelectAll={() => selectAll(customerSources)}
            />
          </div>
        </div>

        {result && (
          <div
            className={`mt-4 px-4 py-3 text-sm border ${
              result.type === 'success'
                ? 'bg-[#3d6b5a]/10 text-[#3d6b5a] border-[#3d6b5a]/30'
                : 'bg-[#7a2e2e]/10 text-[#7a2e2e] border-[#7a2e2e]/30'
            }`}
          >
            {result.text}
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={sending}
          className="mt-4 w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[2px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410] disabled:opacity-60"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {sending ? 'Sending…' : 'Send Campaign'}
        </button>
      </div>

      <div className="bg-white border border-[rgba(184,137,58,0.18)] overflow-x-auto">
        <div className="p-4 border-b border-[rgba(184,137,58,0.18)]">
          <h3 className="display text-sm tracking-[3px] uppercase text-[#1a1410]">
            History {!logsConfigured && <span className="text-[#9a8c75] normal-case tracking-normal text-xs">(connect a database to see past campaigns)</span>}
          </h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] tracking-[1.5px] uppercase text-[#9a8c75] border-b border-[rgba(184,137,58,0.18)] bg-[#fbf8f1]">
              <th className="text-left py-3 px-4 font-semibold">Channel</th>
              <th className="text-left py-3 px-4 font-semibold">Subject / Message</th>
              <th className="text-left py-3 px-4 font-semibold">Recipients</th>
              <th className="text-left py-3 px-4 font-semibold">Sent</th>
              <th className="text-left py-3 px-4 font-semibold">Failed</th>
              <th className="text-left py-3 px-4 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-[rgba(184,137,58,0.1)]">
                <td className="py-3 px-4 capitalize text-[#1a1410]">{l.channel}</td>
                <td className="py-3 px-4 text-[#6b5d4c] max-w-[280px] truncate">{l.subject || l.message}</td>
                <td className="py-3 px-4 text-[#1a1410]">{l.recipientCount}</td>
                <td className="py-3 px-4 text-[#3d6b5a] font-semibold">{l.sentCount}</td>
                <td className="py-3 px-4 text-[#7a2e2e] font-semibold">{l.failedCount}</td>
                <td className="py-3 px-4 text-[#9a8c75] text-xs">{new Date(l.createdAt).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <div className="text-center py-12 text-sm text-[#6b5d4c]">No campaigns sent yet.</div>
        )}
      </div>
    </div>
  );
}

function RecipientList({
  title,
  icon: Icon,
  sources,
  usable,
  selectedKeys,
  onToggle,
  onSelectAll,
}: {
  title: string;
  icon: typeof Users;
  sources: RecipientSource[];
  usable: (s: RecipientSource) => boolean;
  selectedKeys: Set<string>;
  onToggle: (key: string) => void;
  onSelectAll: () => void;
}) {
  return (
    <div className="border border-[rgba(184,137,58,0.18)]">
      <div className="flex items-center justify-between px-3 py-2 bg-[#fbf8f1] border-b border-[rgba(184,137,58,0.18)]">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-[#1a1410]">
          <Icon size={13} className="text-[#b8893a]" /> {title} ({sources.length})
        </span>
        <button type="button" onClick={onSelectAll} className="text-[10px] tracking-[1px] uppercase text-[#b8893a] font-semibold hover:underline">
          Select all
        </button>
      </div>
      <div className="max-h-56 overflow-y-auto divide-y divide-[rgba(184,137,58,0.08)]">
        {sources.map((s) => {
          const disabled = !usable(s);
          return (
            <label
              key={s.key}
              className={`flex items-center gap-2 px-3 py-2 text-xs ${
                disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-[#fbf8f1]/50'
              }`}
            >
              <input
                type="checkbox"
                disabled={disabled}
                checked={selectedKeys.has(s.key)}
                onChange={() => onToggle(s.key)}
                className="accent-[#b8893a]"
              />
              <span className="text-[#1a1410] font-medium truncate">{s.name || 'Unknown'}</span>
              <span className="text-[#9a8c75] truncate">{s.phone || s.email}</span>
            </label>
          );
        })}
        {sources.length === 0 && <div className="px-3 py-4 text-xs text-[#9a8c75]">None found.</div>}
      </div>
    </div>
  );
}
