import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Crypto-style chart for Seller Dashboard
// Expects data: [{ name: 'Aug 2025', revenue: number }]
export default function RevenueOverTimeChart({ data = [], height = 360, formatCurrency }) {
  const list = Array.isArray(data) ? data : [];

  const fmt = (v) => {
    if (typeof formatCurrency === 'function') return formatCurrency(Number(v) || 0);
    return `${Number(v || 0).toLocaleString()}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const v = payload[0]?.value ?? 0;
    return (
      <div
        style={{
          background: 'rgba(17, 24, 39, 0.92)',
          color: '#fff',
          padding: '10px 12px',
          borderRadius: 12,
          boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(10px)',
          minWidth: 170,
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 16, fontWeight: 800 }}>{fmt(v)}</div>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={list} margin={{ top: 18, right: 18, left: 0, bottom: 8 }}>
        <defs>
          <linearGradient id="sellerRevFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="sellerRevStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="60%" stopColor="var(--accent-primary)" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>

        <CartesianGrid stroke="rgba(15, 23, 42, 0.06)" strokeDasharray="3 6" vertical={false} />

        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'var(--text-tertiary, #94a3b8)', fontSize: 12 }}
          minTickGap={16}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'var(--text-tertiary, #94a3b8)', fontSize: 12 }}
          tickFormatter={(v) => {
            const n = Number(v) || 0;
            if (n >= 1_000_000) return `${Math.round(n / 1_000_000)}M`;
            if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
            return `${Math.round(n)}`;
          }}
          width={54}
        />

        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(99,102,241,0.35)', strokeWidth: 1 }} />

        <Area
          type="monotone"
          dataKey="revenue"
          stroke="url(#sellerRevStroke)"
          fill="url(#sellerRevFill)"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: 'var(--accent-primary)' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}



