const express = require('express');
const { authenticateToken, requireManager, requireManagerOrAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { error } = require('../utils/apiResponse');
const supabase = require('../config/supabase');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Helper: check if a Supabase error is "table not found"
function isTableMissing(dbErr) {
  return dbErr && (
    dbErr.code === '42P01' ||
    dbErr.message?.includes('schema cache') ||
    dbErr.message?.includes('not found') ||
    dbErr.message?.includes('does not exist')
  );
}

function makeReference(prefix = 'HH') {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

function makeReceiptNumber() {
  return `HHR-${Date.now().toString(36).toUpperCase()}`;
}

function sanitizeText(value) {
  return String(value || '').trim();
}

function buildNotificationPayload({ studentId, managerId, hostelId, title, message, type = 'info', read = false }) {
  return {
    student_id: studentId || null,
    manager_id: managerId || null,
    hostel_id: hostelId || null,
    title: sanitizeText(title),
    message: sanitizeText(message),
    type,
    read,
  };
}

// ── GET /api/payments/methods/:hostelId ─────────────────────────────────────
router.get('/methods/:hostelId', authenticateToken, asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') return error(res, 'Student access only', 403);

  const { data: hostel } = await supabase
    .from('hostels')
    .select('id, name, manager_id')
    .eq('id', req.params.hostelId)
    .maybeSingle();

  if (!hostel) return error(res, 'Hostel not found', 404);

  const { data: methods, error: dbErr } = await supabase
    .from('hostel_payment_methods')
    .select('*')
    .eq('hostel_id', hostel.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (dbErr && isTableMissing(dbErr)) {
    return res.json({ hostel: { id: hostel.id, name: hostel.name }, paymentMethods: [] });
  }

  return res.json({
    hostel: { id: hostel.id, name: hostel.name, managerId: hostel.manager_id },
    paymentMethods: (methods || []).map((method) => ({
      id: method.id,
      paymentType: method.payment_type,
      accountName: method.account_name,
      accountNumber: method.account_number,
      bankName: method.bank_name,
      branch: method.branch,
      qrCode: method.qr_code,
      instructions: method.instructions,
      isActive: method.is_active,
    })),
  });
}));

// ── POST /api/payments/initiate ──────────────────────────────────────────────
router.post('/initiate', authenticateToken, asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') return error(res, 'Student access only', 403);

  const { hostelId, roomType, amount } = req.body;
  if (!hostelId || !roomType || !amount) return error(res, 'hostelId, roomType, and amount are required', 400);

  const { data: hostel } = await supabase.from('hostels').select('*').eq('id', hostelId).maybeSingle();
  if (!hostel) return error(res, 'Hostel not found', 404);

  // Build student object from JWT claims + optional student_profiles lookup
  let studentName  = req.user.name  || req.user.email;
  let studentEmail = req.user.email || '';
  try {
    const { data: sp } = await supabase.from('user_profiles').select('name, email').eq('id', req.user.sub).maybeSingle();
    if (sp) { studentName = sp.name || studentName; studentEmail = sp.email || studentEmail; }
  } catch {}

  // Check for duplicate booking (non-fatal if table missing)
  const { data: existingBooking, error: bkCheckErr } = await supabase
    .from('bookings').select('id')
    .eq('student_id', req.user.sub).eq('hostel_id', hostelId)
    .in('status', ['confirmed', 'paid', 'pending_payment', 'pending_verification'])
    .maybeSingle();
  if (!bkCheckErr && existingBooking) {
    return error(res, 'You already have an active booking request for this hostel', 409);
  }

  const bookingReference = makeReference('BK');
  const paymentReference = makeReference('PY');
  const paidAmount = Number(amount);

  const { data: payment, error: payErr } = await supabase
    .from('payments')
    .insert({
      reference: paymentReference,
      student_id:    req.user.sub,
      student_name:  studentName,
      student_email: studentEmail,
      hostel_id:    hostel.id,
      hostel_name:  hostel.name,
      room_type:    roomType,
      amount:       paidAmount,
      payment_method: '',
      status: 'pending_submission',
      verified: false,
      metadata: {
        booking_reference: bookingReference,
        manager_id: hostel.manager_id,
      },
    })
    .select()
    .single();

  if (payErr) {
    if (isTableMissing(payErr)) return error(res, 'Booking system not yet configured. Run MIGRATION_REQUIRED.sql in Supabase.', 503);
    throw payErr;
  }
  if (!payment) return error(res, 'Could not create payment record', 500);

  const { data: booking, error: bkErr } = await supabase
    .from('bookings')
    .insert({
      payment_id:    payment.id,
      reference:     bookingReference,
      student_id:    req.user.sub,
      student_name:  studentName,
      student_email: studentEmail,
      hostel_id:    hostel.id,
      hostel_name:  hostel.name,
      manager_id:   hostel.manager_id || null,
      room_type:    roomType,
      amount:       paidAmount,
      status: 'pending_payment',
      notes: 'Awaiting payment verification.',
    })
    .select()
    .single();

  if (bkErr && !isTableMissing(bkErr)) throw bkErr;

  const { data: methods } = await supabase
    .from('hostel_payment_methods')
    .select('*')
    .eq('hostel_id', hostel.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return res.json({
    message: 'Booking request prepared. Select a manager payment method and submit proof of payment.',
    payment,
    booking,
    reference: paymentReference,
    bookingReference,
    paymentMethods: methods || [],
  });
}));

