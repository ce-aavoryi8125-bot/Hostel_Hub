const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'hostel-hub-secret';
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DEFAULT_SEED = {
  students: [],
  managers: [
    {
      id: 'manager-1',
      name: 'John Owusu',
      email: 'manager@hostelhub.dev',
      password: bcrypt.hashSync('manager123', 10),
      phone: '+233 24 111 2222',
      role: 'manager',
      bankDetails: {
        bankName: 'Ghana Commercial Bank',
        accountName: 'John Owusu Hostel Ventures',
        accountNumber: '1029384756'
      },
      createdAt: new Date().toISOString()
    }
  ],
  admins: [
    {
      id: 'admin-1',
      name: 'Hostel Hub Admin',
      email: 'admin@hostelhub.dev',
      password: bcrypt.hashSync('admin123', 10),
      role: 'admin'
    }
  ],
  hostels: [
    {
      id: 'hostel-1',
      name: 'Tarkwa Hostel Haven',
      location: 'Agric Hill',
      address: 'Near UMaT Gate',
      pricePerYear: 4500,
      rating: 4.8,
      mapsUrl: 'https://maps.google.com/?q=Tarkwa+UMaT+Hostel',
      facilities: ['Wi-Fi', 'Power backup', 'Water', 'Security'],
      agentName: 'Ama Mensah',
      agentPhone: '+233 20 123 4567',
      agentEmail: 'ama@hostelhub.dev',
      managerId: 'manager-1',
      managerName: 'John Owusu',
      managerPhone: '+233 24 111 2222',
      managerEmail: 'manager@hostelhub.dev',
      description: 'Popular hostel near the university for students who want safe, clean accommodation with agent support.',
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
      id: 'hostel-2',
      name: 'University Vista Lodge',
      location: 'Akyempim',
      address: 'Opposite UMaT East Gate',
      pricePerYear: 5000,
      rating: 4.6,
      mapsUrl: 'https://maps.google.com/?q=University+Vista+Lodge+Tarkwa',
      facilities: ['Laundry', 'Study hall', 'Water', 'Wi-Fi'],
      agentName: 'Kwame Boateng',
      agentPhone: '+233 24 987 6543',
      agentEmail: 'kwame@hostelhub.dev',
      managerId: 'manager-1',
      managerName: 'John Owusu',
      managerPhone: '+233 24 111 2222',
      managerEmail: 'manager@hostelhub.dev',
      description: 'A student-friendly lodge with roomy shared spaces and easy access to campus transport.',
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
  ],
  tourRequests: [],
  visits: [
    {
      id: 'visit-seed-1',
      page: 'student',
      user: 'Anonymous Student',
      timestamp: new Date(Date.now() - 3600000).toISOString()
    }
  ],
  transactions: [
    {
      id: 'tx-seed-1',
      managerId: 'manager-1',
      hostelId: 'hostel-1',
      hostelName: 'Tarkwa Hostel Haven',
      type: 'income',
      amount: 450,
      category: 'Rent Payment',
      description: '1-in-a-room rent paid by Albert Appiah',
      studentName: 'Albert Appiah',
      studentEmail: 'albert@umat.edu.gh',
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'tx-seed-2',
      managerId: 'manager-1',
      hostelId: 'hostel-1',
      hostelName: 'Tarkwa Hostel Haven',
      type: 'expense',
      amount: 120,
      category: 'Electricity',
      description: 'ECG prepaid credit purchase',
      createdAt: new Date(Date.now() - 43200000).toISOString()
    },
    {
      id: 'tx-seed-3',
      managerId: 'manager-1',
      hostelId: 'hostel-1',
      hostelName: 'Tarkwa Hostel Haven',
      type: 'expense',
      amount: 80,
      category: 'Maintenance',
      description: 'Plumber fee to fix kitchen sink',
      createdAt: new Date(Date.now() - 20000000).toISOString()
    }
  ]
};

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    cb(null, safeName);
  }
});

const upload = multer({ storage });

