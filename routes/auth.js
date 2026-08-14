const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { error } = require('../utils/apiResponse');
const supabase = require('../config/supabase');
const { supabaseAnon } = require('../config/supabase');

const router = express.Router();

// ─────────────────────────────────────────────
// Helper: ensure user_profile row exists
// ─────────────────────────────────────────────
async function ensureUserProfile(authUser) {
  const meta = authUser.user_metadata || {};
  const appMeta = authUser.app_metadata || {};
  const role   = appMeta.role  || meta.role  || 'student';
  const name   = meta.name     || meta.full_name || authUser.email.split('@')[0];
  const status = appMeta.status || meta.status || (role === 'manager' ? 'pending' : 'active');

  const { data: existing } = await supabase
    .from('user_profiles')
    .select('id, role, status, name')
    .eq('id', authUser.id)
    .maybeSingle();

  if (!existing) {
    await supabase.from('user_profiles').insert({
      id:     authUser.id,
      email:  authUser.email,
      name,
      role,
      status,
      phone:  meta.phone || '',
    }).select().single();
  }

  return { role: existing?.role || role, status: existing?.status || status, name: existing?.name || name };
}

// ─────────────────────────────────────────────
// SIGN UP — Student
// ─────────────────────────────────────────────
router.post('/signup', asyncHandler(async (req, res) => {
  const { name, email, phone, password, studentIndex, institution, faculty, department, level } = req.body;

  if (!name || !email || !password) {
    return error(res, 'Name, email, and password are required', 400);
  }
  if (!phone) return error(res, 'Phone number is required', 400);

  const emailLower = String(email).trim().toLowerCase();

  // Create auth user
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: emailLower,
    password,
    email_confirm: true,
    user_metadata: {
      name: String(name).trim(),
      phone: String(phone).trim(),
      role: 'student',
      student_index: String(studentIndex || '').trim(),
      institution: String(institution || 'UMaT').trim(),
    }
  });

  if (authErr) {
    if (authErr.message?.includes('already registered') || authErr.message?.includes('already been registered')) {
      return error(res, 'An account with this email already exists', 409);
    }
    throw authErr;
  }

  const authUser = authData.user;

  // Set role in app_metadata (authoritative)
  await supabase.auth.admin.updateUserById(authUser.id, {
    app_metadata: { role: 'student', status: 'active' }
  });

  // Create user_profile row
  await supabase.from('user_profiles').insert({
    id: authUser.id, email: emailLower,
    name: String(name).trim(), role: 'student', status: 'active',
    phone: String(phone).trim(),
  });

  // Create student_profile row
  await supabase.from('student_profiles').insert({
    id:           authUser.id,
    student_index: String(studentIndex || '').trim(),
    institution:  String(institution || 'UMaT').trim(),
    faculty:      String(faculty || '').trim(),
    department:   String(department || '').trim(),
    level:        String(level || '').trim(),
  });

  // Sign in to get session tokens
  const { data: session, error: signInErr } = await supabaseAnon.auth.signInWithPassword({
    email: emailLower, password
  });

  if (signInErr) {
    return res.status(201).json({
      message: 'Account created successfully. Please sign in.',
      user: { id: authUser.id, email: emailLower, role: 'student', status: 'active', name: String(name).trim() }
    });
  }

  return res.status(201).json({
    token:         session.session.access_token,
    refresh_token: session.session.refresh_token,
    user: {
      id:     authUser.id,
      email:  emailLower,
      name:   String(name).trim(),
      role:   'student',
      status: 'active',
    },
    message: 'Account created successfully'
  });
}));

