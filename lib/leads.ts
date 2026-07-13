// Lightweight CRM lead store. Like the rest of this demo (orders, auth), leads
// are persisted in the browser's localStorage so the admin panel works without
// a backend. Website enquiries (contact form, newsletter) also call addLead()
// after submitting to /api/lead, and inbound WhatsApp messages are captured by
// the webhook — so every channel lands in one pipeline.

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Won' | 'Lost';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  source: string;
  status: LeadStatus;
  createdAt: string; // ISO timestamp
}

export const LEAD_STATUSES: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Won', 'Lost'];

const KEY = 'ogp_leads';

const seedLeads: Lead[] = [];

function read(): Lead[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Lead[]) : null;
  } catch {
    return null;
  }
}

function write(leads: Lead[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(leads));
  } catch {
    /* storage full or unavailable — ignore in this demo */
  }
}

/** All leads, newest first. Seeds sample data on first use. */
export function getLeads(): Lead[] {
  const stored = read();
  if (stored) return stored;
  write(seedLeads);
  return seedLeads;
}

export function addLead(input: {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  source?: string;
}): Lead {
  const lead: Lead = {
    id: 'L' + Date.now().toString(36).toUpperCase(),
    name: input.name.trim() || 'Unknown',
    email: input.email.trim(),
    phone: input.phone?.trim() || undefined,
    message: input.message?.trim() || undefined,
    source: input.source?.trim() || 'Website',
    status: 'New',
    createdAt: new Date().toISOString(),
  };
  write([lead, ...getLeads()]);
  return lead;
}

export function updateLeadStatus(id: string, status: LeadStatus): void {
  write(getLeads().map((l) => (l.id === id ? { ...l, status } : l)));
}

export function deleteLead(id: string): void {
  write(getLeads().filter((l) => l.id !== id));
}

export function leadStats(leads: Lead[]) {
  return {
    total: leads.length,
    new: leads.filter((l) => l.status === 'New').length,
    won: leads.filter((l) => l.status === 'Won').length,
    whatsapp: leads.filter((l) => /whatsapp/i.test(l.source)).length,
  };
}

export function statusColor(status: LeadStatus): string {
  const colors: Record<LeadStatus, string> = {
    New: 'bg-[#7a2e2e]/10 text-[#7a2e2e]',
    Contacted: 'bg-[#b8893a]/10 text-[#b8893a]',
    Qualified: 'bg-blue-500/10 text-blue-600',
    Won: 'bg-[#3d6b5a]/10 text-[#3d6b5a]',
    Lost: 'bg-gray-500/10 text-gray-600',
  };
  return colors[status];
}

export function formatLeadDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
