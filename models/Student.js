const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, trim: true, lowercase: true },
  phone:     { type: String, required: true, trim: true },
  studentId: { type: String, required: true, trim: true },
  password:  { type: String, required: true },
  role:      { type: String, default: 'student' }
}, { 
  timestamps: true,
  toJSON: { virtuals: true, transform(doc, ret) { ret.id = ret._id; delete ret.__v; } }
});

module.exports = mongoose.model('Student', studentSchema);