// ─────────────────────────────────────────────
// MANAGER APPLICATION (Sign up as prospective manager)
// Status set to pending until approved by Admin
// ─────────────────────────────────────────────
router.post('/manager-apply', asyncHandler(async (req, res) => {
  const {
    name, email, phone, password,
    hostelNameApplied, hostelLocationApplied, hostelDescriptionApplied,
    numRoomsApplied, capacityApplied, applicationNotes
  } = req.body;

  if (!name || !email || !password) {
    return error(res, 'Name, email, and password are required', 400);
  }
  if (!phone) return error(res, 'Phone number is required', 400);

  const emailLower = String(email).trim().toLowerCase();

  // Create auth user
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: emailLower,
    password,
    email_confirm: true,
    user_metadata: {
      name: String(name).trim(),
      phone: String(phone).trim(),
      role: 'manager',
      status: 'pending',
    }
  });

  if (authErr) {
    if (authErr.message?.includes('already registered') || authErr.message?.includes('already been registered')) {
      return error(res, 'An account with this email already exists', 409);
    }
    throw authErr;
  }

  const authUser = authData.user;

  // Set role in app_metadata
  await supabase.auth.admin.updateUserById(authUser.id, {
    app_metadata: { role: 'manager', status: 'pending' }
  });

  // Create user_profile row
  await supabase.from('user_profiles').insert({
    id: authUser.id, email: emailLower,
    name: String(name).trim(), role: 'manager', status: 'pending',
    phone: String(phone).trim(),
  });

  // Create manager_profile row
  await supabase.from('manager_profiles').insert({
    id: authUser.id,
    phone: String(phone).trim(),
    hostel_name_applied: String(hostelNameApplied || '').trim(),
    hostel_location_applied: String(hostelLocationApplied || '').trim(),
    hostel_description_applied: String(hostelDescriptionApplied || '').trim(),
    num_rooms_applied: Number(numRoomsApplied) || 0,
    capacity_applied: Number(capacityApplied) || 0,
    application_notes: String(applicationNotes || '').trim(),
    is_verified: false,
  });

  // Sign in to get session tokens
  const { data: session, error: signInErr } = await supabaseAnon.auth.signInWithPassword({
    email: emailLower, password
  });

  if (signInErr) {
    return res.status(201).json({
      message: 'Application submitted successfully. Awaiting administrator review.',
      user: { id: authUser.id, email: emailLower, role: 'manager', status: 'pending', name: String(name).trim() }
    });
  }

  return res.status(201).json({
    token: session.session.access_token,
    refresh_token: session.session.refresh_token,
    user: {
      id: authUser.id,
      email: emailLower,
      name: String(name).trim(),
      role: 'manager',
      status: 'pending',
    },
    message: 'Application submitted successfully'
  });
}));


// ─────────────────────────────────────────────
// LOGIN — Email + Password
// ─────────────────────────────────────────────
router.post('/login', asyncHandler(async (req, res) => {
  const { email = '', password = '' } = req.body;
  if (!email || !password) return error(res, 'Email and password are required', 400);

  const emailLower = String(email).trim().toLowerCase();

  // Sign in via anon client
  const { data, error: signInErr } = await supabaseAnon.auth.signInWithPassword({
    email: emailLower,
    password
  });

  if (signInErr) {
    // Supabase returns "Invalid login credentials" for wrong password
    return error(res, 'Invalid email or password', 401);
  }

  const authUser = data.user;
  const session  = data.session;
  const meta     = authUser.user_metadata  || {};
  const appMeta  = authUser.app_metadata   || {};

  // Authoritative role comes from app_metadata (set server-side)
  // Fall back to user_metadata for older accounts
  const role   = appMeta.role   || meta.role   || 'student';
  const status = appMeta.status || meta.status || 'active';
  const name   = meta.name      || meta.full_name || emailLower.split('@')[0];

  // Ensure profile row exists (handles Google OAuth first-login)
  await ensureUserProfile(authUser);

  const requireReset = appMeta.force_password_reset === true;

  return res.json({
    token:         session.access_token,
    refresh_token: session.refresh_token,
    expires_in:    session.expires_in,
    user: { id: authUser.id, email: authUser.email, name, role, status, requireReset },
    message: 'Signed in successfully'
  });
}));

// ─────────────────────────────────────────────
// RESET TEMPORARY PASSWORD
// ─────────────────────────────────────────────
router.post('/reset-temporary-password', authenticateToken, asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return error(res, 'New password must be at least 8 characters long', 400);
  }

  // Update password and clear force_password_reset flag
  const { error: updateErr } = await supabase.auth.admin.updateUserById(req.user.id, {
    password: newPassword,
    app_metadata: { force_password_reset: false }
  });

  if (updateErr) throw updateErr;

  return res.json({ message: 'Password updated successfully' });
}));