// ── POST /api/payments/submit-proof ──────────────────────────────────────────
router.post('/submit-proof', authenticateToken, upload.single('receiptFile'), asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') return error(res, 'Student access only', 403);

  const { reference, hostelId, roomType, amount, paymentMethodId, transactionReference, paidAt, notes } = req.body;
  if (!reference || !hostelId || !roomType || !amount || !paymentMethodId || !transactionReference) {
    return error(res, 'reference, hostelId, roomType, amount, paymentMethodId, and transactionReference are required', 400);
  }

  const [{ data: payment }, { data: method }, { data: hostel }] = await Promise.all([
    supabase.from('payments').select('*').eq('reference', reference).eq('student_id', req.user.sub).maybeSingle(),
    supabase.from('hostel_payment_methods').select('*').eq('id', paymentMethodId).eq('hostel_id', hostelId).maybeSingle(),
    supabase.from('hostels').select('*').eq('id', hostelId).maybeSingle(),
  ]);

  // Build student info from JWT + optional user_profiles
  let studentName  = req.user.name  || req.user.email;
  let studentEmail = req.user.email || '';
  try {
    const { data: up } = await supabase.from('user_profiles').select('name, email').eq('id', req.user.sub).maybeSingle();
    if (up) { studentName = up.name || studentName; studentEmail = up.email || studentEmail; }
  } catch {}

  if (!payment) return error(res, 'Payment record not found', 404);
  if (!method)  return error(res, 'Payment method not found', 404);
  if (!hostel)  return error(res, 'Hostel not found', 404);

  // Get booking linked to this payment (non-critical if table missing)
  let booking = null;
  if (payment?.id) {
    const { data: bk } = await supabase.from('bookings').select('id').eq('payment_id', payment.id).maybeSingle();
    booking = bk;
  }

  const fileUrl = req.file ? `/uploads/${req.file.filename}` : '';
  const uploadedAt = paidAt || new Date().toISOString();
  const submissionReference = makeReference('SUB');

  const { data: submission, error: subErr } = await supabase
    .from('payment_submissions')
    .insert({
      submission_reference: submissionReference,
      payment_id: payment.id,
      booking_id: booking?.id || null,
      student_id:    req.user.sub,
      student_name:  studentName,
      student_email: studentEmail,
      hostel_id: hostelId,
      hostel_name: payment.hostel_name,
      room_type: roomType,
      amount: Number(amount),
      payment_method_id: method.id,
      payment_method_name: `${method.payment_type} • ${method.account_name}`,
      transaction_reference: sanitizeText(transactionReference),
      paid_at: uploadedAt,
      notes: sanitizeText(notes),
      receipt_file_url: fileUrl,
      receipt_file_name: req.file?.originalname || '',
      status: 'submitted',
      verified_by: null,
      verification_notes: '',
    })
    .select()
    .single();

  if (subErr) throw subErr;

  await supabase
    .from('payments')
    .update({
      payment_method: method.payment_type,
      status: 'pending_verification',
      verified: false,
      paid_at: uploadedAt,
      metadata: {
        ...(payment.metadata || {}),
        payment_method_id: method.id,
        submission_id: submission.id,
      },
    })
    .eq('id', payment.id);

  await supabase
    .from('bookings')
    .update({
      status: 'pending_verification',
      notes: 'Payment proof submitted for manager verification.',
    })
    .eq('payment_id', payment.id);

  try {
    await supabase.from('notifications').insert(buildNotificationPayload({
      managerId: hostel.manager_id || null,
      hostelId,
      title: 'Payment proof submitted',
      message: `${studentName} submitted a payment proof for ${payment.hostel_name}.`,
      type: 'payment',
    }));
  } catch {}

  return res.status(201).json({ message: 'Payment proof submitted successfully. Your hostel manager will verify it shortly.', submission });
}));

