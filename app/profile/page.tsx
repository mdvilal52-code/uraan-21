'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import {
  User, Package, Heart, MapPin, CreditCard, Settings,
  LogOut, ChevronRight, Edit2, Phone, Mail, ShoppingBag,
  Trash2, Star, Loader2,
} from 'lucide-react';
import { getCurrentUser, logoutUser, type AuthUser } from '@/lib/auth';
import { getUserOrders, type StoredOrder } from '@/lib/userOrders';
import AddressForm from '@/components/AddressForm';
import type { Address } from '@/lib/addresses';

type Tab = 'overview' | 'orders' | 'addresses' | 'settings';

function orderColor(status: string): string {
  if (status === 'Delivered') return 'bg-[#3d6b5a]/15 text-[#3d6b5a]';
  if (status === 'Shipped') return 'bg-[#3d6fa8]/15 text-[#3d6fa8]';
  if (status === 'Cancelled') return 'bg-[#7a2e2e]/15 text-[#7a2e2e]';
  return 'bg-[#b8893a]/15 text-[#b8893a]';
}

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [account, setAccount] = useState<AuthUser | null>(null);
  const [userOrders, setUserOrders] = useState<StoredOrder[]>([]);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressesConfigured, setAddressesConfigured] = useState(false);
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressMessage, setAddressMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [busyAddressId, setBusyAddressId] = useState<string | null>(null);

  const loadAddresses = useCallback(async (email: string) => {
    setAddressesLoading(true);
    try {
      const res = await fetch(`/api/addresses?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (res.ok && data.ok) {
        setAddressesConfigured(Boolean(data.configured));
        setAddresses((data.addresses || []) as Address[]);
      }
    } catch {
      /* leave last-known list in place */
    } finally {
      setAddressesLoading(false);
    }
  }, []);

  // New customers must sign in before seeing the profile.
  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      router.replace('/login');
    } else {
      setAccount(u);
      setUserOrders(getUserOrders());
      loadAddresses(u.email);
    }
  }, [router, loadAddresses]);

  const openAddAddress = () => {
    setEditingAddress(null);
    setAddressFormOpen(true);
  };
  const openEditAddress = (a: Address) => {
    setEditingAddress(a);
    setAddressFormOpen(true);
  };

  const handleAddressSaved = () => {
    setAddressMessage({ type: 'success', text: 'Address saved.' });
    if (account) loadAddresses(account.email);
    setTimeout(() => setAddressMessage(null), 3000);
  };

  const handleDeleteAddress = async (a: Address) => {
    if (!account || !confirm('Delete this address?')) return;
    setBusyAddressId(a.id);
    try {
      const res = await fetch(`/api/addresses/${a.id}?email=${encodeURIComponent(account.email)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        setAddressMessage({ type: 'success', text: 'Address deleted.' });
        await loadAddresses(account.email);
      } else {
        setAddressMessage({ type: 'error', text: data.error || 'Could not delete address.' });
      }
    } catch {
      setAddressMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setBusyAddressId(null);
      setTimeout(() => setAddressMessage(null), 3000);
    }
  };

  const handleSetDefault = async (a: Address) => {
    if (!account || a.isDefault) return;
    setBusyAddressId(a.id);
    try {
      const res = await fetch(`/api/addresses/${a.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: account.email,
          fullName: a.fullName,
          mobile: a.mobile,
          alternateMobile: a.alternateMobile,
          houseNo: a.houseNo,
          street: a.street,
          landmark: a.landmark,
          city: a.city,
          state: a.state,
          pincode: a.pincode,
          country: a.country,
          addressType: a.addressType,
          isDefault: true,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setAddressMessage({ type: 'success', text: 'Default address updated.' });
        await loadAddresses(account.email);
      } else {
        setAddressMessage({ type: 'error', text: data.error || 'Could not update default address.' });
      }
    } catch {
      setAddressMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setBusyAddressId(null);
      setTimeout(() => setAddressMessage(null), 3000);
    }
  };

  const handleLogout = () => {
    logoutUser();
    router.push('/login');
  };

  if (!account) {
    return (
      <main className="min-h-screen bg-white">
        <Navbar />
        <div className="py-32 text-center text-sm text-[#9a8c75] tracking-[2px] uppercase">
          Checking your account…
        </div>
      </main>
    );
  }

  const user = {
    name: account.name,
    email: account.email,
    phone: account.phone,
    memberSince: account.joinedOn,
    totalOrders: userOrders.length,
    totalSpent: userOrders.reduce((sum, o) => sum + o.amount, 0),
  };

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <CartDrawer />

      <div className="max-w-7xl mx-auto px-4 py-3 text-[11px] text-[#9a8c75]">
        <Link href="/" className="text-[#b8893a] font-medium">Home</Link>
        <span className="mx-2 opacity-50">›</span>
        <span>My Profile</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-4">
        <h1 className="serif text-4xl text-[#1a1410] mb-1">My Account</h1>
        <p className="text-sm text-[#6b5d4c]">Welcome back, {user.name}!</p>
      </div>

      <section className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-[#f8f2e6] border border-[rgba(184,137,58,0.18)] p-5 text-center mb-4">
            <div className="w-20 h-20 rounded-full bg-[#b8893a]/20 grid place-items-center text-[#b8893a] mx-auto mb-3">
              <User size={36} />
            </div>
            <div className="serif text-lg text-[#1a1410] font-semibold">{user.name}</div>
            <div className="text-[10px] text-[#9a8c75] tracking-[1px] uppercase">Member since {user.memberSince}</div>
          </div>

          <nav className="bg-white border border-[rgba(184,137,58,0.18)]">
            {[
              { id: 'overview' as Tab, label: 'Overview', icon: User },
              { id: 'orders' as Tab, label: 'My Orders', icon: Package },
              { id: 'addresses' as Tab, label: 'Addresses', icon: MapPin },
              { id: 'settings' as Tab, label: 'Settings', icon: Settings },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm border-l-2 ${
                  activeTab === t.id
                    ? 'border-l-[#b8893a] bg-[#fbf8f1] text-[#b8893a] font-semibold'
                    : 'border-l-transparent text-[#1a1410] hover:bg-[#fbf8f1]'
                }`}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
            <Link
              href="/wishlist"
              className="w-full flex items-center gap-3 px-4 py-3 text-sm border-l-2 border-l-transparent text-[#1a1410] hover:bg-[#fbf8f1]"
            >
              <Heart size={14} /> Wishlist
            </Link>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#7a2e2e] hover:bg-[#7a2e2e]/5 border-l-2 border-l-transparent">
              <LogOut size={14} /> Logout
            </button>
          </nav>
        </div>

        {/* Main */}
        <div className="lg:col-span-3">
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white border border-[rgba(184,137,58,0.18)] rounded-xl p-5">
                  <div className="text-[10px] tracking-[2px] uppercase text-[#9a8c75] mb-2">Total Orders</div>
                  <div className="serif lining-nums text-3xl font-bold text-[#1a1410]">{user.totalOrders}</div>
                </div>
                <div className="bg-white border border-[rgba(184,137,58,0.18)] rounded-xl p-5">
                  <div className="text-[10px] tracking-[2px] uppercase text-[#9a8c75] mb-2">Total Spent</div>
                  <div className="serif lining-nums text-3xl font-bold text-[#b8893a]">
                    ₹{user.totalSpent.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="bg-white border border-[rgba(184,137,58,0.18)] rounded-xl p-5">
                  <div className="text-[10px] tracking-[2px] uppercase text-[#9a8c75] mb-2">Loyalty Tier</div>
                  <div className="serif text-3xl font-bold text-[#3d6b5a]">SILVER</div>
                </div>
              </div>

              <div className="bg-white border border-[rgba(184,137,58,0.18)] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="display text-sm tracking-[3px] uppercase text-[#1a1410]">
                    Personal Info
                  </h3>
                  <button className="text-[10px] tracking-[1.5px] uppercase text-[#b8893a] font-semibold hover:underline flex items-center gap-1">
                    <Edit2 size={11} /> Edit
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-[10px] tracking-[1.5px] uppercase text-[#9a8c75] mb-1">Name</div>
                    <div className="text-[#1a1410]">{user.name}</div>
                  </div>
                  <div>
                    <div className="text-[10px] tracking-[1.5px] uppercase text-[#9a8c75] mb-1">Email</div>
                    <div className="text-[#1a1410] flex items-center gap-1"><Mail size={12} /> {user.email}</div>
                  </div>
                  <div>
                    <div className="text-[10px] tracking-[1.5px] uppercase text-[#9a8c75] mb-1">Phone</div>
                    <div className="text-[#1a1410] flex items-center gap-1"><Phone size={12} /> {user.phone}</div>
                  </div>
                  <div>
                    <div className="text-[10px] tracking-[1.5px] uppercase text-[#9a8c75] mb-1">Member Since</div>
                    <div className="text-[#1a1410] lining-nums">{user.memberSince}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[rgba(184,137,58,0.18)] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="display text-sm tracking-[3px] uppercase text-[#1a1410]">Recent Orders</h3>
                  <button onClick={() => setActiveTab('orders')} className="text-[10px] tracking-[1.5px] uppercase text-[#b8893a] font-semibold hover:underline">View All</button>
                </div>
                {userOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag size={32} className="mx-auto mb-3 text-[#b8893a]/50" />
                    <p className="text-sm text-[#6b5d4c] mb-4">You haven&apos;t placed any orders yet.</p>
                    <Link href="/collections" className="inline-block px-6 py-2.5 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[2px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410]">
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {userOrders.slice(0, 3).map((o) => (
                      <div key={o.id} className="flex items-center justify-between p-3 bg-[#fbf8f1] text-sm">
                        <div>
                          <div className="font-semibold text-[#1a1410]">{o.id}</div>
                          <div className="text-[10px] text-[#9a8c75]">{o.date}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-[#1a1410] lining-nums">₹{o.amount.toLocaleString('en-IN')}</div>
                          <span className={`inline-block mt-1 px-2 py-0.5 text-[9px] font-semibold ${orderColor(o.status)}`}>
                            {o.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="bg-white border border-[rgba(184,137,58,0.18)] p-5">
              <h3 className="display text-sm tracking-[3px] uppercase text-[#1a1410] mb-4">All Orders</h3>
              {userOrders.length === 0 ? (
                <div className="text-center py-10">
                  <Package size={32} className="mx-auto mb-3 text-[#b8893a]/50" />
                  <p className="text-sm text-[#6b5d4c] mb-4">No orders yet. Your orders will appear here.</p>
                  <Link href="/collections" className="inline-block px-6 py-2.5 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[2px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410]">
                    Browse Collections
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {userOrders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between p-3 bg-[#fbf8f1] text-sm">
                      <div>
                        <div className="font-semibold text-[#1a1410]">{o.id}</div>
                        <div className="text-[10px] text-[#9a8c75]">{o.date} · {o.payment}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-[#1a1410] lining-nums">₹{o.amount.toLocaleString('en-IN')}</div>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-[9px] font-semibold ${orderColor(o.status)}`}>
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="bg-white border border-[rgba(184,137,58,0.18)] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="display text-sm tracking-[3px] uppercase text-[#1a1410]">My Addresses</h3>
                <button
                  onClick={openAddAddress}
                  aria-label="Add new address"
                  className="text-[10px] tracking-[1.5px] uppercase text-[#b8893a] font-semibold hover:underline"
                >
                  + Add New
                </button>
              </div>

              {addressMessage && (
                <div
                  className={`mb-4 px-4 py-3 text-sm border ${
                    addressMessage.type === 'success'
                      ? 'bg-[#3d6b5a]/10 text-[#3d6b5a] border-[#3d6b5a]/30'
                      : 'bg-[#7a2e2e]/10 text-[#7a2e2e] border-[#7a2e2e]/30'
                  }`}
                >
                  {addressMessage.text}
                </div>
              )}

              {addressesLoading ? (
                <div className="text-center py-10 text-sm text-[#9a8c75] flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Loading addresses…
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-10">
                  <MapPin size={32} className="mx-auto mb-3 text-[#b8893a]/50" />
                  <p className="text-sm text-[#6b5d4c] mb-1">No saved addresses yet.</p>
                  {!addressesConfigured && (
                    <p className="text-xs text-[#9a8c75]">You can still add one during checkout.</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((a) => (
                    <div key={a.id} className="border border-[rgba(184,137,58,0.18)] p-4 relative">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-[10px] tracking-[1px] uppercase font-semibold px-2 py-0.5 bg-[#f8f2e6] text-[#b8893a]">
                          {a.addressType}
                        </span>
                        {a.isDefault && (
                          <span className="text-[10px] tracking-[1px] uppercase font-semibold px-2 py-0.5 bg-[#3d6b5a]/10 text-[#3d6b5a] flex items-center gap-1">
                            <Star size={9} className="fill-[#3d6b5a]" /> Default
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-[#1a1410]">{a.fullName}</div>
                      <div className="text-sm text-[#6b5d4c] mt-1">
                        {a.houseNo}, {a.street}
                        {a.landmark ? `, ${a.landmark}` : ''}
                        <br />
                        {a.city}, {a.state} - {a.pincode}
                        <br />
                        {a.country}
                      </div>
                      <div className="text-xs text-[#9a8c75] mt-1">{a.mobile}</div>

                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[rgba(184,137,58,0.1)]">
                        <button
                          onClick={() => openEditAddress(a)}
                          className="text-[10px] tracking-[1px] uppercase font-semibold text-[#b8893a] hover:underline flex items-center gap-1"
                        >
                          <Edit2 size={11} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(a)}
                          disabled={busyAddressId === a.id}
                          className="text-[10px] tracking-[1px] uppercase font-semibold text-[#7a2e2e] hover:underline flex items-center gap-1 disabled:opacity-50"
                        >
                          <Trash2 size={11} /> Delete
                        </button>
                        {!a.isDefault && (
                          <button
                            onClick={() => handleSetDefault(a)}
                            disabled={busyAddressId === a.id}
                            className="text-[10px] tracking-[1px] uppercase font-semibold text-[#6b5d4c] hover:underline flex items-center gap-1 disabled:opacity-50"
                          >
                            <Star size={11} /> Set as Default
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {account && (
                <AddressForm
                  isOpen={addressFormOpen}
                  onClose={() => setAddressFormOpen(false)}
                  email={account.email}
                  editing={editingAddress}
                  onSaved={handleAddressSaved}
                />
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white border border-[rgba(184,137,58,0.18)] p-5 space-y-5">
              <h3 className="display text-sm tracking-[3px] uppercase text-[#1a1410]">Settings</h3>
              <div className="space-y-3">
                {[
                  'Email notifications', 'SMS alerts', 'WhatsApp updates', 'Marketing offers',
                ].map((s, i) => (
                  <label key={i} className="flex items-center justify-between p-3 bg-[#fbf8f1] cursor-pointer">
                    <span className="text-sm text-[#1a1410]">{s}</span>
                    <input type="checkbox" defaultChecked className="accent-[#b8893a]" />
                  </label>
                ))}
              </div>
              <button className="px-6 py-2 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[2px] uppercase font-semibold">
                Save Changes
              </button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}