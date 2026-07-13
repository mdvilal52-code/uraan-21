'use client';

import { useEffect, useState } from 'react';
import { UserCog, Plus, Edit2, Trash2, Mail, Phone, Shield, X, Search } from 'lucide-react';
import { type User, type TeamRole, getTeam, addMember, updateMember, deleteMember } from '@/lib/team';

const emptyForm = { name: '', email: '', phone: '', role: 'staff' as TeamRole };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setUsers(getTeam());
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (u: User) => {
    setEditingId(u.id);
    setForm({ name: u.name, email: u.email, phone: u.phone, role: u.role === 'admin' ? 'admin' : 'staff' });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    if (editingId) {
      updateMember(editingId, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
      });
    } else {
      addMember(form);
    }
    setUsers(getTeam());
    closeForm();
  };

  const handleDelete = (id: string) => {
    if (confirm(`Delete user ${id}?`)) {
      deleteMember(id);
      setUsers(getTeam());
    }
  };

  const roleColor: Record<string, string> = {
    admin: 'bg-[#b8893a]/10 text-[#b8893a]',
    staff: 'bg-blue-500/10 text-blue-600',
    customer: 'bg-gray-500/10 text-gray-600',
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="serif text-3xl text-[#1a1410] mb-1">Admin Users</h1>
          <p className="text-sm text-[#6b5d4c]">
            {filtered.length} team members · {filtered.filter((u) => u.role === 'admin').length} admins
          </p>
        </div>
        <button
          onClick={() => (showForm ? closeForm() : openAdd())}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[2px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410]"
        >
          {showForm ? <X size={14} /> : <Plus size={14} />} {showForm ? 'Close' : 'Add User'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-[rgba(184,137,58,0.18)] p-5 mb-5">
          <h3 className="display text-sm tracking-[3px] uppercase text-[#1a1410] mb-4">
            {editingId ? 'Edit Team Member' : 'New Admin User'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="luxury-label">Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="luxury-input"
              />
            </div>
            <div>
              <label className="luxury-label">Role *</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as TeamRole })}
                className="luxury-input"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="luxury-label">Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="luxury-input"
              />
            </div>
            <div>
              <label className="luxury-label">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="luxury-input"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button type="submit" className="px-6 py-2 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[2px] uppercase font-semibold">
              {editingId ? 'Save Changes' : 'Add User'}
            </button>
            <button type="button" onClick={closeForm} className="px-6 py-2 border border-[#1a1410] text-[11px] tracking-[2px] uppercase font-semibold">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-[rgba(184,137,58,0.18)] p-4 mb-5 flex items-center gap-2">
        <Search size={14} className="text-[#9a8c75]" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm"
        />
      </div>

      <div className="bg-white border border-[rgba(184,137,58,0.18)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] tracking-[1.5px] uppercase text-[#9a8c75] border-b border-[rgba(184,137,58,0.18)] bg-[#fbf8f1]">
              <th className="text-left py-3 px-4 font-semibold">User</th>
              <th className="text-left py-3 px-4 font-semibold">Contact</th>
              <th className="text-left py-3 px-4 font-semibold">Role</th>
              <th className="text-left py-3 px-4 font-semibold">Joined</th>
              <th className="text-right py-3 px-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-[rgba(184,137,58,0.1)] hover:bg-[#fbf8f1]/40">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#b8893a]/10 grid place-items-center text-[#b8893a]">
                      {u.role === 'admin' ? <Shield size={14} /> : <UserCog size={14} />}
                    </div>
                    <div>
                      <div className="font-medium text-[#1a1410]">{u.name}</div>
                      <div className="text-[10px] text-[#9a8c75]">{u.id}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-xs text-[#6b5d4c] flex items-center gap-1">
                    <Mail size={11} /> {u.email}
                  </div>
                  <div className="text-xs text-[#6b5d4c] flex items-center gap-1 mt-0.5">
                    <Phone size={11} /> {u.phone}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[1px] ${roleColor[u.role]}`}>
                    {u.role}
                  </span>
                </td>
                <td className="py-3 px-4 text-xs text-[#6b5d4c]">{u.joinedOn}</td>
                <td className="py-3 px-4">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(u)} aria-label="Edit" className="text-[#6b5d4c] hover:text-[#b8893a]">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(u.id)} aria-label="Delete" className="text-[#6b5d4c] hover:text-[#7a2e2e]">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-[#6b5d4c]">
            {users.length === 0 ? 'No team members yet.' : 'No team members match your search.'}
          </div>
        )}
      </div>
    </div>
  );
}
