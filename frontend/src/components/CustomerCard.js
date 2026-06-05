import React from 'react';
import { CheckCircle, Clock, AlertCircle, Activity } from 'lucide-react';

function statusBadge(status) {
  switch (status) {
    case 'Paid':
      return { color: 'bg-[#10B981]/10 text-[#10B981]', icon: <CheckCircle className="w-4 h-4" /> };
    case 'Pending':
      return { color: 'bg-[#F59E0B]/10 text-[#F59E0B]', icon: <Clock className="w-4 h-4" /> };
    case 'Overdue':
      return { color: 'bg-[#EF4444]/10 text-[#EF4444]', icon: <AlertCircle className="w-4 h-4" /> };
    default:
      return { color: 'bg-blue-50 text-blue-600', icon: <Activity className="w-4 h-4" /> };
  }
}

export default function CustomerCard({ customer, onCollect }) {
  const s = statusBadge(customer.status);
  const remaining = (customer.loanAmount || 0) - (customer.totalPaid || 0);

  return (
    <div className={`p-3 rounded-lg flex items-center justify-between transition-colors duration-300 ${customer.status === 'Overdue' ? 'border-l-4 border-red-500 bg-red-50/40 dark:bg-[#4C1F1F]/20' : 'bg-white dark:bg-[#0F172A]'} `}>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#1F2937] flex items-center justify-center text-lg font-semibold text-gray-700 dark:text-gray-100">{(customer.name || 'U').charAt(0)}</div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{customer.name}</p>
            <span className={`px-2 py-0.5 text-xs rounded ${s.color}`}>{customer.status}</span>
          </div>
          <p className="text-sm text-gray-500">Loan: ₹{customer.loanAmount} • Paid: ₹{customer.totalPaid || 0}</p>
          <p className="text-sm text-gray-500">Next due: {customer.nextDueDate || '—'} • Day: {customer.collectionDay || '—'}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm text-gray-500">Remaining</p>
          <p className="font-bold">₹{remaining}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onCollect?.(customer, 2000)} className="px-3 py-2 bg-[#2563EB] text-white rounded-md text-sm">Collect ₹2000</button>
        </div>
      </div>
    </div>
  );
}
