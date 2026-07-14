const express = require('express');
const bcrypt = require('bcryptjs');
const { createAuthToken, authenticateToken, requireAdmin, requireManagerOrAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { asyncHandler } = require('../middleware/errorHandler');
const { success, error } = require('../utils/apiResponse');

const Admin = require('../models/Admin');
const Manager = require('../models/Manager');
const Hostel = require('../models/Hostel');
const Student = require('../models/Student');
const TourRequest = require('../models/TourRequest');
const Visit = require('../models/Visit');

const router = express.Router();

// ADMIN LOGIN
router.post('/login', asyncHandler(async (req, res) => {
  const { email = '', password = '' } = req.body;
  const admin = await Admin.findOne({ email: String(email).trim().toLowerCase() });
  if (!admin) return error(res, 'Invalid admin credentials', 401);

  const ok = await bcrypt.compare(password, admin.password);
  if (!ok) return error(res, 'Invalid admin credentials', 401);

  const token = createAuthToken(admin._id.toString(), { role: 'admin', name: admin.name });
  return res.json({ message: 'Admin login successful', token, admin: { id: admin._id, name: admin.name, email: admin.email } });
}));

// ADMIN STATS
router.get('/stats', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const [totalHostels, totalStudents, totalManagers, totalTourRequests, totalVisits, hostels] = await Promise.all([
    Hostel.countDocuments(),
    Student.countDocuments(),
    Manager.countDocuments(),
    TourRequest.countDocuments(),
    Visit.countDocuments(),
    Hostel.find({}, 'pricePerYear')
  ]);

  const averagePrice = hostels.length
    ? (hostels.reduce((sum, h) => sum + (h.pricePerYear || 0), 0) / hostels.length).toFixed(2)
    : 0;

  return res.json({ stats: { totalHostels, totalStudents, totalManagers, totalTourRequests, totalVisits, averagePrice } });
}));

// ADMIN: LIST ALL HOSTELS
router.get('/hostels', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const hostels = await Hostel.find().sort({ createdAt: -1 });
  return res.json({ hostels });
}));

// ADMIN: GET VISITS
router.get('/visits', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const visits = await Visit.find().sort({ timestamp: -1 }).limit(200);
  return res.json({ visits });
}));

// ADD NEW HOSTEL (Manager or Admin)
router.post('/hostels', authenticateToken, requireManagerOrAdmin, upload.array('photos', 12), asyncHandler(async (req, res) => {
  const submittedRoomTypes = typeof req.body.roomTypes === 'string' ? JSON.parse(req.body.roomTypes) : (req.body.roomTypes || {});
  const photos = (req.files || []).map(file => `/uploads/${file.filename}`);

  let managerId    = '';
  let managerName  = '';
  let managerPhone = '';
  let managerEmail = '';

  if (req.user.role === 'manager') {
    const mgr = await Manager.findById(req.user.sub);
    if (mgr) {
      managerId    = mgr._id.toString();
      managerName  = mgr.name;
      managerPhone = mgr.phone  || '';
      managerEmail = mgr.email;
    }
  }

  let kitchenPhotos = [];
  if (req.body.kitchenPhotos) {
    kitchenPhotos = typeof req.body.kitchenPhotos === 'string'
      ? req.body.kitchenPhotos.split(',').map(i => i.trim()).filter(Boolean)
      : req.body.kitchenPhotos;
  }
  if (!kitchenPhotos.length) {
    kitchenPhotos = ['https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=900&q=80'];
  }

  const hostel = await Hostel.create({
    name:         String(req.body.name         || '').trim(),
    location:     String(req.body.location     || '').trim(),
    address:      String(req.body.address      || '').trim(),
    pricePerYear: Number(req.body.pricePerYear || req.body.pricePerMonth || 0),
    rating:       Number(req.body.rating       || 4.5),
    mapsUrl:      String(req.body.mapsUrl      || '').trim(),
    facilities:   String(req.body.facilities   || '').split(',').map(i => i.trim()).filter(Boolean),
    agentName:    String(req.body.agentName    || '').trim() || managerName,
    agentPhone:   String(req.body.agentPhone   || '').trim() || managerPhone,
    agentEmail:   String(req.body.agentEmail   || '').trim() || managerEmail,
    managerId,
    managerName,
    managerPhone,
    managerEmail,
    description:  String(req.body.description  || '').trim(),
    photos:       photos.length ? photos : ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'],
    roomTypes:    submittedRoomTypes,
    kitchenPhotos
  });

  return res.status(201).json({ message: 'Hostel listing created', hostel });
}));

module.exports = router;
