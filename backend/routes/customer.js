const express = require('express');
const customerController = require('../controllers/customerController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.post('/add', customerController.addCustomer);
router.get('/', customerController.getAllCustomers);
router.get('/search', customerController.searchCustomers);
router.get('/weekday/:day', customerController.getCustomersByWeekDay);
router.get('/:id', customerController.getCustomerById);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
