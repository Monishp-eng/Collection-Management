const Payment = require('../models/Payment');

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const INDIA_TIME_ZONE = 'Asia/Kolkata';

const getIndiaTodayRange = () => {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: INDIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);

  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]));
  const startOfDay = new Date(Date.UTC(values.year, values.month - 1, values.day, -5, -30, 0, 0));
  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);
  endOfDay.setUTCMilliseconds(endOfDay.getUTCMilliseconds() - 1);

  return {
    startOfDay,
    endOfDay,
    todayWeekDay: new Intl.DateTimeFormat('en-US', { timeZone: INDIA_TIME_ZONE, weekday: 'long' }).format(now)
  };
};

const formatDateString = (date) => {
  if (!date) return '';
  const dt = new Date(date);
  return dt.toISOString();
};

exports.buildDailyReportData = async (userId) => {
  const now = new Date();
  const { startOfDay, endOfDay, todayWeekDay } = getIndiaTodayRange();

  const paymentsDueToday = await Payment.find({
    userId,
    weekDay: todayWeekDay,
    dueDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['Pending', 'Partial'] }
  }).sort({ dueDate: 1 }).lean();

  const paymentsCollectedToday = await Payment.find({
    userId,
    receivedAmount: { $gt: 0 },
    receivedDate: { $gte: startOfDay, $lte: endOfDay }
  }).sort({ receivedDate: 1 }).lean();

  const overduePayments = await Payment.find({
    userId,
    status: { $in: ['Pending', 'Partial'] },
    dueDate: { $lt: startOfDay }
  }).sort({ dueDate: 1 }).lean();

  const totalCustomersDueToday = new Set(paymentsDueToday.map((payment) => String(payment.customerId || payment.customerName))).size;
  const totalDueAmountToday = paymentsDueToday.reduce((total, payment) => total + (payment.emiAmount || 0), 0);
  const totalCollectedAmountToday = paymentsCollectedToday.reduce((total, payment) => total + (payment.receivedAmount || 0), 0);
  const remainingBalanceToday = paymentsDueToday.reduce((total, payment) => total + Math.max(0, (payment.emiAmount || 0) - (payment.receivedAmount || 0)), 0);

  const overdueCustomerIds = new Set(overduePayments.map((payment) => String(payment.customerId || payment.customerName)));
  const overdueCustomersCount = overdueCustomerIds.size;
  const totalOverdueAmount = overduePayments.reduce((total, payment) => total + Math.max(0, (payment.emiAmount || 0) - (payment.receivedAmount || 0)), 0);

  const paidCustomers = paymentsCollectedToday.map((payment) => ({
    customerName: payment.customerName,
    amountPaid: payment.receivedAmount || 0,
    paymentTime: payment.receivedDate,
    status: payment.status || 'Paid'
  }));

  const pendingCustomers = paymentsDueToday.map((payment) => ({
    customerName: payment.customerName,
    dueAmount: payment.emiAmount || 0,
    pendingBalance: Math.max(0, (payment.emiAmount || 0) - (payment.receivedAmount || 0)),
    dueDate: payment.dueDate,
    status: payment.status
  }));

  const overdueCustomers = overduePayments.map((payment) => ({
    customerName: payment.customerName,
    overdueDays: Math.max(0, Math.floor((startOfDay - new Date(payment.dueDate)) / (1000 * 60 * 60 * 24))),
    pendingAmount: Math.max(0, (payment.emiAmount || 0) - (payment.receivedAmount || 0)),
    dueDate: payment.dueDate,
    status: payment.status
  }));

  const dailyActivity = [
    { label: 'Due Today', value: totalCustomersDueToday },
    { label: 'Paid Today', value: paymentsCollectedToday.length },
    { label: 'Overdue Customers', value: overdueCustomersCount },
    { label: 'Amount Collected', value: totalCollectedAmountToday },
    { label: 'Remaining Balance', value: remainingBalanceToday }
  ];

  return {
    reportDate: formatDateString(startOfDay),
    reportTime: formatDateString(now),
    dayOfWeek: todayWeekDay,
    summary: {
      totalCustomersDueToday,
      totalDueAmountToday,
      totalCollectedAmountToday,
      remainingBalanceToday,
      overdueCustomersCount,
      totalOverdueAmount
    },
    dailyActivity,
    paidCustomers,
    pendingCustomers,
    overdueCustomers
  };
};
