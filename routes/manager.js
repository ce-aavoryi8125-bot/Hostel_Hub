const express = require('express');
const { authenticateToken, requireManager } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { error } = require('../utils/apiResponse');
const supabase = require('../config/supabase');

const router = express.Router();

// Require active manager — reads from user_profiles + JWT claim
function requireActiveManager(req, res, next) {
  if (!req.user || req.user.role !== 'manager') return error(res, 'Manager access only', 403);
  next();
}

async function checkManagerActive(req, res, next) {
  // Check user_profiles for current status (authoritative)
  const { data: up } = await supabase
    .from('user_profiles')
    .select('id, status')
    .eq('id', req.user.sub)
    .maybeSingle();

  // Fall back to JWT claim if user_profiles doesn't exist yet
  const effectiveStatus = up?.status || req.user.status || 'active';

  if (effectiveStatus !== 'active') {
    return error(res, 'Your account is pending approval. You cannot access manager features until your application is reviewed.', 403);
  }
  next();
}

router.use(authenticateToken, requireActiveManager, asyncHandler(checkManagerActive));

// ─────────────────────────────────────────────
// MANAGER PROFILE
// ─────────────────────────────────────────────
router.get('/profile', asyncHandler(async (req, res) => {
  const isMissing = e => e && (e.message?.includes('schema cache') || e.message?.includes('not found') || e.message?.includes('does not exist'));
  const { data: up, error: upErr } = await supabase.from('user_profiles').select('*').eq('id', req.user.sub).maybeSingle();
  if (upErr && !isMissing(upErr)) return error(res, 'Manager not found', 404);
  const { data: mp } = !isMissing(upErr) ? await supabase.from('manager_profiles').select('*').eq('id', req.user.sub).maybeSingle() : { data: null };

  // Fall back to JWT claims when user_profiles table doesn't exist
  const profile = up || { id: req.user.sub, name: req.user.name, email: req.user.email, role: 'manager', status: req.user.status || 'active', phone: '' };

  return res.json({
    profile: {
      id:      profile.id,
      name:    profile.name || req.user.name,
      email:   profile.email || req.user.email,
      phone:   profile.phone || mp?.phone || '',
      role:    'manager',
      bankDetails: mp?.bank_name ? { bankName: mp.bank_name, accountName: mp.account_name, accountNumber: mp.account_number } : null,
      accountStatus: profile.status || 'active',
    }
  });
}));

router.put('/profile', asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  const updates = {};
  if (name  && String(name).trim())  updates.name  = String(name).trim();
  if (phone && String(phone).trim()) updates.phone = String(phone).trim();
  if (email && String(email).trim()) updates.email = String(email).trim().toLowerCase();

  if (Object.keys(updates).length > 0) {
    // Update user_profiles (non-fatal if table missing)
    try { await supabase.from('user_profiles').update(updates).eq('id', req.user.sub); } catch {}
    const authUpdates = {};
    if (updates.name)  authUpdates.user_metadata = { name: updates.name };
    if (updates.email) authUpdates.email = updates.email;
    if (password && String(password).trim()) authUpdates.password = String(password).trim();
    if (Object.keys(authUpdates).length > 0) {
      await supabase.auth.admin.updateUserById(req.user.sub, authUpdates);
    }
  }
  return res.json({ message: 'Profile updated successfully', profile: { id: req.user.sub, ...updates, role: 'manager', accountStatus: 'Active' } });
}));

