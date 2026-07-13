'use client';

import SettingsForm from '@/components/admin/SettingsForm';
import GoldRateSettings from '@/components/admin/GoldRateSettings';

export default function AdminSettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="serif text-3xl text-[#1a1410] mb-1">Settings</h1>
        <p className="text-sm text-[#6b5d4c]">Manage store configuration, payments, and preferences.</p>
      </div>

      <div className="mb-5">
        <GoldRateSettings />
      </div>

      <SettingsForm />
    </div>
  );
}