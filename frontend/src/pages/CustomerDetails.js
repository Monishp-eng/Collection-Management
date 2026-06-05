import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerAPI, paymentAPI } from '../api/api';
import { ArrowLeft, User } from 'lucide-react';
import { sendWhatsAppReminder } from '../utils/whatsapp';

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(null);
  const [paymentData, setPaymentData] = useState({});

  const fetchCustomerAndPayments = useCallback(async () => {
    try {
      const [customerRes, paymentsRes] = await Promise.all([
        customerAPI.getCustomer(id),
        paymentAPI.getPaymentsByCustomer(id)
      ]);
      setCustomer(customerRes.data);
      setPayments(paymentsRes.data);
    } catch (err) {
      setError('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomerAndPayments();
  }, [fetchCustomerAndPayments]);

  const handlePaymentSubmit = async (paymentId) => {
    try {
      const payment = payments.find((item) => item._id === paymentId);
      const rawValue = paymentData[paymentId]?.receivedAmount;
      const amount = Number(rawValue);

      if (!payment || Number.isNaN(amount) || amount < 0) {
        setError('Enter a valid amount for payment update');
        return;
      }

      if (amount > payment.emiAmount) {
        setError('Payment amount cannot exceed the EMI amount');
        return;
      }

      await paymentAPI.updatePayment(paymentId, {
        receivedAmount: amount,
        remarks: 'Updated from payment details'
      });

      setShowPaymentForm(null);
      setPaymentData({});
      // refresh global dashboard stats after updating a payment
      try { window.dispatchEvent(new CustomEvent('dashboard:refresh')); } catch (e) { /* ignore */ }
      fetchCustomerAndPayments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update payment');
    }
  };

  if (loading) return <div className="p-6 text-center text-slate-200">Loading...</div>;
  if (!customer) return <div className="p-6 text-center text-slate-200">Customer not found</div>;

  return (
    <div className="space-y-5 text-slate-100">
      <button onClick={() => navigate('/customers')} className="flex items-center gap-2 text-slate-300 hover:text-white mb-6 transition">
        <ArrowLeft className="w-5 h-5" />
        Back to Customers
      </button>

      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 text-red-200 px-4 py-3">{error}</div>}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-blue-500/15 p-3 rounded-xl border border-blue-400/20">
            <User className="w-8 h-8 text-blue-300" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-100">{customer.name}</h1>
            <p className="text-slate-400">{customer.phone}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button onClick={() => window.location.href = `tel:${customer.phone}`} className="px-3 py-2 rounded-lg bg-gray-700 text-white text-sm">Call</button>
          <button onClick={() => sendWhatsAppReminder(customer, customer.loanStatus === 'Overdue' ? 'overdue' : 'dueToday')} className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm">WhatsApp Reminder</button>
          <button onClick={() => { navigator.clipboard?.writeText(customer.phone); }} className="px-3 py-2 rounded-lg bg-slate-700 text-white text-sm">Copy Phone</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-slate-400 text-sm">Wife/Caretaker</p>
            <p className="font-semibold text-slate-100">{customer.wifeCaretaker || 'N/A'}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Address</p>
            <p className="font-semibold text-slate-100">{customer.address}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Amount Given</p>
            <p className="font-semibold text-slate-100">₹{customer.amountGiven}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Total Paid</p>
            <p className="font-semibold text-emerald-300">₹{customer.totalPaid}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Remaining Balance</p>
            <p className="font-semibold text-red-300">₹{customer.remainingBalance}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Loan Status</p>
            <p className={`font-semibold px-3 py-1 rounded-full w-fit ${customer.loanStatus === 'Active' ? 'bg-blue-500/15 text-blue-300 border border-blue-400/20' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/20'}`}>
              {customer.loanStatus}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Collection Day</p>
            <p className="font-semibold text-slate-100">{customer.collectionWeekDay}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Weekly EMI</p>
            <p className="font-semibold text-slate-100">₹{customer.weeklyEMI}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-4">Payment Schedule</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-800 border-b border-slate-700">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-slate-200">Week</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-200">Due Date</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-200">Amount</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-200">Received</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-200">Status</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-200">Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment._id} className="border-b border-slate-800 hover:bg-slate-800/60 transition">
                  <td className="px-4 py-3 text-slate-200">{payment.weekNumber}</td>
                  <td className="px-4 py-3 text-slate-300">{new Date(payment.dueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-200">₹{payment.emiAmount}</td>
                  <td className="px-4 py-3 text-slate-300">₹{payment.receivedAmount || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${payment.status === 'Paid' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/20' : payment.status === 'Partial' ? 'bg-blue-500/15 text-blue-300 border-blue-400/20' : 'bg-amber-500/15 text-amber-300 border-amber-400/20'}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {showPaymentForm === payment._id ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          min="0"
                          placeholder="Amount"
                          value={paymentData[payment._id]?.receivedAmount || ''}
                          onChange={(e) => setPaymentData({
                            ...paymentData,
                            [payment._id]: {
                              ...paymentData[payment._id],
                              receivedAmount: e.target.value
                            }
                          })}
                          className="w-24 px-2 py-1 rounded-lg border border-slate-700 bg-slate-950 text-slate-100 text-sm"
                        />
                        <button onClick={() => handlePaymentSubmit(payment._id)} className="bg-emerald-600 text-white px-2 py-1 rounded text-xs font-semibold hover:bg-emerald-700 transition">
                          Save
                        </button>
                        <button onClick={() => setShowPaymentForm(null)} className="bg-slate-700 text-white px-2 py-1 rounded text-xs font-semibold hover:bg-slate-600 transition">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setShowPaymentForm(payment._id);
                          setPaymentData({
                            [payment._id]: {
                              receivedAmount: payment.receivedAmount?.toString() || ''
                            }
                          });
                        }}
                        className="bg-[#2563EB] text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-[#1d4ed8] transition"
                      >
                        Update
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