// ─────────────────────────────────────────────
// MANAGER FINANCES (dashboard aggregate)
// ─────────────────────────────────────────────
router.get('/finances', asyncHandler(async (req, res) => {
  const managerId = req.user.sub;

  // Try user_profiles first; fall back to just using req.user if table missing
  const { data: up, error: upErr } = await supabase.from('user_profiles').select('*').eq('id', managerId).maybeSingle();
  const isMissing = e => e && (e.message?.includes('schema cache') || e.message?.includes('not found') || e.code === '42P01' || e.message?.includes('does not exist'));
  if (upErr && !isMissing(upErr)) return error(res, 'Manager not found', 404);

  const mp = upErr ? null : (await supabase.from('manager_profiles').select('*').eq('id', managerId).maybeSingle()).data;

  // Hostels assigned to this manager
  const { data: hostels } = await supabase.from('hostels').select('id, name').eq('manager_id', managerId);
  const hostelIds = (hostels || []).map(h => h.id);

  const [txRes, roomRes, maintRes, annRes, tourRes] = await Promise.all([
    supabase.from('transactions').select('*').eq('manager_id', managerId).order('created_at', { ascending: false }),
    hostelIds.length
      ? supabase.from('rooms').select('*').in('hostel_id', hostelIds).order('room_number', { ascending: true })
      : Promise.resolve({ data: [] }),
    hostelIds.length
      ? supabase.from('maintenance_requests').select('*').in('hostel_id', hostelIds).order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    hostelIds.length
      ? supabase.from('announcements').select('*').in('hostel_id', hostelIds).order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    hostelIds.length
      ? supabase.from('tour_requests').select('*').in('hostel_id', hostelIds).order('created_at', { ascending: false })
      : Promise.resolve({ data: [] })
  ]);

  // Get residents from user_profiles where student has been assigned to one of our hostels
  const { data: residents } = hostelIds.length
    ? await supabase.from('student_profiles').select('*, user_profiles(id,name,email,phone,status)').in('hostel_id', hostelIds)
    : { data: [] };

  const allTxs       = txRes.data   || [];
  const allRooms     = roomRes.data  || [];
  const allResidents = residents     || [];
  const allMaint     = maintRes.data || [];
  const allAnn       = annRes.data   || [];
  const allTours     = tourRes.data  || [];

  const totalIncome  = allTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = allTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const totalRooms     = allRooms.length;
  const occupiedRooms  = allRooms.filter(r => r.occupied >= r.capacity).length;
  const availableRooms = allRooms.filter(r => r.occupied < r.capacity).length;

  return res.json({
    bankDetails: mp?.bank_name ? {
      bankName:      mp.bank_name,
      accountName:   mp.account_name,
      accountNumber: mp.account_number,
    } : null,
    transactions:  allTxs,
    hostels:       (hostels || []).map(h => ({ id: h.id, name: h.name })),
    rooms:         allRooms,
    students:      allResidents,
    maintenance:   allMaint,
    announcements: allAnn,
    tourRequests:  allTours,
    totalIncome,
    totalExpense,
    netProfit: totalIncome - totalExpense,
    summary: {
      totalRooms,
      occupiedRooms,
      availableRooms,
      totalStudents:       allResidents.length,
      pendingPayments:     0,
      pendingMaintenance:  allMaint.filter(m => m.status === 'Pending').length,
      pendingTours:        allTours.filter(t => t.status === 'pending').length,
    }
  });
}));

// ─────────────────────────────────────────────
// PAYMENT METHODS
// ─────────────────────────────────────────────
router.get('/payment-methods', asyncHandler(async (req, res) => {
  const { data: hostels } = await supabase.from('hostels').select('id, name').eq('manager_id', req.user.sub);
  const hostelIds = (hostels || []).map((h) => h.id);
  if (!hostelIds.length) return res.json({ paymentMethods: [] });

  const { data: methods, error: dbErr } = await supabase
    .from('hostel_payment_methods')
    .select('*')
    .in('hostel_id', hostelIds)
    .order('created_at', { ascending: false });

  if (dbErr) {
    if (dbErr.message?.includes('schema cache') || dbErr.message?.includes('not found')) {
      return res.json({ paymentMethods: [], note: 'Run MIGRATION_REQUIRED.sql to enable payment methods.' });
    }
    throw dbErr;
  }
  return res.json({ paymentMethods: methods || [] });
}));

