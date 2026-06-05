const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  wifeCaretaker: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    match: /^\d{10}$/
  },
  address: {
    type: String,
    required: true
  },
  amountGiven: {
    type: Number,
    required: true
  },
  dateGiven: {
    type: Date,
    required: true
  },
  collectionWeekDay: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  weeklyEMI: {
    type: Number,
    required: true
  },
  totalWeeks: {
    type: Number,
    required: true,
    default: 15
  },
  loanStatus: {
    type: String,
    enum: ['Active', 'Completed', 'Closed'],
    default: 'Active'
  },
  totalPaid: {
    type: Number,
    default: 0
  },
  remainingBalance: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

customerSchema.index({ userId: 1, phone: 1 }, { unique: true });
customerSchema.index({ collectionWeekDay: 1 });
customerSchema.index({ loanStatus: 1 });
customerSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Customer', customerSchema);
