const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const mongoose = require('mongoose');
const reportService = require('../services/reportService');

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const INDIA_TIME_ZONE = 'Asia/Kolkata';

const getIndiaToday = () => {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: INDIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);

  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]));
  const start = new Date(Date.UTC(values.year, values.month - 1, values.day, -5, -30, 0, 0));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  end.setUTCMilliseconds(end.getUTCMilliseconds() - 1);

  return { start, end, todayWeekDay: new Intl.DateTimeFormat('en-US', { timeZone: INDIA_TIME_ZONE, weekday: 'long' }).format(now) };
};

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const parsePagination = (query) => {
  const page = Number.parseInt(query.page, 10);
  let limit = Number.parseInt(query.limit, 10);
  if (limit > 100) limit = 100; // Prevent DoS
  const hasPagination = Number.isInteger(page) && Number.isInteger(limit) && page > 0 && limit > 0;

  if (!hasPagination) {
    return { hasPagination: false, page: 1, limit: 0, skip: 0 };
  }

  return {
    hasPagination: true,
    page,
    limit,
    skip: (page - 1) * limit
  };
};

const setPaginationHeader = (res, total, page, limit) => {
  res.set('X-Pagination', JSON.stringify({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }));
};

exports.getPaymentsByCustomer = async (req, res) => {
  try {
    const { hasPagination, page, limit, skip } = parsePagination(req.query);
    const filter = { customerId: req.params.customerId, userId: req.user.id };

    let paymentsQuery = Payment.find(filter)
      .sort({ weekNumber: 1 })
      .select('-__v')
      .lean();

    if (hasPagination) {
      const total = await Payment.countDocuments(filter);
      paymentsQuery = paymentsQuery.skip(skip).limit(limit);
      setPaginationHeader(res, total, page, limit);
    }

    const payments = await paymentsQuery;
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const { receivedAmount, remarks } = req.body;
    const paymentId = req.params.id;
    const receivedAmountValue = Number(receivedAmount || 0);

    if (Number.isNaN(receivedAmountValue) || receivedAmountValue < 0) {
      return res.status(400).json({ message: 'receivedAmount must be a valid non-negative number' });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment || payment.userId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const customer = await Customer.findById(payment.customerId);
    if (!customer || customer.userId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Customer not found for this payment' });
    }

    if (receivedAmountValue > payment.emiAmount) {
      return res.status(400).json({ message: 'receivedAmount cannot exceed the EMI amount' });
    }

    const oldReceivedAmount = Number(payment.receivedAmount || 0);
    const computedStatus = receivedAmountValue === 0
      ? 'Pending'
      : receivedAmountValue === payment.emiAmount
        ? 'Paid'
        : 'Partial';

    payment.receivedAmount = receivedAmountValue;
    payment.status = computedStatus;
    payment.remarks = remarks || '';
    payment.receivedDate = receivedAmountValue > 0 ? new Date() : undefined;

    await payment.save();

    const amountDifference = receivedAmountValue - oldReceivedAmount;
    customer.totalPaid = Number(customer.totalPaid || 0) + amountDifference;
    customer.remainingBalance = Number(customer.amountGiven || 0) - customer.totalPaid;

    if (customer.remainingBalance <= 0) {
      customer.loanStatus = 'Completed';
      customer.remainingBalance = 0;
    } else if (customer.loanStatus === 'Completed' && customer.remainingBalance > 0) {
      customer.loanStatus = 'Active';
    }

    await customer.save();

    res.json({ message: 'Payment updated', payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPendingPayments = async (req, res) => {
  try {
    const { hasPagination, page, limit, skip } = parsePagination(req.query);
    const filter = { status: 'Pending', userId: req.user.id };

    let paymentsQuery = Payment.find(filter)
      .sort({ dueDate: 1 })
      .select('-__v')
      .lean();

    if (hasPagination) {
      const total = await Payment.countDocuments(filter);
      paymentsQuery = paymentsQuery.skip(skip).limit(limit);
      setPaginationHeader(res, total, page, limit);
    }

    const payments = await paymentsQuery;
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOverduePayments = async (req, res) => {
  try {
    const { hasPagination, page, limit, skip } = parsePagination(req.query);
    const now = new Date();
    const filter = {
      userId: req.user.id,
      status: { $in: ['Pending', 'Partial'] },
      dueDate: { $lt: now }
    };

    let paymentsQuery = Payment.find(filter)
      .sort({ dueDate: 1 })
      .select('-__v')
      .lean();

    if (hasPagination) {
      const total = await Payment.countDocuments(filter);
      paymentsQuery = paymentsQuery.skip(skip).limit(limit);
      setPaginationHeader(res, total, page, limit);
    }

    const payments = await paymentsQuery;

    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPaymentsByWeekDay = async (req, res) => {
  try {
    const { hasPagination, page, limit, skip } = parsePagination(req.query);
    const { day } = req.params;
    const filter = { weekDay: day, userId: req.user.id };

    let paymentsQuery = Payment.find(filter)
      .sort({ dueDate: 1 })
      .select('-__v')
      .lean();

    if (hasPagination) {
      const total = await Payment.countDocuments(filter);
      paymentsQuery = paymentsQuery.skip(skip).limit(limit);
      setPaginationHeader(res, total, page, limit);
    }

    const payments = await paymentsQuery;
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    const { customerId } = req.params;
    const payments = await Payment.find({ customerId, userId: req.user.id }).sort({ weekNumber: 1 }).select('-__v').lean();

    const paidPayments = payments.filter(p => p.status === 'Paid');
    const pendingPayments = payments.filter(p => p.status === 'Pending');
    const partialPayments = payments.filter(p => p.status === 'Partial');

    res.json({
      total: payments.length,
      paid: paidPayments.length,
      pending: pendingPayments.length,
      partial: partialPayments.length,
      payments
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const userIdObj = new mongoose.Types.ObjectId(req.user.id);
    const ownerFilter = { userId: userIdObj };
    const totalCustomers = await Customer.countDocuments(ownerFilter);
    const activeCustomers = await Customer.countDocuments({ ...ownerFilter, loanStatus: 'Active' });

    const [customerTotals] = await Customer.aggregate([
      { $match: { userId: userIdObj } },
      {
        $group: {
          _id: null,
          totalAmountGiven: { $sum: { $ifNull: ['$amountGiven', 0] } },
          totalRemaining: { $sum: { $ifNull: ['$remainingBalance', 0] } }
        }
      }
    ]);

    const totalAmountGiven = customerTotals?.totalAmountGiven || 0;
    const totalRemainingFromCustomers = customerTotals?.totalRemaining || 0;

    // Calculate total collected directly from payments collection to ensure we include
    // partial payments and avoid relying on possibly stale `customer.totalPaid` fields.
    const [paymentTotals] = await Payment.aggregate([
      { $match: { userId: userIdObj, receivedAmount: { $ne: null } } },
      {
        $group: {
          _id: null,
          totalAmountCollected: { $sum: { $ifNull: ['$receivedAmount', 0] } }
        }
      }
    ]);

    const totalAmountCollected = paymentTotals?.totalAmountCollected || 0;

    // Pending collections: prefer summing remainingBalance on customers (accurate),
    // otherwise compute as difference between given and collected.
    const pendingCollections = totalRemainingFromCustomers || Math.max(0, totalAmountGiven - totalAmountCollected);

    const now = new Date();
    const overduePayments = await Payment.countDocuments({
      userId: req.user.id,
      status: { $in: ['Pending', 'Partial'] },
      dueDate: { $lt: now }
    });

    const pendingPayments = await Payment.countDocuments({ userId: req.user.id, status: 'Pending' });

    // Today-only operational summary (timezone-safe at server local day boundaries).
    const { start: startOfDay, end: endOfDay, todayWeekDay } = getIndiaToday();

    const todayRecords = await Payment.find({
      userId: req.user.id,
      weekDay: todayWeekDay,
      dueDate: { $gte: startOfDay, $lte: endOfDay }
    }).lean();

    const totalDueAmountToday = todayRecords.reduce((sum, payment) => sum + (payment.emiAmount || 0), 0);
    const totalCollectedAmountToday = todayRecords.reduce((sum, payment) => sum + (payment.receivedAmount || 0), 0);
    const remainingBalanceToday = Math.max(0, totalDueAmountToday - totalCollectedAmountToday);
    const totalDueCustomersToday = todayRecords.filter(p => p.status === 'Pending' || p.status === 'Partial').length;

    // Sort todayRecords: Pending > Partial > Paid
    const statusOrder = { 'Pending': 1, 'Partial': 2, 'Paid': 3 };
    todayRecords.sort((a, b) => {
      const aVal = statusOrder[a.status] || 99;
      const bVal = statusOrder[b.status] || 99;
      if (aVal !== bVal) return aVal - bVal;
      return (a.customerName || '').localeCompare(b.customerName || '');
    });

    res.json({
      totalCustomers,
      activeCustomers,
      totalAmountGiven,
      totalAmountCollected,
      pendingCollections,
      overduePayments,
      pendingPayments,
      todayCollectionSummary: {
        collectionDay: todayWeekDay,
        totalDueAmountToday,
        totalCollectedAmountToday,
        remainingBalanceToday,
        totalDueCustomersToday,
        startOfDay,
        endOfDay,
        todayRecords
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDailyReport = async (req, res) => {
  try {
    const reportData = await reportService.buildDailyReportData(req.user.id);
    res.json(reportData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