function ensureDb() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_SEED, null, 2));
    return;
  }

  try {
    const current = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    const needsSeed = !current || 
                      !Array.isArray(current.students) || 
                      !Array.isArray(current.managers) ||
                      !Array.isArray(current.hostels) || 
                      !current.hostels.length || 
                      !Array.isArray(current.tourRequests) || 
                      !Array.isArray(current.visits) || 
                      !Array.isArray(current.transactions) ||
                      !Array.isArray(current.admins) || 
                      !current.admins.length;

    if (needsSeed) {
      const merged = {
        ...DEFAULT_SEED,
        ...current,
        students: Array.isArray(current?.students) ? current.students : DEFAULT_SEED.students,
        managers: Array.isArray(current?.managers) ? current.managers : DEFAULT_SEED.managers,
        admins: Array.isArray(current?.admins) && current.admins.length ? current.admins : DEFAULT_SEED.admins,
        hostels: Array.isArray(current?.hostels) && current.hostels.length ? current.hostels : DEFAULT_SEED.hostels,
        tourRequests: Array.isArray(current?.tourRequests) ? current.tourRequests : DEFAULT_SEED.tourRequests,
        visits: Array.isArray(current?.visits) ? current.visits : DEFAULT_SEED.visits,
        transactions: Array.isArray(current?.transactions) ? current.transactions : DEFAULT_SEED.transactions
      };

      fs.writeFileSync(DB_PATH, JSON.stringify(merged, null, 2));
    }
  } catch (e) {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_SEED, null, 2));
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function sanitizeStudentPayload(payload) {
  return {
    name: String(payload.name || '').trim(),
    email: String(payload.email || '').trim().toLowerCase(),
    phone: String(payload.phone || '').trim(),
    studentId: String(payload.studentId || '').trim(),
    password: String(payload.password || '').trim()
  };
}

function createAuthToken(subject, extra = {}) {
  return jwt.sign({ sub: subject, ...extra }, JWT_SECRET, { expiresIn: '7d' });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Missing bearer token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access only' });
  }
  next();
}

function requireManager(req, res, next) {
  if (!req.user || req.user.role !== 'manager') {
    return res.status(403).json({ message: 'Manager access only' });
  }
  next();
}

function requireManagerOrAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'manager' && req.user.role !== 'admin')) {
    return res.status(403).json({ message: 'Manager or Admin access only' });
  }
  next();
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Hostel Hub API running' });
});

app.post('/api/signup', async (req, res) => {
  const { role = 'student', name, email, phone, password, studentId } = req.body;

  if (!name || !email || !phone || !password || (role === 'student' && !studentId)) {
    return res.status(400).json({ message: 'All required signup fields must be filled' });
  }

  const db = readDb();
  const emailLower = String(email).trim().toLowerCase();

  const dupStudent = db.students.find((s) => s.email === emailLower);
  const dupManager = db.managers.find((m) => m.email === emailLower);
  const dupAdmin = db.admins.find((a) => a.email === emailLower);
  if (dupStudent || dupManager || dupAdmin) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  if (role === 'manager') {
    const manager = {
      id: `manager-${Date.now()}`,
      name: String(name).trim(),
      email: emailLower,
      phone: String(phone).trim(),
      password: passwordHash,
      role: 'manager',
      bankDetails: null,
      createdAt: new Date().toISOString()
    };
    db.managers.push(manager);
    writeDb(db);
    const token = createAuthToken(manager.id, { role: 'manager', name: manager.name });
    return res.status(201).json({ message: 'Manager account created', token, user: { id: manager.id, name: manager.name, email: manager.email, role: 'manager' } });
  } else {
    const student = {
      id: `student-${Date.now()}`,
      name: String(name).trim(),
      email: emailLower,
      phone: String(phone).trim(),
      studentId: String(studentId).trim(),
      password: passwordHash,
      role: 'student',
      createdAt: new Date().toISOString()
    };
    db.students.push(student);
    writeDb(db);
    const token = createAuthToken(student.id, { role: 'student', name: student.name });
    return res.status(201).json({ message: 'Student account created', token, user: { id: student.id, name: student.name, email: student.email, role: 'student' } });
  }
});

