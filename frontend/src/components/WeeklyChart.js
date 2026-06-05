import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function WeeklyChart({ data }) {
  const { theme } = useTheme();
  const textColor = theme === 'dark' ? '#E6EEF8' : '#1F2937';
  const gridStroke = theme === 'dark' ? '#172554' : '#E6EEF8';

  return (
    <div className="w-full h-56">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#2563EB" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis dataKey="day" tick={{ fontSize: 12, fill: textColor }} />
          <YAxis tickFormatter={(v) => `₹${v}`} tick={{ fill: textColor }} />
          <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
          <Tooltip wrapperStyle={{ background: theme === 'dark' ? '#0b1220' : '#fff' }} formatter={(v) => `₹${v}`} />
          <Area type="monotone" dataKey="amount" stroke="#2563EB" fill="url(#colorAmt)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
