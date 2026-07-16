const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { error } = require('../utils/apiResponse');
const supabase = require('../config/supabase');

const router = express.Router();

// ─────────────────────────────────────────────
// LIST HOSTELS (with filters)
// ─────────────────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const searchInput    = String(req.query.search   || '').trim();
  const roomType       = String(req.query.roomType  || '').trim();
  const locationFilter = String(req.query.location  || '').trim();
  const maxPrice       = Number(req.query.maxPrice  || 15000);

  let query = supabase
    .from('hostels')
    .select('*')
    .lte('price_per_year', maxPrice)
    .order('created_at', { ascending: false });

  if (locationFilter) {
    query = query.ilike('location', locationFilter);
  }

  if (searchInput) {
    query = query.or(
      `name.ilike.%${searchInput}%,location.ilike.%${searchInput}%,address.ilike.%${searchInput}%,description.ilike.%${searchInput}%`
    );
  }

  const { data: hostels, error: dbErr } = await query;
  if (dbErr) throw dbErr;

  // Normalize fields and filter by roomType in JS (JSONB key filter)
  let result = (hostels || []).map(normalizeHostel);

  if (roomType) {
    result = result.filter(h => h.roomTypes && h.roomTypes[roomType]);
  }

  return res.json({ hostels: result });
}));

// ─────────────────────────────────────────────
// GET SINGLE HOSTEL
// ─────────────────────────────────────────────
router.get('/:id', asyncHandler(async (req, res) => {
  const { data: hostel, error: dbErr } = await supabase
    .from('hostels')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle();

  if (dbErr) throw dbErr;
  if (!hostel) return error(res, 'Hostel not found', 404);

  return res.json({ hostel: normalizeHostel(hostel) });
}));

// ─────────────────────────────────────────────
// TOUR REQUEST
// ─────────────────────────────────────────────
router.post('/:id/tour-request', asyncHandler(async (req, res) => {
  const { data: hostel } = await supabase.from('hostels').select('id, name').eq('id', req.params.id).maybeSingle();
  if (!hostel) return error(res, 'Hostel not found', 404);

  const { data: request, error: dbErr } = await supabase
    .from('tour_requests')
    .insert({
      hostel_id:   hostel.id,
      hostel_name: hostel.name,
      name:        String(req.body.name    || '').trim(),
      phone:       String(req.body.phone   || '').trim(),
      message:     String(req.body.message || '').trim()
    })
    .select()
    .single();

  if (dbErr) throw dbErr;
  return res.status(201).json({ message: 'Tour request sent successfully', request });
}));

// ─────────────────────────────────────────────
// LOG HOSTEL VISIT
// ─────────────────────────────────────────────
router.post('/:id/visit', asyncHandler(async (req, res) => {
  const { data: current } = await supabase
    .from('hostels')
    .select('id, name, visits')
    .eq('id', req.params.id)
    .maybeSingle();

  if (!current) return error(res, 'Hostel not found', 404);

  const newVisits = (current.visits || 0) + 1;
  await supabase.from('hostels').update({ visits: newVisits }).eq('id', req.params.id);
  await supabase.from('visits').insert({ page: 'hostel-detail', user: `Visited ${current.name}` });

  return res.json({ message: 'Visit recorded', visits: newVisits });
}));

// ─────────────────────────────────────────────
// PAY / BOOK ROOM
// ─────────────────────────────────────────────
router.post('/:id/pay', authenticateToken, asyncHandler(async (req, res) => {
  const { data: hostel } = await supabase.from('hostels').select('*').eq('id', req.params.id).maybeSingle();
  if (!hostel) return error(res, 'Hostel not found', 404);

  const { roomType, price } = req.body;
  if (!roomType || !price) return error(res, 'Room type and price are required', 400);

  const { data: tx, error: dbErr } = await supabase
    .from('transactions')
    .insert({
      manager_id:    hostel.manager_id || null,
      hostel_id:     hostel.id,
      hostel_name:   hostel.name,
      type:          'income',
      amount:        Number(price),
      category:      'Rent Payment',
      description:   `${roomType} rent paid via Hostel Hub`,
      student_name:  req.user.name  || 'Anonymous Student',
      student_email: req.user.email || 'student@umat.edu.gh'
    })
    .select()
    .single();

  if (dbErr) throw dbErr;
  return res.status(201).json({ message: `Payment of GHS ${price} processed successfully!`, transaction: tx });
}));

// ─────────────────────────────────────────────
// Helper: normalize DB row to frontend shape
// ─────────────────────────────────────────────
function normalizeHostel(h) {
  return {
    ...h,
    id:           h.id,
    pricePerYear: h.price_per_year,
    mapsUrl:      h.maps_url,
    agentName:    h.agent_name,
    agentPhone:   h.agent_phone,
    agentEmail:   h.agent_email,
    managerId:    h.manager_id,
    managerName:  h.manager_name,
    managerPhone: h.manager_phone,
    managerEmail: h.manager_email,
    kitchenPhotos: h.kitchen_photos,
    roomTypes:    h.room_types,
    locationId:   h.location_id,
    createdAt:    h.created_at,
    updatedAt:    h.updated_at
  };
}

module.exports = router;
