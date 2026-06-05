import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { paymentAPI } from '../api/api';
import toast, { Toaster } from 'react-hot-toast';
import { ArrowRight, ArrowLeft } from 'lucide-react';

const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function CollectionMode() {
  const today = useMemo(() => weekdayNames[new Date().getDay()], []);
  const [payments, setPayments] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quickAmount, setQuickAmount] = useState(2000);

  useEffect(() => {
    fetchTodayPayments();
    // eslint-disable-next-line
  }, []);

  const fetchTodayPayments = async () => {
    try {
      setLoading(true);
      const res = await paymentAPI.getPaymentsByWeekDay(today);
      const data = (res.data || []).filter(p => p.status !== 'Paid');
      setPayments(data);
    } catch (err) {
      toast.error('Could not load collections');
    } finally {
      setLoading(false);
    }
  };

  const advance = () => setIndex((i) => Math.min(i + 1, Math.max(0, payments.length - 1)));
  const retreat = () => setIndex((i) => Math.max(i - 1, 0));

  const handleCollect = async (payment, amount) => {
    try {
      const currentReceived = Number(payment.receivedAmount || 0);
      const remaining = Number(payment.emiAmount || 0) - currentReceived;
      const collectAmount = Math.min(amount, remaining);

      if (!payment || collectAmount <= 0) {
        toast.error('Nothing to collect for this payment');
        return;
      }

      toast.loading('Saving...');
      const newReceived = currentReceived + collectAmount;
      await paymentAPI.updatePayment(payment._id || payment.id, {
        receivedAmount: newReceived,
        remarks: 'Collected via Collection Mode'
      });
      toast.dismiss();
      toast.success(`Collected ₹${collectAmount}`);
      // refresh dashboard KPIs after a successful collection
      try { window.dispatchEvent(new CustomEvent('dashboard:refresh')); } catch (e) { /* ignore */ }
      fetchTodayPayments();
      advance();
    } catch (err) {
      toast.dismiss();
      toast.error(err.response?.data?.message || 'Collection failed');
    }
  };

  const handleSkip = () => {
    advance();
  };

  const current = payments[index];

  if (loading) return <div className="p-6 text-center text-gray-900 dark:text-gray-100">Loading collections...</div>;

  if (!current) return (
    <div className="p-6 text-gray-900 dark:text-gray-100">
      <Toaster />
      <div className="text-center">
        <h2 className="text-xl font-semibold">No collections</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">You're all caught up for {today}.</p>
      </div>
    </div>
  );

  const remaining = (current.emiAmount || 0) - (current.receivedAmount || 0);

  return (
    <div className="h-screen p-4 flex flex-col bg-bg dark:bg-[#0F172A] transition-colors duration-300 text-gray-900 dark:text-gray-100">
      <Toaster />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Collection Mode</h3>
          <p className="text-sm text-gray-500">Focus: {today} • {payments.length} pending</p>
        </div>
        <div className="text-sm text-gray-600">{index + 1}/{payments.length}</div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <motion.div
          className="w-full max-w-md rounded-2xl p-5 touch-manipulation transition-colors duration-300 bg-white dark:bg-[#1E293B] shadow-lg dark:shadow-none"
          drag="x"
          dragConstraints={{ left: -100, right: 100 }}
          onDragEnd={(e, info) => {
            if (info.offset.x > 120) {
              // swipe right to collect quick amount
              handleCollect(current, quickAmount);
            } else if (info.offset.x < -120) {
              // swipe left to skip
              handleSkip();
            }
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-[#111827] flex items-center justify-center text-xl font-semibold text-gray-900 dark:text-gray-100">{(current.customerName || 'U')[0]}</div>
              <div>
                <p className="font-semibold">{current.customerName}</p>
                <p className="text-sm text-gray-500">Loan ₹{current.emiAmount} • Remaining ₹{remaining}</p>
              </div>
            </div>
            <div className={`text-xs px-2 py-1 rounded ${current.status === 'Overdue' ? 'bg-[#EF4444]/10 text-[#EF4444]' : current.status === 'Pending' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'bg-[#10B981]/10 text-[#10B981]'}`}>{current.status}</div>
          </div>

          <div className="my-4">
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-3 bg-[#2563EB] rounded-full" style={{ width: `${Math.min(100, ((current.receivedAmount || 0) / current.emiAmount) * 100)}%` }} />
            </div>
            <div className="flex items-center justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
              <div>Due: ₹{current.emiAmount}</div>
              <div>Received: ₹{current.receivedAmount || 0}</div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            {[200, 500, 1000, 2000].map((amt) => (
              <button key={amt} onClick={() => setQuickAmount(amt)} className={`flex-1 py-3 rounded-lg text-sm ${quickAmount === amt ? 'bg-[#2563EB] text-white' : 'bg-gray-100 dark:bg-[#0B1220] dark:text-gray-100'}`}>₹{amt}</button>
            ))}
          </div>

          <div className="mt-4 flex gap-3">
            <button onClick={() => handleCollect(current, quickAmount)} className="flex-1 py-3 rounded-lg bg-[#10B981] text-white text-lg font-semibold">Collect ₹{quickAmount}</button>
            <button onClick={() => handleCollect(current, remaining)} className="w-32 py-3 rounded-lg bg-[#3B82F6] text-white">Full</button>
          </div>

          <div className="mt-3 flex items-center justify-between text-sm">
            <button onClick={handleSkip} className="text-gray-600">Skip</button>
            <div className="flex items-center gap-3">
              <button onClick={retreat} className="p-2 rounded-lg bg-gray-100"><ArrowLeft className="w-4 h-4" /></button>
              <button onClick={advance} className="p-2 rounded-lg bg-gray-100"><ArrowRight className="w-4 h-4" /></button>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mt-4">
        <p className="text-xs text-gray-500">Tip: Swipe right to collect, swipe left to skip.</p>
      </div>
    </div>
  );
}
