const cron = require('node-cron');

const schedule = process.env.DAILY_REPORT_CRON || '0 21 * * *';

function start() {
  if (process.env.ENABLE_DAILY_REPORT_SCHEDULER !== 'true') {
    return;
  }

  cron.schedule(schedule, async () => {
    console.log('Daily report scheduler triggered.');
    // Future implementation: iterate active users, generate daily reports using reportService,
    // and persist or deliver them automatically.
  }, {
    scheduled: true,
    timezone: process.env.TIMEZONE || 'Asia/Kolkata'
  });
}

module.exports = { start };