// ── GET /api/payments/history ─────────────────────────────────────────────
router.get('/history', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const [payResult, bkResult, subResult] = await Promise.all([
    supabase.from('payments').select('*').eq('student_id', userId).order('created_at', { ascending: false }),
    supabase.from('bookings').select('*').eq('student_id', userId).order('created_at', { ascending: false }),
    supabase.from('payment_submissions').select('*').eq('student_id', userId).order('created_at', { ascending: false }),
  ]);
  return res.json({
    payments:     (payResult.error && isTableMissing(payResult.error))  ? [] : (payResult.data  || []),
    bookings:     (bkResult.error  && isTableMissing(bkResult.error))   ? [] : (bkResult.data   || []),
    submissions:  (subResult.error && isTableMissing(subResult.error))  ? [] : (subResult.data  || []),
  });
}));

// ── GET /api/payments/receipts ──────────────────────────────────────────────
router.get('/receipts', authenticateToken, asyncHandler(async (req, res) => {
  if (req.user.role !== 'student' && req.user.role !== 'manager') return error(res, 'Student or manager access only', 403);

  let query = supabase.from('receipts').select('*');
  if (req.user.role === 'student') query = query.eq('student_id', req.user.sub);
  else query = query.eq('manager_id', req.user.sub);

  const { data: receipts, error: dbErr } = await query.order('created_at', { ascending: false });
  if (dbErr && isTableMissing(dbErr)) return res.json({ receipts: [] });
  if (dbErr) throw dbErr;

  return res.json({ receipts: receipts || [] });
}));

// ── GET /api/payments/verification-queue ───────────────────────────────────
router.get('/verification-queue', authenticateToken, requireManager, asyncHandler(async (req, res) => {
  const { data: hostels } = await supabase.from('hostels').select('id').eq('manager_id', req.user.sub);
  const hostelIds = (hostels || []).map((h) => h.id);
  if (!hostelIds.length) return res.json({ submissions: [], payments: [], bookings: [] });

  const [subResult, payResult, bkResult] = await Promise.all([
    supabase.from('payment_submissions').select('*').in('hostel_id', hostelIds).order('created_at', { ascending: false }),
    supabase.from('payments').select('*').in('hostel_id', hostelIds).order('created_at', { ascending: false }),
    supabase.from('bookings').select('*').in('hostel_id', hostelIds).order('created_at', { ascending: false }),
  ]);

  return res.json({
    submissions: (subResult.error && isTableMissing(subResult.error)) ? [] : (subResult.data || []),
    payments: (payResult.error && isTableMissing(payResult.error)) ? [] : (payResult.data || []),
    bookings: (bkResult.error && isTableMissing(bkResult.error)) ? [] : (bkResult.data || []),
  });
}));

