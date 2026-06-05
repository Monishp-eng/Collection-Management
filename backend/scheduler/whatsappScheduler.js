const cron = require('node-cron');
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const { sendMessage, provider } = require('../services/whatsappService');
require('dotenv').config();

const enabled = (process.env.ENABLE_WHATSAPP_SCHEDULER || 'false') === 'true';
const schedule = process.env.WHATSAPP_CRON || '0 8 * * *'; // default: every day at 08:00

const sendReminder = async (to, message) => {
  try {
    if (!provider || provider === 'none') return;
    console.log(`Sending WhatsApp to ${to}: ${message}`);
    if (process.env.WHATSAPP_DRY_RUN === 'true') {
      console.log('DRY RUN enabled; not sending');
      return;
    }
    await sendMessage(to, message);
  } catch (err) {
    console.error('WhatsApp send failed', err.message || err);
  }
};

const runJob = async () => {
  console.log('WhatsApp scheduler running job');
  // connect if needed
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI);
  }

  const now = new Date();
  // 1. Reminders for tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0,0,0,0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(23,59,59,999);

  const dueTomorrow = await Payment.find({
    dueDate: { $gte: tomorrow, $lte: tomorrowEnd },
    userId: { $exists: true }
  }).populate('customerId').lean();

  for (const p of dueTomorrow) {
    const phone = p.customerId?.phone || p.customerPhone || null;
    if (!phone) continue;
    const msg = `Reminder: Your EMI of ₹${p.emiAmount} is due tomorrow.`;
    await sendReminder(phone, msg);
  }

  // 2. Due today
  const start = new Date(now);
  start.setHours(0,0,0,0);
  const end = new Date(start);
  end.setHours(23,59,59,999);

  const dueToday = await Payment.find({ dueDate: { $gte: start, $lte: end } }).populate('customerId').lean();
  for (const p of dueToday) {
    const phone = p.customerId?.phone || p.customerPhone || null;
    if (!phone) continue;
    const msg = `Your EMI payment of ₹${p.emiAmount} is due today.`;
    await sendReminder(phone, msg);
  }

  // 3. Overdue messages (payments older than 3 days)
  const overdueThreshold = new Date(now);
  overdueThreshold.setDate(overdueThreshold.getDate() - 3);

  const overdueList = await Payment.find({ dueDate: { $lt: overdueThreshold }, status: { $in: ['Pending','Partial'] } }).populate('customerId').lean();
  for (const p of overdueList) {
    const phone = p.customerId?.phone || p.customerPhone || null;
    if (!phone) continue;
    const daysOver = Math.floor((now - new Date(p.dueDate)) / (1000 * 60 * 60 * 24));
    const pending = (p.emiAmount || 0) - (p.receivedAmount || 0);
    const msg = `Your EMI is overdue by ${daysOver} days. Pending amount ₹${pending}.`;
    await sendReminder(phone, msg);
  }
};

let task = null;

const start = () => {
  if (!enabled) {
    console.log('WhatsApp scheduler not enabled. To enable set ENABLE_WHATSAPP_SCHEDULER=true');
    return;
  }
  console.log('Starting WhatsApp scheduler with schedule:', schedule);
  task = cron.schedule(schedule, () => {
    runJob().catch(err => console.error('Scheduler job error', err));
  }, { timezone: process.env.WHATSAPP_TIMEZONE || 'UTC' });
};

const stop = () => {
  if (task) task.stop();
};

module.exports = { start, stop, runJob };
