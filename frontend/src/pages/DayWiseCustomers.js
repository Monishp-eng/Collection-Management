import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerAPI, paymentAPI } from '../api/api';
import { Calendar, ChevronRight, Search } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import CustomerDetailModal from '../components/CustomerDetailModal';
import { sendWhatsAppReminder } from '../utils/whatsapp';

const money = (value = 0) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

export default function DayWiseCustomers() {
  const { day } = useParams();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDayWiseData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [customersRes, paymentsRes] = await Promise.all([
        customerAPI.getCustomersByWeekDay(day),
        paymentAPI.getPaymentsByWeekDay(day)
      ]);
      setCustomers(customersRes.data.customers || []);
      setPayments(paymentsRes.data || []);
    } catch (err) {
      setError('Failed to load data');
      toast.error('Failed to load weekday collections');
    } finally {
      setLoading(false);
    }
  }, [day]);

  useEffect(() => {
    fetchDayWiseData();
  }, [fetchDayWiseData]);

  const customerRows = useMemo(() => {
    const paymentMap = payments.reduce((accumulator, payment) => {
      const key = String(payment.customerId);
      if (!accumulator[key]) accumulator[key] = [];
      accumulator[key].push(payment);
      return accumulator;
    }, {});

    return customers.map((customer) => {
      const customerPayments = [...(paymentMap[String(customer._id)] || [])].sort((left, right) => new Date(left.dueDate) - new Date(right.dueDate));
      const nextPayment = customerPayments.find((payment) => payment.status !== 'Paid') || customerPayments[0] || null;
      const totalDue = customerPayments.reduce((sum, payment) => sum + (payment.emiAmount || 0), 0);
      const totalCollected = customerPayments.reduce((sum, payment) => sum + (payment.receivedAmount || 0), 0);
      const remainingBalance = Math.max(0, totalDue - totalCollected);
      const progress = totalDue ? Math.min(100, Math.round((totalCollected / totalDue) * 100)) : 0;
      const overdueCount = customerPayments.filter((payment) => payment.status !== 'Paid' && new Date(payment.dueDate) < new Date()).length;

      return {
        ...customer,
        customerPayments,
        nextPayment,
        totalDue,
        totalCollected,
        remainingBalance,
        progress,
        overdueCount,
        status: remainingBalance === 0 ? 'Paid' : overdueCount > 0 ? 'Overdue' : nextPayment?.status || 'Pending'
      };
    });
  }, [customers, payments]);

  const filteredCustomerRows = useMemo(() => {
    if (!searchQuery.trim()) return customerRows;

    const query = searchQuery.trim().toLowerCase();
    return customerRows.filter((customer) => {
      return [customer.name, customer.phone, customer.wifeCaretaker]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [customerRows, searchQuery]);

  const dailyTotals = useMemo(() => {
    const totalDue = customerRows.reduce((sum, customer) => sum + customer.totalDue, 0);
    const totalCollected = customerRows.reduce((sum, customer) => sum + customer.totalCollected, 0);
    const remainingBalance = Math.max(0, totalDue - totalCollected);

    return {
      totalDue,
      totalCollected,
      remainingBalance,
      totalCustomers: customerRows.length
    };
  }, [customerRows]);

  const badgeStyles = {
    Paid: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20',
    Pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20',
    Partial: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20',
    Overdue: 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/20'
  };

  if (loading) return <div className="p-6 text-center text-slate-700 dark:text-slate-200">Loading...</div>;

  const balanceTone = dailyTotals.remainingBalance === 0
    ? 'text-emerald-600 dark:text-emerald-300'
    : dailyTotals.remainingBalance > dailyTotals.totalDue * 0.35
      ? 'text-red-600 dark:text-red-300'
      : 'text-amber-600 dark:text-amber-300';

  return (
    <div className="space-y-5 text-slate-900 dark:text-slate-100">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{day} Collections</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Grouped by customer. Click a customer to update individual EMI rows.</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/add-customer')}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-[#1d4ed8]"
        >
          + Add Customer
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-500/10 dark:border-red-500/20 text-red-700 dark:text-red-200 px-4 py-3">{error}</div>}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm dark:shadow-none">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Amount Due</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{money(dailyTotals.totalDue)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm dark:shadow-none">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Amount Collected</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-300">{money(dailyTotals.totalCollected)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm dark:shadow-none">
          <p className="text-sm text-slate-500 dark:text-slate-400">Remaining Balance</p>
          <p className={`mt-2 text-2xl font-bold ${balanceTone}`}>{money(dailyTotals.remainingBalance)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm dark:shadow-none">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Customers</p>
          <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-300">{dailyTotals.totalCustomers}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm dark:shadow-none transition-colors duration-300">
        <div className="flex items-center gap-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500/50 transition">
          <Search className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer, phone, or caretaker..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>



      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">#</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Customer</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Loan / Paid</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Remaining</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Next Due</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Progress</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomerRows.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    No customers match this search
                  </td>
                </tr>
              ) : (
                filteredCustomerRows.map((customer, index) => (
                  <tr
                    key={customer._id}
                    onClick={() => setSelectedCustomer(customer)}
                    className={`border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition ${customer.status === 'Overdue' ? 'bg-red-50/60 dark:bg-red-500/10 border-l-4 border-l-red-500' : ''}`}
                  >
                    <td className="px-4 py-4 text-slate-500 dark:text-slate-400 font-semibold">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{customer.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{customer.phone}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{customer.wifeCaretaker || 'Caretaker not set'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{money(customer.totalDue)}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Paid: {money(customer.totalCollected)}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      <p className={`font-semibold ${customer.remainingBalance <= 0 ? 'text-emerald-600 dark:text-emerald-300' : customer.remainingBalance > customer.amountGiven * 0.35 ? 'text-red-600 dark:text-red-300' : 'text-amber-600 dark:text-amber-300'}`}>{money(customer.remainingBalance)}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{money(customer.totalDue)} due from payments</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{customer.nextPayment ? new Date(customer.nextPayment.dueDate).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-4">
                      <div className="w-36 max-w-full">
                        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div className="h-2 rounded-full bg-[#2563EB] transition-all duration-300" style={{ width: `${customer.progress}%` }} />
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{customer.progress}% collected</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${badgeStyles[customer.status] || badgeStyles.Pending}`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedCustomer(customer);
                        }}
                        className="inline-flex items-center gap-1 bg-[#2563EB] text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-[#1d4ed8] transition"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); sendWhatsAppReminder(customer, customer.status === 'Overdue' ? 'overdue' : 'dueToday'); }} className="ml-2 inline-flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-green-700 transition">WhatsApp</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedCustomer && (
          <CustomerDetailModal
            customer={selectedCustomer}
            onClose={() => setSelectedCustomer(null)}
            onSaved={async () => {
              await fetchDayWiseData();
              const refreshedCustomer = await customerAPI.getCustomer(selectedCustomer._id);
              setSelectedCustomer(refreshedCustomer.data);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
