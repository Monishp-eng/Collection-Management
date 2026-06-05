import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerAPI } from '../api/api';
import { Plus, Search, Trash2 } from 'lucide-react';

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await customerAPI.getAllCustomers();
      setCustomers(response.data);
    } catch (err) {
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    try {
      const response = await customerAPI.searchCustomers(searchQuery);
      setFilteredCustomers(response.data);
    } catch (err) {
      setError('Search failed');
    }
  }, [customers, searchQuery]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [handleSearch]);

  const statusStyles = useMemo(() => ({
    Active: 'bg-blue-500/15 text-blue-300 border border-blue-400/20',
    Completed: 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/20',
    Pending: 'bg-amber-500/15 text-amber-300 border border-amber-400/20'
  }), []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;

    try {
      await customerAPI.deleteCustomer(id);
      fetchCustomers();
    } catch (err) {
      setError('Failed to delete customer');
    }
  };

  if (loading) return <div className="p-6 text-center text-slate-700 dark:text-slate-200">Loading...</div>;

  return (
    <div className="space-y-5 text-slate-900 dark:text-slate-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">All Customers</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Search and manage active loan customers</p>
        </div>
        <button
          onClick={() => navigate('/add-customer')}
          className="inline-flex items-center gap-2 bg-[#2563EB] text-white px-4 py-2.5 rounded-xl hover:bg-[#1d4ed8] transition shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-400/30 bg-red-500/10 text-red-700 dark:text-red-200 px-4 py-3">{error}</div>}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 transition-colors duration-300">
        <div className="flex items-center gap-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500/50 transition">
          <Search className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none w-full text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Phone</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Amount Given</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Total Paid</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Balance</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Day</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    No customers found
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer._id} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">{customer.name}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{customer.phone}</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-200">₹{customer.amountGiven}</td>
                    <td className="px-6 py-4 text-emerald-700 dark:text-emerald-300 font-semibold">₹{customer.totalPaid}</td>
                    <td className="px-6 py-4 text-red-700 dark:text-red-300 font-semibold">₹{customer.remainingBalance}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[customer.loanStatus] || statusStyles.Active}`}>
                        {customer.loanStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{customer.collectionWeekDay}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/customer/${customer._id}`)}
                        className="bg-[#2563EB] text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-[#1d4ed8] mr-2 shadow-sm transition"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleDelete(customer._id)}
                        className="bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-red-700 shadow-sm transition"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
