const express = require('express');
const bcrypt = require('bcryptjs');
const { createAuthToken, authenticateToken, requireAdmin, requireManagerOrAdmin } = require('../middleware/auth');
const { upload, uploadHostel } = require('../middleware/upload');
const { asyncHandler } = require('../middleware/errorHandler');
const { error } = require('../utils/apiResponse');
const supabase = require('../config/supabase');

const router = express.Router();

// ─────────────────────────────────────────────
// ADMIN LOGIN
// ─────────────────────────────────────────────
router.post('/login', asyncHandler(async (req, res) => {
  const { email = '', password = '' } = req.body;
  const { data: admin } = await supabase
    .from('admins').select('*').eq('email', String(email).trim().toLowerCase()).maybeSingle();
  if (!admin) return error(res, 'Invalid admin credentials', 401);
  const ok = await bcrypt.compare(password, admin.password);
  if (!ok) return error(res, 'Invalid admin credentials', 401);
  const token = createAuthToken(admin.id, { role: 'admin', name: admin.name });
  return res.json({ message: 'Admin login successful', token, admin: { id: admin.id, name: admin.name, email: admin.email } });
}));

// ─────────────────────────────────────────────
// ADMIN STATS
// ─────────────────────────────────────────────
router.get('/stats', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const [
    { count: totalHostels }, { count: totalStudents }, { count: totalManagers },
    { count: totalTourRequests }, { count: totalVisits }, { data: hostels }
  ] = await Promise.all([
    supabase.from('hostels').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('managers').select('*', { count: 'exact', head: true }),
    supabase.from('tour_requests').select('*', { count: 'exact', head: true }),
    supabase.from('visits').select('*', { count: 'exact', head: true }),
    supabase.from('hostels').select('price_per_year')
  ]);
  const averagePrice = hostels?.length
    ? (hostels.reduce((sum, h) => sum + (h.price_per_year || 0), 0) / hostels.length).toFixed(2) : 0;
  return res.json({ stats: { totalHostels, totalStudents, totalManagers, totalTourRequests, totalVisits, averagePrice } });
}));

// ─────────────────────────────────────────────
// ADMIN: LIST ALL HOSTELS
// ─────────────────────────────────────────────
router.get('/hostels', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { data: hostels, error: dbErr } = await supabase.from('hostels').select('*').order('created_at', { ascending: false });
  if (dbErr) throw dbErr;
  return res.json({ hostels: hostels || [] });
}));

// ─────────────────────────────────────────────
// ADMIN: GET VISITS
// ─────────────────────────────────────────────
router.get('/visits', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { data: visits, error: dbErr } = await supabase.from('visits').select('*').order('timestamp', { ascending: false }).limit(200);
  if (dbErr) throw dbErr;
  return res.json({ visits: visits || [] });
}));

