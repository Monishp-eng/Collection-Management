#!/usr/bin/env node

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createDefaultUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const existingUser = await User.findOne({ email: 'admin@finance.local' });
    if (existingUser) {
      console.log('⚠️  Default user already exists');
      return;
    }

    const user = new User({
      fullName: 'Administrator',
      email: 'admin@finance.local',
      phone: '9999999999',
      password: 'Admin@1234',
      role: 'admin'
    });

    await user.save();
    console.log('✅ Default user created successfully');
    console.log('📝 Email: admin@finance.local');
    console.log('🔐 Password: Admin@1234');
    console.log('⚠️  Please change password after first login for security');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

createDefaultUser();
