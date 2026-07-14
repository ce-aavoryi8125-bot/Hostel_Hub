require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Database config
const connectDB = require('./config/db');

// Middleware
const { errorHandler } = require('./middleware/errorHandler');
const { UPLOADS_DIR } = require('./middleware/upload');

// Routes
const authRoutes = require('./routes/auth');
const hostelRoutes = require('./routes/hostels');
const managerRoutes = require('./routes/manager');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname, 'public')));

// Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later.'
});

const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 150, // Limit each IP to 150 requests per minute
  message: 'Too many requests, please try again later.'
});

app.use('/api', globalLimiter);
app.use('/api/login', authLimiter);
app.use('/api/signup', authLimiter);
app.use('/api/admin/login', authLimiter);

// API Routes
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({ ok: true, message: 'Hostel Hub API running', db: mongoose.connection.readyState === 1 ? 'MongoDB' : 'disconnected' });
});

app.use('/api', authRoutes); // /api/signup, /api/login, /api/me
app.use('/api/hostels', hostelRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/admin', adminRoutes);

// Fallback: serve React/HTML app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Hostel Hub running on http://localhost:${PORT}`);
});
