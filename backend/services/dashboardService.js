const Customer = require('../models/Customer');
const Payment = require('../models/Payment');

const getDashboardStats = async (userId) => {
  try {
    const ownerFilter = { userId };
    const totalCustomers = await Customer.countDocuments(ownerFilter);
    const activeCustomers = await Customer.countDocuments({ ...ownerFilter, loanStatus: 'Active' });

    const allCustomers = await Customer.find(ownerFilter);
    const totalAmountGiven = allCustomers.reduce((sum, c) => sum + c.amountGiven, 0);
    const totalAmountCollected = allCustomers.reduce((sum, c) => sum + c.totalPaid, 0);
    const pendingCollections = allCustomers.reduce((sum, c) => sum + c.remainingBalance, 0);

    const now = new Date();
    const overduePayments = await Payment.countDocuments({
      userId,
      status: { $in: ['Pending', 'Partial'] },
      dueDate: { $lt: now }
    });

    const pendingPayments = await Payment.countDocuments({
      userId,
      status: 'Pending'
    });

    return {
      totalCustomers,
      activeCustomers,
      totalAmountGiven,
      totalAmountCollected,
      pendingCollections,
      overduePayments,
      pendingPayments
    };
  } catch (err) {
    throw err;
  }
};

module.exports = {
  getDashboardStats
};
