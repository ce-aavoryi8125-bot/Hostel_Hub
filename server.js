require('dotenv').config();

const express    = require('express');
const path       = require('path');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const multer     = require('multer');
const cors       = require('cors');
const mongoose   = require('mongoose');
const fs         = require('fs');

const Student     = require('./models/Student');
const Manager     = require('./models/Manager');
const Admin       = require('./models/Admin');
const Hostel      = require('./models/Hostel');
const Transaction = require('./models/Transaction');
const Visit       = require('./models/Visit');
const TourRequest = require('./models/TourRequest');

const app         = express();
const PORT        = process.env.PORT        || 3000;
const JWT_SECRET  = process.env.JWT_SECRET  || 'hostel-hub-secret';
const MONGO_URI   = process.env.MONGO_URI;
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// ─── Connect to MongoDB ────────────────────────────────────────────────────────
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas');
    await seedDefaults();
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// ─── Seed default data on first boot ──────────────────────────────────────────
async function seedDefaults() {
  // Default admin
  const adminExists = await Admin.findOne({ email: 'admin@hostelhub.dev' });
  if (!adminExists) {
    await Admin.create({
      name:     'Hostel Hub Admin',
      email:    'admin@hostelhub.dev',
      password: await bcrypt.hash('admin123', 10),
      role:     'admin'
    });
    console.log('✅ Default admin seeded');
  }

  // Default manager
  const managerExists = await Manager.findOne({ email: 'manager@hostelhub.dev' });
  if (!managerExists) {
    await Manager.create({
      name:     'John Owusu',
      email:    'manager@hostelhub.dev',
      phone:    '+233 24 111 2222',
      password: await bcrypt.hash('manager123', 10),
      role:     'manager',
      bankDetails: {
        bankName:      'Ghana Commercial Bank',
        accountName:   'John Owusu Hostel Ventures',
        accountNumber: '1029384756'
      }
    });
    console.log('✅ Default manager seeded');
  }

  // Default hostels
  const hostelCount = await Hostel.countDocuments();
  if (hostelCount === 0) {
    const manager = await Manager.findOne({ email: 'manager@hostelhub.dev' });
    const mId    = manager ? manager._id.toString() : 'manager-1';

    await Hostel.insertMany([
      {
        name:         'Tarkwa Hostel Haven',
        location:     'Agric Hill',
        address:      'Near UMaT Gate',
        pricePerYear: 4500,
        rating:       4.8,
        mapsUrl:      'https://maps.google.com/?q=Tarkwa+UMaT+Hostel',
        facilities:   ['Wi-Fi', 'Power backup', 'Water', 'Security'],
        agentName:    'Ama Mensah',
        agentPhone:   '+233 20 123 4567',
        agentEmail:   'ama@hostelhub.dev',
        managerId:    mId,
        managerName:  'John Owusu',
        managerPhone: '+233 24 111 2222',
        managerEmail: 'manager@hostelhub.dev',
        description:  'Popular hostel near the university for students who want safe, clean accommodation with agent support.',
        photos: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'
        ],
        roomTypes: {
          '1-in-a-room': { price: 9000, gallery: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'] },
          '2-in-a-room': { price: 7000, gallery: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80'] },
          '3-in-a-room': { price: 5500, gallery: ['https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'] },
          '4-in-a-room': { price: 4500, gallery: ['https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80'] }
        },
        kitchenPhotos: ['https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=900&q=80'],
        visits: 0
      },
      {
        name:         'University Vista Lodge',
        location:     'Akyempim',
        address:      'Opposite UMaT East Gate',
        pricePerYear: 5000,
        rating:       4.6,
        mapsUrl:      'https://maps.google.com/?q=University+Vista+Lodge+Tarkwa',
        facilities:   ['Laundry', 'Study hall', 'Water', 'Wi-Fi'],
        agentName:    'Kwame Boateng',
        agentPhone:   '+233 24 987 6543',
        agentEmail:   'kwame@hostelhub.dev',
        managerId:    mId,
        managerName:  'John Owusu',
        managerPhone: '+233 24 111 2222',
        managerEmail: 'manager@hostelhub.dev',
        description:  'A student-friendly lodge with roomy shared spaces and easy access to campus transport.',
        photos: [
          'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80'
        ],
        roomTypes: {
          '2-in-a-room': { price: 8000, gallery: ['https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'] },
          '4-in-a-room': { price: 5000, gallery: ['https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80'] }
        },
        kitchenPhotos: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'],
        visits: 0
      }
    ]);

    // Seed sample transactions
    await Transaction.insertMany([
      {
        managerId:    mId,
        hostelId:     'hostel-seed-1',
        hostelName:   'Tarkwa Hostel Haven',
        type:         'income',
        amount:       4500,
        category:     'Rent Payment',
        description:  '4-in-a-room rent paid by Albert Appiah',
        studentName:  'Albert Appiah',
        studentEmail: 'albert@umat.edu.gh'
      },
      {
        managerId:   mId,
        hostelId:    'hostel-seed-1',
        hostelName:  'Tarkwa Hostel Haven',
        type:        'expense',
        amount:      120,
        category:    'Electricity',
        description: 'ECG prepaid credit purchase'
      },
      {
        managerId:   mId,
        hostelId:    'hostel-seed-1',
        hostelName:  'Tarkwa Hostel Haven',
        type:        'expense',
        amount:      80,
        category:    'Maintenance',
        description: 'Plumber fee to fix kitchen sink'
      }
    ]);

    console.log('✅ Default hostels and transactions seeded');
  }
}

// ─── Middleware ────────────────────────────────────────────────────────────────
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename:    (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    cb(null, safeName);
  }
});
const upload = multer({ storage });