router.post('/payment-methods', asyncHandler(async (req, res) => {
  const { hostelId, paymentType, accountName, accountNumber, bankName, branch, qrCode, instructions, isActive } = req.body;
  if (!hostelId || !paymentType || !accountName || !accountNumber) {
    return error(res, 'Hostel, payment type, account name, and account number are required', 400);
  }

  const { data: hostel } = await supabase
    .from('hostels')
    .select('id')
    .eq('id', hostelId)
    .eq('manager_id', req.user.sub)
    .maybeSingle();

  if (!hostel) return error(res, 'Hostel not found', 404);

  const { data: method, error: dbErr } = await supabase
    .from('hostel_payment_methods')
    .insert({
      hostel_id: hostelId,
      payment_type: String(paymentType).trim(),
      account_name: String(accountName).trim(),
      account_number: String(accountNumber).trim(),
      bank_name: String(bankName || '').trim(),
      branch: String(branch || '').trim(),
      qr_code: String(qrCode || '').trim(),
      instructions: String(instructions || '').trim(),
      is_active: isActive !== false,
    })
    .select()
    .single();

  if (dbErr) throw dbErr;
  return res.status(201).json({ message: 'Payment method saved', paymentMethod: method });
}));

router.put('/payment-methods/:id', asyncHandler(async (req, res) => {
  const { data: method, error: findErr } = await supabase
    .from('hostel_payment_methods')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle();

  if (findErr) throw findErr;
  if (!method) return error(res, 'Payment method not found', 404);

  const { data: hostel } = await supabase
    .from('hostels')
    .select('id')
    .eq('id', method.hostel_id)
    .eq('manager_id', req.user.sub)
    .maybeSingle();

  if (!hostel) return error(res, 'Payment method not found', 404);

  const { data: updated, error: dbErr } = await supabase
    .from('hostel_payment_methods')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();

  if (dbErr) throw dbErr;
  return res.json({ message: 'Payment method updated', paymentMethod: updated });
}));

router.delete('/payment-methods/:id', asyncHandler(async (req, res) => {
  const { data: method, error: findErr } = await supabase
    .from('hostel_payment_methods')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle();

  if (findErr) throw findErr;
  if (!method) return error(res, 'Payment method not found', 404);

  const { data: hostel } = await supabase
    .from('hostels')
    .select('id')
    .eq('id', method.hostel_id)
    .eq('manager_id', req.user.sub)
    .maybeSingle();

  if (!hostel) return error(res, 'Payment method not found', 404);

  const { error: dbErr } = await supabase.from('hostel_payment_methods').delete().eq('id', req.params.id);
  if (dbErr) throw dbErr;
  return res.json({ message: 'Payment method removed' });
}));

// ─────────────────────────────────────────────
// HOSTEL DOCUMENTS
// ─────────────────────────────────────────────
router.get('/documents', asyncHandler(async (req, res) => {
  const { data: hostels } = await supabase.from('hostels').select('id').eq('manager_id', req.user.sub);
  const hostelIds = (hostels || []).map((h) => h.id);
  if (!hostelIds.length) return res.json({ documents: [] });

  const { data: documents, error: dbErr } = await supabase
    .from('hostel_documents')
    .select('*')
    .in('hostel_id', hostelIds)
    .order('created_at', { ascending: false });

  if (dbErr) throw dbErr;
  return res.json({ documents: documents || [] });
}));

