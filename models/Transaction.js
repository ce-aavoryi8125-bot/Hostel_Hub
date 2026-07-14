const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  managerId:    { type: String, required: true },
  hostelId:     { type: String, default: null },
  hostelName:   { type: String, default: 'General Operation' },
  type:         { type: String, enum: ['income', 'expense'], required: true },
  amount:       { type: Number, required: true },
  category:     { type: String, required: true, trim: true },
  description:  { type: String, required: true, trim: true },
  studentName:  { type: String, default: '' },
  studentEmail: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
