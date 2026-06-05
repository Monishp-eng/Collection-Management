const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const { generatePaymentSchedule } = require('../services/paymentScheduleService');

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

const getOwnerFilter = (req) => ({ userId: req.user.id });

exports.addCustomer = async (req, res) => {
  try {
    const { name, wifeCaretaker, phone, address, amountGiven, dateGiven, collectionWeekDay, weeklyEMI, totalWeeks } = req.body;
    const ownerFilter = getOwnerFilter(req);

    const existingCustomer = await Customer.findOne({ ...ownerFilter, phone });
    if (existingCustomer) {
      return res.status(400).json({ message: 'Customer with this phone already exists' });
    }

    const amountGivenValue = Number(amountGiven);
    const weeklyEMIValue = Number(weeklyEMI);
    const totalWeeksValue = Number(totalWeeks);
    const customerTotalWeeks = Number.isInteger(totalWeeksValue) && totalWeeksValue > 0 ? totalWeeksValue : 15;

    if (Number.isNaN(amountGivenValue) || amountGivenValue <= 0) {
      return res.status(400).json({ message: 'amountGiven must be a valid positive number' });
    }

    if (Number.isNaN(weeklyEMIValue) || weeklyEMIValue <= 0) {
      return res.status(400).json({ message: 'weeklyEMI must be a valid positive number' });
    }

    const customer = new Customer({
      userId: req.user.id,
      name,
      wifeCaretaker,
      phone,
      address,
      amountGiven: amountGivenValue,
      dateGiven,
      collectionWeekDay,
      weeklyEMI: weeklyEMIValue,
      totalWeeks: customerTotalWeeks,
      remainingBalance: amountGivenValue
    });

    await customer.save();

    await generatePaymentSchedule(req.user.id, customer._id, customer.name, dateGiven, collectionWeekDay, weeklyEMIValue, customerTotalWeeks);

    res.status(201).json({ message: 'Customer added successfully', customer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllCustomers = async (req, res) => {
  try {
    const { hasPagination, page, limit, skip } = parsePagination(req.query);
    const ownerFilter = getOwnerFilter(req);

    let customersQuery = Customer.find(ownerFilter)
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean();

    if (hasPagination) {
      const total = await Customer.countDocuments(ownerFilter);
      customersQuery = customersQuery.skip(skip).limit(limit);
      setPaginationHeader(res, total, page, limit);
    }

    const customers = await customersQuery;
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, userId: req.user.id }).select('-__v').lean();
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCustomersByWeekDay = async (req, res) => {
  try {
    const { hasPagination, page, limit, skip } = parsePagination(req.query);
    const { day } = req.params;
    const ownerFilter = getOwnerFilter(req);

    const customerFilter = { ...ownerFilter, collectionWeekDay: day };
    let customersQuery = Customer.find(customerFilter).select('-__v').lean();

    if (hasPagination) {
      const total = await Customer.countDocuments(customerFilter);
      customersQuery = customersQuery.skip(skip).limit(limit);
      setPaginationHeader(res, total, page, limit);
    }

    const [customers, payments] = await Promise.all([
      customersQuery,
      Payment.find({ ...ownerFilter, weekDay: day, status: { $in: ['Pending', 'Partial'] } })
        .select('-__v')
        .lean()
    ]);

    res.json({ customers, payments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.searchCustomers = async (req, res) => {
  try {
    const { query } = req.query;
    const { hasPagination, page, limit, skip } = parsePagination(req.query);
    const ownerFilter = getOwnerFilter(req);

    const searchQuery = {
      ...ownerFilter,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } }
      ]
    };

    let customersQuery = Customer.find(searchQuery)
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean();

    if (hasPagination) {
      const total = await Customer.countDocuments(searchQuery);
      customersQuery = customersQuery.skip(skip).limit(limit);
      setPaginationHeader(res, total, page, limit);
    }

    const customers = await customersQuery;

    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { name, wifeCaretaker, phone, address, collectionWeekDay, amountGiven, weeklyEMI, totalWeeks } = req.body;
    
    const customer = await Customer.findOne({ _id: req.params.id, userId: req.user.id });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    let financialsChanged = false;
    const newAmountGiven = amountGiven !== undefined ? Number(amountGiven) : customer.amountGiven;
    const newWeeklyEMI = weeklyEMI !== undefined ? Number(weeklyEMI) : customer.weeklyEMI;
    const newTotalWeeks = totalWeeks !== undefined ? Number(totalWeeks) : customer.totalWeeks;

    if (newAmountGiven !== customer.amountGiven || newWeeklyEMI !== customer.weeklyEMI || newTotalWeeks !== customer.totalWeeks) {
      financialsChanged = true;
    }

    if (name !== undefined) customer.name = name;
    if (wifeCaretaker !== undefined) customer.wifeCaretaker = wifeCaretaker;
    if (phone !== undefined) customer.phone = phone;
    if (address !== undefined) customer.address = address;
    if (collectionWeekDay !== undefined) customer.collectionWeekDay = collectionWeekDay;

    if (financialsChanged) {
      customer.amountGiven = newAmountGiven;
      customer.weeklyEMI = newWeeklyEMI;
      customer.totalWeeks = newTotalWeeks;
      
      const newRemainingBalance = Math.max(0, newAmountGiven - customer.totalPaid);
      customer.remainingBalance = newRemainingBalance;
      if (newRemainingBalance === 0) {
        customer.loanStatus = 'Completed';
      } else {
        customer.loanStatus = 'Active';
      }
    }

    await customer.save();

    if (financialsChanged) {
      await Payment.updateMany(
        { customerId: customer._id, userId: req.user.id, status: 'Pending' },
        { $set: { emiAmount: newWeeklyEMI } }
      );

      const existingPayments = await Payment.find({ customerId: customer._id, userId: req.user.id }).sort({ weekNumber: 1 });
      
      if (existingPayments.length > newTotalWeeks) {
        await Payment.deleteMany({
          customerId: customer._id,
          userId: req.user.id,
          weekNumber: { $gt: newTotalWeeks },
          status: 'Pending'
        });
      }

      const currentMaxWeek = existingPayments.length > 0 ? existingPayments[existingPayments.length - 1].weekNumber : 0;
      if (newTotalWeeks > currentMaxWeek) {
        let lastDueDate = existingPayments.length > 0 ? new Date(existingPayments[existingPayments.length - 1].dueDate) : new Date(customer.dateGiven || Date.now());
        
        const newPayments = [];
        for (let week = currentMaxWeek + 1; week <= newTotalWeeks; week++) {
          const dueDate = new Date(lastDueDate);
          dueDate.setDate(dueDate.getDate() + 7 * (week - currentMaxWeek));
          dueDate.setHours(0, 0, 0, 0);

          newPayments.push({
            userId: req.user.id,
            customerId: customer._id,
            customerName: customer.name,
            weekNumber: week,
            weekDay: customer.collectionWeekDay,
            dueDate,
            emiAmount: newWeeklyEMI,
            status: 'Pending'
          });
        }
        
        if (newPayments.length > 0) {
          await Payment.insertMany(newPayments);
        }
      }
    }

    res.json({ message: 'Customer updated', customer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await Payment.deleteMany({ customerId: req.params.id, userId: req.user.id });

    res.json({ message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