// ─────────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────────
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return error(res, 'refresh_token is required', 400);

  const { data, error: refreshErr } = await supabaseAnon.auth.refreshSession({ refresh_token });
  if (refreshErr) return error(res, 'Session expired. Please sign in again.', 401);

  const u = data.user;
  const s = data.session;
  const meta    = u.user_metadata || {};
  const appMeta = u.app_metadata  || {};
  const role    = appMeta.role   || meta.role   || 'student';
  const status  = appMeta.status || meta.status || 'active';

  return res.json({
    token:         s.access_token,
    refresh_token: s.refresh_token,
    expires_in:    s.expires_in,
    user: { id: u.id, email: u.email, name: meta.name || u.email, role, status }
  });
}));

// ─────────────────────────────────────────────
// FORGOT PASSWORD — Send reset email
// ─────────────────────────────────────────────
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return error(res, 'Email is required', 400);

  // We use generateLink to create a reset link
  const { error: linkErr } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: String(email).trim().toLowerCase(),
  });

  // Always return success (don't reveal if email exists)
  if (linkErr) console.warn('Password reset link warn:', linkErr.message);

  return res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
}));

// ─────────────────────────────────────────────
// LOGOUT — Invalidate session server-side
// ─────────────────────────────────────────────
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  // Revoke the session
  try {
    await supabase.auth.admin.signOut(req.user.sub, 'local');
  } catch {}
  return res.json({ message: 'Logged out successfully' });
}));

// ─────────────────────────────────────────────
// GET ME — Return current user from token
// ─────────────────────────────────────────────
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const { sub, role, name, email, status } = req.user;

  // Get profile from database for full details
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', sub)
    .maybeSingle();

  const effectiveRole   = profile?.role   || role;
  const effectiveStatus = profile?.status || status;

  const responseUser = {
    id:     sub,
    email:  email || profile?.email,
    name:   profile?.name || name,
    role:   effectiveRole,
    status: effectiveStatus,
    phone:  profile?.phone || '',
    avatarUrl: profile?.avatar_url || '',
  };

  // Add student-specific data
  if (effectiveRole === 'student') {
    const { data: sp } = await supabase.from('student_profiles').select('*').eq('id', sub).maybeSingle();
    if (sp) {
      Object.assign(responseUser, {
        studentIndex:      sp.student_index || '',
        institution:       sp.institution || 'UMaT',
        faculty:           sp.faculty || '',
        department:        sp.department || '',
        programme:         sp.programme || sp.department || 'Engineering',
        level:             sp.level || '100',
        gender:            sp.gender || 'Not specified',
        emergencyContact:  sp.emergency_contact || '',
        profilePhoto:      sp.profile_photo || profile?.avatar_url || '',
        preferredRoomType: sp.preferred_room_type || '1_in_room',
        currentHostelId:   sp.current_hostel_id || null,
        hostelName:        sp.hostel_name || '',
        roomNumber:        sp.room_number || '',
        balance:           sp.balance || 0,
        createdAt:         sp.created_at || profile?.created_at
      });
    }
  }

  // Add manager-specific data
  if (effectiveRole === 'manager') {
    const { data: mp } = await supabase.from('manager_profiles').select('*').eq('id', sub).maybeSingle();
    if (mp) {
      Object.assign(responseUser, {
        applicationInfo: {
          hostelNameApplied:        mp.hostel_name_applied || '',
          hostelLocationApplied:    mp.hostel_location_applied || '',
          hostelDescriptionApplied: mp.hostel_description_applied || '',
          numRoomsApplied:          mp.num_rooms_applied || 0,
          capacityApplied:          mp.capacity_applied || 0,
          applicationNotes:         mp.application_notes || '',
          rejectionReason:          mp.rejection_reason || '',
          reviewedAt:               mp.reviewed_at || null,
          assignedHostelId:         mp.assigned_hostel_id || null,
        },
        isVerified: mp.is_verified || false,
        bankDetails: mp.bank_name ? {
          bankName:      mp.bank_name,
          accountName:   mp.account_name,
          accountNumber: mp.account_number,
        } : null,
      });
    }
  }

  return res.json({ user: responseUser });
}));




