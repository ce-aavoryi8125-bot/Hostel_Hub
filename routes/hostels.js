const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { success, error } = require('../utils/apiResponse');

const Hostel = require('../models/Hostel');
const TourRequest = require('../models/TourRequest');
const Visit = require('../models/Visit');
const Transaction = require('../models/Transaction');

const router = express.Router();

// Helper for escaping regex to prevent ReDoS
const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

// LIST HOSTELS (with filters)
router.get('/', asyncHandler(async (req, res) => {
  const searchInput    = String(req.query.search   || '').trim();
  const roomType       = String(req.query.roomType  || '').trim();
  const locationFilter = String(req.query.location  || '').trim();
  const maxPrice       = Number(req.query.maxPrice  || 15000);

  const query = { pricePerYear: { $lte: maxPrice } };
  
  if (locationFilter) {
    query.location = { $regex: new RegExp(`^${escapeRegex(locationFilter)}$`, 'i') };
  }
  
  if (searchInput) {
    const safeSearch = escapeRegex(searchInput);
    query.$or = [
      { name:        { $regex: safeSearch, $options: 'i' } },
      { location:    { $regex: safeSearch, $options: 'i' } },
      { address:     { $regex: safeSearch, $options: 'i' } },
      { description: { $regex: safeSearch, $options: 'i' } }
    ];
  }

  let hostels = await Hostel.find(query).sort({ createdAt: -1 }).lean();

  if (roomType) {
    hostels = hostels.filter(h => h.roomTypes && h.roomTypes[roomType]);
  }

  // Use raw json for backwards compatibility with existing frontend expectations
  return res.json({ hostels });
}));

// GET SINGLE HOSTEL
router.get('/:id', asyncHandler(async (req, res) => {
  const hostel = await Hostel.findById(req.params.id).lean();
  if (!hostel) return error(res, 'Hostel not found', 404);
  return res.json({ hostel }); // Backwards compat
}));

// TOUR REQUEST
router.post('/:id/tour-request', asyncHandler(async (req, res) => {
  const hostel = await Hostel.findById(req.params.id);
  if (!hostel) return error(res, 'Hostel not found', 404);

  const request = await TourRequest.create({
    hostelId:   hostel._id.toString(),
    hostelName: hostel.name,
    name:       String(req.body.name    || '').trim(),
    phone:      String(req.body.phone   || '').trim(),
    message:    String(req.body.message || '').trim()
  });

  return res.status(201).json({ message: 'Tour request sent successfully', request }); // Backwards compat
}));

// LOG HOSTEL VISIT
router.post('/:id/visit', asyncHandler(async (req, res) => {
  const hostel = await Hostel.findByIdAndUpdate(req.params.id, { $inc: { visits: 1 } }, { new: true });
  if (!hostel) return error(res, 'Hostel not found', 404);

  await Visit.create({ page: 'hostel-detail', user: `Visited ${hostel.name}` });
  return res.json({ message: 'Visit recorded', visits: hostel.visits });
}));

// PAY / BOOK ROOM
router.post('/:id/pay', authenticateToken, asyncHandler(async (req, res) => {
  const hostel = await Hostel.findById(req.params.id);
  if (!hostel) return error(res, 'Hostel not found', 404);

  const { roomType, price } = req.body;
  if (!roomType || !price) return error(res, 'Room type and price are required', 400);

  const tx = await Transaction.create({
    managerId:    hostel.managerId || '',
    hostelId:     hostel._id.toString(),
    hostelName:   hostel.name,
    type:         'income',
    amount:       Number(price),
    category:     'Rent Payment',
    description:  `${roomType} rent paid via Hostel Hub`,
    studentName:  req.user.name  || 'Anonymous Student',
    studentEmail: req.user.email || 'student@umat.edu.gh'
  });

  return res.status(201).json({ message: `Payment of GHS ${price} processed successfully!`, transaction: tx });
}));

module.exports = router;
