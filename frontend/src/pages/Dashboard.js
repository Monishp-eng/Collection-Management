import React, { useEffect, useMemo, useState } from 'react';
import { paymentAPI } from '../api/api';
import { AlertCircle, CheckCircle2, Download, Loader2, Share2, Users, Wallet, ChevronRight } from 'lucide-react';
import KpiCard from '../components/KpiCard';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { downloadDailyReport, shareDailyReport } from '../utils/reportPdf';
import { AnimatePresence } from 'framer-motion';
import CustomerDetailModal from '../components/CustomerDetailModal';
import { customerAPI } from '../api/api';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const money = (value = 0) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const getDayName = (offset = 0) => WEEKDAYS[(new Date().getDay() + offset) % 7];

const groupByCustomer = (payments = []) => payments.reduce((accumulator, payment) => {
  const key = String(payment.customerId || payment.customerName);
  if (!accumulator[key]) {
    accumulator[key] = {
      customerId: payment.customerId,
      customerName: payment.customerName,
      payments: []
    };
  }

  accumulator[key].payments.push(payment);
  return accumulator;
}, {});

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [overduePayments, setOverduePayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    fetchWorkspace();

    // listen for external triggers to refresh the dashboard (payment updates, new customers)
    const onRefresh = () => fetchWorkspace();
    window.addEventListener('dashboard:refresh', onRefresh);
    return () => window.removeEventListener('dashboard:refresh', onRefresh);
  }, []);

  const fetchWorkspace = async () => {
    try {
      setLoading(true);

      const [statsResponse, overdueResponse] = await Promise.all([
        paymentAPI.getDashboardStats(),
        paymentAPI.getOverduePayments()
      ]);

      setStats(statsResponse.data);
      setOverduePayments((overdueResponse.data || []).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)));
    } catch (error) {
      console.error('Failed to load dashboard workspace', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = async (customerId) => {
    try {
      const res = await customerAPI.getCustomer(customerId);
      setSelectedCustomer(res.data);
    } catch (error) {
      toast.error('Failed to load customer details');
    }
  };

  const formatReportFileName = (dateValue = new Date()) => {
    const date = new Date(dateValue);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `Daily_Report_${day}-${month}-${year}.pdf`;
  };

  const fetchDailyReport = async () => {
    const response = await paymentAPI.getDailyReport();
    return response.data;
  };

  const handleDownloadReport = async () => {
    try {
      setReportLoading(true);
      const reportData = await fetchDailyReport();
      const fileName = formatReportFileName(reportData.reportDate);
      downloadDailyReport(reportData, user?.fullName || 'Admin', fileName);
      toast.success('Daily report is downloading');
    } catch (error) {
      console.error('Failed to download report', error);
      toast.error('Unable to generate PDF report');
    } finally {
      setReportLoading(false);
    }
  };

  const handleShareReport = async () => {
    try {
      setReportLoading(true);
      const reportData = await fetchDailyReport();
      const fileName = formatReportFileName(reportData.reportDate);
      await shareDailyReport(reportData, user?.fullName || 'Admin', fileName);
      toast.success('Share dialog opened');
    } catch (error) {
      console.error('Failed to share report', error);
      toast.error('Unable to share report');
    } finally {
      setReportLoading(false);
    }
  };

  const todaySummary = useMemo(() => {
    const serverSummary = stats?.todayCollectionSummary;
    return {
      collectionDay: serverSummary?.collectionDay || getDayName(0),
      totalDueAmount: Number(serverSummary?.totalDueAmountToday || 0),
      totalCollectedAmount: Number(serverSummary?.totalCollectedAmountToday || 0),
      remainingBalanceToday: Number(serverSummary?.remainingBalanceToday || 0),
      totalDueCustomers: Number(serverSummary?.totalDueCustomersToday || 0),
      records: serverSummary?.todayRecords || []
    };
  }, [stats]);



  const balanceColor = useMemo(() => {
    if (todaySummary.totalDueAmount === 0 || todaySummary.remainingBalanceToday === 0) return 'text-emerald-600 dark:text-emerald-300';
    if (todaySummary.remainingBalanceToday > todaySummary.totalDueAmount * 0.35) return 'text-red-600 dark:text-red-300';
    return 'text-amber-600 dark:text-amber-300';
  }, [todaySummary]);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-700 dark:text-gray-200">
        <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" />
        Loading dashboard workspace...
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-5 text-gray-900 dark:text-gray-100">
      <Toaster position="top-right" />

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Operational workspace for daily collections</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            onClick={handleDownloadReport}
            disabled={reportLoading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            Download Daily PDF
          </button>
          <button
            onClick={handleShareReport}
            disabled={reportLoading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Share2 className="w-4 h-4" />
            Share Report
          </button>
        </div>
      </div>

      {/* Overall KPI Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          subtitle={`${stats?.activeCustomers || 0} active loans`}
          icon={Users}
          color="blue"
        />
        <KpiCard
          title="Total Disbursed"
          value={money(stats?.totalAmountGiven || 0)}
          subtitle="Lifetime loans given"
          icon={Wallet}
          color="gray"
        />
        <KpiCard
          title="Total Collected"
          value={money(stats?.totalAmountCollected || 0)}
          subtitle={`${stats?.totalAmountGiven ? Math.round(((stats.totalAmountCollected || 0) / stats.totalAmountGiven) * 100) : 0}% recovery rate`}
          icon={CheckCircle2}
          color="green"
        />
        <KpiCard
          title="Outstanding Balance"
          value={money(stats?.pendingCollections || 0)}
          subtitle="Total active dues"
          icon={AlertCircle}
          color="amber"
        />
      </div>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm dark:shadow-none overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 md:px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-semibold">Today's Collection Summary</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Operational summary for {todaySummary.collectionDay}</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {todaySummary.totalDueCustomers} due customers
          </span>
        </div>

        <div className="p-4 md:p-5 grid grid-cols-2 xl:grid-cols-5 gap-3 md:gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Collection Day</p>
            <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{todaySummary.collectionDay}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Total Due Today</p>
            <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{money(todaySummary.totalDueAmount)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Collected Today</p>
            <p className="mt-2 text-lg font-semibold text-emerald-600 dark:text-emerald-300">{money(todaySummary.totalCollectedAmount)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Remaining Today</p>
            <p className={`mt-2 text-lg font-semibold ${balanceColor}`}>{money(todaySummary.remainingBalanceToday)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Due Customers</p>
            <p className="mt-2 text-lg font-semibold text-blue-600 dark:text-blue-300">{todaySummary.totalDueCustomers}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm dark:shadow-none overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 md:px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-semibold">Today's Collection Records</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sorted by Pending, Partial, and Paid</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Customer</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Due Amount</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Collected</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Remaining</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Status</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Last Payment Time</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-600 dark:text-slate-300">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {todaySummary.records.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-slate-500">No collections scheduled for today.</td>
                </tr>
              ) : (
                todaySummary.records.map((record) => {
                  const remaining = Math.max(0, (record.emiAmount || 0) - (record.receivedAmount || 0));
                  return (
                    <tr key={record._id} onClick={() => handleRowClick(record.customerId)} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition">
                      <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">{record.customerName}</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{money(record.emiAmount)}</td>
                      <td className="px-5 py-3 text-emerald-600 dark:text-emerald-400 font-medium">{money(record.receivedAmount)}</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{money(remaining)}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${
                          record.status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' :
                          record.status === 'Partial' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs">
                        {record.receivedDate ? new Date(record.receivedDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 transition font-medium text-xs">
                          Update <ChevronRight className="w-3 h-3 ml-1" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
      <AnimatePresence>
        {selectedCustomer && (
          <CustomerDetailModal
            customer={selectedCustomer}
            onClose={() => setSelectedCustomer(null)}
            onSaved={async () => {
              await fetchWorkspace();
              const refreshedCustomer = await customerAPI.getCustomer(selectedCustomer._id);
              setSelectedCustomer(refreshedCustomer.data);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