app.post('/api/login', async (req, res) => {
  const { email = '', password = '' } = req.body;
  const emailLower = String(email).trim().toLowerCase();
  const db = readDb();

  let user = db.students.find((entry) => entry.email === emailLower);
  let role = 'student';

  if (!user) {
    user = db.managers.find((entry) => entry.email === emailLower);
    role = 'manager';
  }

  if (!user) {
    user = db.admins.find((entry) => entry.email === emailLower);
    role = 'admin';
  }

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = createAuthToken(user.id, { role, name: user.name });
  return res.json({ 
    message: `${role.charAt(0).toUpperCase() + role.slice(1)} login successful`, 
    token, 
    user: { id: user.id, name: user.name, email: user.email, role } 
  });
});

app.get('/api/me', authenticateToken, (req, res) => {
  const db = readDb();
  let user = null;

  if (req.user.role === 'manager') {
    user = db.managers.find((entry) => entry.id === req.user.sub);
  } else if (req.user.role === 'admin') {
    user = db.admins.find((entry) => entry.id === req.user.sub);
  } else {
    user = db.students.find((entry) => entry.id === req.user.sub);
  }

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json({ 
    user: { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: req.user.role || 'student',
      bankDetails: user.bankDetails || null,
      phone: user.phone || ''
    } 
  });
});

app.get('/api/hostels', (req, res) => {
  const db = readDb();
  const searchTerm = String(req.query.search || '').trim().toLowerCase();
  const roomType = String(req.query.roomType || '').trim();
  const locationFilter = String(req.query.location || '').trim().toLowerCase();
  const maxPrice = Number(req.query.maxPrice || 15000);

  let hostels = db.hostels.filter((hostel) => {
    const matchesSearch = !searchTerm || [hostel.name, hostel.location, hostel.address, hostel.description].join(' ').toLowerCase().includes(searchTerm);
    const matchesRoomType = !roomType || Object.keys(hostel.roomTypes || {}).includes(roomType);
    const matchesPrice = Number(hostel.pricePerYear || hostel.pricePerMonth) <= maxPrice;
    const matchesLocation = !locationFilter || String(hostel.location || '').toLowerCase() === locationFilter;
    return matchesSearch && matchesRoomType && matchesPrice && matchesLocation;
  });

  return res.json({ hostels });
});

app.get('/api/hostels/:id', (req, res) => {
  const db = readDb();
  const hostel = db.hostels.find((item) => item.id === req.params.id);
  if (!hostel) {
    return res.status(404).json({ message: 'Hostel not found' });
  }
  return res.json({ hostel });
});

app.post('/api/hostels/:id/tour-request', (req, res) => {
  const db = readDb();
  const hostel = db.hostels.find((item) => item.id === req.params.id);
  if (!hostel) {
    return res.status(404).json({ message: 'Hostel not found' });
  }

  const request = {
    id: `request-${Date.now()}`,
    hostelId: hostel.id,
    hostelName: hostel.name,
    name: String(req.body.name || '').trim(),
    phone: String(req.body.phone || '').trim(),
    message: String(req.body.message || '').trim(),
    createdAt: new Date().toISOString()
  };

  db.tourRequests.push(request);
  writeDb(db);
  return res.status(201).json({ message: 'Tour request sent successfully', request });
});

app.post('/api/hostels/:id/visit', (req, res) => {
  const db = readDb();
  const hostel = db.hostels.find((item) => item.id === req.params.id);
  if (!hostel) {
    return res.status(404).json({ message: 'Hostel not found' });
  }

  hostel.visits = Number(hostel.visits || 0) + 1;
  db.visits.push({ 
    id: `visit-${Date.now()}`, 
    page: 'hostel-detail', 
    user: `Visited ${hostel.name}`, 
    timestamp: new Date().toISOString() 
  });
  writeDb(db);
  return res.json({ message: 'Visit recorded', visits: hostel.visits });
});

