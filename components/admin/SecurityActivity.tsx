'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Activity, Monitor, Database, HardDrive } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import { isSupabaseAuthConfigured } from '@/lib/supabase/config';
import { parseUserAgent } from '@/lib/security/request';

type Login = { email: string; ip: string; user_agent: string; success: boolean; reason?: string | null; created_at: string };
type SecEvent = { type: string; severity: string; email: string | null; ip: string | null; created_at: string };

function when(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export default function SecurityActivity() {
  const router = useRouter();
  const [logins, setLogins] = useState<Login[]>([]);
  const [events, setEvents] = useState<SecEvent[]>([]);
  const [configured, setConfigured] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const d = await (await fetch('/api/admin/security-activity')).json();
        setConfigured(Boolean(d.configured));
        setLogins(d.logins || []);
        setEvents(d.events || []);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const signOutAll = async () => {
    if (!confirm('Sign out of ALL devices? Everyone will need to sign in again.')) return;
    setBusy(true);
    try {
      if (isSupabaseAuthConfigured()) {
        const sb = createClient();
        await sb.auth.signOut({ scope: 'global' });
      }
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {
      /* redirect regardless */
    }
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <div className="space-y-5">
      {/* Sessions / force logout */}
      <div className="bg-white border border-[rgba(184,137,58,0.18)] p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Monitor className="text-[#b8893a]" size={20} />
            <div>
              <div className="font-semibold text-[#1a1410]">Sessions &amp; devices</div>
              <div className="text-xs text-[#6b5d4c]">Sign out everywhere if a device is lost or compromised.</div>
            </div>
          </div>
          <button
            onClick={signOutAll}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#7a2e2e] text-[#7a2e2e] text-[11px] tracking-[1.5px] uppercase font-semibold hover:bg-[#7a2e2e] hover:text-white disabled:opacity-60"
          >
            <LogOut size={14} /> Sign out all devices
          </button>
        </div>
      </div>

      {/* Login activity */}
      <div className="bg-white border border-[rgba(184,137,58,0.18)] p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="text-[#b8893a]" size={18} />
            <h3 className="display text-sm tracking-[2px] uppercase text-[#1a1410]">Recent login activity</h3>
          </div>
          <span
            className={`inline-flex items-center gap-1 text-[10px] tracking-[1px] uppercase px-2 py-0.5 ${
              configured ? 'bg-[#3d6b5a]/10 text-[#3d6b5a]' : 'bg-[#b8893a]/10 text-[#b8893a]'
            }`}
          >
            {configured ? <Database size={11} /> : <HardDrive size={11} />}
            {configured ? 'Live' : 'No data'}
          </span>
        </div>

        {!configured ? (
          <p className="text-sm text-[#6b5d4c]">Run <span className="font-semibold">supabase/schema.sql</span> to record and show login activity.</p>
        ) : logins.length === 0 ? (
          <p className="text-sm text-[#6b5d4c]">No login activity yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] tracking-[1.5px] uppercase text-[#9a8c75] border-b border-[rgba(184,137,58,0.18)]">
                  <th className="text-left py-2 font-semibold">When</th>
                  <th className="text-left py-2 font-semibold">Device</th>
                  <th className="text-left py-2 font-semibold">IP</th>
                  <th className="text-left py-2 font-semibold">Result</th>
                </tr>
              </thead>
              <tbody>
                {logins.map((l, i) => {
                  const ua = parseUserAgent(l.user_agent || '');
                  return (
                    <tr key={i} className="border-b border-[rgba(184,137,58,0.1)]">
                      <td className="py-2 text-xs text-[#6b5d4c]">{when(l.created_at)}</td>
                      <td className="py-2 text-[#1a1410]">{ua.browser} · {ua.os} · {ua.deviceType}</td>
                      <td className="py-2 text-xs text-[#6b5d4c]">{l.ip}</td>
                      <td className="py-2">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold ${l.success ? 'bg-[#3d6b5a]/10 text-[#3d6b5a]' : 'bg-[#7a2e2e]/10 text-[#7a2e2e]'}`}>
                          {l.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {configured && events.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[rgba(184,137,58,0.12)]">
            <h4 className="text-[10px] tracking-[1.5px] uppercase text-[#9a8c75] mb-2">Security events</h4>
            <ul className="space-y-1">
              {events.slice(0, 8).map((ev, i) => (
                <li key={i} className="text-xs text-[#6b5d4c] flex items-center gap-2">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      ev.severity === 'critical' ? 'bg-[#7a2e2e]' : ev.severity === 'warning' ? 'bg-[#b8893a]' : 'bg-[#3d6b5a]'
                    }`}
                  />
                  <span className="font-medium text-[#1a1410]">{ev.type}</span>
                  <span>· {ev.ip || '—'} · {when(ev.created_at)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