// ─────────────────────────────────────────────
// AI HOSTEL RECOMMENDATIONS FOR STUDENT
// ─────────────────────────────────────────────
router.get('/student/recommendations', authenticateToken, asyncHandler(async (req, res) => {
  const { data: hostels } = await supabase.from('hostels').select('*').eq('is_published', true).limit(20);
  const { data: sp } = await supabase.from('student_profiles').select('*').eq('id', req.user.sub).maybeSingle();

  const prefType  = sp?.preferred_room_type || '1_in_room';
  const prefGender = sp?.gender || 'Co-ed';

  // Compute algorithmic recommendation score (0-100%)
  const list = (hostels || []).map(h => {
    let score = 85;
    if (h.verification_status === 'premium_partner') score += 10;
    if (h.verification_status === 'featured') score += 7;
    if (h.verification_status === 'verified') score += 5;
    if (h.gender_preference === 'Co-ed' || h.gender_preference === prefGender) score += 3;

    score = Math.min(99, Math.max(78, score));

    return {
      ...h,
      id: h.id,
      matchScore: score,
      matchBadge: `${score}% Match for You`
    };
  }).sort((a, b) => b.matchScore - a.matchScore);

  return res.json({ recommendations: list });
}));

// ─────────────────────────────────────────────
// GOOGLE OAUTH — Exchange code for session
// ─────────────────────────────────────────────
router.post('/oauth/google', asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) return error(res, 'OAuth code is required', 400);

  const { data, error: oauthErr } = await supabaseAnon.auth.exchangeCodeForSession(code);
  if (oauthErr) return error(res, 'OAuth authentication failed', 401);

  const authUser = data.user;
  const meta     = authUser.user_metadata || {};
  const appMeta  = authUser.app_metadata  || {};

  // For new Google users, set role to 'student' if not set
  if (!appMeta.role) {
    await supabase.auth.admin.updateUserById(authUser.id, {
      app_metadata: { role: 'student', status: 'active' }
    });
  }

  const role   = appMeta.role   || 'student';
  const status = appMeta.status || 'active';

  // Ensure profile exists
  await ensureUserProfile({ ...authUser, app_metadata: { role, status, ...appMeta } });

  return res.json({
    token:         data.session.access_token,
    refresh_token: data.session.refresh_token,
    user: {
      id:     authUser.id,
      email:  authUser.email,
      name:   meta.name || meta.full_name || authUser.email,
      role,
      status,
    }
  });
}));

// ─────────────────────────────────────────────
// STUDENT PORTAL DATA
// ─────────────────────────────────────────────
router.get('/student/portal', authenticateToken, asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') return error(res, 'Student access only', 403);
  const userId = req.user.sub;
  const isMissing = e => e && (e.message?.includes('schema cache') || e.message?.includes('not found') || e.code === '42P01' || e.code === 'PGRST205' || e.message?.includes('does not exist'));
  const { getStore } = require('../utils/localStore');
  const store = getStore();

  // Try new tables; fall back to empty objects if not yet created
  let sp = null, up = null;
  try {
    const spR = await supabase.from('student_profiles').select('*').eq('id', userId).maybeSingle();
    if (!isMissing(spR.error)) sp = spR.data;
  } catch {}
  try {
    const upR = await supabase.from('user_profiles').select('*').eq('id', userId).maybeSingle();
    if (!isMissing(upR.error)) up = upR.data;
  } catch {}

  const student = { ...(up || {}), ...(sp || {}), id: userId, email: req.user.email, name: req.user.name };
  const hostelId = sp?.hostel_id || null;

  const [maintRes, payRes, subRes, recRes, notifRes, docRes, annRes] = await Promise.all([
    supabase.from('maintenance_requests').select('*').eq('student_id', userId).order('created_at', { ascending: false }),
    supabase.from('payments').select('*').eq('student_id', userId).order('created_at', { ascending: false }),
    supabase.from('payment_submissions').select('*').eq('student_id', userId).order('created_at', { ascending: false }),
    supabase.from('receipts').select('*').eq('student_id', userId).order('created_at', { ascending: false }),
    supabase.from('notifications').select('*').eq('student_id', userId).order('created_at', { ascending: false }),
    hostelId ? supabase.from('hostel_documents').select('*').eq('hostel_id', hostelId) : Promise.resolve({ data: [] }),
    supabase.from('announcements').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(10),
  ]);

  const payments = (!payRes.error && payRes.data?.length) ? payRes.data : store.payments.filter(p => p.student_id === userId);
  const paymentSubmissions = (!subRes.error && subRes.data?.length) ? subRes.data : store.payment_submissions.filter(s => s.student_id === userId);
  const receipts = (!recRes.error && recRes.data?.length) ? recRes.data : store.receipts.filter(r => r.student_id === userId);
  const notifications = (!notifRes.error && notifRes.data?.length) ? notifRes.data : store.notifications.filter(n => n.student_id === userId || !n.student_id);

  return res.json({
    student,
    maintenance:        isMissing(maintRes.error) ? [] : (maintRes.data || []),
    payments,
    paymentSubmissions,
    receipts,
    notifications,
    documents:          isMissing(docRes.error)   ? [] : (docRes.data   || []),
    announcements:      isMissing(annRes.error)   ? [] : (annRes.data   || []),
    agreements:         [],
  });
}));