app.post('/api/hostels/:id/pay', authenticateToken, (req, res) => {
  const db = readDb();
  const hostel = db.hostels.find((h) => h.id === req.params.id);
  if (!hostel) {
    return res.status(404).json({ message: 'Hostel not found' });
  }

  const { roomType, price } = req.body;
  if (!roomType || !price) {
    return res.status(400).json({ message: 'Room type and price are required' });
  }

  const tx = {
    id: `tx-${Date.now()}`,
    managerId: hostel.managerId || 'manager-1',
    hostelId: hostel.id,
    hostelName: hostel.name,
    type: 'income',
    amount: Number(price),
    category: 'Rent Payment',
    description: `${roomType} rent paid via Hostel Hub`,
    studentName: req.user.name || 'Anonymous Student',
    studentEmail: req.user.sub || 'student@umat.edu.gh',
    createdAt: new Date().toISOString()
  };

  db.transactions.push(tx);
  writeDb(db);

  return res.status(201).json({ message: `Payment of ${price} GHS processed successfully!`, transaction: tx });
});

app.get('/api/manager/finances', authenticateToken, requireManager, (req, res) => {
  const db = readDb();
  const managerId = req.user.sub;
  const manager = db.managers.find((m) => m.id === managerId);

  if (!manager) {
    return res.status(404).json({ message: 'Manager not found' });
  }

  const txs = db.transactions.filter((tx) => tx.managerId === managerId);
  const hostels = db.hostels.filter((h) => h.managerId === managerId);

  const totalIncome = txs.filter((t) => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalExpense = txs.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const netProfit = totalIncome - totalExpense;

  return res.json({
    bankDetails: manager.bankDetails || null,
    transactions: txs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    hostels: hostels.map((h) => ({ id: h.id, name: h.name })),
    totalIncome,
    totalExpense,
    netProfit
  });
});

app.post('/api/manager/expenses', authenticateToken, requireManager, (req, res) => {
  const { hostelId, amount, category, description } = req.body;
  if (!amount || !category || !description) {
    return res.status(400).json({ message: 'Amount, category, and description are required' });
  }

  const db = readDb();
  const managerId = req.user.sub;

  let hostelName = 'General Operation';
  if (hostelId) {
    const hostel = db.hostels.find((h) => h.id === hostelId && h.managerId === managerId);
    if (hostel) {
      hostelName = hostel.name;
    }
  }

  const tx = {
    id: `tx-${Date.now()}`,
    managerId,
    hostelId: hostelId || null,
    hostelName,
    type: 'expense',
    amount: Number(amount),
    category: String(category).trim(),
    description: String(description).trim(),
    createdAt: new Date().toISOString()
  };

  db.transactions.push(tx);
  writeDb(db);

  return res.status(201).json({ message: 'Expense logged successfully', transaction: tx });
});

app.post('/api/manager/bank-account', authenticateToken, requireManager, (req, res) => {
  const { bankName, accountName, accountNumber } = req.body;
  if (!bankName || !accountName || !accountNumber) {
    return res.status(400).json({ message: 'All bank details are required' });
  }

  const db = readDb();
  const manager = db.managers.find((m) => m.id === req.user.sub);
  if (!manager) {
    return res.status(404).json({ message: 'Manager not found' });
  }

  manager.bankDetails = {
    bankName: String(bankName).trim(),
    accountName: String(accountName).trim(),
    accountNumber: String(accountNumber).trim()
  };

  writeDb(db);
  return res.json({ message: 'Bank account linked successfully', bankDetails: manager.bankDetails });
});

app.post('/api/visits/log', (req, res) => {
  const { page = 'student', user = 'Anonymous Student' } = req.body;
  const db = readDb();

  const visit = {
    id: `visit-${Date.now()}`,
    page: String(page),
    user: String(user),
    timestamp: new Date().toISOString()
  };

  db.visits.push(visit);
  writeDb(db);
  return res.json({ ok: true });
});

app.get('/api/admin/visits', authenticateToken, requireAdmin, (req, res) => {
  const db = readDb();
  return res.json({ visits: db.visits.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) });
});

