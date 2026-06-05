const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Customer = require('./models/Customer');
const Payment = require('./models/Payment');
const User = require('./models/User');

dotenv.config();

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getNextDueDate = (startDate, targetDay, weeksToAdd) => {
  const startDayOfWeek = startDate.getDay();
  const targetDayIndex = DAYS.indexOf(targetDay);
  const daysToAdd = (targetDayIndex - startDayOfWeek + 7) % 7;
  const dueDate = new Date(startDate);
  dueDate.setDate(dueDate.getDate() + daysToAdd + weeksToAdd * 7);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate;
};

async function runStressTest() {
  console.log('⏳ Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected.');

  const user = await User.findOne();
  if (!user) {
    console.error('❌ No user found in DB. Please register at least one user first.');
    process.exit(1);
  }

  const userId = user._id;
  console.log(`👤 Running test for User: ${user.fullName} (${userId})`);

  // --- CLEANUP ANY PREVIOUS MOCK DATA ---
  console.log('🧹 Cleaning up any previous mock data...');
  await Customer.deleteMany({ userId, name: { $regex: '^MOCK_' } });
  await Payment.deleteMany({ userId, customerName: { $regex: '^MOCK_' } });
  
  // --- INJECTION ---
  console.log('🚀 Injecting 500 Mock Customers...');
  const customersToInsert = [];
  
  for (let i = 1; i <= 500; i++) {
    const day = DAYS[i % 7];
    customersToInsert.push({
      userId,
      name: `MOCK_Customer_${i}`,
      phone: `999${String(i).padStart(7, '0')}`,
      address: `Mock Address ${i}`,
      amountGiven: 15000,
      dateGiven: new Date(),
      collectionWeekDay: day,
      weeklyEMI: 1000,
      totalWeeks: 15,
      loanStatus: 'Active',
      totalPaid: 0,
      remainingBalance: 15000
    });
  }

  const insertedCustomers = await Customer.insertMany(customersToInsert);
  console.log(`✅ Injected ${insertedCustomers.length} customers.`);

  console.log('🚀 Injecting 7,500 Mock Payments...');
  const paymentsToInsert = [];
  const now = new Date();

  for (const customer of insertedCustomers) {
    for (let week = 1; week <= 15; week++) {
      const dueDate = getNextDueDate(now, customer.collectionWeekDay, week - 1);
      
      // Randomize statuses to simulate real usage
      const rand = Math.random();
      let status = 'Pending';
      let receivedAmount = 0;
      
      if (week < 5) {
        status = 'Paid';
        receivedAmount = 1000;
      } else if (week === 5 && rand > 0.5) {
        status = 'Partial';
        receivedAmount = 500;
      }

      paymentsToInsert.push({
        userId,
        customerId: customer._id,
        customerName: customer.name,
        weekNumber: week,
        weekDay: customer.collectionWeekDay,
        dueDate,
        emiAmount: 1000,
        receivedAmount,
        status
      });
    }
  }

  // Insert in chunks of 2500 to prevent memory blowouts on injection
  for (let i = 0; i < paymentsToInsert.length; i += 2500) {
    await Payment.insertMany(paymentsToInsert.slice(i, i + 2500));
    console.log(`   - Inserted chunk ${i} to ${i + 2500}...`);
  }
  console.log(`✅ Injected ${paymentsToInsert.length} payments.`);

  // --- BENCHMARKING ---
  console.log('\n⏱️ --- BEGIN BENCHMARKS ---');

  // Benchmark 1: Dashboard Stats Aggregation
  console.time('Benchmark: getDashboardStats');
  
  // Note: Since this is a script, we run the raw aggregations equivalent to the controller
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  
  const todayName = DAYS[startOfDay.getDay()];

  await Payment.aggregate([
    {
      $match: {
        userId,
        weekDay: todayName,
        dueDate: { $lte: endOfDay } // only due today or overdue
      }
    }
    // ... we just need to see if the DB handles a large read fast enough
  ]);
  
  // Real check: Let's do a heavy lookup
  await Payment.find({ userId, status: { $in: ['Pending', 'Partial'] } }).sort({ dueDate: 1 }).lean();

  console.timeEnd('Benchmark: getDashboardStats');


  // Benchmark 2: Customer Search with Pagination
  console.time('Benchmark: getAllCustomers Pagination');
  await Customer.find({ userId }).sort({ createdAt: -1 }).skip(100).limit(100).lean();
  console.timeEnd('Benchmark: getAllCustomers Pagination');

  // Benchmark 3: Overdue Payments Lookup (Heavy date comparison)
  console.time('Benchmark: getOverduePayments');
  await Payment.find({
    userId,
    status: { $in: ['Pending', 'Partial'] },
    dueDate: { $lt: startOfDay }
  }).lean();
  console.timeEnd('Benchmark: getOverduePayments');

  console.log('⏱️ --- END BENCHMARKS ---\n');

  // --- CLEANUP ---
  console.log('🧹 Cleaning up mock data to restore production state...');
  await Customer.deleteMany({ userId, name: { $regex: '^MOCK_' } });
  await Payment.deleteMany({ userId, customerName: { $regex: '^MOCK_' } });
  console.log('✅ Cleanup complete. Database restored.');

  mongoose.disconnect();
  console.log('Done!');
}

runStressTest().catch(console.error);
