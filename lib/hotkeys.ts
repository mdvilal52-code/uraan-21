// Single source of truth for every admin keyboard shortcut. Add a new one
// here and it shows up in both the command palette's shortcut list and the
// global listener that fires it (components/admin/CommandPalette.tsx) — no
// other file needs to change.
//
// Two shapes of shortcut:
//   - `mod+k`  — a modifier chord (Ctrl on Windows/Linux, Cmd on Mac), fires
//                on keydown regardless of focus.
//   - `g d`    — a sequential chord (Gmail/Linear-style): press `g`, then
//                within CHORD_TIMEOUT_MS press `d`. Ignored while typing in
//                a text field so it never fights with normal typing.
import { ADMIN_NAV_ITEMS } from './adminNav';

export const CHORD_TIMEOUT_MS = 900;

export type HotkeyAction =
  | { kind: 'open-palette' }
  | { kind: 'navigate'; href: string }
  | { kind: 'open-palette-scoped'; scope: string };

export type HotkeyBinding = {
  id: string;
  label: string;
  keys: string; // human-readable, shown in the palette's shortcut list
  chord: string[]; // lowercase sequence this fires on, e.g. ['g','d'] or ['mod','k']
  action: HotkeyAction;
  group: 'General' | 'Navigate' | 'Create' | 'Find';
};

const NAV_CHORDS: Record<string, string> = {
  '/admin': 'd',
  '/admin/products': 'p',
  '/admin/orders': 'o',
  '/admin/leads': 'l',
  '/admin/customers': 'c',
  '/admin/backups': 'b',
  '/admin/security': 's',
  '/admin/settings': ',',
};

// "Go to <section>" for the handful of sections common enough to deserve a
// muscle-memory chord — derived from ADMIN_NAV_ITEMS so the label/href can
// never drift from the sidebar.
const navigateHotkeys: HotkeyBinding[] = ADMIN_NAV_ITEMS.filter((item) => item.href in NAV_CHORDS).map((item) => {
  const key = NAV_CHORDS[item.href];
  return {
    id: `nav-${item.href}`,
    label: `Go to ${item.label}`,
    keys: `G ${key.toUpperCase()}`,
    chord: ['g', key],
    action: { kind: 'navigate', href: item.href },
    group: 'Navigate',
  };
});

export const HOTKEYS: HotkeyBinding[] = [
  {
    id: 'palette',
    label: 'Open command palette',
    keys: 'Ctrl/⌘ K',
    chord: ['mod', 'k'],
    action: { kind: 'open-palette' },
    group: 'General',
  },
  ...navigateHotkeys,
  {
    id: 'new-product',
    label: 'New product',
    keys: 'N P',
    chord: ['n', 'p'],
    action: { kind: 'navigate', href: '/admin/products/add' },
    group: 'Create',
  },
  {
    id: 'find-order',
    label: 'Find order',
    keys: 'F O',
    chord: ['f', 'o'],
    action: { kind: 'open-palette-scoped', scope: 'Order' },
    group: 'Find',
  },
  {
    id: 'find-product',
    label: 'Find product',
    keys: 'F P',
    chord: ['f', 'p'],
    action: { kind: 'open-palette-scoped', scope: 'Product' },
    group: 'Find',
  },
  {
    id: 'find-customer',
    label: 'Find customer',
    keys: 'F C',
    chord: ['f', 'c'],
    action: { kind: 'open-palette-scoped', scope: 'Customer' },
    group: 'Find',
  },
];
