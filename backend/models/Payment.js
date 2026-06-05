const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  weekNumber: {
    type: Number,
    required: true
  },
  weekDay: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  emiAmount: {
    type: Number,
    required: true
  },
  receivedAmount: {
    type: Number,
    default: 0
  },
  receivedDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Partial'],
    default: 'Pending'
  },
  remarks: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

paymentSchema.index({ customerId: 1, weekNumber: 1 });
paymentSchema.index({ weekDay: 1, dueDate: 1 });
paymentSchema.index({ status: 1, dueDate: 1 });
paymentSchema.index({ receivedDate: 1 });
paymentSchema.index({ userId: 1, status: 1, dueDate: 1 });
paymentSchema.index({ userId: 1, weekDay: 1, dueDate: 1 });
paymentSchema.index({ userId: 1, receivedAmount: 1 }); // Speeds up getDashboardStats aggregation

module.exports = mongoose.model('Payment', paymentSchema);