app.post('/api/admin/login', async (req, res) => {
  const { email = '', password = '' } = req.body;
  const db = readDb();
  const admin = db.admins.find((entry) => entry.email === String(email).trim().toLowerCase());

  if (!admin) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }

  const passwordMatches = await bcrypt.compare(password, admin.password);
  if (!passwordMatches) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }

  const token = createAuthToken(admin.id, { role: 'admin', name: admin.name });
  return res.json({ message: 'Admin login successful', token, admin: { id: admin.id, name: admin.name, email: admin.email } });
});

app.get('/api/admin/stats', authenticateToken, requireAdmin, (req, res) => {
  const db = readDb();
  const stats = {
    totalHostels: db.hostels.length,
    totalStudents: db.students.length,
    totalManagers: db.managers ? db.managers.length : 0,
    totalTourRequests: db.tourRequests.length,
    totalVisits: db.visits.length,
    averagePrice: db.hostels.length ? (db.hostels.reduce((sum, hostel) => sum + Number(hostel.pricePerYear || hostel.pricePerMonth || 0), 0) / db.hostels.length).toFixed(2) : 0
  };

  return res.json({ stats });
});

app.get('/api/admin/hostels', authenticateToken, requireAdmin, (req, res) => {
  const db = readDb();
  return res.json({ hostels: db.hostels });
});

app.post('/api/admin/hostels', authenticateToken, requireManagerOrAdmin, upload.array('photos', 12), (req, res) => {
  const db = readDb();

  const submittedRoomTypes = typeof req.body.roomTypes === 'string' ? JSON.parse(req.body.roomTypes) : (req.body.roomTypes || {});
  const photos = (req.files || []).map((file) => `/uploads/${file.filename}`);

  let managerId = 'manager-1';
  let managerName = 'John Owusu';
  let managerPhone = '+233 24 111 2222';
  let managerEmail = 'manager@hostelhub.dev';

  if (req.user.role === 'manager') {
    const mgr = db.managers.find((m) => m.id === req.user.sub);
    if (mgr) {
      managerId = mgr.id;
      managerName = mgr.name;
      managerPhone = mgr.phone || '';
      managerEmail = mgr.email;
    }
  }

  let kitchenPhotos = [];
  if (req.body.kitchenPhotos) {
    kitchenPhotos = typeof req.body.kitchenPhotos === 'string' ? req.body.kitchenPhotos.split(',').map(item => item.trim()).filter(Boolean) : req.body.kitchenPhotos;
  }
  if (!kitchenPhotos.length) {
    kitchenPhotos = ['https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=900&q=80'];
  }

  const hostel = {
    id: `hostel-${Date.now()}`,
    name: String(req.body.name || '').trim(),
    location: String(req.body.location || '').trim(),
    address: String(req.body.address || '').trim(),
    pricePerYear: Number(req.body.pricePerYear || req.body.pricePerMonth || 0),
    rating: Number(req.body.rating || 4.5),
    mapsUrl: String(req.body.mapsUrl || '').trim(),
    facilities: String(req.body.facilities || '').split(',').map((item) => item.trim()).filter(Boolean),
    agentName: String(req.body.agentName || '').trim() || managerName,
    agentPhone: String(req.body.agentPhone || '').trim() || managerPhone,
    agentEmail: String(req.body.agentEmail || '').trim() || managerEmail,
    managerId,
    managerName,
    managerPhone,
    managerEmail,
    description: String(req.body.description || '').trim(),
    photos: photos.length ? photos : [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'
    ],
    roomTypes: submittedRoomTypes,
    kitchenPhotos: kitchenPhotos,
    visits: 0
  };

  db.hostels.unshift(hostel);
  writeDb(db);
  return res.status(201).json({ message: 'Hostel listing created', hostel });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Hostel Hub server is running on http://localhost:${PORT}`);
});
