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
      location: 'Tarkwa',
      address: 'Near UMaT Gate',
      pricePerMonth: 420,
      rating: 4.8,
      mapsUrl: 'https://maps.google.com/?q=Tarkwa+UMaT+Hostel',
      facilities: ['Wi-Fi', 'Power backup', 'Water', 'Security'],
      agentName: 'Ama Mensah',
      agentPhone: '+233 20 123 4567',
      agentEmail: 'ama@hostelhub.dev',
      description: 'Popular hostel near the university for students who want safe, clean accommodation with agent support.',
      photos: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'
      ],
      roomTypes: {
        '1-in-a-room': { price: 450, gallery: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'] },
        '2-in-a-room': { price: 420, gallery: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80'] },
        '3-in-a-room': { price: 380, gallery: ['https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'] }
      },
      kitchenPhotos: ['https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=900&q=80'],
      visits: 0
    },
    {
      id: 'hostel-2',
      name: 'University Vista Lodge',
      location: 'Tarkwa',
      address: 'Opposite UMaT East Gate',
      pricePerMonth: 360,
      rating: 4.6,
      mapsUrl: 'https://maps.google.com/?q=University+Vista+Lodge+Tarkwa',
      facilities: ['Laundry', 'Study hall', 'Water', 'Wi-Fi'],
      agentName: 'Kwame Boateng',
      agentPhone: '+233 24 987 6543',
      agentEmail: 'kwame@hostelhub.dev',
      description: 'A student-friendly lodge with roomy shared spaces and easy access to campus transport.',
      photos: [
        'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80'
      ],
      roomTypes: {
        '2-in-a-room': { price: 360, gallery: ['https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'] },
        '4-in-a-room': { price: 320, gallery: ['https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80'] }
      },
      kitchenPhotos: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'],
      visits: 0
    }
  ],
  tourRequests: [],
  visits: []
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

  const current = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  const needsSeed = !current || !Array.isArray(current.students) || !Array.isArray(current.hostels) || !current.hostels.length || !Array.isArray(current.tourRequests) || !Array.isArray(current.visits) || !Array.isArray(current.admins) || !current.admins.length;

  if (needsSeed) {
    const merged = {
      ...DEFAULT_SEED,
      ...current,
      students: Array.isArray(current?.students) ? current.students : DEFAULT_SEED.students,
      admins: Array.isArray(current?.admins) && current.admins.length ? current.admins : DEFAULT_SEED.admins,
      hostels: Array.isArray(current?.hostels) && current.hostels.length ? current.hostels : DEFAULT_SEED.hostels,
      tourRequests: Array.isArray(current?.tourRequests) ? current.tourRequests : DEFAULT_SEED.tourRequests,
      visits: Array.isArray(current?.visits) ? current.visits : DEFAULT_SEED.visits
    };

    fs.writeFileSync(DB_PATH, JSON.stringify(merged, null, 2));
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

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Hostel Hub API running' });
});

app.post('/api/signup', async (req, res) => {
  const payload = sanitizeStudentPayload(req.body);

  if (!payload.name || !payload.email || !payload.phone || !payload.studentId || !payload.password) {
    return res.status(400).json({ message: 'All student fields are required' });
  }

  const db = readDb();
  const duplicatedEmail = db.students.find((student) => student.email === payload.email);
  if (duplicatedEmail) {
    return res.status(409).json({ message: 'Student account already exists' });
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const student = {
    id: `student-${Date.now()}`,
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    studentId: payload.studentId,
    password: passwordHash,
    createdAt: new Date().toISOString()
  };

  db.students.push(student);
  writeDb(db);

  const token = createAuthToken(student.id, { role: 'student', name: student.name });
  return res.status(201).json({ message: 'Student account created', token, student: { id: student.id, name: student.name, email: student.email } });
});

app.post('/api/login', async (req, res) => {
  const { email = '', password = '' } = req.body;
  const db = readDb();
  const student = db.students.find((entry) => entry.email === String(email).trim().toLowerCase());

  if (!student) {
    return res.status(401).json({ message: 'Invalid student credentials' });
  }

  const passwordMatches = await bcrypt.compare(password, student.password);
  if (!passwordMatches) {
    return res.status(401).json({ message: 'Invalid student credentials' });
  }

  const token = createAuthToken(student.id, { role: 'student', name: student.name });
  return res.json({ message: 'Student login successful', token, student: { id: student.id, name: student.name, email: student.email } });
});

app.get('/api/me', authenticateToken, (req, res) => {
  const db = readDb();
  const student = db.students.find((entry) => entry.id === req.user.sub);

  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }

  return res.json({ student: { id: student.id, name: student.name, email: student.email } });
});

app.get('/api/hostels', (req, res) => {
  const db = readDb();
  const searchTerm = String(req.query.search || '').trim().toLowerCase();
  const roomType = String(req.query.roomType || '').trim();
  const maxPrice = Number(req.query.maxPrice || 9999);

  let hostels = db.hostels.filter((hostel) => {
    const matchesSearch = !searchTerm || [hostel.name, hostel.location, hostel.address, hostel.description].join(' ').toLowerCase().includes(searchTerm);
    const matchesRoomType = !roomType || Object.keys(hostel.roomTypes || {}).includes(roomType);
    const matchesPrice = Number(hostel.pricePerMonth) <= maxPrice;
    return matchesSearch && matchesRoomType && matchesPrice;
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
  db.visits.push({ id: `visit-${Date.now()}`, hostelId: hostel.id, createdAt: new Date().toISOString() });
  writeDb(db);
  return res.json({ message: 'Visit recorded', visits: hostel.visits });
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
    totalTourRequests: db.tourRequests.length,
    totalVisits: db.visits.length,
    averagePrice: db.hostels.length ? (db.hostels.reduce((sum, hostel) => sum + Number(hostel.pricePerMonth || 0), 0) / db.hostels.length).toFixed(2) : 0
  };

  return res.json({ stats });
});

app.get('/api/admin/hostels', authenticateToken, requireAdmin, (req, res) => {
  const db = readDb();
  return res.json({ hostels: db.hostels });
});

app.post('/api/admin/hostels', authenticateToken, requireAdmin, upload.array('photos', 12), (req, res) => {
  const db = readDb();

  const submittedRoomTypes = typeof req.body.roomTypes === 'string' ? JSON.parse(req.body.roomTypes) : (req.body.roomTypes || {});
  const photos = (req.files || []).map((file) => `/uploads/${file.filename}`);
  const kitchenPhotos = typeof req.body.kitchenPhotos === 'string' ? req.body.kitchenPhotos.split(',').map((item) => item.trim()).filter(Boolean) : [];

  const hostel = {
    id: `hostel-${Date.now()}`,
    name: String(req.body.name || '').trim(),
    location: String(req.body.location || '').trim(),
    address: String(req.body.address || '').trim(),
    pricePerMonth: Number(req.body.pricePerMonth || 0),
    rating: Number(req.body.rating || 4.5),
    mapsUrl: String(req.body.mapsUrl || '').trim(),
    facilities: String(req.body.facilities || '').split(',').map((item) => item.trim()).filter(Boolean),
    agentName: String(req.body.agentName || '').trim(),
    agentPhone: String(req.body.agentPhone || '').trim(),
    agentEmail: String(req.body.agentEmail || '').trim(),
    description: String(req.body.description || '').trim(),
    photos: photos.length ? photos : [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'
    ],
    roomTypes: submittedRoomTypes,
    kitchenPhotos: kitchenPhotos.length ? kitchenPhotos : ['https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=900&q=80'],
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
