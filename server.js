require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Database / Supabase bootstrap
const connectDB = require('./config/db');

// Middleware
const { errorHandler } = require('./middleware/errorHandler');
const { UPLOADS_DIR } = require('./middleware/upload');

// Routes
const authRoutes         = require('./routes/auth');
const hostelRoutes       = require('./routes/hostels');
const locationRoutes     = require('./routes/locations');
const managerRoutes      = require('./routes/manager');
const adminRoutes        = require('./routes/admin');
const paymentRoutes      = require('./routes/payments');
const tourRoutes         = require('./routes/tours');
const notificationRoutes = require('./routes/notifications');

const app  = express();
const PORT = process.env.PORT || 3000;

// Connect to Supabase and seed defaults
connectDB();

// ── Paystack webhook needs raw body — mount BEFORE express.json() ──
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Global Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname, 'public')));

// Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,  // 20 login attempts per 15 min per IP — appropriate for production
  message: 'Too many authentication attempts, please try again later.'
});

const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 150,
  message: 'Too many requests, please try again later.'
});

app.use('/api', globalLimiter);
app.use('/api/login', authLimiter);
app.use('/api/signup', authLimiter);
app.use('/api/admin/login', authLimiter);

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Hostel Hub API running', db: 'Supabase Auth' });
});

// Expose public config to frontend (anon key is safe to expose)
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl:      process.env.SUPABASE_URL,
    supabaseAnon:     process.env.SUPABASE_ANON_KEY,
    googleEnabled:    false,
    institutionName:  process.env.INSTITUTION_NAME  || 'University of Mines and Technology (UMaT)',
    institutionShort: process.env.INSTITUTION_SHORT || 'UMaT',
    targetCity:       process.env.TARGET_CITY       || 'Tarkwa',
    targetCountry:    process.env.TARGET_COUNTRY    || 'Ghana',
  });
});

app.use('/api', authRoutes);           // /api/signup, /api/login, /api/me
app.use('/api/locations', locationRoutes);
app.use('/api/hostels', hostelRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/notifications', notificationRoutes);

// Payment callback page — Paystack redirects here after payment
app.get('/payment-callback', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'payment-callback.html'));
});

// Fallback: serve HTML app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Centralized Error Handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Hostel Hub running on http://localhost:${PORT}`);
});
