'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Smartphone, Trash2, AlertCircle, Check, KeyRound, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import { isSupabaseAuthConfigured } from '@/lib/supabase/config';
import SecurityActivity from '@/components/admin/SecurityActivity';

type Factor = { id: string; friendly_name?: string | null; factor_type: string; status: string };
type Enrollment = { factorId: string; qr: string; secret: string; uri: string };

export default function AdminSecurityPage() {
  const ready = isSupabaseAuthConfigured();
  const supabase = useMemo(() => (ready ? createClient() : null), [ready]);

  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Change-password state.
  const [pwExpired, setPwExpired] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwErrors, setPwErrors] = useState<string[]>([]);
  const [pwMsg, setPwMsg] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setSignedIn(Boolean(user));
      if (user) {
        const { data } = await supabase.auth.mfa.listFactors();
        setFactors(((data?.all as Factor[]) || []).filter((f) => f.factor_type === 'totp'));
        try {
          const me = await (await fetch('/api/admin/me')).json();
          setPwExpired(Boolean(me?.admin?.passwordExpired));
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const verified = factors.filter((f) => f.status === 'verified');
  const twoFAOn = verified.length > 0;

  const startEnroll = async () => {
    if (!supabase) return;
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const { data, error: err } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: `Authenticator ${Date.now().toString().slice(-4)}`,
      });
      if (err) setError(err.message);
      else if (data) {
        setEnrollment({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret, uri: data.totp.uri });
      }
    } catch {
      setError('Could not start enrollment. Please try again.');
    }
    setBusy(false);
  };

  const confirmEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !enrollment) return;
    setError('');
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.mfa.challengeAndVerify({
        factorId: enrollment.factorId,
        code: code.trim(),
      });
      if (err) setError(err.message || 'Invalid code. Try again.');
      else {
        setMessage('Two-factor authentication is now enabled.');
        setEnrollment(null);
        setCode('');
        await load();
      }
    } catch {
      setError('Verification failed. Please try again.');
    }
    setBusy(false);
  };

  const cancelEnroll = async () => {
    if (supabase && enrollment) {
      try {
        await supabase.auth.mfa.unenroll({ factorId: enrollment.factorId });
      } catch {
        /* ignore */
      }
    }
    setEnrollment(null);
    setCode('');
    setError('');
  };

  const removeFactor = async (id: string) => {
    if (!supabase) return;
    if (!confirm('Remove this authenticator? Two-factor protection will be reduced.')) return;
    try {
      await supabase.auth.mfa.unenroll({ factorId: id });
      await load();
    } catch {
      setError('Could not remove the authenticator.');
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErrors([]);
    setPwMsg('');
    if (newPw !== confirmPw) {
      setPwErrors(['Passwords do not match.']);
      return;
    }
    setPwBusy(true);
    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newPw }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setPwMsg('Password updated.');
        setNewPw('');
        setConfirmPw('');
        setPwExpired(false);
      } else {
        setPwErrors(data.errors || [data.error || 'Could not update password.']);
      }
    } catch {
      setPwErrors(['Network error. Please try again.']);
    }
    setPwBusy(false);
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="serif text-3xl text-[#1a1410] mb-1 flex items-center gap-2">
          <ShieldCheck className="text-[#b8893a]" size={26} /> Security
        </h1>
        <p className="text-sm text-[#6b5d4c]">Two-factor authentication and password for your admin account.</p>
      </div>

      {!ready && (
        <Notice tone="warn">
          Supabase Auth isn&apos;t configured yet. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, then sign in with the secure login to manage security.
        </Notice>
      )}

      {ready && loading && <Notice tone="info">Loading…</Notice>}

      {ready && !loading && !signedIn && (
        <Notice tone="warn">
          You&apos;re signed in with the recovery (legacy) login. Two-factor authentication and password
          management apply to Supabase Auth accounts — sign in with the secure login to manage them.
        </Notice>
      )}

      {ready && !loading && signedIn && (
        <div className="space-y-5">
          {pwExpired && (
            <Notice tone="warn">Your password has expired. Please set a new one below.</Notice>
          )}
          {error && <Notice tone="error">{error}</Notice>}
          {message && <Notice tone="success">{message}</Notice>}

          {/* ── Two-factor authentication ── */}
          <div className="bg-white border border-[rgba(184,137,58,0.18)] p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <Smartphone className="text-[#b8893a]" size={20} />
                <div>
                  <div className="font-semibold text-[#1a1410]">Authenticator app (TOTP)</div>
                  <div className="text-xs text-[#6b5d4c]">Use Google Authenticator, Authy, 1Password, etc.</div>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1 text-[10px] tracking-[1px] uppercase px-2 py-0.5 font-semibold ${
                  twoFAOn ? 'bg-[#3d6b5a]/10 text-[#3d6b5a]' : 'bg-[#7a2e2e]/10 text-[#7a2e2e]'
                }`}
              >
                {twoFAOn ? <Check size={11} /> : <AlertCircle size={11} />} {twoFAOn ? 'On' : 'Off'}
              </span>
            </div>

            {verified.length > 0 && (
              <div className="mt-4 divide-y divide-[rgba(184,137,58,0.12)] border-t border-[rgba(184,137,58,0.12)]">
                {verified.map((f) => (
                  <div key={f.id} className="flex items-center justify-between py-3">
                    <div className="text-sm text-[#1a1410]">
                      {f.friendly_name || 'Authenticator'}
                      <span className="ml-2 text-[10px] text-[#3d6b5a] uppercase tracking-[1px]">Verified</span>
                    </div>
                    <button onClick={() => removeFactor(f.id)} className="text-[#6b5d4c] hover:text-[#7a2e2e]" aria-label="Remove authenticator">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!enrollment && (
              <button
                onClick={startEnroll}
                disabled={busy}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[2px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410] disabled:opacity-60"
              >
                <KeyRound size={14} /> {twoFAOn ? 'Add another authenticator' : 'Enable 2FA'}
              </button>
            )}
          </div>

          {enrollment && (
            <form onSubmit={confirmEnroll} className="bg-white border border-[rgba(184,137,58,0.18)] p-5">
              <h3 className="display text-sm tracking-[3px] uppercase text-[#1a1410] mb-4">Set up authenticator</h3>
              <ol className="text-sm text-[#6b5d4c] space-y-2 mb-4 list-decimal list-inside">
                <li>Open your authenticator app and scan this QR code.</li>
                <li>Or enter the secret key manually.</li>
                <li>Enter the 6-digit code it shows to confirm.</li>
              </ol>

              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={enrollment.qr} alt="2FA QR code" width={176} height={176} className="w-44 h-44 border border-[rgba(184,137,58,0.18)] bg-white p-2" />
                <div className="flex-1 min-w-0">
                  <label className="luxury-label">Secret key</label>
                  <div className="font-mono text-xs break-all bg-[#fbf8f1] border border-[rgba(184,137,58,0.18)] p-2 mb-4">{enrollment.secret}</div>
                  <label className="luxury-label">6-digit code</label>
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className="luxury-input tracking-[6px] text-center text-lg"
                    placeholder="••••••"
                  />
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <button type="submit" disabled={busy || code.length !== 6} className="px-6 py-2.5 bg-[#b8893a] text-white text-[11px] tracking-[2px] uppercase font-semibold hover:bg-[#1a1410] hover:text-[#e8d49b] disabled:opacity-60">
                  {busy ? 'Verifying…' : 'Verify & enable'}
                </button>
                <button type="button" onClick={cancelEnroll} className="px-6 py-2.5 border border-[#1a1410] text-[11px] tracking-[2px] uppercase font-semibold">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* ── Change password ── */}
          <form onSubmit={changePassword} className="bg-white border border-[rgba(184,137,58,0.18)] p-5">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="text-[#b8893a]" size={20} />
              <div>
                <div className="font-semibold text-[#1a1410]">Change password</div>
                <div className="text-xs text-[#6b5d4c]">
                  At least 12 characters, with upper &amp; lower case, a number and a symbol. Can&apos;t reuse a recent password.
                </div>
              </div>
            </div>

            {pwErrors.length > 0 && (
              <div className="mb-3 bg-[#7a2e2e]/10 text-[#7a2e2e] text-sm p-3">
                <div className="flex items-center gap-1.5 font-medium mb-1"><AlertCircle size={14} /> Please fix:</div>
                <ul className="list-disc list-inside">{pwErrors.map((er, i) => <li key={i}>{er}</li>)}</ul>
              </div>
            )}
            {pwMsg && <Notice tone="success">{pwMsg}</Notice>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="luxury-label">New password</label>
                <input type="password" autoComplete="new-password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="luxury-input" />
              </div>
              <div>
                <label className="luxury-label">Confirm password</label>
                <input type="password" autoComplete="new-password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="luxury-input" />
              </div>
            </div>

            <button type="submit" disabled={pwBusy || !newPw} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[2px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410] disabled:opacity-60">
              {pwBusy ? 'Updating…' : 'Update password'}
            </button>
          </form>

          <SecurityActivity />
        </div>
      )}
    </div>
  );
}

function Notice({ tone, children }: { tone: 'info' | 'warn' | 'error' | 'success'; children: React.ReactNode }) {
  const styles: Record<string, string> = {
    info: 'bg-[#fbf8f1] text-[#6b5d4c] border-[rgba(184,137,58,0.3)]',
    warn: 'bg-[#b8893a]/8 text-[#6b5d4c] border-[rgba(184,137,58,0.3)]',
    error: 'bg-[#7a2e2e]/10 text-[#7a2e2e] border-[#7a2e2e]/20',
    success: 'bg-[#3d6b5a]/10 text-[#3d6b5a] border-[#3d6b5a]/20',
  };
  return <div className={`border p-4 text-sm ${styles[tone]}`}>{children}</div>;
}
