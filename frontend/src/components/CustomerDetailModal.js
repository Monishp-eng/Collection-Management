import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Clock3, ClipboardList, Loader2, X, Pencil, Trash2, Save, XCircle } from 'lucide-react';
import { paymentAPI, customerAPI } from '../api/api';
import toast from 'react-hot-toast';

const statusStyles = {
  Paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  Partial: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  Overdue: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300'
};

function money(value = 0) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

export default function CustomerDetailModal({ customer, onClose, onSaved }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [partialAmount, setPartialAmount] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState({
    name: customer?.name || '',
    wifeCaretaker: customer?.wifeCaretaker || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    collectionWeekDay: customer?.collectionWeekDay || 'Monday',
    amountGiven: customer?.amountGiven || '',
    weeklyEMI: customer?.weeklyEMI || '',
    totalWeeks: customer?.totalWeeks || ''
  });

  useEffect(() => {
    if (!customer?._id) return;

    let cancelled = false;

    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await paymentAPI.getPaymentsByCustomer(customer._id);
        const list = (response.data || []).sort((a, b) => a.weekNumber - b.weekNumber);
        if (!cancelled) {
          setPayments(list);
          setSelectedPayment(list.find((payment) => payment.status !== 'Paid') || list[0] || null);
          setPartialAmount('');
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load customer payments', err);
          setError('Failed to load payment history');
          toast.error('Failed to load payment history');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPayments();

    return () => {
      cancelled = true;
    };
  }, [customer?._id]);

  const stats = useMemo(() => {
    const paid = payments.filter((payment) => payment.status === 'Paid').length;
    const pending = payments.filter((payment) => payment.status === 'Pending').length;
    const partial = payments.filter((payment) => payment.status === 'Partial').length;
    return { paid, pending, partial, total: payments.length };
  }, [payments]);

  const syncAndNotify = async (paymentId, payload, successMessage) => {
    try {
      setSavingId(paymentId);
      await paymentAPI.updatePayment(paymentId, payload);
      toast.success(successMessage);
      const response = await paymentAPI.getPaymentsByCustomer(customer._id);
      const freshPayments = (response.data || []).sort((a, b) => a.weekNumber - b.weekNumber);
      setPayments(freshPayments);
      setSelectedPayment(freshPayments.find((payment) => payment._id === paymentId) || freshPayments.find((payment) => payment.status !== 'Paid') || freshPayments[0] || null);
      setPartialAmount('');
      onSaved?.();
      // refresh global dashboard stats
      try { window.dispatchEvent(new CustomEvent('dashboard:refresh')); } catch (e) { /* ignore */ }
    } catch (err) {
      console.error('Failed to update payment', err);
      const message = err.response?.data?.message || 'Failed to update payment';
      toast.error(message);
    } finally {
      setSavingId(null);
    }
  };

  const handleFullCollect = () => {
    if (!selectedPayment) return;
    syncAndNotify(
      selectedPayment._id,
      {
        receivedAmount: selectedPayment.emiAmount,
        status: 'Paid',
        remarks: 'Collected full amount from modal'
      },
      'Payment marked as paid'
    );
  };

  const handlePartialCollect = () => {
    if (!selectedPayment) return;
    const amount = Number(partialAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid partial amount');
      return;
    }

    if (amount > selectedPayment.emiAmount) {
      toast.error('Partial amount cannot exceed the EMI amount');
      return;
    }

    syncAndNotify(
      selectedPayment._id,
      {
        receivedAmount: amount,
        remarks: 'Partial collection from modal'
      },
      'Partial payment updated'
    );
  };

  const handleMarkPending = () => {
    if (!selectedPayment) return;
    syncAndNotify(
      selectedPayment._id,
      {
        receivedAmount: 0,
        remarks: 'Marked pending from modal'
      },
      'Payment marked pending'
    );
  };

  const handleDeleteCustomer = async () => {
    if (!window.confirm(`Are you absolutely sure you want to delete ${customer.name}? This action cannot be undone.`)) {
      return;
    }
    try {
      setIsDeleting(true);
      await customerAPI.deleteCustomer(customer._id);
      toast.success('Customer deleted successfully');
      onSaved?.();
      try { window.dispatchEvent(new CustomEvent('dashboard:refresh')); } catch (e) { /* ignore */ }
      onClose();
    } catch (err) {
      toast.error('Failed to delete customer');
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      await customerAPI.updateCustomer(customer._id, editForm);
      toast.success('Customer details updated');
      setIsEditing(false);
      onSaved?.();
      try { window.dispatchEvent(new CustomEvent('dashboard:refresh')); } catch (e) { /* ignore */ }
      
      customer.name = editForm.name;
      customer.wifeCaretaker = editForm.wifeCaretaker;
      customer.phone = editForm.phone;
      customer.address = editForm.address;
      customer.collectionWeekDay = editForm.collectionWeekDay;
      customer.amountGiven = Number(editForm.amountGiven);
      customer.weeklyEMI = Number(editForm.weeklyEMI);
      customer.totalWeeks = Number(editForm.totalWeeks);
      customer.remainingBalance = Math.max(0, customer.amountGiven - customer.totalPaid);

      // Refetch payment schedule in case it changed
      const response = await paymentAPI.getPaymentsByCustomer(customer._id);
      const freshPayments = (response.data || []).sort((a, b) => a.weekNumber - b.weekNumber);
      setPayments(freshPayments);
      
    } catch (err) {
      toast.error('Failed to update customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="customer-detail-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/60 p-0 md:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.25 }}
          className="w-full md:max-w-6xl md:rounded-3xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Customer Detail</p>
              <h2 className="text-xl md:text-2xl font-bold">{customer.name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{customer.collectionWeekDay} collection • {customer.phone}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`p-2 rounded-full transition ${isEditing ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500'}`}
                aria-label="Edit customer"
                title="Edit Customer"
              >
                <Pencil className="w-5 h-5" />
              </button>
              <button
                onClick={handleDeleteCustomer}
                disabled={isDeleting}
                className="p-2 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 text-slate-500 transition disabled:opacity-50"
                aria-label="Delete customer"
                title="Delete Customer"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition text-slate-500"
                aria-label="Close customer detail"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-0 flex-1 min-h-0">
            <div className="p-4 md:p-6 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700 overflow-y-auto">
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 p-4 md:p-5 shadow-sm">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Customer Name</label>
                      <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Caretaker Name</label>
                      <input type="text" value={editForm.wifeCaretaker} onChange={(e) => setEditForm({...editForm, wifeCaretaker: e.target.value})} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Phone Number</label>
                      <input type="text" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Collection Day</label>
                      <select value={editForm.collectionWeekDay} onChange={(e) => setEditForm({...editForm, collectionWeekDay: e.target.value})} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Address</label>
                      <textarea value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} rows="2" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Loan Amount (₹)</label>
                        <input type="number" value={editForm.amountGiven} onChange={(e) => setEditForm({...editForm, amountGiven: e.target.value})} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Total Weeks</label>
                        <input type="number" value={editForm.totalWeeks} onChange={(e) => setEditForm({...editForm, totalWeeks: e.target.value})} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Weekly EMI (₹)</label>
                        <input type="number" value={editForm.weeklyEMI} onChange={(e) => setEditForm({...editForm, weeklyEMI: e.target.value})} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button onClick={handleSaveEdit} disabled={loading} className="flex-1 inline-flex justify-center items-center gap-2 bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-emerald-700 transition">
                        <Save className="w-4 h-4" /> Save Details
                      </button>
                      <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center text-lg font-bold">
                        {(customer.name || 'C').slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{customer.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{customer.wifeCaretaker || 'Caretaker not set'}</p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-700">
                        <p className="text-slate-500 dark:text-slate-400 text-xs uppercase">Loan Amount</p>
                        <p className="font-semibold text-base mt-1">{money(customer.amountGiven)}</p>
                      </div>
                      <div className="rounded-xl bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-700">
                        <p className="text-slate-500 dark:text-slate-400 text-xs uppercase">Total Paid</p>
                        <p className="font-semibold text-base mt-1 text-emerald-600 dark:text-emerald-400">{money(customer.totalPaid)}</p>
                      </div>
                      <div className="rounded-xl bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-700">
                        <p className="text-slate-500 dark:text-slate-400 text-xs uppercase">Remaining</p>
                        <p className="font-semibold text-base mt-1 text-rose-600 dark:text-rose-400">{money(customer.remainingBalance)}</p>
                      </div>
                      <div className="rounded-xl bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-700">
                        <p className="text-slate-500 dark:text-slate-400 text-xs uppercase">Collection Day</p>
                        <p className="font-semibold text-base mt-1">{customer.collectionWeekDay}</p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-slate-100 dark:bg-slate-800 p-3 text-sm">
                      <p className="text-slate-500 dark:text-slate-400 text-xs uppercase mb-1">Address</p>
                      <p className="leading-6">{customer.address || 'N/A'}</p>
                    </div>
                  </>
                )}

                <div className="mt-4 flex gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    {stats.paid} Paid
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 text-xs font-semibold">
                    <Clock3 className="w-4 h-4" />
                    {stats.pending} Pending
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 text-xs font-semibold">
                    <ClipboardList className="w-4 h-4" />
                    {stats.partial} Partial
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
                <h3 className="font-semibold mb-3">Quick Collect</h3>
                {selectedPayment ? (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 text-sm">
                      <p className="text-slate-500 dark:text-slate-400 text-xs uppercase">Selected EMI</p>
                      <p className="mt-1 font-semibold">Week {selectedPayment.weekNumber} • {money(selectedPayment.emiAmount)}</p>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">Due {new Date(selectedPayment.dueDate).toLocaleDateString()}</p>
                    </div>

                    <input
                      type="number"
                      min="0"
                      value={partialAmount}
                      onChange={(event) => setPartialAmount(event.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handlePartialCollect();
                        }
                      }}
                      placeholder="Partial amount"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />

                    <div className="grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={handleFullCollect}
                        disabled={savingId === selectedPayment._id}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-white font-semibold hover:bg-emerald-700 transition disabled:opacity-60"
                      >
                        {savingId === selectedPayment._id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Collect Full
                      </button>
                      <button
                        type="button"
                        onClick={handlePartialCollect}
                        disabled={savingId === selectedPayment._id}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60"
                      >
                        {savingId === selectedPayment._id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Collect Partial
                      </button>
                      <button
                        type="button"
                        onClick={handleMarkPending}
                        disabled={savingId === selectedPayment._id}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-white font-semibold hover:bg-amber-600 transition disabled:opacity-60"
                      >
                        {savingId === selectedPayment._id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Mark Pending
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No payment rows available for this customer.</p>
                )}
              </div>
            </div>

            <div className="p-4 md:p-6 overflow-hidden flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Payment History</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">All EMI rows for this customer</p>
                </div>
                <button
                  onClick={onClose}
                  className="hidden md:inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              </div>

              {loading ? (
                <div className="flex-1 grid place-items-center text-slate-500 dark:text-slate-400">Loading payment history...</div>
              ) : error ? (
                <div className="rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-500/10 p-4 text-rose-700 dark:text-rose-300 text-sm">
                  {error}
                </div>
              ) : (
                <div className="flex-1 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                      <tr className="text-left text-slate-500 dark:text-slate-400">
                        <th className="px-4 py-3 font-semibold">Week</th>
                        <th className="px-4 py-3 font-semibold">Due Date</th>
                        <th className="px-4 py-3 font-semibold">EMI Amount</th>
                        <th className="px-4 py-3 font-semibold">Received</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">
                            No payments found for this customer.
                          </td>
                        </tr>
                      ) : (
                        payments.map((payment) => {
                          const isSelected = selectedPayment?._id === payment._id;
                          return (
                            <tr
                              key={payment._id}
                              className={`border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition ${isSelected ? 'bg-blue-50/70 dark:bg-blue-500/10' : ''}`}
                            >
                              <td className="px-4 py-3 font-semibold">{payment.weekNumber}</td>
                              <td className="px-4 py-3">{new Date(payment.dueDate).toLocaleDateString()}</td>
                              <td className="px-4 py-3">{money(payment.emiAmount)}</td>
                              <td className="px-4 py-3">{money(payment.receivedAmount)}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[payment.status] || statusStyles.Pending}`}>
                                  {payment.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => {
                                    setSelectedPayment(payment);
                                    setPartialAmount(String(payment.receivedAmount || ''));
                                  }}
                                  className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-3 py-2 text-white text-xs font-semibold hover:bg-[#1d4ed8] transition"
                                >
                                  Update
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
