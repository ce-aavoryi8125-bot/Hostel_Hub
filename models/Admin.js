const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role:     { type: String, default: 'admin' }
}, { 
  timestamps: true,
  toJSON: { virtuals: true, transform(doc, ret) { ret.id = ret._id; delete ret.__v; } }
});

module.exports = mongoose.model('Admin', adminSchema);