router.post('/documents', asyncHandler(async (req, res) => {
  const { hostelId, title, documentType, description, fileUrl } = req.body;
  if (!hostelId || !title || !documentType || !fileUrl) {
    return error(res, 'Hostel, title, document type, and file URL are required', 400);
  }

  const { data: hostel } = await supabase
    .from('hostels')
    .select('id')
    .eq('id', hostelId)
    .eq('manager_id', req.user.sub)
    .maybeSingle();

  if (!hostel) return error(res, 'Hostel not found', 404);

  const { data: document, error: dbErr } = await supabase
    .from('hostel_documents')
    .insert({
      hostel_id: hostelId,
      title: String(title).trim(),
      document_type: String(documentType).trim(),
      description: String(description || '').trim(),
      file_url: String(fileUrl).trim(),
      file_type: String(fileUrl).trim().toLowerCase().endsWith('.pdf') ? 'pdf' : 'file',
    })
    .select()
    .single();

  if (dbErr) throw dbErr;
  return res.status(201).json({ message: 'Hostel document uploaded', document });
}));

router.delete('/documents/:id', asyncHandler(async (req, res) => {
  const { data: document } = await supabase.from('hostel_documents').select('*').eq('id', req.params.id).maybeSingle();
  if (!document) return error(res, 'Document not found', 404);

  const { data: hostel } = await supabase.from('hostels').select('id').eq('id', document.hostel_id).eq('manager_id', req.user.sub).maybeSingle();
  if (!hostel) return error(res, 'Document not found', 404);

  const { error: dbErr } = await supabase.from('hostel_documents').delete().eq('id', req.params.id);
  if (dbErr) throw dbErr;
  return res.json({ message: 'Document removed' });
}));

// ─────────────────────────────────────────────
// AGREEMENTS
// ─────────────────────────────────────────────
router.get('/agreements', asyncHandler(async (req, res) => {
  const { data: hostels } = await supabase.from('hostels').select('id').eq('manager_id', req.user.sub);
  const hostelIds = (hostels || []).map((h) => h.id);
  if (!hostelIds.length) return res.json({ agreements: [] });

  const { data: agreements, error: dbErr } = await supabase
    .from('student_agreements')
    .select('*')
    .in('hostel_id', hostelIds)
    .order('created_at', { ascending: false });

  if (dbErr) throw dbErr;
  return res.json({ agreements: agreements || [] });
}));

// ─────────────────────────────────────────────
// ROOMS
// ─────────────────────────────────────────────
router.post('/rooms', asyncHandler(async (req, res) => {
  const { hostelId, blockName, roomNumber, capacity, status } = req.body;
  if (!hostelId || !roomNumber || !capacity) return error(res, 'Hostel, room number, and capacity are required', 400);

  const { data: hostel } = await supabase
    .from('hostels')
    .select('id, name')
    .eq('id', hostelId)
    .eq('manager_id', req.user.sub)
    .maybeSingle();

  if (!hostel) return error(res, 'Hostel not found', 404);

  const cap = Number(capacity);
  const { data: room, error: dbErr } = await supabase
    .from('rooms')
    .insert({
      hostel_id:   hostel.id,
      hostel_name: hostel.name,
      block_name:  blockName || 'Main Block',
      room_number: String(roomNumber).trim(),
      capacity:    cap,
      occupied:    0,
      available:   cap,
      status:      status || 'Available'
    })
    .select()
    .single();

  if (dbErr) throw dbErr;
  return res.status(201).json({ message: 'Room created successfully', room });
}));

router.get('/rooms', asyncHandler(async (req, res) => {
  const { data: hostels } = await supabase.from('hostels').select('id, name').eq('manager_id', req.user.sub);
  const hostelIds = (hostels || []).map(h => h.id);

  if (!hostelIds.length) return res.json({ rooms: [], hostels: [] });

  const { data: rooms, error: dbErr } = await supabase
    .from('rooms')
    .select('*')
    .in('hostel_id', hostelIds)
    .order('room_number', { ascending: true });

  if (dbErr) throw dbErr;
  return res.json({ rooms: rooms || [], hostels: hostels || [] });
}));

