const express = require('express');
const bcrypt = require('bcryptjs');
const { createAuthToken, authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { success, error } = require('../utils/apiResponse');

const Student = require('../models/Student');
const Manager = require('../models/Manager');
const Admin = require('../models/Admin');

const router = express.Router();

// SIGN UP
router.post('/signup', asyncHandler(async (req, res) => {
  const { role = 'student', name, email, phone, password, studentId } = req.body;
  
  if (!name || !email || !phone || !password || (role === 'student' && !studentId)) {
    return error(res, 'All required signup fields must be filled', 400);
  }

  const emailLower = String(email).trim().toLowerCase();

  const [dupStudent, dupManager, dupAdmin] = await Promise.all([
    Student.findOne({ email: emailLower }),
    Manager.findOne({ email: emailLower }),
    Admin.findOne({ email: emailLower })
  ]);

  if (dupStudent || dupManager || dupAdmin) {
    return error(res, 'An account with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  if (role === 'manager') {
    const manager = await Manager.create({
      name: String(name).trim(),
      email: emailLower,
      phone: String(phone).trim(),
      password: passwordHash,
      role: 'manager'
    });
    const token = createAuthToken(manager._id.toString(), { role: 'manager', name: manager.name });
    return res.status(201).json({ token, user: { id: manager._id, name: manager.name, email: manager.email, role: 'manager' }, message: 'Manager account created' });
  } else {
    const student = await Student.create({
      name:      String(name).trim(),
      email:     emailLower,
      phone:     String(phone).trim(),
      studentId: String(studentId).trim(),
      password:  passwordHash,
      role:      'student'
    });
    const token = createAuthToken(student._id.toString(), { role: 'student', name: student.name });
    return res.status(201).json({ token, user: { id: student._id, name: student.name, email: student.email, role: 'student' }, message: 'Student account created' });
  }
}));

// LOGIN
router.post('/login', asyncHandler(async (req, res) => {
  const { email = '', password = '' } = req.body;
  const emailLower = String(email).trim().toLowerCase();

  let user = await Student.findOne({ email: emailLower });
  let role = 'student';

  if (!user) { user = await Manager.findOne({ email: emailLower }); role = 'manager'; }
  if (!user) { user = await Admin.findOne({ email: emailLower });   role = 'admin'; }

  if (!user) return error(res, 'Invalid credentials', 401);

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return error(res, 'Invalid credentials', 401);

  const token = createAuthToken(user._id.toString(), { role, name: user.name });
  return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role }, message: `${role.charAt(0).toUpperCase() + role.slice(1)} login successful` });
}));

// GET ME
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  let user = null;
  if (req.user.role === 'manager')     user = await Manager.findById(req.user.sub);
  else if (req.user.role === 'admin')  user = await Admin.findById(req.user.sub);
  else                                 user = await Student.findById(req.user.sub);

  if (!user) return error(res, 'User not found', 404);

  return res.json({ user: { id: user._id, name: user.name, email: user.email, role: req.user.role, bankDetails: user.bankDetails || null, phone: user.phone || '' } });
}));

module.exports = router;
