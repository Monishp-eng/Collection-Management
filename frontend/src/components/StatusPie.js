import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

export default function StatusPie({ data }) {
  const { theme } = useTheme();
  const tooltipStyle = { background: theme === 'dark' ? '#0b1220' : '#fff' };
  return (
    <div className="w-full h-56">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip wrapperStyle={tooltipStyle} formatter={(v) => `₹${v}`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
