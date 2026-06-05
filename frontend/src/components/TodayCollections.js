import React from 'react';
import { motion } from 'framer-motion';
import CustomerCard from './CustomerCard';

export default function TodayCollections({ customers = [], onCollect }) {
  const totalDue = customers.reduce((s, c) => s + (c.dueAmount || 0), 0);
  const pendingCount = customers.filter((c) => c.status !== 'Paid').length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl p-4 transition-colors duration-300 bg-white dark:bg-[#1E293B]">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold">Today's Collections</h3>
          <p className="text-sm text-gray-500">Due: ₹{totalDue} • Pending: {pendingCount}</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1 rounded-lg bg-[#2563EB] text-white text-sm">Start Collecting</button>
          <button className="px-3 py-1 rounded-lg bg-gray-100 text-sm">View Calendar</button>
        </div>
      </div>

      <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
        {customers.length === 0 && <p className="text-sm text-gray-500">No collections for today.</p>}
        {customers.map((c) => (
          <CustomerCard key={c._id || c.id} customer={c} onCollect={onCollect} />
        ))}
      </div>
    </motion.div>
  );
}