// ── PATCH /api/payments/verification-queue/:id ─────────────────────────────
router.patch('/verification-queue/:id', authenticateToken, requireManager, asyncHandler(async (req, res) => {
  const { action, notes } = req.body;
  if (!['approve', 'reject', 'request_more_info'].includes(action)) return error(res, 'Invalid action', 400);

  const { data: submission, error: subFetchErr } = await supabase
    .from('payment_submissions')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle();

  if (subFetchErr && isTableMissing(subFetchErr)) return error(res, 'Payment submission system not configured. Run MIGRATION_REQUIRED.sql.', 503);
  if (!submission) return error(res, 'Payment submission not found', 404);

  const { data: payment } = submission.payment_id
    ? await supabase.from('payments').select('*').eq('id', submission.payment_id).maybeSingle()
    : { data: null };

  const statusMap = {
    approve: 'approved',
    reject: 'rejected',
    request_more_info: 'request_more_info',
  };

  const { data: updatedSubmission, error: updErr } = await supabase
    .from('payment_submissions')
    .update({
      status: statusMap[action],
      verified_by: req.user.sub,
      verification_notes: sanitizeText(notes),
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', submission.id)
    .select()
    .single();

  if (updErr) throw updErr;

  if (action === 'approve') {
    await supabase.from('payments').update({ status: 'verified', verified: true, paid_at: new Date().toISOString() }).eq('id', payment.id);
    await supabase.from('bookings').update({ status: 'confirmed', notes: 'Payment verified and confirmed by manager.' }).eq('payment_id', payment.id);

    // Generate receipt (non-fatal if receipts table doesn't exist yet)
    const receiptNumber = makeReceiptNumber();
    const { error: recErr } = await supabase.from('receipts').insert({
      receipt_number: receiptNumber,
      student_id: submission.student_id,
      student_name: submission.student_name,
      hostel_id: submission.hostel_id,
      hostel_name: submission.hostel_name,
      room_type: submission.room_type,
      academic_year: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
      amount_paid: submission.amount,
      payment_method: submission.payment_method_name,
      transaction_reference: submission.transaction_reference,
      verified_at: new Date().toISOString(),
      manager_confirmation: req.user.name,
      manager_id: req.user.sub,
      file_url: submission.receipt_file_url || '',
    });
    if (recErr && !isTableMissing(recErr)) console.warn('Receipt insert warn:', recErr.message);

    // Log as income transaction
    await supabase.from('transactions').insert({
      manager_id: req.user.sub,
      hostel_id: submission.hostel_id,
      hostel_name: submission.hostel_name,
      type: 'income',
      amount: submission.amount,
      category: 'Rent Payment',
      description: `${submission.room_type} — Payment verified — Ref: ${submission.transaction_reference}`,
      student_name: submission.student_name,
      student_email: submission.student_email,
    });
  }

  if (action === 'reject') {
    await supabase.from('payments').update({ status: 'rejected', verified: false }).eq('id', payment.id);
    await supabase.from('bookings').update({ status: 'rejected', notes: 'Payment proof rejected by manager.' }).eq('payment_id', payment.id);
  }

  if (action === 'request_more_info') {
    await supabase.from('payments').update({ status: 'pending_more_info', verified: false }).eq('id', payment.id);
    await supabase.from('bookings').update({ status: 'pending_more_info', notes: 'Manager requested additional payment information.' }).eq('payment_id', payment.id);
  }

  // Send notification to student (non-fatal)
  try {
    await supabase.from('notifications').insert(buildNotificationPayload({
      studentId: submission.student_id,
      hostelId: submission.hostel_id,
      title: action === 'approve' ? 'Payment confirmed ✓' : action === 'reject' ? 'Payment rejected' : 'More information needed',
      message: action === 'approve'
        ? `Your payment for ${submission.hostel_name} has been verified and your booking is confirmed.`
        : action === 'reject'
          ? `Your payment proof for ${submission.hostel_name} was rejected. Please contact the manager.`
          : `The manager needs more details about your payment for ${submission.hostel_name}.`,
      type: 'payment',
    }));
  } catch {}

  return res.json({ message: `Payment ${action}d successfully`, submission: updatedSubmission });
}));

// ── GET /api/payments/manager-summary ────────────────────────────────────────
router.get('/manager-summary', authenticateToken, requireManager, asyncHandler(async (req, res) => {
  const { data: hostels } = await supabase.from('hostels').select('id').eq('manager_id', req.user.sub);
  const hostelIds = (hostels || []).map((h) => h.id);
  if (!hostelIds.length) return res.json({ payments: [], bookings: [], summary: {} });

  const [{ data: payments }, { data: bookings }] = await Promise.all([
    supabase.from('payments').select('*').in('hostel_id', hostelIds).order('created_at', { ascending: false }),
    supabase.from('bookings').select('*').in('hostel_id', hostelIds).order('created_at', { ascending: false }),
  ]);

  const allPayments = payments || [];
  const allBookings = bookings || [];
  const verified = allPayments.filter((p) => p.status === 'verified');
  const pending = allPayments.filter((p) => p.status === 'pending_verification' || p.status === 'pending_more_info');
  const rejected = allPayments.filter((p) => p.status === 'rejected');

  return res.json({
    payments: allPayments,
    bookings: allBookings,
    summary: {
      totalRevenue: verified.reduce((sum, p) => sum + Number(p.amount), 0),
      verifiedCount: verified.length,
      pendingCount: pending.length,
      rejectedCount: rejected.length,
      totalBookings: allBookings.length,
    },
  });
}));

// ── GET /api/payments/admin-all ───────────────────────────────────────────────
router.get('/admin-all', authenticateToken, requireManagerOrAdmin, asyncHandler(async (req, res) => {
  const { status, hostelId, from, to } = req.query;
  let query = supabase.from('payments').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  if (hostelId) query = query.eq('hostel_id', hostelId);
  if (from) query = query.gte('created_at', from);
  if (to) query = query.lte('created_at', to + 'T23:59:59Z');

  const { data: payments, error: dbErr } = await query;
  if (dbErr) throw dbErr;

  return res.json({ payments: payments || [] });
}));

module.exports = router;
