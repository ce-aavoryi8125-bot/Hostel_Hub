const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { error } = require('../utils/apiResponse');
const supabase = require('../config/supabase');

const router = express.Router();

// ─────────────────────────────────────────────
// LIST HOSTELS (with filters — only verified+published)
// ─────────────────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const searchInput    = String(req.query.search      || '').trim();
  const roomType       = String(req.query.roomType     || '').trim();
  const locationFilter = String(req.query.location     || '').trim();
  const maxPrice       = Number(req.query.maxPrice     || 999999);
  const genderPref     = String(req.query.gender       || '').trim();
  const maxDistance    = Number(req.query.maxDistance   || 999);
  const verifiedOnly   = req.query.verified === 'true';
  const showAll        = req.query.showAll  === 'true';

  let query = supabase
    .from('hostels')
    .select('*')
    .lte('price_per_year', maxPrice)
    .order('created_at', { ascending: false });

  if (locationFilter) {
    query = query.ilike('location', `%${locationFilter}%`);
  }
  if (searchInput) {
    query = query.or(
      `name.ilike.%${searchInput}%,location.ilike.%${searchInput}%,address.ilike.%${searchInput}%,description.ilike.%${searchInput}%`
    );
  }

  const { data: hostels, error: dbErr } = await query;
  if (dbErr) throw dbErr;

  let result = (hostels || []).map(normalizeHostel);

  if (!showAll) {
    result = result.filter(h => h.is_published !== false);
  }

  if (verifiedOnly) {
    result = result.filter(h => ['verified', 'featured', 'premium_partner'].includes(h.verificationStatus || h.verification_status));
  }

  if (genderPref) {
    result = result.filter(h => !h.genderPreference || h.genderPreference === 'Co-ed' || h.genderPreference === genderPref);
  }

  if (maxDistance < 99) {
    result = result.filter(h => Number(h.distanceKm || h.distance_km || 1.0) <= maxDistance);
  }

  if (roomType) {
    const formatted = roomType.toLowerCase().replace(/[^a-z0-9]/g, '');
    result = result.filter(h => {
      if (!h.roomTypes) return true;
      return Object.keys(h.roomTypes).some(k => k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(formatted));
    });
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

  if (dbErr) {
    if (dbErr.code === '22P02' || dbErr.message?.includes('invalid input syntax')) {
      return error(res, 'Hostel not found', 404);
    }
    throw dbErr;
  }
  if (!hostel) return error(res, 'Hostel not found', 404);

  return res.json({ hostel: normalizeHostel(hostel) });
}));

// ─────────────────────────────────────────────
// TOUR REQUEST
// ─────────────────────────────────────────────
router.post('/:id/tour-request', asyncHandler(async (req, res) => {
  const { data: hostel } = await supabase.from('hostels').select('id, name, manager_id').eq('id', req.params.id).maybeSingle();
  if (!hostel) return error(res, 'Hostel not found', 404);

  const { data: request, error: dbErr } = await supabase
    .from('tour_requests')
    .insert({
      hostel_id:      hostel.id,
      hostel_name:    hostel.name,
      manager_id:     hostel.manager_id || null,
      name:           String(req.body.name    || '').trim(),
      phone:          String(req.body.phone   || '').trim(),
      message:        String(req.body.message || '').trim(),
      special_notes:  String(req.body.specialNotes || req.body.message || '').trim(),
      student_id:     req.body.studentId || null,
      preferred_date: req.body.preferredDate || null,
      preferred_time: String(req.body.preferredTime || 'Morning (10:00 AM)').trim(),
      status:         'pending',
    })
    .select()
    .single();

  if (dbErr) {
    const isMissing = dbErr.message?.includes('column') || dbErr.message?.includes('does not exist') || dbErr.code === '42P01';
    if (isMissing) {
      const { data: basic, error: basicErr } = await supabase.from('tour_requests').insert({
        hostel_id: hostel.id, hostel_name: hostel.name,
        name: String(req.body.name || '').trim(), phone: String(req.body.phone || '').trim(),
        message: String(req.body.message || '').trim()
      }).select().single();
      if (basicErr) throw basicErr;
      return res.status(201).json({ message: 'Tour request sent successfully', request: basic });
    }
    throw dbErr;
  }

  // Create notification for manager & admin
  if (hostel.manager_id) {
    await supabase.from('notifications').insert({
      user_id: hostel.manager_id,
      title: 'New Physical Tour Request',
      message: `${req.body.name || 'A student'} requested a physical tour for ${hostel.name} on ${req.body.preferredDate || 'upcoming date'}.`,
      type: 'info',
      entity_type: 'tour_request',
      entity_id: request.id
    });
  }

  return res.status(201).json({ message: 'Physical tour request submitted successfully!', request });
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
  try { await supabase.from('visits').insert({ page: 'hostel-detail', user: `Visited ${current.name}` }); } catch {}

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
    id:                 h.id,
    pricePerYear:       h.price_per_year,
    mapsUrl:            h.maps_url,
    agentName:          h.agent_name,
    agentPhone:         h.agent_phone,
    agentEmail:         h.agent_email,
    managerId:          h.manager_id,
    managerName:        h.manager_name,
    managerPhone:       h.manager_phone,
    managerEmail:       h.manager_email,
    kitchenPhotos:      h.kitchen_photos || h.gallery_kitchen || [],
    roomTypes:          h.room_types || {},
    locationId:         h.location_id,
    verificationStatus: h.verification_status || 'verified',
    distanceKm:         h.distance_km || 1.2,
    genderPreference:   h.gender_preference || 'Co-ed',
    landmarks:          h.landmarks || [],
    facilities:         h.facilities || [],
    services:           h.services || [],
    // Categorized galleries
    galleryExterior:     h.gallery_exterior || [],
    galleryFrontView:   h.gallery_front_view || [],
    galleryCompound:     h.gallery_compound || [],
    galleryEntrance:     h.gallery_entrance || [],
    galleryRooms:        h.gallery_rooms || { '1_in_room': [], '2_in_room': [], '3_in_room': [], '4_in_room': [] },
    galleryKitchen:      h.gallery_kitchen || h.kitchen_photos || [],
    galleryWashroom:     h.gallery_washroom || [],
    galleryBathroom:     h.gallery_bathroom || [],
    galleryStudyRoom:    h.gallery_study_room || [],
    galleryReadingArea:  h.gallery_reading_area || [],
    galleryTvRoom:       h.gallery_tv_room || [],
    galleryCommonArea:   h.gallery_common_area || [],
    galleryDryingLine:   h.gallery_drying_line || [],
    galleryWaterStorage: h.gallery_water_storage || [],
    galleryGenerator:    h.gallery_generator || [],
    galleryParking:      h.gallery_parking || [],
    gallerySecurity:     h.gallery_security || [],
    createdAt:           h.created_at,
    updatedAt:           h.updated_at
  };
}

module.exports = router;
