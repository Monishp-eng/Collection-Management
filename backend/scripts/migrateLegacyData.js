#!/usr/bin/env node

const mongoose = require('mongoose');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
require('dotenv').config();

async function migrateLegacyData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    let legacyUser = await User.findOne({ email: 'admin@finance.local' });
    if (!legacyUser) {
      legacyUser = await User.create({
        fullName: 'Legacy Account',
        email: 'admin@finance.local',
        phone: '9999999999',
        password: 'Admin@1234',
        role: 'admin'
      });
    }

    await Customer.updateMany(
      { userId: { $exists: false } },
      { $set: { userId: legacyUser._id } }
    );

    await Payment.updateMany(
      { userId: { $exists: false } },
      { $set: { userId: legacyUser._id } }
    );

    console.log('Legacy records assigned to the default account.');
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

migrateLegacyData();