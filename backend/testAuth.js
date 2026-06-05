const mongoose = require('mongoose');
const User = require('./models/User');
const axios = require('axios');
require('dotenv').config();

async function testForgotPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    // Find any user to test
    const user = await User.findOne({});
    if (!user) {
      console.log('No users found in database to test with.');
      process.exit(1);
    }
    
    console.log(`Testing with user: ${user.email} (Phone: ${user.phone})`);

    // 1. Request OTP
    console.log('1. Requesting OTP...');
    const requestRes = await axios.post('http://localhost:5000/api/auth/forgot-password', {
      identifier: user.phone
    });
    
    console.log('Response:', requestRes.data);
    const otp = requestRes.data.simulatedOTP;

    if (!otp) {
      console.log('Failed to generate OTP in response.');
      process.exit(1);
    }

    // 2. Reset Password
    console.log(`2. Resetting password with OTP: ${otp}...`);
    const resetRes = await axios.post('http://localhost:5000/api/auth/reset-password', {
      identifier: user.phone,
      otp: otp,
      newPassword: 'NewSecurePassword123!'
    });

    console.log('Response:', resetRes.data);
    console.log('Forgot Password flow works perfectly!');
    
  } catch (err) {
    console.error('Error during test:', err.response?.data || err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testForgotPassword();