router.put('/rooms/:id', asyncHandler(async (req, res) => {
  const { data: hostels } = await supabase.from('hostels').select('id').eq('manager_id', req.user.sub);
  const hostelIds = (hostels || []).map(h => h.id);

  if (!hostelIds.length) return error(res, 'Room not found', 404);

  const { data: room, error: dbErr } = await supabase
    .from('rooms')
    .update(req.body)
    .eq('id', req.params.id)
    .in('hostel_id', hostelIds)
    .select()
    .single();

  if (dbErr || !room) return error(res, 'Room not found', 404);
  return res.json({ message: 'Room updated', room });
}));

// ─────────────────────────────────────────────
// STUDENTS
// ─────────────────────────────────────────────
router.post('/students', asyncHandler(async (req, res) => {
  const { name, email, phone, studentId, gender, institution, level, emergencyContact, hostelId, hostelName, roomId, roomNumber, balance } = req.body;
  if (!name || !email || !phone || !studentId) return error(res, 'Name, email, phone, and student ID are required', 400);

  if (hostelId) {
    const { data: hostel } = await supabase.from('hostels').select('id').eq('id', hostelId).eq('manager_id', req.user.sub).maybeSingle();
    if (!hostel) return error(res, 'Hostel not found', 404);
  }

  const passwordHash = await bcrypt.hash(String(studentId).slice(0, 6), 10);

  const { data: student, error: dbErr } = await supabase
    .from('students')
    .insert({
      name:              String(name).trim(),
      email:             String(email).trim().toLowerCase(),
      phone:             String(phone).trim(),
      student_id:        String(studentId).trim(),
      password:          passwordHash,
      role:              'student',
      manager_id:        req.user.sub,
      hostel_id:         hostelId || null,
      hostel_name:       hostelName || '',
      room_id:           roomId || null,
      room_number:       roomNumber || '',
      gender:            gender || '',
      institution:       institution || '',
      level:             level || '',
      emergency_contact: emergencyContact || '',
      balance:           Number(balance || 0),
      status:            'Active'
    })
    .select()
    .single();

  if (dbErr) throw dbErr;

  // Update room occupancy
  if (roomId) {
    const { data: room } = await supabase.from('rooms').select('capacity, occupied').eq('id', roomId).maybeSingle();
    if (room) {
      const occupied  = Math.min(room.capacity, (room.occupied || 0) + 1);
      const available = Math.max(0, room.capacity - occupied);
      await supabase.from('rooms').update({
        occupied,
        available,
        status: occupied >= room.capacity ? 'Occupied' : 'Available'
      }).eq('id', roomId);
    }
  }

  return res.status(201).json({ message: 'Resident registered successfully', student });
}));

router.get('/students', asyncHandler(async (req, res) => {
  const { data: students, error: dbErr } = await supabase
    .from('students')
    .select('*')
    .eq('manager_id', req.user.sub)
    .order('created_at', { ascending: false });

  if (dbErr) throw dbErr;
  return res.json({ students: students || [] });
}));

router.put('/students/:id', asyncHandler(async (req, res) => {
  const { data: student, error: dbErr } = await supabase
    .from('students')
    .update(req.body)
    .eq('id', req.params.id)
    .eq('manager_id', req.user.sub)
    .select()
    .single();

  if (dbErr || !student) return error(res, 'Student not found', 404);
  return res.json({ message: 'Student updated', student });
}));

router.delete('/students/:id', asyncHandler(async (req, res) => {
  const { data: student, error: dbErr } = await supabase
    .from('students')
    .delete()
    .eq('id', req.params.id)
    .eq('manager_id', req.user.sub)
    .select()
    .single();

  if (dbErr || !student) return error(res, 'Student not found', 404);
  return res.json({ message: 'Student removed' });
}));

