const Payment = require('../models/Payment');

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const parseLocalDate = (isoDateString) => {
  const [year, month, day] = String(isoDateString || '').split('-').map(Number);
  if (!year || !month || !day) {
    return new Date();
  }
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const getNextDueDate = (startDate, targetDay, weeksToAdd) => {
  const startDayOfWeek = startDate.getDay();
  const targetDayIndex = daysOfWeek.indexOf(targetDay);

  const daysToAdd = (targetDayIndex - startDayOfWeek + 7) % 7;
  const dueDate = new Date(startDate);
  dueDate.setDate(dueDate.getDate() + daysToAdd + weeksToAdd * 7);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate;
};

const generatePaymentSchedule = async (userId, customerId, customerName, dateGiven, collectionDay, emiAmount, totalWeeks) => {
  try {
    const payments = [];
    const startDate = parseLocalDate(dateGiven);

    for (let week = 1; week <= totalWeeks; week++) {
      const dueDate = getNextDueDate(startDate, collectionDay, week - 1);

      payments.push({
        userId,
        customerId,
        customerName,
        weekNumber: week,
        weekDay: collectionDay,
        dueDate,
        emiAmount,
        status: 'Pending'
      });
    }

    await Payment.insertMany(payments);
    return payments;
  } catch (err) {
    throw err;
  }
};

module.exports = {
  generatePaymentSchedule
};