// ─────────────────────────────────────────────
// UPDATE STUDENT PROFILE
// ─────────────────────────────────────────────
router.put('/student/profile', authenticateToken, asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') return error(res, 'Student access only', 403);
  const { name, phone, gender, institution, faculty, department, level, emergencyContact, studentIndex } = req.body;
  const isMissing = e => e && (e.message?.includes('schema cache') || e.message?.includes('not found') || e.message?.includes('does not exist'));

  const profileUpdates = {};
  if (name  !== undefined) profileUpdates.name  = String(name).trim();
  if (phone !== undefined) profileUpdates.phone = String(phone).trim();
  if (Object.keys(profileUpdates).length > 0) {
    try {
      const r = await supabase.from('user_profiles').update(profileUpdates).eq('id', req.user.sub);
      if (isMissing(r.error) && profileUpdates.name) {
        await supabase.auth.admin.updateUserById(req.user.sub, { user_metadata: { name: profileUpdates.name } });
      } else if (!r.error && profileUpdates.name) {
        await supabase.auth.admin.updateUserById(req.user.sub, { user_metadata: { name: profileUpdates.name } });
      }
    } catch {
      if (profileUpdates.name) await supabase.auth.admin.updateUserById(req.user.sub, { user_metadata: { name: profileUpdates.name } }).catch(() => {});
    }
  }

  const spUpdates = {};
  if (gender           !== undefined) spUpdates.gender            = gender;
  if (institution      !== undefined) spUpdates.institution       = institution;
  if (faculty          !== undefined) spUpdates.faculty           = faculty;
  if (department       !== undefined) spUpdates.department        = department;
  if (level            !== undefined) spUpdates.level             = level;
  if (emergencyContact !== undefined) spUpdates.emergency_contact = emergencyContact;
  if (studentIndex     !== undefined) spUpdates.student_index     = studentIndex;

  if (Object.keys(spUpdates).length > 0) {
    try { await supabase.from('student_profiles').upsert({ id: req.user.sub, ...spUpdates }); } catch {}
  }

  return res.json({ message: 'Profile updated successfully' });
}));

