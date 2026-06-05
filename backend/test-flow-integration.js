const mongoose = require('mongoose');
const axios = require('axios');
const assert = require('assert');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';

// Models for cleanup
const User = require('./models/User');
const Customer = require('./models/Customer');
const Payment = require('./models/Payment');

async function runIntegrationTest() {
  console.log('🚀 Starting Complete Backend Integration Test...\n');

  // Connect directly to the database for cleanup and checks
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🔌 Connected to database:', process.env.MONGODB_URI);

  // Clean up any stale test records from previous runs
  const testEmail = 'test-integration@finance.local';
  const testPhone = '8888888888';
  
  await User.deleteOne({ email: testEmail });
  await Customer.deleteMany({ phone: testPhone });
  
  console.log('🧹 Cleaned up any existing test records.');

  let authToken = '';
  let testUser = null;
  let testCustomer = null;
  let payments = [];

  try {
    // 1. REGISTER TEST USER
    console.log('\n--- 1. Registering test user...');
    const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
      fullName: 'Test Integration User',
      email: testEmail,
      phone: testPhone,
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!'
    });
    
    assert.strictEqual(registerRes.status, 201);
    assert.strictEqual(registerRes.data.user.email, testEmail);
    console.log('✅ Registration successful!');

    // 2. LOGIN TEST USER
    console.log('\n--- 2. Logging in test user...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: testEmail,
      password: 'SecurePassword123!'
    });
    
    assert.strictEqual(loginRes.status, 200);
    assert.ok(loginRes.data.token);
    authToken = loginRes.data.token;
    testUser = loginRes.data.user;
    console.log('✅ Login successful! Token acquired.');

    // Set up Axios authorization header for subsequent requests
    const client = axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Bearer ${authToken}` }
    });

    // 3. GET DASHBOARD STATS (Initial)
    console.log('\n--- 3. Checking initial Dashboard stats...');
    const statsRes1 = await client.get('/payments/dashboard/stats');
    assert.strictEqual(statsRes1.status, 200);
    assert.strictEqual(statsRes1.data.totalCustomers, 0);
    assert.strictEqual(statsRes1.data.totalAmountCollected, 0);
    console.log('✅ Initial stats verified (0 customers, 0 collected).');

    // 4. ADD A CUSTOMER
    console.log('\n--- 4. Adding a new customer...');
    const customerPayload = {
      name: 'Integration Test Customer',
      wifeCaretaker: 'Integration Caretaker',
      phone: testPhone,
      address: '123 Test Street, City',
      amountGiven: 15000,
      dateGiven: new Date().toISOString(),
      collectionWeekDay: 'Sunday',
      weeklyEMI: 1000,
      totalWeeks: 15
    };
    
    const customerRes = await client.post('/customers/add', customerPayload);
    assert.strictEqual(customerRes.status, 201);
    assert.ok(customerRes.data.customer._id);
    testCustomer = customerRes.data.customer;
    console.log(`✅ Customer added successfully with ID: ${testCustomer._id}`);

    // Verify payments were automatically generated for the customer
    const generatedPaymentsCount = await Payment.countDocuments({ customerId: testCustomer._id });
    assert.strictEqual(generatedPaymentsCount, 15);
    console.log(`✅ Verified payment schedule: 15 EMI records automatically generated.`);

    // 5. GET CUSTOMERS LIST
    console.log('\n--- 5. Fetching customers list...');
    const listRes = await client.get('/customers');
    assert.strictEqual(listRes.status, 200);
    assert.ok(listRes.data.length >= 1);
    const found = listRes.data.find(c => c._id.toString() === testCustomer._id.toString());
    assert.ok(found);
    assert.strictEqual(found.name, 'Integration Test Customer');
    console.log('✅ Customer retrieved in list successfully.');

    // 6. RECORD A COLLECTION / PAYMENT
    console.log('\n--- 6. Collecting payment (updating EMI status)...');
    // Find the first payment EMI
    const firstPayment = await Payment.findOne({ customerId: testCustomer._id }).sort({ dueDate: 1 });
    assert.ok(firstPayment);
    assert.strictEqual(firstPayment.status, 'Pending');
    
    const paymentRes = await client.put(`/payments/${firstPayment._id}`, {
      receivedAmount: 1000,
      remarks: 'Paid in full - Integration Test'
    });
    
    assert.strictEqual(paymentRes.status, 200);
    assert.strictEqual(paymentRes.data.payment.status, 'Paid');
    assert.strictEqual(paymentRes.data.payment.receivedAmount, 1000);
    console.log('✅ Payment recorded successfully (status updated to Paid, receivedAmount = 1000).');

    // 7. GET DASHBOARD STATS (After Payment)
    console.log('\n--- 7. Checking updated Dashboard stats...');
    const statsRes2 = await client.get('/payments/dashboard/stats');
    assert.strictEqual(statsRes2.status, 200);
    assert.strictEqual(statsRes2.data.totalCustomers, 1);
    assert.strictEqual(statsRes2.data.totalAmountCollected, 1000);
    assert.strictEqual(statsRes2.data.pendingCollections, 14000); // 15000 - 1000
    console.log('✅ Updated stats verified (1 customer, 1000 collected, 14000 pending).');

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉');

  } catch (err) {
    console.error('\n❌ TEST FAILED:');
    if (err.response) {
      console.error('API Error Response:', err.response.status, err.response.data);
    } else {
      console.error(err);
    }
    process.exitCode = 1;
  } finally {
    // CLEAN UP DATABASE AFTER TEST
    console.log('\n🧹 Performing post-test database cleanup...');
    if (testCustomer) {
      await Customer.deleteOne({ _id: testCustomer._id });
      await Payment.deleteMany({ customerId: testCustomer._id });
    }
    if (testUser) {
      await User.deleteOne({ _id: testUser._id });
    }
    
    await mongoose.disconnect();
    console.log('🔌 Database disconnected.');
    console.log('🏁 Integration test complete.');
  }
}

runIntegrationTest();
