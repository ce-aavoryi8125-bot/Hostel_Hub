const mongoose = require('mongoose');

const tourRequestSchema = new mongoose.Schema({
  hostelId:   { type: String, required: true },
  hostelName: { type: String, required: true },
  name:       { type: String, required: true, trim: true },
  phone:      { type: String, required: true, trim: true },
  message:    { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('TourRequest', tourRequestSchema);