// ─────────────────────────────────────────────
// ADD NEW HOSTEL — full wizard (Manager or Admin)
// Accepts any named file fields via uploadHostel.any()
// Field naming convention:
//   photos_exterior[], photos_compound[], photos_reception[],
//   photos_study[], photos_lounge[], photos_kitchen[],
//   photos_washroom[], photos_laundry[], photos_parking[],
//   photos_water[], photos_security[], photos_other[],
//   room_photos_<roomKey>[]   (e.g. room_photos_1-in-a-room[])
// ─────────────────────────────────────────────
router.post('/hostels', authenticateToken, requireManagerOrAdmin, uploadHostel.any(), asyncHandler(async (req, res) => {
  const files = req.files || [];

  // Helper: collect uploaded files for a given field prefix → /uploads/paths
  const collect = (prefix) =>
    files.filter(f => f.fieldname === prefix || f.fieldname === `${prefix}[]`)
         .map(f => `/uploads/${f.filename}`);

  // ── Manager info ──
  let managerId = null, managerName = '', managerPhone = '', managerEmail = '';
  if (req.user.role === 'manager') {
    const { data: mgr } = await supabase.from('managers').select('*').eq('id', req.user.sub).maybeSingle();
    if (mgr) { managerId = mgr.id; managerName = mgr.name; managerPhone = mgr.phone || ''; managerEmail = mgr.email; }
  }

  // ── Room types ──
  let roomTypes = {};
  try {
    roomTypes = typeof req.body.roomTypes === 'string' ? JSON.parse(req.body.roomTypes) : (req.body.roomTypes || {});
  } catch { roomTypes = {}; }

  // Attach uploaded per-room photos to each room type
  Object.keys(roomTypes).forEach(roomKey => {
    const fieldName = `room_photos_${roomKey}`;
    const roomPhotos = collect(fieldName);
    if (roomPhotos.length) {
      roomTypes[roomKey].gallery = [...(roomTypes[roomKey].gallery || []), ...roomPhotos];
    }
    // Ensure gallery exists
    if (!roomTypes[roomKey].gallery) roomTypes[roomKey].gallery = [];
  });

  // ── Gallery sections ──
  const GALLERY_SECTIONS = ['exterior', 'reception', 'compound', 'study', 'lounge', 'kitchen', 'washroom', 'laundry', 'parking', 'water', 'security', 'other'];
  const gallery = {};
  GALLERY_SECTIONS.forEach(section => {
    const uploaded = collect(`photos_${section}`);
    if (uploaded.length) gallery[section] = uploaded;
  });

  // Legacy fallback: if old 'photos' field used, put in exterior
  const legacyPhotos = collect('photos');
  if (legacyPhotos.length && !gallery.exterior) gallery.exterior = legacyPhotos;

  // ── Cover photos (first exterior image, else first any image) ──
  const allUploaded = files.map(f => `/uploads/${f.filename}`);
  const coverPhotos = gallery.exterior?.length ? gallery.exterior
    : allUploaded.length ? allUploaded
    : ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'];

  const kitchenPhotos = gallery.kitchen?.length ? gallery.kitchen
    : ['https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=900&q=80'];

  // ── Facilities ──
  let facilities = [];
  try {
    const raw = req.body.facilities || '';
    facilities = typeof raw === 'string'
      ? raw.split(',').map(i => i.trim()).filter(Boolean)
      : (Array.isArray(raw) ? raw : []);
  } catch { facilities = []; }

  // ── Build base price ──
  // Use minimum room price if pricePerYear not set
  const roomPrices = Object.values(roomTypes).map(r => Number(r.price || 0)).filter(p => p > 0);
  const basePrice  = Number(req.body.pricePerYear || req.body.pricePerMonth || (roomPrices.length ? Math.min(...roomPrices) : 0));

  const { data: hostel, error: dbErr } = await supabase
    .from('hostels')
    .insert({
      name:           String(req.body.name        || '').trim(),
      location:       String(req.body.location    || '').trim(),
      address:        String(req.body.address     || '').trim(),
      price_per_year: basePrice,
      rating:         Number(req.body.rating      || 4.5),
      maps_url:       String(req.body.mapsUrl     || '').trim(),
      facilities,
      agent_name:     String(req.body.agentName   || '').trim() || managerName,
      agent_phone:    String(req.body.agentPhone  || '').trim() || managerPhone,
      agent_email:    String(req.body.agentEmail  || '').trim() || managerEmail,
      manager_id:     managerId,
      manager_name:   managerName,
      manager_phone:  managerPhone,
      manager_email:  managerEmail,
      description:    String(req.body.description || '').trim(),
      photos:         coverPhotos,
      kitchen_photos: kitchenPhotos,
      room_types:     roomTypes,
      gallery:        gallery,
    })
    .select()
    .single();

  if (dbErr) throw dbErr;
  return res.status(201).json({ message: 'Hostel listing created', hostel });
}));

module.exports = router;