// ─────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────
router.post('/payments', asyncHandler(async (req, res) => {
  const { studentId, amount, description, hostelId, hostelName } = req.body;
  if (!studentId || !amount) return error(res, 'Student and amount are required', 400);

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .eq('manager_id', req.user.sub)
    .maybeSingle();

  if (!student) return error(res, 'Student not found', 404);

  const newBalance = Math.max(0, Number(student.balance || 0) - Number(amount));

  const { data: tx, error: txErr } = await supabase
    .from('transactions')
    .insert({
      manager_id:    req.user.sub,
      hostel_id:     hostelId || student.hostel_id || null,
      hostel_name:   hostelName || student.hostel_name || 'Hostel',
      type:          'income',
      amount:        Number(amount),
      category:      'Rent Payment',
      description:   description || 'Hostel fee payment',
      student_name:  student.name,
      student_email: student.email,
      student_id:    student.student_id,
      due_amount:    newBalance
    })
    .select()
    .single();

  if (txErr) throw txErr;

  const { data: updatedStudent } = await supabase
    .from('students')
    .update({ balance: newBalance })
    .eq('id', studentId)
    .select()
    .single();

  return res.status(201).json({ message: 'Payment recorded successfully', transaction: tx, student: updatedStudent });
}));

// ─────────────────────────────────────────────
// MAINTENANCE
// ─────────────────────────────────────────────
router.post('/maintenance', asyncHandler(async (req, res) => {
  const { title, description, category, priority, studentId, studentName, hostelId, hostelName } = req.body;
  if (!title || !description) return error(res, 'Title and description are required', 400);

  const { data: request, error: dbErr } = await supabase
    .from('maintenance_requests')
    .insert({
      student_id:   studentId || null,
      student_name: studentName || '',
      hostel_id:    hostelId || null,
      hostel_name:  hostelName || '',
      title:        String(title).trim(),
      description:  String(description).trim(),
      category:     category || 'General',
      priority:     priority || 'Medium',
      status:       'Pending'
    })
    .select()
    .single();

  if (dbErr) throw dbErr;
  return res.status(201).json({ message: 'Maintenance request submitted', request });
}));

router.put('/maintenance/:id', asyncHandler(async (req, res) => {
  const { status, assignedTo, notes, photoAfterUrl } = req.body;

  const updates = {
    updated_at: new Date().toISOString()
  };
  if (status) updates.status = status;
  if (assignedTo) updates.assigned_to = String(assignedTo).trim();
  if (notes) updates.notes = String(notes).trim();
  if (photoAfterUrl) updates.photo_after_url = String(photoAfterUrl).trim();
  if (status === 'Completed') updates.completed_at = new Date().toISOString();

  const { data: request, error: dbErr } = await supabase
    .from('maintenance_requests')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (dbErr || !request) return error(res, 'Maintenance request not found', 404);

  // Send notification to student if student_id is set
  if (request.student_id) {
    try {
      await supabase.from('notifications').insert({
        user_id: request.student_id,
        title: `Maintenance Request ${status || 'Updated'}`,
        message: `Your maintenance request "${request.title}" for ${request.hostel_name || 'your hostel'} is now: ${status || 'Updated'}.`,
        type: status === 'Completed' ? 'success' : status === 'Rejected' ? 'danger' : 'info',
        entity_type: 'maintenance_request',
        entity_id: request.id
      });
    } catch {}
  }

  return res.json({ message: 'Maintenance request updated', request });
}));

router.get('/maintenance', asyncHandler(async (req, res) => {
  const { data: hostels } = await supabase.from('hostels').select('id').eq('manager_id', req.user.sub);
  const hostelIds = (hostels || []).map(h => h.id);

  if (!hostelIds.length) return res.json({ requests: [] });

  const { data: requests, error: dbErr } = await supabase
    .from('maintenance_requests')
    .select('*')
    .in('hostel_id', hostelIds)
    .order('created_at', { ascending: false });

  if (dbErr) throw dbErr;
  return res.json({ requests: requests || [] });
}));

// ─────────────────────────────────────────────
// ANNOUNCEMENTS
// ─────────────────────────────────────────────
router.post('/announcements', asyncHandler(async (req, res) => {
  const { title, message, type, audience } = req.body;
  if (!title || !message) return error(res, 'Title and message are required', 400);

  const { data: announcement, error: dbErr } = await supabase
    .from('announcements')
    .insert({ title, message, type: type || 'General', audience: audience || 'All', created_by: req.user.name || 'Manager' })
    .select()
    .single();

  if (dbErr) throw dbErr;
  return res.status(201).json({ announcement });
}));