// ─── Auth Helpers ──────────────────────────────────────────────────────────────
function createAuthToken(subject, extra = {}) {
  return jwt.sign({ sub: subject, ...extra }, JWT_SECRET, { expiresIn: '7d' });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing bearer token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access only' });
  next();
}

function requireManager(req, res, next) {
  if (!req.user || req.user.role !== 'manager') return res.status(403).json({ message: 'Manager access only' });
  next();
}

function requireManagerOrAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'manager' && req.user.role !== 'admin')) return res.status(403).json({ message: 'Manager or Admin access only' });
  next();
}

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Hostel Hub API running', db: mongoose.connection.readyState === 1 ? 'MongoDB' : 'disconnected' });
});

// SIGN UP
app.post('/api/signup', async (req, res) => {
  try {
    const { role = 'student', name, email, phone, password, studentId } = req.body;
    if (!name || !email || !phone || !password || (role === 'student' && !studentId)) {
      return res.status(400).json({ message: 'All required signup fields must be filled' });
    }

    const emailLower = String(email).trim().toLowerCase();

    const [dupStudent, dupManager, dupAdmin] = await Promise.all([
      Student.findOne({ email: emailLower }),
      Manager.findOne({ email: emailLower }),
      Admin.findOne({ email: emailLower })
    ]);

    if (dupStudent || dupManager || dupAdmin) {
      return res.status(409).json({ message: 'An account with this email already exists' });
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
      return res.status(201).json({ message: 'Manager account created', token, user: { id: manager._id, name: manager.name, email: manager.email, role: 'manager' } });
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
      return res.status(201).json({ message: 'Student account created', token, user: { id: student._id, name: student.name, email: student.email, role: 'student' } });
    }
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ message: 'Server error during signup' });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { email = '', password = '' } = req.body;
    const emailLower = String(email).trim().toLowerCase();

    let user = await Student.findOne({ email: emailLower });
    let role = 'student';

    if (!user) { user = await Manager.findOne({ email: emailLower }); role = 'manager'; }
    if (!user) { user = await Admin.findOne({ email: emailLower });   role = 'admin'; }

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok)   return res.status(401).json({ message: 'Invalid credentials' });

    const token = createAuthToken(user._id.toString(), { role, name: user.name });
    return res.json({
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} login successful`,
      token,
      user: { id: user._id, name: user.name, email: user.email, role }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error during login' });
  }
});

// GET ME
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    let user = null;
    if (req.user.role === 'manager')     user = await Manager.findById(req.user.sub);
    else if (req.user.role === 'admin')  user = await Admin.findById(req.user.sub);
    else                                 user = await Student.findById(req.user.sub);

    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({ user: { id: user._id, name: user.name, email: user.email, role: req.user.role, bankDetails: user.bankDetails || null, phone: user.phone || '' } });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// LIST HOSTELS (with filters)
app.get('/api/hostels', async (req, res) => {
  try {
    const searchTerm     = String(req.query.search   || '').trim().toLowerCase();
    const roomType       = String(req.query.roomType  || '').trim();
    const locationFilter = String(req.query.location  || '').trim();
    const maxPrice       = Number(req.query.maxPrice  || 15000);

    const query = { pricePerYear: { $lte: maxPrice } };
    if (locationFilter) query.location = { $regex: new RegExp(`^${locationFilter}$`, 'i') };
    if (searchTerm) {
      query.$or = [
        { name:        { $regex: searchTerm, $options: 'i' } },
        { location:    { $regex: searchTerm, $options: 'i' } },
        { address:     { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    let hostels = await Hostel.find(query).sort({ createdAt: -1 }).lean();

    if (roomType) {
      hostels = hostels.filter(h => h.roomTypes && h.roomTypes[roomType]);
    }

    return res.json({ hostels });
  } catch (err) {
    console.error('Hostel list error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET SINGLE HOSTEL
app.get('/api/hostels/:id', async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id).lean();
    if (!hostel) return res.status(404).json({ message: 'Hostel not found' });
    return res.json({ hostel });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// TOUR REQUEST
app.post('/api/hostels/:id/tour-request', async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) return res.status(404).json({ message: 'Hostel not found' });

    const request = await TourRequest.create({
      hostelId:   hostel._id.toString(),
      hostelName: hostel.name,
      name:       String(req.body.name    || '').trim(),
      phone:      String(req.body.phone   || '').trim(),
      message:    String(req.body.message || '').trim()
    });

    return res.status(201).json({ message: 'Tour request sent successfully', request });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// LOG HOSTEL VISIT
app.post('/api/hostels/:id/visit', async (req, res) => {
  try {
    const hostel = await Hostel.findByIdAndUpdate(req.params.id, { $inc: { visits: 1 } }, { new: true });
    if (!hostel) return res.status(404).json({ message: 'Hostel not found' });

    await Visit.create({ page: 'hostel-detail', user: `Visited ${hostel.name}` });
    return res.json({ message: 'Visit recorded', visits: hostel.visits });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// PAY / BOOK ROOM
app.post('/api/hostels/:id/pay', authenticateToken, async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) return res.status(404).json({ message: 'Hostel not found' });

    const { roomType, price } = req.body;
    if (!roomType || !price) return res.status(400).json({ message: 'Room type and price are required' });

    const tx = await Transaction.create({
      managerId:    hostel.managerId || '',
      hostelId:     hostel._id.toString(),
      hostelName:   hostel.name,
      type:         'income',
      amount:       Number(price),
      category:     'Rent Payment',
      description:  `${roomType} rent paid via Hostel Hub`,
      studentName:  req.user.name  || 'Anonymous Student',
      studentEmail: req.user.email || 'student@umat.edu.gh'
    });

    return res.status(201).json({ message: `Payment of GHS ${price} processed successfully!`, transaction: tx });
  } catch (err) {
    console.error('Payment error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// MANAGER FINANCES
app.get('/api/manager/finances', authenticateToken, requireManager, async (req, res) => {
  try {
    const managerId = req.user.sub;
    const [manager, txs, hostels] = await Promise.all([
      Manager.findById(managerId),
      Transaction.find({ managerId }).sort({ createdAt: -1 }),
      Hostel.find({ managerId }, 'name _id')
    ]);

    if (!manager) return res.status(404).json({ message: 'Manager not found' });

    const totalIncome  = txs.filter(t => t.type === 'income' ).reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    return res.json({
      bankDetails:  manager.bankDetails || null,
      transactions: txs,
      hostels:      hostels.map(h => ({ id: h._id, name: h.name })),
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense
    });
  } catch (err) {
    console.error('Finances error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// LOG EXPENSE
app.post('/api/manager/expenses', authenticateToken, requireManager, async (req, res) => {
  try {
    const { hostelId, amount, category, description } = req.body;
    if (!amount || !category || !description) return res.status(400).json({ message: 'Amount, category, and description are required' });

    const managerId = req.user.sub;
    let hostelName  = 'General Operation';

    if (hostelId) {
      const hostel = await Hostel.findOne({ _id: hostelId, managerId });
      if (hostel) hostelName = hostel.name;
    }

    const tx = await Transaction.create({
      managerId,
      hostelId:    hostelId || null,
      hostelName,
      type:        'expense',
      amount:      Number(amount),
      category:    String(category).trim(),
      description: String(description).trim()
    });

    return res.status(201).json({ message: 'Expense logged successfully', transaction: tx });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// SAVE BANK ACCOUNT
app.post('/api/manager/bank-account', authenticateToken, requireManager, async (req, res) => {
  try {
    const { bankName, accountName, accountNumber } = req.body;
    if (!bankName || !accountName || !accountNumber) return res.status(400).json({ message: 'All bank details are required' });

    const manager = await Manager.findByIdAndUpdate(
      req.user.sub,
      { bankDetails: { bankName: String(bankName).trim(), accountName: String(accountName).trim(), accountNumber: String(accountNumber).trim() } },
      { new: true }
    );

    if (!manager) return res.status(404).json({ message: 'Manager not found' });
    return res.json({ message: 'Bank account linked successfully', bankDetails: manager.bankDetails });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// LOG PAGE VISIT
app.post('/api/visits/log', async (req, res) => {
  try {
    const { page = 'student', user = 'Anonymous Student' } = req.body;
    await Visit.create({ page: String(page), user: String(user) });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN: GET VISITS
app.get('/api/admin/visits', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const visits = await Visit.find().sort({ timestamp: -1 }).limit(200);
    return res.json({ visits });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN LOGIN
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email = '', password = '' } = req.body;
    const admin = await Admin.findOne({ email: String(email).trim().toLowerCase() });
    if (!admin) return res.status(401).json({ message: 'Invalid admin credentials' });

    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) return res.status(401).json({ message: 'Invalid admin credentials' });

    const token = createAuthToken(admin._id.toString(), { role: 'admin', name: admin.name });
    return res.json({ message: 'Admin login successful', token, admin: { id: admin._id, name: admin.name, email: admin.email } });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN STATS
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [totalHostels, totalStudents, totalManagers, totalTourRequests, totalVisits, hostels] = await Promise.all([
      Hostel.countDocuments(),
      Student.countDocuments(),
      Manager.countDocuments(),
      TourRequest.countDocuments(),
      Visit.countDocuments(),
      Hostel.find({}, 'pricePerYear')
    ]);

    const averagePrice = hostels.length
      ? (hostels.reduce((sum, h) => sum + (h.pricePerYear || 0), 0) / hostels.length).toFixed(2)
      : 0;

    return res.json({ stats: { totalHostels, totalStudents, totalManagers, totalTourRequests, totalVisits, averagePrice } });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN: LIST ALL HOSTELS
app.get('/api/admin/hostels', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const hostels = await Hostel.find().sort({ createdAt: -1 });
    return res.json({ hostels });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// ADD NEW HOSTEL (Manager or Admin)
app.post('/api/admin/hostels', authenticateToken, requireManagerOrAdmin, upload.array('photos', 12), async (req, res) => {
  try {
    const submittedRoomTypes = typeof req.body.roomTypes === 'string' ? JSON.parse(req.body.roomTypes) : (req.body.roomTypes || {});
    const photos = (req.files || []).map(file => `/uploads/${file.filename}`);

    let managerId    = '';
    let managerName  = '';
    let managerPhone = '';
    let managerEmail = '';

    if (req.user.role === 'manager') {
      const mgr = await Manager.findById(req.user.sub);
      if (mgr) {
        managerId    = mgr._id.toString();
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

    const hostel = await Hostel.create({
      name:         String(req.body.name         || '').trim(),
      location:     String(req.body.location     || '').trim(),
      address:      String(req.body.address      || '').trim(),
      pricePerYear: Number(req.body.pricePerYear || req.body.pricePerMonth || 0),
      rating:       Number(req.body.rating       || 4.5),
      mapsUrl:      String(req.body.mapsUrl      || '').trim(),
      facilities:   String(req.body.facilities   || '').split(',').map(i => i.trim()).filter(Boolean),
      agentName:    String(req.body.agentName    || '').trim() || managerName,
      agentPhone:   String(req.body.agentPhone   || '').trim() || managerPhone,
      agentEmail:   String(req.body.agentEmail   || '').trim() || managerEmail,
      managerId,
      managerName,
      managerPhone,
      managerEmail,
      description:  String(req.body.description  || '').trim(),
      photos:       photos.length ? photos : ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'],
      roomTypes:    submittedRoomTypes,
      kitchenPhotos
    });

    return res.status(201).json({ message: 'Hostel listing created', hostel });
  } catch (err) {
    console.error('Create hostel error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Fallback: serve React/HTML app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Hostel Hub running on http://localhost:${PORT}`);
});
