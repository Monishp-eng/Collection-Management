import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerAPI } from '../api/api';
import { Save, AlertCircle, User2, CreditCard, CalendarDays } from 'lucide-react';

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekdayFromDate = (dateStr) => {
  if (!dateStr) return 'Monday';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return 'Monday';
  const [year, month, day] = parts.map(Number);
  const date = new Date(year, month - 1, day);
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return daysOfWeek[date.getDay()];
};

export default function AddCustomer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const initialDate = getLocalDateString();
  const initialWeekday = getWeekdayFromDate(initialDate);

  const [formData, setFormData] = useState({
    name: '',
    wifeCaretaker: '',
    phone: '',
    address: '',
    amountGiven: '',
    dateGiven: initialDate,
    collectionWeekDay: initialWeekday,
    weeklyEMI: '',
    totalWeeks: '15'
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const fieldClass = 'w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-300';
  const sectionClass = 'rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 md:p-6 transition-colors duration-300';

  const summary = useMemo(() => [
    { label: 'Customer Details', icon: User2 },
    { label: 'Loan Details', icon: CreditCard },
    { label: 'Collection Schedule', icon: CalendarDays }
  ], []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'dateGiven') {
        updated.collectionWeekDay = getWeekdayFromDate(value);
      }
      return updated;
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const tagName = e.target.tagName.toLowerCase();
      if (tagName !== 'textarea' && e.target.type !== 'submit') {
        e.preventDefault();
        const form = e.target.form;
        if (form) {
          const index = Array.prototype.indexOf.call(form, e.target);
          if (index >= 0 && index < form.elements.length - 1) {
            let nextIndex = index + 1;
            while (nextIndex < form.elements.length) {
              const element = form.elements[nextIndex];
              if (
                element &&
                !element.disabled &&
                element.tabIndex !== -1 &&
                (element.tagName.toLowerCase() === 'input' ||
                  element.tagName.toLowerCase() === 'select' ||
                  element.tagName.toLowerCase() === 'textarea' ||
                  element.tagName.toLowerCase() === 'button')
              ) {
                element.focus();
                break;
              }
              nextIndex++;
            }
          }
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await customerAPI.addCustomer({
        ...formData,
        amountGiven: parseFloat(formData.amountGiven),
        weeklyEMI: parseFloat(formData.weeklyEMI),
        totalWeeks: parseInt(formData.totalWeeks)
      });
      // notify dashboard to refresh immediately after creating a customer
      try { window.dispatchEvent(new CustomEvent('dashboard:refresh')); } catch (e) { /* ignore */ }
      navigate('/customers');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Add New Customer</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Create a new loan profile and collection schedule</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-200 px-4 py-3 rounded-xl mb-6 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {summary.map(({ label, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-300 flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Section</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={sectionClass}>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="grid grid-cols-1 gap-6">
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4 md:p-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Customer Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-2">Customer Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} onKeyDown={handleKeyDown} autoComplete="new-customer-name" className={fieldClass} required />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Wife/Caretaker Name</label>
                  <input type="text" name="wifeCaretaker" value={formData.wifeCaretaker} onChange={handleChange} onKeyDown={handleKeyDown} autoComplete="new-customer-caretaker" className={fieldClass} placeholder="Optional" />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Phone Number *</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} onKeyDown={handleKeyDown} autoComplete="new-customer-phone" className={fieldClass} pattern="\d{10}" placeholder="10-digit number" required />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold mb-2">Address *</label>
                  <textarea name="address" value={formData.address} onChange={handleChange} onKeyDown={handleKeyDown} autoComplete="new-customer-address" rows="3" className={fieldClass} required />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4 md:p-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Loan Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-2">Amount Given (₹) *</label>
                  <input type="number" name="amountGiven" min="1" value={formData.amountGiven} onChange={handleChange} onKeyDown={handleKeyDown} autoComplete="new-customer-amount" className={fieldClass} required />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Weekly EMI (₹) *</label>
                  <input type="number" name="weeklyEMI" min="1" value={formData.weeklyEMI} onChange={handleChange} onKeyDown={handleKeyDown} autoComplete="new-customer-emi" className={fieldClass} required />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Total Weeks *</label>
                  <input type="number" name="totalWeeks" min="1" value={formData.totalWeeks} onChange={handleChange} onKeyDown={handleKeyDown} autoComplete="new-customer-weeks" className={fieldClass} required />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Date Given *</label>
                  <input type="date" name="dateGiven" value={formData.dateGiven} onChange={handleChange} onKeyDown={handleKeyDown} autoComplete="off" className={fieldClass} required />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4 md:p-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Collection Schedule</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-2">Collection Day *</label>
                  <select name="collectionWeekDay" value={formData.collectionWeekDay} onChange={handleChange} onKeyDown={handleKeyDown} className={fieldClass} required>
                    {days.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Tip</p>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">Keep the caretaker and address accurate for fast field collections.</p>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#2563EB] text-white px-6 py-3 rounded-xl hover:bg-[#1d4ed8] transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/20"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Adding...' : 'Add Customer'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/customers')}
              className="bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-6 py-3 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
