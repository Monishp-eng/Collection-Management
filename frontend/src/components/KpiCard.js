import React from 'react';
import { motion } from 'framer-motion';

export default function KpiCard({ title, value, subtitle, icon: Icon, color = 'blue' }) {
  const colorMap = {
    blue: 'bg-[#2563EB] text-white',
    green: 'bg-[#10B981] text-white',
    amber: 'bg-[#F59E0B] text-white',
    red: 'bg-[#EF4444] text-white',
    gray: 'bg-white text-gray-900'
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className={`rounded-xl p-5 transition-colors duration-300 ${colorMap[color] || colorMap.gray} ${color === 'gray' ? 'bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white shadow-md dark:shadow-none' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-90">{title}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
          {subtitle && <p className="mt-1 text-xs opacity-80">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="w-12 h-12 rounded-lg bg-white bg-opacity-10 flex items-center justify-center">
            <Icon className="w-6 h-6 opacity-90" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
