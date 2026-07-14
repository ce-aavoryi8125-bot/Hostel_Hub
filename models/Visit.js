const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  page:      { type: String, default: 'student' },
  user:      { type: String, default: 'Anonymous Student' },
  timestamp: { type: Date, default: Date.now }
}, { 
  timestamps: false,
  toJSON: { virtuals: true, transform(doc, ret) { ret.id = ret._id; delete ret.__v; } }
});

module.exports = mongoose.model('Visit', visitSchema);
