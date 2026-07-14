const mongoose = require('mongoose');

const roomTypeSchema = new mongoose.Schema({
  price:   { type: Number, default: 0 },
  gallery: [{ type: String }]
}, { _id: false });

const hostelSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  location:     { type: String, required: true, trim: true },
  address:      { type: String, trim: true },
  pricePerYear: { type: Number, default: 0 },
  rating:       { type: Number, default: 4.5 },
  mapsUrl:      { type: String, default: '' },
  facilities:   [{ type: String }],
  agentName:    { type: String, default: '' },
  agentPhone:   { type: String, default: '' },
  agentEmail:   { type: String, default: '' },
  managerId:    { type: String, default: '' },
  managerName:  { type: String, default: '' },
  managerPhone: { type: String, default: '' },
  managerEmail: { type: String, default: '' },
  description:  { type: String, default: '' },
  photos:       [{ type: String }],
  kitchenPhotos:[{ type: String }],
  roomTypes:    {
    '1-in-a-room': { type: roomTypeSchema, default: null },
    '2-in-a-room': { type: roomTypeSchema, default: null },
    '3-in-a-room': { type: roomTypeSchema, default: null },
    '4-in-a-room': { type: roomTypeSchema, default: null }
  },
  visits:       { type: Number, default: 0 }
}, { 
  timestamps: true,
  toJSON: { virtuals: true, transform(doc, ret) { ret.id = ret._id; delete ret.__v; } }
});

module.exports = mongoose.model('Hostel', hostelSchema);