// ─────────────────────────────────────────────
// STUDENT MAINTENANCE SUBMISSION
// ─────────────────────────────────────────────
router.post('/student/maintenance', authenticateToken, asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') return error(res, 'Student access only', 403);

  // Try to get hostel_id from student_profiles (non-fatal if table missing)
  let hostelId = null;
  try {
    const { data: sp } = await supabase.from('student_profiles').select('hostel_id').eq('id', req.user.sub).maybeSingle();
    hostelId = sp?.hostel_id || null;
  } catch {}

  const { title, description, category = 'General', priority = 'Medium' } = req.body;
  if (!title || !description) return error(res, 'Title and description are required', 400);

  const payload = {
    student_id:   req.user.sub,
    student_name: req.user.name,
    hostel_id:    hostelId,
    hostel_name:  '',
    title:        String(title).trim(),
    description:  String(description).trim(),
    category, priority, status: 'Pending'
  };

  let request, dbErr;
  ({ data: request, error: dbErr } = await supabase
    .from('maintenance_requests')
    .insert(payload).select().single());

  // If FK violation (student not in legacy students table), retry without student_id
  if (dbErr && dbErr.code === '23503' && dbErr.message?.includes('student_id')) {
    ({ data: request, error: dbErr } = await supabase
      .from('maintenance_requests')
      .insert({ ...payload, student_id: null }).select().single());
  }

  if (dbErr) throw dbErr;
  return res.status(201).json({ message: 'Maintenance request submitted', request });
}));

// ─────────────────────────────────────────────
// MANAGER APPLICATION STATUS
// ─────────────────────────────────────────────
router.get('/manager/application-status', authenticateToken, asyncHandler(async (req, res) => {
  if (req.user.role !== 'manager') return error(res, 'Manager access only', 403);

  const { data: up } = await supabase.from('user_profiles').select('status, name, email, phone').eq('id', req.user.sub).maybeSingle();
  const { data: mp } = await supabase.from('manager_profiles').select('*').eq('id', req.user.sub).maybeSingle();

  if (!up) return error(res, 'Profile not found', 404);

  return res.json({
    status: up.status || 'pending',
    applicationInfo: {
      name:                     up.name || '',
      email:                    up.email || '',
      phone:                    up.phone || mp?.phone || '',
      hostelNameApplied:        mp?.hostel_name_applied || '',
      hostelLocationApplied:    mp?.hostel_location_applied || '',
      hostelDescriptionApplied: mp?.hostel_description_applied || '',
      numRoomsApplied:          mp?.num_rooms_applied || 0,
      capacityApplied:          mp?.capacity_applied || 0,
      applicationNotes:         mp?.application_notes || '',
      rejectionReason:          mp?.rejection_reason || '',
      reviewedAt:               mp?.reviewed_at || null,
    }
  });
}));

// ─────────────────────────────────────────────
// MARK NOTIFICATION AS READ
// ─────────────────────────────────────────────
router.patch('/notifications/:id/read', authenticateToken, asyncHandler(async (req, res) => {
  const { error: dbErr } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', req.params.id)
    .eq('student_id', req.user.sub);
  if (dbErr) throw dbErr;
  return res.json({ message: 'Notification marked as read' });
}));

// ─────────────────────────────────────────────
// STUDENT AGREEMENT SUBMISSION
// ─────────────────────────────────────────────
router.post('/student/agreement', authenticateToken, asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') return error(res, 'Student access only', 403);
  const { hostelId, hostelName, roomType, digitalSignature, rulesReviewed, termsAccepted } = req.body;
  if (!hostelId || !digitalSignature) return error(res, 'Hostel ID and Digital Signature are required', 400);

  const { data: agreement, error: dbErr } = await supabase
    .from('student_agreements')
    .insert({
      student_id: req.user.sub,
      student_name: req.user.name,
      hostel_id: hostelId, hostel_name: hostelName || '',
      room_type: roomType || '',
      rules_reviewed: !!rulesReviewed, terms_accepted: !!termsAccepted,
      digital_signature: String(digitalSignature).trim(),
      signed_at: new Date().toISOString(),
    }).select().single();

  if (dbErr) throw dbErr;
  return res.status(201).json({ message: 'Agreement signed', agreement });
}));

// ─────────────────────────────────────────────
// Utility: Log admin audit
// ─────────────────────────────────────────────
async function logAudit(adminId, adminName, action, entityType, entityId, entityName, details = {}) {
  try {
    await supabase.from('admin_audit_log').insert({
      admin_id: adminId || null,
      admin_name: String(adminName || 'System'),
      action: String(action),
      entity_type: String(entityType || ''),
      entity_id: String(entityId || ''),
      entity_name: String(entityName || ''),
      details: details || {}
    });
  } catch { /* non-fatal */ }
}

module.exports = router;
