const express = require('express');
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/customer/:customerId', paymentController.getPaymentsByCustomer);
router.get('/history/:customerId', paymentController.getPaymentHistory);
router.get('/weekday/:day', paymentController.getPaymentsByWeekDay);
router.get('/pending/list', paymentController.getPendingPayments);
router.get('/overdue/list', paymentController.getOverduePayments);
router.get('/dashboard/stats', paymentController.getDashboardStats);
router.get('/dashboard/daily-report', paymentController.getDailyReport);
router.put('/:id', paymentController.updatePayment);

module.exports = router;
