const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { error } = require('../utils/apiResponse');
const supabase = require('../config/supabase');
const { logAuditTrail } = require('../middleware/errorLogger');

const router = express.Router();

// ── GET /api/tours/student ──────────────────────────────────────────────────
router.get('/student', authenticateToken, asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') return error(res, 'Student access only', 403);

  const { data: tours, error: dbErr } = await supabase
    .from('tour_requests')
    .select('*, hostels(name, location, address, price_per_year)')
    .eq('student_id', req.user.sub)
    .order('created_at', { ascending: false });

  if (dbErr && dbErr.code === '42P01') return res.json({ tours: [] });
  if (dbErr) throw dbErr;

  return res.json({ tours: tours || [] });
}));

// ── GET /api/tours/manager ──────────────────────────────────────────────────
router.get('/manager', authenticateToken, asyncHandler(async (req, res) => {
  if (req.user.role !== 'manager' && req.user.role !== 'admin') return error(res, 'Manager or Admin access only', 403);

  let query = supabase.from('tour_requests').select('*').order('created_at', { ascending: false });
  if (req.user.role === 'manager') {
    query = query.eq('manager_id', req.user.sub);
  }

  const { data: tours, error: dbErr } = await query;
  if (dbErr && dbErr.code === '42P01') return res.json({ tours: [] });
  if (dbErr) throw dbErr;

  return res.json({ tours: tours || [] });
}));

// ── PATCH /api/tours/:id/status ─────────────────────────────────────────────
router.post('/:id/status', authenticateToken, asyncHandler(async (req, res) => {
  if (req.user.role !== 'manager' && req.user.role !== 'admin') return error(res, 'Manager or Admin access only', 403);

  const { status, rescheduledDate, rescheduledTime, adminNotes } = req.body;
  if (!['approved', 'rejected', 'rescheduled'].includes(status)) {
    return error(res, 'Status must be approved, rejected, or rescheduled', 400);
  }

  const updates = {
    status,
    admin_notes: String(adminNotes || '').trim(),
    updated_at: new Date().toISOString()
  };

  if (status === 'rescheduled') {
    if (!rescheduledDate) return error(res, 'Rescheduled date is required', 400);
    updates.rescheduled_date = rescheduledDate;
    updates.rescheduled_time = String(rescheduledTime || 'Morning (10:00 AM)').trim();
  }

  const { data: updated, error: dbErr } = await supabase
    .from('tour_requests')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (dbErr) throw dbErr;

  // Send notification to student
  if (updated && updated.student_id) {
    const notifMsg = status === 'approved'
      ? `Your tour request for ${updated.hostel_name} on ${updated.preferred_date} has been APPROVED!`
      : status === 'rescheduled'
      ? `Your tour request for ${updated.hostel_name} has been RESCHEDULED to ${rescheduledDate} ${rescheduledTime || ''}.`
      : `Your tour request for ${updated.hostel_name} could not be approved at this time.`;

    await supabase.from('notifications').insert({
      user_id: updated.student_id,
      title: `Tour Request ${status.toUpperCase()}`,
      message: notifMsg,
      type: status === 'approved' ? 'success' : status === 'rescheduled' ? 'warning' : 'danger',
      entity_type: 'tour_request',
      entity_id: updated.id
    });
  }

  await logAuditTrail(req, `tour_request_${status}`, 'tour_request', updated.id, updated.hostel_name, { status, rescheduledDate });

  return res.json({ message: `Tour request updated to ${status}`, tour: updated });
}));

module.exports = router;
