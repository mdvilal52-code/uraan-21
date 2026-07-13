'use client';

import { Mail, Phone, MessageCircle, Trash2, Contact } from 'lucide-react';
import {
  Lead,
  LeadStatus,
  LEAD_STATUSES,
  statusColor,
  formatLeadDate,
} from '@/lib/leads';
import { whatsappLink, leadReplyMessage } from '@/lib/whatsapp';

type LeadsTableProps = {
  leads: Lead[];
  onStatusChange?: (id: string, status: LeadStatus) => void;
  onDelete?: (id: string) => void;
};

export default function LeadsTable({ leads, onStatusChange, onDelete }: LeadsTableProps) {
  return (
    <div className="bg-white border border-[rgba(184,137,58,0.18)] overflow-x-auto">
      <table className="w-full text-sm min-w-[820px]">
        <thead>
          <tr className="text-[10px] tracking-[1.5px] uppercase text-[#9a8c75] border-b border-[rgba(184,137,58,0.18)] bg-[#fbf8f1]">
            <th className="text-left py-3 px-4 font-semibold">Lead</th>
            <th className="text-left py-3 px-4 font-semibold">Contact</th>
            <th className="text-left py-3 px-4 font-semibold">Source</th>
            <th className="text-left py-3 px-4 font-semibold">Enquiry</th>
            <th className="text-left py-3 px-4 font-semibold">Status</th>
            <th className="text-left py-3 px-4 font-semibold">Added</th>
            <th className="text-right py-3 px-4 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b border-[rgba(184,137,58,0.1)] hover:bg-[#fbf8f1]/40 align-top">
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#b8893a]/10 grid place-items-center text-[#b8893a] font-semibold text-xs flex-shrink-0">
                    {lead.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-[#1a1410]">{lead.name}</div>
                    <div className="text-[10px] text-[#9a8c75]">{lead.id}</div>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="text-xs text-[#6b5d4c] flex items-center gap-1">
                  <Mail size={11} /> {lead.email}
                </div>
                {lead.phone && (
                  <div className="text-xs text-[#6b5d4c] flex items-center gap-1 mt-0.5">
                    <Phone size={11} /> {lead.phone}
                  </div>
                )}
              </td>
              <td className="py-3 px-4">
                <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-[#b8893a]/10 text-[#b8893a]">
                  {lead.source}
                </span>
              </td>
              <td className="py-3 px-4 text-xs text-[#6b5d4c] max-w-[220px]">
                <span className="line-clamp-2">{lead.message || '—'}</span>
              </td>
              <td className="py-3 px-4">
                <select
                  value={lead.status}
                  onChange={(e) => onStatusChange?.(lead.id, e.target.value as LeadStatus)}
                  className={`text-[11px] font-semibold px-2 py-1 outline-none cursor-pointer border-0 ${statusColor(lead.status)}`}
                >
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
              <td className="py-3 px-4 text-xs text-[#6b5d4c] whitespace-nowrap">
                {formatLeadDate(lead.createdAt)}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-2">
                  {lead.phone && (
                    <a
                      href={whatsappLink(leadReplyMessage(lead.name), lead.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Reply on WhatsApp"
                      title="Reply on WhatsApp"
                      className="text-[#16796F] hover:opacity-70"
                    >
                      <MessageCircle size={15} />
                    </a>
                  )}
                  {lead.phone && (
                    <a
                      href={`tel:${lead.phone.replace(/\s/g, '')}`}
                      aria-label="Call lead"
                      title="Call"
                      className="text-[#6b5d4c] hover:text-[#b8893a]"
                    >
                      <Phone size={15} />
                    </a>
                  )}
                  <a
                    href={`mailto:${lead.email}`}
                    aria-label="Email lead"
                    title="Email"
                    className="text-[#6b5d4c] hover:text-[#b8893a]"
                  >
                    <Mail size={15} />
                  </a>
                  <button
                    onClick={() => onDelete?.(lead.id)}
                    aria-label="Delete lead"
                    title="Delete"
                    className="text-[#6b5d4c] hover:text-[#7a2e2e]"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {leads.length === 0 && (
        <div className="text-center py-12">
          <Contact className="text-[#9a8c75] mx-auto mb-2" size={32} />
          <p className="text-sm text-[#6b5d4c]">No leads yet.</p>
        </div>
      )}
    </div>
  );
}
