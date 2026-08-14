const express = require('express');
const { authenticateToken, requireManager, requireManagerOrAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { error } = require('../utils/apiResponse');
const supabase = require('../config/supabase');
const { upload } = require('../middleware/upload');
const { getStore, updateStore } = require('../utils/localStore');

const router = express.Router();

// Helper: check if a Supabase error is "table not found"
function isTableMissing(dbErr) {
  return dbErr && (
    dbErr.code === '42P01' ||
    dbErr.code === 'PGRST205' ||
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
    id: 'notif-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
    student_id: studentId || null,
    manager_id: managerId || null,
    hostel_id: hostelId || null,
    title: sanitizeText(title),
    message: sanitizeText(message),
    type,
    read,
    created_at: new Date().toISOString()
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

  let rawMethods = methods || [];

  if (dbErr && isTableMissing(dbErr)) {
    const store = getStore();
    rawMethods = (store.hostel_payment_methods || []).filter(m => m.hostel_id === hostel.id || m.is_active);
  }

  if (rawMethods.length === 0) {
    const store = getStore();
    rawMethods = store.hostel_payment_methods || [];
  }

  return res.json({
    hostel: { id: hostel.id, name: hostel.name, managerId: hostel.manager_id },
    paymentMethods: rawMethods.map((method) => ({
      id: method.id,
      paymentType: method.payment_type || method.paymentType,
      accountName: method.account_name || method.accountName,
      accountNumber: method.account_number || method.accountNumber,
      bankName: method.bank_name || method.bankName,
      branch: method.branch,
      instructions: method.instructions,
      isActive: method.is_active ?? true,
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

  // Overbooking Protection: check room availability if configured
  if (hostel.room_types && typeof hostel.room_types === 'object') {
    const key = Object.keys(hostel.room_types).find(k => k === roomType || k.replace(/_/g, '-') === roomType.replace(/_/g, '-'));
    if (key && hostel.room_types[key]?.available !== undefined && Number(hostel.room_types[key].available) <= 0) {
      return error(res, `Sorry, ${roomType.replace(/_/g, ' ')} is currently fully booked. Please select another room option.`, 400);
    }
  }

  let studentName  = req.user.name  || req.user.email;
  let studentEmail = req.user.email || '';
  try {
    const { data: sp } = await supabase.from('user_profiles').select('name, email').eq('id', req.user.sub).maybeSingle();
    if (sp) { studentName = sp.name || studentName; studentEmail = sp.email || studentEmail; }
  } catch {}

  const { data: existingBooking, error: bkCheckErr } = await supabase
    .from('bookings').select('*')
    .eq('student_id', req.user.sub).eq('hostel_id', hostelId)
    .in('status', ['confirmed', 'paid', 'pending_payment', 'pending_verification'])
    .maybeSingle();

  if (!bkCheckErr && existingBooking) {
    const { data: existingPayment } = existingBooking.payment_id
      ? await supabase.from('payments').select('*').eq('id', existingBooking.payment_id).maybeSingle()
      : { data: null };

    const { data: methods } = await supabase.from('hostel_payment_methods').select('*').eq('hostel_id', hostel.id);
    const store = getStore();

    return res.json({
      message: 'Active booking request found.',
      booking: existingBooking,
      payment: existingPayment || { reference: existingBooking.reference, hostel_name: hostel.name },
      reference: existingPayment?.reference || existingBooking.reference,
      bookingReference: existingBooking.reference,
      paymentMethods: (methods && methods.length) ? methods : store.hostel_payment_methods,
    });
  }

  const bookingReference = makeReference('BK');
  const paymentReference = makeReference('PY');
  const paidAmount = Number(amount);

  let payment = null;
  let booking = null;

  const payPayload = {
    id: 'pay-' + Date.now(),
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
    created_at: new Date().toISOString(),
    metadata: { booking_reference: bookingReference, manager_id: hostel.manager_id }
  };

  const { data: payDb, error: payErr } = await supabase.from('payments').insert(payPayload).select().maybeSingle();

  if (payErr && isTableMissing(payErr)) {
    payment = payPayload;
    updateStore(s => { s.payments.unshift(payment); return s; });
  } else if (payDb) {
    payment = payDb;
  } else {
    payment = payPayload;
  }

  const bkPayload = {
    id: 'bk-' + Date.now(),
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
    created_at: new Date().toISOString()
  };

  const { data: bkDb, error: bkErr } = await supabase.from('bookings').insert(bkPayload).select().maybeSingle();

  if (bkErr && isTableMissing(bkErr)) {
    booking = bkPayload;
    updateStore(s => { s.bookings.unshift(booking); return s; });
  } else if (bkDb) {
    booking = bkDb;
  } else {
    booking = bkPayload;
  }

  const { data: methods } = await supabase.from('hostel_payment_methods').select('*').eq('hostel_id', hostel.id).eq('is_active', true);
  const store = getStore();

  return res.json({
    message: 'Booking request prepared. Select a manager payment method and submit proof of payment.',
    payment,
    booking,
    reference: paymentReference,
    bookingReference,
    paymentMethods: (methods && methods.length) ? methods : store.hostel_payment_methods,
  });
}));

// ── POST /api/payments/submit-proof ──────────────────────────────────────────
router.post('/submit-proof', authenticateToken, upload.single('receiptFile'), asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') return error(res, 'Student access only', 403);

  const { reference, hostelId, roomType, amount, paymentMethodId, transactionReference, paidAt, notes } = req.body;
  if (!reference || !hostelId || !roomType || !amount || !paymentMethodId || !transactionReference) {
    return error(res, 'reference, hostelId, roomType, amount, paymentMethodId, and transactionReference are required', 400);
  }

  let [{ data: payment }, { data: method }, { data: hostel }] = await Promise.all([
    supabase.from('payments').select('*').eq('reference', reference).eq('student_id', req.user.sub).maybeSingle(),
    supabase.from('hostel_payment_methods').select('*').eq('id', paymentMethodId).maybeSingle(),
    supabase.from('hostels').select('*').eq('id', hostelId).maybeSingle(),
  ]);

  const store = getStore();

  if (!payment) {
    payment = (store.payments || []).find(p => (p.reference === reference || p.student_id === req.user.sub) && p.hostel_id === hostelId);
  }

  if (!method) {
    method = (store.hostel_payment_methods || []).find(m => m.id === paymentMethodId) || store.hostel_payment_methods[0];
  }

  if (!hostel) {
    const { data: h } = await supabase.from('hostels').select('*').eq('id', hostelId).maybeSingle();
    hostel = h;
  }

  let studentName  = req.user.name  || req.user.email;
  let studentEmail = req.user.email || '';
  try {
    const { data: up } = await supabase.from('user_profiles').select('name, email').eq('id', req.user.sub).maybeSingle();
    if (up) { studentName = up.name || studentName; studentEmail = up.email || studentEmail; }
  } catch {}

  const fileUrl = req.file ? `/uploads/${req.file.filename}` : '';
  const uploadedAt = paidAt || new Date().toISOString();
  const submissionReference = makeReference('SUB');

  const subPayload = {
    id: 'sub-' + Date.now(),
    submission_reference: submissionReference,
    payment_id: payment?.id || 'pay-' + Date.now(),
    booking_id: null,
    student_id:    req.user.sub,
    student_name:  studentName,
    student_email: studentEmail,
    hostel_id: hostelId,
    hostel_name: payment?.hostel_name || hostel?.name || 'Hostel',
    room_type: roomType,
    amount: Number(amount),
    payment_method_id: method?.id || paymentMethodId,
    payment_method_name: method ? `${method.payment_type} • ${method.account_name}` : 'Mobile Money',
    transaction_reference: sanitizeText(transactionReference),
    paid_at: uploadedAt,
    notes: sanitizeText(notes),
    receipt_file_url: fileUrl,
    receipt_file_name: req.file?.originalname || '',
    status: 'submitted',
    verified_by: null,
    verification_notes: '',
    created_at: new Date().toISOString()
  };

  let submission = null;
  const { data: subDb, error: subErr } = await supabase.from('payment_submissions').insert(subPayload).select().maybeSingle();

  if (subErr && isTableMissing(subErr)) {
    submission = subPayload;
    updateStore(s => { s.payment_submissions.unshift(submission); return s; });
  } else if (subDb) {
    submission = subDb;
  } else {
    submission = subPayload;
    updateStore(s => { s.payment_submissions.unshift(submission); return s; });
  }

  // Update payment status in local store + Supabase
  if (payment?.id) {
    await supabase.from('payments').update({ payment_method: method?.payment_type || 'MoMo', status: 'pending_verification', verified: false }).eq('id', payment.id);
  }
  updateStore(s => {
    const p = s.payments.find(x => x.id === payment?.id || x.student_id === req.user.sub);
    if (p) { p.status = 'pending_verification'; p.payment_method = method?.payment_type || 'MoMo'; }
    const b = s.bookings.find(x => x.student_id === req.user.sub && x.hostel_id === hostelId);
    if (b) { b.status = 'pending_verification'; }
    return s;
  });

  // Create notification
  const notifObj = buildNotificationPayload({
    managerId: hostel?.manager_id || null,
    hostelId,
    title: 'Payment proof submitted',
    message: `${studentName} submitted payment proof for ${subPayload.hostel_name}.`,
    type: 'payment'
  });

  const { error: notifErr } = await supabase.from('notifications').insert(notifObj);
  if (notifErr && isTableMissing(notifErr)) {
    updateStore(s => { s.notifications.unshift(notifObj); return s; });
  }

  return res.status(201).json({ message: 'Payment proof submitted successfully. Manager will verify shortly.', submission });
}));

// ── GET /api/payments/history ─────────────────────────────────────────────
router.get('/history', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const store = getStore();

  const [payResult, bkResult, subResult] = await Promise.all([
    supabase.from('payments').select('*').eq('student_id', userId).order('created_at', { ascending: false }),
    supabase.from('bookings').select('*').eq('student_id', userId).order('created_at', { ascending: false }),
    supabase.from('payment_submissions').select('*').eq('student_id', userId).order('created_at', { ascending: false }),
  ]);

  const payments = (!payResult.error && payResult.data?.length) ? payResult.data : store.payments.filter(p => p.student_id === userId);
  const bookings = (!bkResult.error && bkResult.data?.length) ? bkResult.data : store.bookings.filter(b => b.student_id === userId);
  const submissions = (!subResult.error && subResult.data?.length) ? subResult.data : store.payment_submissions.filter(s => s.student_id === userId);

  return res.json({ payments, bookings, submissions });
}));

// ── GET /api/payments/receipts ──────────────────────────────────────────────
router.get('/receipts', authenticateToken, asyncHandler(async (req, res) => {
  if (req.user.role !== 'student' && req.user.role !== 'manager') return error(res, 'Student or manager access only', 403);

  let query = supabase.from('receipts').select('*');
  if (req.user.role === 'student') query = query.eq('student_id', req.user.sub);
  else query = query.eq('manager_id', req.user.sub);

  const { data: receipts, error: dbErr } = await query.order('created_at', { ascending: false });
  const store = getStore();

  if ((dbErr && isTableMissing(dbErr)) || !receipts || receipts.length === 0) {
    const localReceipts = store.receipts.filter(r => req.user.role === 'student' ? r.student_id === req.user.sub : r.manager_id === req.user.sub);
    return res.json({ receipts: localReceipts });
  }

  return res.json({ receipts: receipts || [] });
}));

// ── GET /api/payments/verification-queue ───────────────────────────────────
router.get('/verification-queue', authenticateToken, requireManager, asyncHandler(async (req, res) => {
  const { data: hostels } = await supabase.from('hostels').select('id').eq('manager_id', req.user.sub);
  const hostelIds = (hostels || []).map((h) => h.id);
  const store = getStore();

  const [subResult, payResult, bkResult] = await Promise.all([
    supabase.from('payment_submissions').select('*').order('created_at', { ascending: false }),
    supabase.from('payments').select('*').order('created_at', { ascending: false }),
    supabase.from('bookings').select('*').order('created_at', { ascending: false }),
  ]);

  let submissions = (!subResult.error && subResult.data?.length) ? subResult.data : store.payment_submissions;
  let payments = (!payResult.error && payResult.data?.length) ? payResult.data : store.payments;
  let bookings = (!bkResult.error && bkResult.data?.length) ? bkResult.data : store.bookings;

  if (hostelIds.length > 0) {
    submissions = submissions.filter(s => hostelIds.includes(s.hostel_id));
    payments = payments.filter(p => hostelIds.includes(p.hostel_id));
    bookings = bookings.filter(b => hostelIds.includes(b.hostel_id));
  }

  return res.json({ submissions, payments, bookings });
}));

// ── PATCH /api/payments/verification-queue/:id ─────────────────────────────
router.patch('/verification-queue/:id', authenticateToken, requireManager, asyncHandler(async (req, res) => {
  const { action, notes } = req.body;
  if (!['approve', 'reject', 'request_more_info'].includes(action)) return error(res, 'Invalid action', 400);

  let { data: submission, error: subFetchErr } = await supabase
    .from('payment_submissions')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle();

  const store = getStore();

  if (!submission) {
    submission = (store.payment_submissions || []).find(s => s.id === req.params.id);
  }

  if (!submission) return error(res, 'Payment submission not found', 404);

  // 1. Manager Authorization Check — Manager can only approve payments for their own hostel
  if (req.user.role === 'manager') {
    const { data: hostel } = await supabase.from('hostels').select('manager_id').eq('id', submission.hostel_id).maybeSingle();
    if (hostel?.manager_id && hostel.manager_id !== req.user.sub) {
      return error(res, 'Unauthorized: You are not authorized to manage payment verification for this hostel', 403);
    }
  }

  // 2. Prevent Double Approval
  if (action === 'approve' && submission.status === 'approved') {
    return error(res, 'This payment submission has already been approved and verified.', 400);
  }

  const statusMap = { approve: 'approved', reject: 'rejected', request_more_info: 'request_more_info' };

  // Update submission
  await supabase.from('payment_submissions').update({ status: statusMap[action], verified_by: req.user.sub, verification_notes: sanitizeText(notes) }).eq('id', submission.id);
  updateStore(s => {
    const sub = s.payment_submissions.find(x => x.id === submission.id);
    if (sub) { sub.status = statusMap[action]; sub.verification_notes = sanitizeText(notes); }
    return s;
  });

  if (action === 'approve') {
    // Check if receipt already generated for this transaction reference
    const { data: existingRec } = await supabase.from('receipts').select('*').eq('transaction_reference', submission.transaction_reference).maybeSingle();
    const existingLocalRec = store.receipts.find(r => r.transaction_reference === submission.transaction_reference);

    const receiptNumber = existingRec?.receipt_number || existingLocalRec?.receipt_number || makeReceiptNumber();
    const receiptObj = {
      id: existingRec?.id || existingLocalRec?.id || ('rec-' + Date.now()),
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
      manager_confirmation: req.user.name || 'Demo Manager',
      manager_id: req.user.sub,
      file_url: submission.receipt_file_url || '',
      created_at: new Date().toISOString()
    };

    const { error: recErr } = await supabase.from('receipts').insert(receiptObj);
    if (recErr && isTableMissing(recErr)) {
      updateStore(s => { s.receipts.unshift(receiptObj); return s; });
    } else {
      updateStore(s => { s.receipts.unshift(receiptObj); return s; });
    }

    await supabase.from('payments').update({ status: 'verified', verified: true }).eq('id', submission.payment_id);
    await supabase.from('bookings').update({ status: 'confirmed' }).eq('student_id', submission.student_id);

    updateStore(s => {
      const p = s.payments.find(x => x.id === submission.payment_id || x.student_id === submission.student_id);
      if (p) { p.status = 'verified'; p.verified = true; }
      const b = s.bookings.find(x => x.student_id === submission.student_id);
      if (b) { b.status = 'confirmed'; }
      return s;
    });

    // Log commercial transaction record with configurable commission rate
    const commissionPct = Number(process.env.PLATFORM_COMMISSION_PCT || 5);
    const commission = Math.round(submission.amount * (commissionPct / 100));
    const managerPayout = submission.amount - commission;

    await supabase.from('transactions').insert({
      manager_id: req.user.sub,
      hostel_id: submission.hostel_id,
      hostel_name: submission.hostel_name,
      type: 'income',
      amount: submission.amount,
      booking_amount: submission.amount,
      platform_fee_pct: commissionPct,
      hostelhub_fee: commission,
      manager_payout: managerPayout,
      category: 'Rent Payment',
      description: `${submission.room_type} — Payment verified (${commissionPct}% fee: GHS ${commission}) — Ref: ${submission.transaction_reference}`,
      student_name: submission.student_name,
      student_email: submission.student_email,
      refund_status: 'none',
      status: 'completed',
      created_at: new Date().toISOString()
    });
  }

  if (action === 'reject') {
    await supabase.from('payments').update({ status: 'rejected', verified: false }).eq('student_id', submission.student_id);
    await supabase.from('bookings').update({ status: 'rejected' }).eq('student_id', submission.student_id);
    updateStore(s => {
      const p = s.payments.find(x => x.student_id === submission.student_id);
      if (p) { p.status = 'rejected'; }
      const b = s.bookings.find(x => x.student_id === submission.student_id);
      if (b) { b.status = 'rejected'; }
      return s;
    });
  }

  // Send notification to student
  const notifObj = buildNotificationPayload({
    studentId: submission.student_id,
    hostelId: submission.hostel_id,
    title: action === 'approve' ? 'Payment confirmed ✓' : action === 'reject' ? 'Payment rejected' : 'More information needed',
    message: action === 'approve'
      ? `Your payment for ${submission.hostel_name} has been verified and your receipt is ready!`
      : action === 'reject'
        ? `Your payment proof for ${submission.hostel_name} was rejected. Reason: ${notes || 'Please contact manager'}`
        : `Manager requested more details regarding your payment for ${submission.hostel_name}.`,
    type: 'payment'
  });

  const { error: nErr } = await supabase.from('notifications').insert(notifObj);
  if (nErr && isTableMissing(nErr)) {
    updateStore(s => { s.notifications.unshift(notifObj); return s; });
  } else {
    updateStore(s => { s.notifications.unshift(notifObj); return s; });
  }

  submission.status = statusMap[action];
  return res.json({ message: `Payment ${action}d successfully`, submission });
}));

// ── GET /api/payments/manager-summary ────────────────────────────────────────
router.get('/manager-summary', authenticateToken, requireManager, asyncHandler(async (req, res) => {
  const { data: hostels } = await supabase.from('hostels').select('id').eq('manager_id', req.user.sub);
  const hostelIds = (hostels || []).map((h) => h.id);
  const store = getStore();

  let payments = store.payments;
  let bookings = store.bookings;

  const verified = payments.filter((p) => p.status === 'verified');
  const pending = payments.filter((p) => p.status === 'pending_verification' || p.status === 'pending_more_info');
  const rejected = payments.filter((p) => p.status === 'rejected');

  return res.json({
    payments,
    bookings,
    summary: {
      totalRevenue: verified.reduce((sum, p) => sum + Number(p.amount), 0),
      verifiedCount: verified.length,
      pendingCount: pending.length,
      rejectedCount: rejected.length,
      totalBookings: bookings.length,
    },
  });
}));

// ── GET /api/payments/admin-all ───────────────────────────────────────────────
router.get('/admin-all', authenticateToken, requireManagerOrAdmin, asyncHandler(async (req, res) => {
  const store = getStore();
  const { data: payments } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
  return res.json({ payments: (payments && payments.length) ? payments : store.payments });
}));

module.exports = router;

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
