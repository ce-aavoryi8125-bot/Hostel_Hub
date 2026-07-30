const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const supabase = require('../config/supabase');

const router = express.Router();

function enrichLocation(loc, hostels = []) {
  const name = loc.name || '';

  let distanceKm = Number(loc.distance_km || loc.distanceKm || 0);
  if (!distanceKm || distanceKm === 0) {
    if (name.includes('Main Gate') || name.includes('Campus')) distanceKm = 0.2;
    else if (name === 'Banso') distanceKm = 0.5;
    else if (name === 'Cyanide' || name === 'Cyanide Park') distanceKm = 0.8;
    else if (name === 'Bankyim' || name === 'Akyempim') distanceKm = 1.2;
    else if (name === 'Akoon') distanceKm = 1.5;
    else if (name === 'New Atuabo' || name === 'Nkamponase') distanceKm = 2.1;
    else if (name.includes('Station') || name.includes('Zongo') || name.includes('Brahabebome')) distanceKm = 2.8;
    else if (name === 'Nsuaem' || name === 'Nsuaem Road') distanceKm = 3.5;
    else if (name === 'Tamso' || name === 'Tarkwa Mine') distanceKm = 4.2;
    else if (name === 'Mile 7' || name === 'Aboso') distanceKm = 5.0;
    else distanceKm = 2.5;
  }

  const estimatedWalkingMins = Math.round(distanceKm * 12);
  const estimatedDrivingMins = Math.max(2, Math.round(distanceKm * 2.5));
  const avgTransportFareGhs = distanceKm <= 1 ? 0 : Math.round(distanceKm * 2.5);

  let nearbyLandmark = loc.nearby_landmark || loc.nearbyLandmark || '';
  if (!nearbyLandmark) {
    if (name.includes('Campus') || name === 'Banso') nearbyLandmark = 'UMaT Main Gate & Library';
    else if (name === 'Cyanide') nearbyLandmark = 'Cyanide Junction & Engineering Blocks';
    else if (name === 'Bankyim') nearbyLandmark = 'Bankyim Police Post';
    else if (name === 'Akoon') nearbyLandmark = 'Akoon Shaft & Mines Campus';
    else if (name === 'New Atuabo') nearbyLandmark = 'Atuabo Hospital Junction';
    else if (name.includes('Station')) nearbyLandmark = 'Tarkwa Main Lorry Park';
    else if (name === 'Tamso') nearbyLandmark = 'Tamso Estate Junction';
    else if (name === 'Nkamponase') nearbyLandmark = 'Nkamponase Community Center';
    else if (name === 'TNA Park') nearbyLandmark = 'Medeama SC Stadium';
    else nearbyLandmark = `${name} Junction`;
  }

  const matchedHostels = hostels.filter(h =>
    (h.location || '').toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes((h.location || '').toLowerCase())
  );
  const hostelCount = matchedHostels.length;
  const prices = matchedHostels.map(h => Number(h.price_per_year || h.pricePerYear || 0)).filter(p => p > 0);
  const avgPriceGhs = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;

  return {
    ...loc,
    id: loc.id,
    name: loc.name,
    category: loc.category || 'Community',
    description: loc.description || '',
    nearbyLandmark,
    nearby_landmark: nearbyLandmark,
    distanceKm,
    distance_km: distanceKm,
    estimatedWalkingMins,
    estimated_walking_mins: estimatedWalkingMins,
    estimatedDrivingMins,
    estimated_driving_mins: estimatedDrivingMins,
    avgTransportFareGhs,
    avg_transport_fare_ghs: avgTransportFareGhs,
    latitude: Number(loc.latitude || loc.lat || 5.2974),
    longitude: Number(loc.longitude || loc.lng || -1.9968),
    lat: Number(loc.latitude || loc.lat || 5.2974),
    lng: Number(loc.longitude || loc.lng || -1.9968),
    studentsCommonlyLiveHere: loc.students_commonly_live_here || 'Yes',
    active: loc.active !== false,
    hostelCount,
    hostel_count: hostelCount,
    avgPriceGhs,
    avg_price_ghs: avgPriceGhs
  };
}

router.get('/', asyncHandler(async (req, res) => {
  const [locRes, hostelRes] = await Promise.all([
    supabase.from('locations').select('*').order('name', { ascending: true }),
    supabase.from('hostels').select('id, name, location, price_per_year')
  ]);

  if (locRes.error) throw locRes.error;

  const rawLocations = locRes.data || [];
  const hostels = hostelRes.data || [];

  let enriched = rawLocations.map(l => enrichLocation(l, hostels));

  const { search, maxDistance, walkableOnly } = req.query;
  if (search) {
    const q = String(search).toLowerCase().trim();
    enriched = enriched.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.nearbyLandmark.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q)
    );
  }
  if (maxDistance) {
    const maxD = Number(maxDistance);
    if (!isNaN(maxD)) enriched = enriched.filter(l => l.distanceKm <= maxD);
  }
  if (walkableOnly === 'true') {
    enriched = enriched.filter(l => l.distanceKm <= 1.2 || l.estimatedWalkingMins <= 15);
  }

  return res.json({ locations: enriched });
}));

router.post('/', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { name, category, description, nearbyLandmark, distanceKm, lat, lng, estimatedWalkingMins, estimatedDrivingMins, avgTransportFareGhs } = req.body;

  if (!name) return res.status(400).json({ message: 'Location name is required' });

  const payload = {
    name: String(name).trim(),
    category: String(category || 'Community').trim(),
    description: String(description || '').trim(),
    nearby_landmark: String(nearbyLandmark || '').trim(),
    distance_km: Number(distanceKm || 1.5),
    latitude: Number(lat || 5.2974),
    longitude: Number(lng || -1.9968),
    estimated_walking_mins: Number(estimatedWalkingMins || 15),
    estimated_driving_mins: Number(estimatedDrivingMins || 4),
    avg_transport_fare_ghs: Number(avgTransportFareGhs || 5),
    students_commonly_live_here: 'Yes',
    active: true
  };

  const { data: newLoc, error } = await supabase.from('locations').insert(payload).select().single();
  if (error) throw error;

  return res.status(201).json({ message: 'Location created successfully', location: enrichLocation(newLoc, []) });
}));

router.put('/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body, updated_at: new Date().toISOString() };
  delete updates.id;

  const { data: updated, error } = await supabase.from('locations').update(updates).eq('id', id).select().single();
  if (error) throw error;

  return res.json({ message: 'Location updated', location: enrichLocation(updated, []) });
}));

router.delete('/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('locations').delete().eq('id', id);
  if (error) throw error;

  return res.json({ message: 'Location deleted successfully' });
}));

module.exports = router;