router.get('/announcements', asyncHandler(async (req, res) => {
  const { data: hostels } = await supabase.from('hostels').select('id').eq('manager_id', req.user.sub);
  const hostelIds = (hostels || []).map(h => h.id);

  if (!hostelIds.length) return res.json({ announcements: [] });

  const { data: announcements, error: dbErr } = await supabase
    .from('announcements')
    .select('*')
    .in('hostel_id', hostelIds)
    .order('created_at', { ascending: false });

  if (dbErr) throw dbErr;
  return res.json({ announcements: announcements || [] });
}));

// ─────────────────────────────────────────────
// EXPENSES
// ─────────────────────────────────────────────
router.post('/expenses', asyncHandler(async (req, res) => {
  const { hostelId, amount, category, description } = req.body;
  if (!amount || !category || !description) return error(res, 'Amount, category, and description are required', 400);

  const managerId = req.user.sub;
  let hostelName  = 'General Operation';
  let resolvedHostelId = null;

  if (hostelId) {
    const { data: hostel } = await supabase.from('hostels').select('id, name').eq('id', hostelId).eq('manager_id', managerId).maybeSingle();
    if (hostel) { hostelName = hostel.name; resolvedHostelId = hostel.id; }
  }

  const { data: tx, error: dbErr } = await supabase
    .from('transactions')
    .insert({
      manager_id:  managerId,
      hostel_id:   resolvedHostelId,
      hostel_name: hostelName,
      type:        'expense',
      amount:      Number(amount),
      category:    String(category).trim(),
      description: String(description).trim()
    })
    .select()
    .single();

  if (dbErr) throw dbErr;
  return res.status(201).json({ message: 'Expense logged successfully', transaction: tx });
}));

// ─────────────────────────────────────────────
// BANK ACCOUNT
// ─────────────────────────────────────────────
router.post('/bank-account', asyncHandler(async (req, res) => {
  const { bankName, accountName, accountNumber } = req.body;
  if (!bankName || !accountName || !accountNumber) return error(res, 'All bank details are required', 400);

  await supabase.from('manager_profiles').upsert({
    id:             req.user.sub,
    bank_name:      String(bankName).trim(),
    account_name:   String(accountName).trim(),
    account_number: String(accountNumber).trim(),
  });

  return res.json({
    message: 'Bank account linked successfully',
    bankDetails: { bankName, accountName, accountNumber }
  });
}));

// ─────────────────────────────────────────────
// TOUR REQUESTS
// ─────────────────────────────────────────────
router.patch('/tour-requests/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const VALID = ['pending', 'confirmed', 'cancelled', 'completed'];
  if (!VALID.includes(status)) return error(res, `Invalid status. Must be one of: ${VALID.join(', ')}`, 400);

  // Verify the manager owns this tour request's hostel
  const { data: tr } = await supabase.from('tour_requests').select('id, hostel_id, name').eq('id', id).maybeSingle();
  if (!tr) return error(res, 'Tour request not found', 404);

  const { data: hostel } = await supabase.from('hostels').select('id, manager_id').eq('id', tr.hostel_id).maybeSingle();
  if (!hostel || hostel.manager_id !== req.user.sub) return error(res, 'Unauthorized: this tour request does not belong to your hostel', 403);

  const updates = { status, updated_at: new Date().toISOString() };
  if (notes) updates.special_notes = String(notes).trim();

  const { data: updated, error: dbErr } = await supabase.from('tour_requests').update(updates).eq('id', id).select().single();
  if (dbErr) throw dbErr;

  return res.json({ message: `Tour request ${status} successfully`, tourRequest: updated });
}));

module.exports = router;

