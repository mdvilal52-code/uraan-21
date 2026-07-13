'use client';

// Hardened localStorage-backed state for the guest Cart/Wishlist.
//
// Root cause this exists to fix: the previous implementation wrapped every
// localStorage write in a silent `catch {}`. Safari Private Browsing (and
// several WhatsApp/Instagram in-app WebView browsers) either throw on
// `setItem` or silently no-op it — the write "succeeds" from the caller's
// point of view but nothing was actually saved. The cart looks fine all
// session (it's just React state in memory) until the tab is reloaded —
// which mobile OSes do routinely when a backgrounded tab is reclaimed after
// switching to another app — at which point there's nothing to restore from.
//
// This hook verifies every write actually landed (read-back check), retries
// a few times, and only then flags storage as genuinely blocked. It also
// keeps state in sync across tabs (`storage` event) and re-syncs when the
// tab regains focus/visibility, since neither existed before.

import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

// Module-level so any number of usePersistentState() instances (cart,
// wishlist, ...) can share one "is storage blocked" flag and one warning.
let blocked = false;
const blockedListeners = new Set<(value: boolean) => void>();

function flagStorageBlocked() {
  if (blocked) return;
  blocked = true;
  blockedListeners.forEach((fn) => fn(true));
}

export function useStorageBlocked(): boolean {
  const [value, setValue] = useState(blocked);
  useEffect(() => {
    blockedListeners.add(setValue);
    return () => {
      blockedListeners.delete(setValue);
    };
  }, []);
  return value;
}

export function usePersistentState<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [state, setState] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const retriesRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const readFromStorage = useCallback((): T | null => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? (JSON.parse(saved) as T) : null;
    } catch {
      return null;
    }
  }, [key]);

  const writeToStorage = useCallback(
    (value: T) => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      const json = JSON.stringify(value);
      try {
        localStorage.setItem(key, json);
        // A successful setItem() call is not proof the data was saved — some
        // browsers silently no-op it — so read it back and compare.
        if (localStorage.getItem(key) !== json) throw new Error('storage write did not verify');
        retriesRef.current = 0;
      } catch (err) {
        if (retriesRef.current < MAX_RETRIES) {
          retriesRef.current += 1;
          retryTimeoutRef.current = setTimeout(
            () => writeToStorage(stateRef.current),
            RETRY_DELAY_MS * retriesRef.current
          );
        } else {
          console.warn(
            `[storage] "${key}" could not be saved after ${MAX_RETRIES} retries — ` +
              'this browser is blocking persistent storage (Private Browsing or an ' +
              'in-app browser can do this).',
            err
          );
          flagStorageBlocked();
        }
      }
    },
    [key]
  );

  // Hydrate once on mount — never overwrite saved data with the initial value.
  useEffect(() => {
    const saved = readFromStorage();
    if (saved !== null) setState(saved);
    setIsHydrated(true);
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on every change, once hydrated.
  useEffect(() => {
    if (!isHydrated) return;
    writeToStorage(state);
  }, [state, isHydrated, writeToStorage]);

  // Cross-tab sync: pick up a write made by another tab of this site.
  useEffect(() => {
    const onStorageEvent = (e: StorageEvent) => {
      if (e.key !== key || e.newValue === null) return;
      try {
        const incoming = JSON.parse(e.newValue) as T;
        if (JSON.stringify(incoming) !== JSON.stringify(stateRef.current)) {
          setState(incoming);
        }
      } catch {
        /* ignore a corrupt payload written by another tab */
      }
    };
    window.addEventListener('storage', onStorageEvent);
    return () => window.removeEventListener('storage', onStorageEvent);
  }, [key]);

  // Re-sync when the tab regains visibility/focus — covers OS-level
  // suspend/resume (switching to another app and back) and bfcache restores.
  useEffect(() => {
    const resync = () => {
      if (document.visibilityState !== 'visible') return;
      const saved = readFromStorage();
      if (saved !== null && JSON.stringify(saved) !== JSON.stringify(stateRef.current)) {
        setState(saved);
      }
    };
    document.addEventListener('visibilitychange', resync);
    window.addEventListener('pageshow', resync);
    window.addEventListener('focus', resync);
    return () => {
      document.removeEventListener('visibilitychange', resync);
      window.removeEventListener('pageshow', resync);
      window.removeEventListener('focus', resync);
    };
  }, [readFromStorage]);

  return [isHydrated ? state : initialValue, setState, isHydrated];
}
