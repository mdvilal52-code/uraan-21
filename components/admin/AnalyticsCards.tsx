'use client';

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

type DashboardCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  color?: 'gold' | 'green' | 'red' | 'blue';
};

export default function AnalyticsCard({
  title, value, icon: Icon, change, changeLabel = 'vs last month', color = 'gold',
}: DashboardCardProps) {
  const colorClass = {
    gold: 'bg-[#b8893a]/10 text-[#b8893a]',
    green: 'bg-[#3d6b5a]/10 text-[#3d6b5a]',
    red: 'bg-[#7a2e2e]/10 text-[#7a2e2e]',
    // Sapphire — keeps the fourth accent inside the jewel-tone palette instead
    // of a generic Tailwind blue that clashed with the warm luxury scheme.
    blue: 'bg-[#3a5a7a]/10 text-[#3a5a7a]',
  }[color];

  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="bg-white border border-[rgba(184,137,58,0.18)] p-5 hover:shadow-[0_12px_40px_rgba(122,90,31,0.12)] transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="stat-label mb-1.5">{title}</div>
          <div className="stat-value text-[#1a1410]">{value}</div>
        </div>
        <div className={`w-11 h-11 rounded-full grid place-items-center ${colorClass}`}>
          <Icon size={20} />
        </div>
      </div>

      {change !== undefined && (
        <div className="flex items-center gap-2 text-xs">
          <span className={`flex items-center gap-1 font-semibold ${isPositive ? 'text-[#3d6b5a]' : 'text-[#7a2e2e]'}`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isPositive ? '+' : ''}{change}%
          </span>
          <span className="text-[#9a8c75]">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}