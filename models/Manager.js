const mongoose = require('mongoose');

const managerSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  email:   { type: String, required: true, unique: true, trim: true, lowercase: true },
  phone:   { type: String, required: true, trim: true },
  password:{ type: String, required: true },
  role:    { type: String, default: 'manager' },
  bankDetails: {
    bankName:      { type: String, default: '' },
    accountName:   { type: String, default: '' },
    accountNumber: { type: String, default: '' }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true, transform(doc, ret) { ret.id = ret._id; delete ret.__v; } }
});

module.exports = mongoose.model('Manager', managerSchema);
