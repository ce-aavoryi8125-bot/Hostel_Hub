const express = require('express');
const bcrypt = require('bcryptjs');
const { createAuthToken, authenticateToken, requireAdmin, requireManagerOrAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
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
    .from('admins')
    .select('*')
    .eq('email', String(email).trim().toLowerCase())
    .maybeSingle();

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
    { count: totalHostels },
    { count: totalStudents },
    { count: totalManagers },
    { count: totalTourRequests },
    { count: totalVisits },
    { data: hostels }
  ] = await Promise.all([
    supabase.from('hostels').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('managers').select('*', { count: 'exact', head: true }),
    supabase.from('tour_requests').select('*', { count: 'exact', head: true }),
    supabase.from('visits').select('*', { count: 'exact', head: true }),
    supabase.from('hostels').select('price_per_year')
  ]);

  const averagePrice = hostels && hostels.length
    ? (hostels.reduce((sum, h) => sum + (h.price_per_year || 0), 0) / hostels.length).toFixed(2)
    : 0;

  return res.json({ stats: { totalHostels, totalStudents, totalManagers, totalTourRequests, totalVisits, averagePrice } });
}));

// ─────────────────────────────────────────────
// ADMIN: LIST ALL HOSTELS
// ─────────────────────────────────────────────
router.get('/hostels', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { data: hostels, error: dbErr } = await supabase
    .from('hostels')
    .select('*')
    .order('created_at', { ascending: false });

  if (dbErr) throw dbErr;
  return res.json({ hostels: hostels || [] });
}));

// ─────────────────────────────────────────────
// ADMIN: GET VISITS
// ─────────────────────────────────────────────
router.get('/visits', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { data: visits, error: dbErr } = await supabase
    .from('visits')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(200);

  if (dbErr) throw dbErr;
  return res.json({ visits: visits || [] });
}));

// ─────────────────────────────────────────────
// ADD NEW HOSTEL (Manager or Admin)
// ─────────────────────────────────────────────
router.post('/hostels', authenticateToken, requireManagerOrAdmin, upload.array('photos', 12), asyncHandler(async (req, res) => {
  const submittedRoomTypes = typeof req.body.roomTypes === 'string'
    ? JSON.parse(req.body.roomTypes)
    : (req.body.roomTypes || {});

  const photos = (req.files || []).map(file => `/uploads/${file.filename}`);

  let managerId    = null;
  let managerName  = '';
  let managerPhone = '';
  let managerEmail = '';

  if (req.user.role === 'manager') {
    const { data: mgr } = await supabase.from('managers').select('*').eq('id', req.user.sub).maybeSingle();
    if (mgr) {
      managerId    = mgr.id;
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

  const { data: hostel, error: dbErr } = await supabase
    .from('hostels')
    .insert({
      name:          String(req.body.name         || '').trim(),
      location:      String(req.body.location     || '').trim(),
      address:       String(req.body.address      || '').trim(),
      price_per_year: Number(req.body.pricePerYear || req.body.pricePerMonth || 0),
      rating:        Number(req.body.rating        || 4.5),
      maps_url:      String(req.body.mapsUrl       || '').trim(),
      facilities:    String(req.body.facilities    || '').split(',').map(i => i.trim()).filter(Boolean),
      agent_name:    String(req.body.agentName     || '').trim() || managerName,
      agent_phone:   String(req.body.agentPhone    || '').trim() || managerPhone,
      agent_email:   String(req.body.agentEmail    || '').trim() || managerEmail,
      manager_id:    managerId,
      manager_name:  managerName,
      manager_phone: managerPhone,
      manager_email: managerEmail,
      description:   String(req.body.description  || '').trim(),
      photos:        photos.length ? photos : ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'],
      room_types:    submittedRoomTypes,
      kitchen_photos: kitchenPhotos
    })
    .select()
    .single();

  if (dbErr) throw dbErr;
  return res.status(201).json({ message: 'Hostel listing created', hostel });
}));

module.exports = router;
