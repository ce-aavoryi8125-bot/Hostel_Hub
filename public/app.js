const { useState, useEffect, useRef } = React;

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const API = '';

const normalizeHostel = (hostel = {}) => ({
  ...hostel,
  id: hostel.id || hostel._id || '',
  roomTypes: hostel.roomTypes || {},
  photos: hostel.photos || [],
  facilities: hostel.facilities || [],
  kitchenPhotos: hostel.kitchenPhotos || [],
});

const DEMO_HOSTELS = [
  {
    id: 'demo-1',
    name: 'Blue Pearl Hostel',
    location: 'Agric Hill',
    address: 'Near UMaT Gate',
    pricePerYear: 4800,
    rating: 4.7,
    mapsUrl: 'https://maps.google.com/?q=Blue+Pearl+Hostel+Tarkwa',
    facilities: ['Wi-Fi', 'Water', 'Security', 'Power backup'],
    description: 'A modern student residence with spacious rooms, reliable utilities, and a calm study environment.',
    photos: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=600&q=80'],
    roomTypes: {
      '1-in-a-room': { price: 9500, gallery: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'] },
      '2-in-a-room': { price: 7200, gallery: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80'] }
    },
    agentPhone: '+233200111222',
  },
  {
    id: 'demo-2',
    name: 'Noble Court Lodge',
    location: 'Akyempim',
    address: 'Opposite East Gate',
    pricePerYear: 5200,
    rating: 4.6,
    mapsUrl: 'https://maps.google.com/?q=Noble+Court+Lodge+Tarkwa',
    facilities: ['Laundry', 'Wi-Fi', 'Study hall', 'Parking'],
    description: 'Comfortable lodge with roomy study areas and convenient access to campus transport.',
    photos: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80'],
    roomTypes: {
      '2-in-a-room': { price: 7800, gallery: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80'] },
      '4-in-a-room': { price: 5600, gallery: ['https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80'] }
    },
    agentPhone: '+233240222333',
  },
  {
    id: 'demo-3',
    name: 'Golden Palm Residence',
    location: 'Tamso',
    address: 'Near Market Road',
    pricePerYear: 6100,
    rating: 4.8,
    mapsUrl: 'https://maps.google.com/?q=Golden+Palm+Residence+Tarkwa',
    facilities: ['Water', 'Security', 'Generator', 'Kitchen'],
    description: 'A premium hostel experience with reliable power support and comfortable shared spaces.',
    photos: ['https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=600&q=80'],
    roomTypes: {
      '3-in-a-room': { price: 8300, gallery: ['https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'] },
      '4-in-a-room': { price: 6200, gallery: ['https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=900&q=80'] }
    },
    agentPhone: '+233244333444',
  },
  {
    id: 'demo-4',
    name: 'Sunset Terrace Hostel',
    location: 'New Canaan',
    address: 'Behind the Main Road',
    pricePerYear: 4700,
    rating: 4.5,
    mapsUrl: 'https://maps.google.com/?q=Sunset+Terrace+Hostel+Tarkwa',
    facilities: ['Wi-Fi', 'Water', 'CCTV', 'Parking'],
    description: 'Budget-friendly and secure, ideal for students who want easy access and a quiet atmosphere.',
    photos: ['https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80'],
    roomTypes: {
      '1-in-a-room': { price: 8800, gallery: ['https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80'] },
      '2-in-a-room': { price: 6900, gallery: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80'] }
    },
    agentPhone: '+233200555666',
  },
  {
    id: 'demo-5',
    name: 'Campus Breeze Lodge',
    location: 'Brahabebome',
    address: 'Near School Junction',
    pricePerYear: 5400,
    rating: 4.7,
    mapsUrl: 'https://maps.google.com/?q=Campus+Breeze+Lodge+Tarkwa',
    facilities: ['Wi-Fi', 'Laundry', 'Security', 'Kitchen'],
    description: 'A student-focused lodge with modern amenities and a welcoming shared kitchen area.',
    photos: ['https://images.unsplash.com/photo-1502672023048-883d7bed201d?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=600&q=80'],
    roomTypes: {
      '2-in-a-room': { price: 7600, gallery: ['https://images.unsplash.com/photo-1502672023048-883d7bed201d?auto=format&fit=crop&w=900&q=80'] },
      '3-in-a-room': { price: 5900, gallery: ['https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'] }
    },
    agentPhone: '+233240666777',
  },
];

const FACILITY_ICONS = {
  'Wi-Fi': '📶', 'WiFi': '📶', 'Wifi': '📶',
  'Water': '🚿', 'Power backup': '⚡', 'Electricity Backup': '⚡', 'Electricity': '⚡',
  'Security': '🔒', 'CCTV': '📷',
  'Kitchen': '🍳', 'Shared Kitchen': '🍳',
  'Parking': '🚗', 'Laundry': '👕',
  'Internet': '🌐', 'AC': '❄️',
  'Generator': '⚡', 'Borehole': '💧',
};

const getFacilityIcon = (f) => {
  for (const key of Object.keys(FACILITY_ICONS)) {
    if (f.toLowerCase().includes(key.toLowerCase())) return FACILITY_ICONS[key];
  }
  return '✅';
};

function StarRating({ rating }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span className="stars">
      {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(5 - full - (half ? 1 : 0))}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-img" />
      <div className="skeleton-body">
        <div className="skeleton skeleton-short" />
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line" style={{ width: '55%' }} />
      </div>
    </div>
  );
}

function getRoleLabel(role) {
  switch (role) {
    case 'manager': return 'Hostel Manager';
    case 'admin': return 'Administrator';
    default: return 'Student Resident';
  }
}

function getRoleBadge(role) {
  switch (role) {
    case 'manager': return 'Manager';
    case 'admin': return 'Admin';
    default: return 'Student';
  }
}

function getInitials(name) {
  return (name || 'HU').split(' ').slice(0, 2).map((part) => part[0] || '').join('').toUpperCase();
}

function ProfileSidebar({
  user,
  onClose,
  onLogout,
  activeTheme,
  onThemeChange,
  activeMenuItem,
  onSelectMenuItem,
  unreadCount = 3,
  completionPercent = 80,
}) {
  const role = user?.role || 'student';
  const isManager = role === 'manager';
  const menuItems = isManager
    ? [
        { key: 'profile', label: 'Manager Profile', desc: 'Manage your identity and account access', icon: '👤' },
        { key: 'hostels', label: 'Hostel Management', desc: 'Overview of your property portfolio', icon: '🏠' },
        { key: 'rooms', label: 'Room Management', desc: 'Track room occupancy and availability', icon: '🛏️' },
        { key: 'students', label: 'Student Management', desc: 'View residents and their activity', icon: '🎓' },
        { key: 'payments', label: 'Payment Records', desc: 'Monitor rent and dues', icon: '💳' },
        { key: 'maintenance', label: 'Maintenance Requests', desc: 'Resolve hostel issues quickly', icon: '🛠️' },
        { key: 'reports', label: 'Reports & Analytics', desc: 'Measure growth and performance', icon: '📊' },
        { key: 'communications', label: 'Announcements', desc: 'Push updates to residents', icon: '📢' },
      ]
    : [
        { key: 'profile', label: 'My Profile', desc: 'View and edit personal information', icon: '👤' },
        { key: 'hostel', label: 'My Hostel', desc: 'View hostel details and allocation', icon: '🏠' },
        { key: 'rooms', label: 'My Room', desc: 'Check roommates and room details', icon: '🛏️' },
        { key: 'bookings', label: 'My Bookings', desc: 'Review your booking history', icon: '📅' },
        { key: 'payments', label: 'Payments', desc: 'Check payment status and invoices', icon: '💳' },
        { key: 'maintenance', label: 'Maintenance Requests', desc: 'Report and track hostel issues', icon: '🛠️' },
        { key: 'notifications', label: 'Notifications', desc: 'Stay updated on announcements', icon: '🔔' },
        { key: 'support', label: 'Help Center', desc: 'Contact hostel management', icon: '❓' },
      ];

  return (
    <div className="profile-panel-backdrop" onClick={onClose}>
      <aside className="profile-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="User profile menu">
        <button className="profile-close" onClick={onClose} type="button">×</button>

        <div className="profile-panel-header">
          <div className="profile-avatar">{getInitials(user?.name)}</div>
          <div className="profile-meta">
            <div className="profile-name">{user?.name || 'Albert Atsu Avoryi'}</div>
            <div className="profile-role-row">
              <span className="profile-role-badge">{getRoleBadge(role)}</span>
              <span className="profile-status"><span className="profile-status-dot" /> Online</span>
            </div>
            <div className="profile-role-subtitle">{getRoleLabel(role)}</div>
          </div>
        </div>

        <div className="profile-progress-card">
          <div className="profile-progress-top">
            <span>Profile Completed</span>
            <strong>{completionPercent}%</strong>
          </div>
          <div className="profile-progress-bar">
            <span style={{ width: `${completionPercent}%` }} />
          </div>
        </div>

        <div className="profile-notice-card">
          <div className="profile-notice-title">
            <span>Notifications</span>
            <span className="profile-badge">{unreadCount}</span>
          </div>
          <div className="profile-notice-sub">New updates and payment reminders waiting for you.</div>
        </div>

        <div className="profile-section-title">Hostel Access</div>
        <div className="profile-menu-list">
          {menuItems.map((item) => (
            <button
              key={item.key}
              className={`profile-menu-item ${activeMenuItem === item.key ? 'active' : ''}`}
              type="button"
              onClick={() => {
                onSelectMenuItem?.(item.key);
                onClose();
              }}
            >
              <span className="profile-menu-icon">{item.icon}</span>
              <span className="profile-menu-text">
                <strong>{item.label}</strong>
                <small>{item.desc}</small>
              </span>
            </button>
          ))}
        </div>

        <div className="profile-section-title">Appearance</div>
        <div className="profile-theme-switcher">
          {['light', 'dark', 'system'].map((mode) => (
            <button
              key={mode}
              className={`profile-theme-chip ${activeTheme === mode ? 'active' : ''}`}
              type="button"
              onClick={() => onThemeChange(mode)}
            >
              {mode === 'light' ? '☀ Light' : mode === 'dark' ? '☾ Dark' : '◐ System'}
            </button>
          ))}
        </div>

        <div className="profile-info-card">
          <div className="profile-info-row"><span>Hostel</span><strong>{user?.hostelName || 'University Hostel Block A'}</strong></div>
          <div className="profile-info-row"><span>Room</span><strong>{user?.roomNumber || 'A-203'}</strong></div>
          <div className="profile-info-row"><span>Phone</span><strong>{user?.phone || '+233 20 000 0000'}</strong></div>
          <div className="profile-info-row"><span>Role</span><strong>{getRoleBadge(role)}</strong></div>
        </div>

        <div className="profile-actions">
          <button className="profile-action-btn" type="button" onClick={() => onSelectMenuItem?.('profile')}>Settings</button>
          <button className="profile-action-btn" type="button" onClick={() => onSelectMenuItem?.('communications')}>Security</button>
          <button className="profile-action-btn danger" type="button" onClick={() => {
            if (window.confirm('Are you sure you want to log out from Hostel Hub?')) {
              onLogout();
            }
          }}>Logout</button>
        </div>
      </aside>
    </div>
  );
}

/* ============================
   HOSTEL CARD
============================ */
function HostelCard({ hostel, onClick }) {
  const mainPhoto = (hostel.photos || [])[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80';
  const facilities = (hostel.facilities || []).slice(0, 3);
  const roomTypes = Object.keys(hostel.roomTypes || {});

  return (
    <div className="hostel-card" onClick={() => onClick(hostel)}>
      <div className="hostel-card-img">
        <img src={mainPhoto} alt={hostel.name} loading="lazy" />
        <div className="hostel-card-badges">
          <span className="badge badge-verified">✓ Verified</span>
          <span className="badge badge-rating">
            <span className="star">★</span> {hostel.rating || 4.5}
          </span>
        </div>
      </div>
      <div className="hostel-card-body">
        <div className="hostel-card-location">📍 {hostel.location}</div>
        <div className="hostel-card-name">{hostel.name}</div>
        <div className="hostel-card-amenities">
          {facilities.map((f) => (
            <span key={f} className="amenity-pill">{getFacilityIcon(f)} {f}</span>
          ))}
        </div>
        <div className="hostel-card-footer">
          <div className="hostel-price">
            <div className="hostel-price-label">Starting from</div>
            <div className="hostel-price-value">
              {formatCurrency(hostel.pricePerYear || hostel.pricePerMonth)} <span className="per">/year</span>
            </div>
          </div>
          <div className="hostel-card-rooms">
            {roomTypes.map((rt) => (
              <span key={rt} className="room-type-chip">{rt.split('-')[0]}-in</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================
   HOSTEL DETAIL MODAL
============================ */
function HostelDetailModal({ hostel, user, onClose, onRent, onRequireAuth }) {
  const [activeRoom, setActiveRoom] = useState(() => Object.keys(hostel.roomTypes || {})[0] || '');
  const [tourForm, setTourForm] = useState({ name: user?.name || '', phone: user?.phone || '', message: '' });
  const [tourMsg, setTourMsg] = useState('');
  const [tourLoading, setTourLoading] = useState(false);

  const roomTypes = hostel.roomTypes || {};
  const activeRoomData = roomTypes[activeRoom];
  const allPhotos = hostel.photos || [];

  const hostelId = hostel.id || hostel._id || '';

  const submitTour = async (e) => {
    e.preventDefault();
    if (!user) { onRequireAuth(); return; }
    setTourLoading(true);
    try {
      const res = await fetch(`${API}/api/hostels/${hostelId}/tour-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tourForm),
      });
      const data = await res.json();
      setTourMsg(data.message || 'Tour request submitted! Our agent will contact you soon.');
      setTourForm({ name: '', phone: '', message: '' });
      setTimeout(() => setTourMsg(''), 6000);
    } catch {
      setTourMsg('Could not submit tour request. Please try again.');
    }
    setTourLoading(false);
  };

  const waLink = `https://wa.me/${(hostel.agentPhone || '').replace(/\s+/g, '')}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <button className="modal-close" onClick={onClose}>×</button>

        {/* Gallery */}
        <div className="modal-gallery">
          <div className="modal-gallery-main">
            <img src={allPhotos[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80'} alt={hostel.name} />
          </div>
          <div className="modal-gallery-side">
            {[1, 2].map((i) => (
              <div key={i} className="modal-gallery-thumb">
                <img
                  src={allPhotos[i] || `https://images.unsplash.com/photo-${i === 1 ? '1505693416388-ac5ce068fe85' : '1494526585095-c41746248156'}?auto=format&fit=crop&w=600&q=80`}
                  alt={`${hostel.name} view ${i + 1}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="modal-body">
          {/* Header */}
          <div className="modal-header-row">
            <div>
              <div className="modal-verified">✓ Physically Verified & Photographed</div>
              <h2 className="modal-title">{hostel.name}</h2>
              <div className="modal-address">
                📍 {hostel.address}, {hostel.location}
              </div>
              <div className="modal-rating-row">
                <StarRating rating={hostel.rating || 4.5} />
                <span>{hostel.rating || 4.5} rating</span>
              </div>
            </div>
            <div className="modal-price-box">
              <div className="modal-price-from">From</div>
              <div className="modal-price-big">
                {formatCurrency(hostel.pricePerYear || hostel.pricePerMonth)}<span className="per">/year</span>
              </div>
              <a href={hostel.mapsUrl || '#'} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ marginTop: '10px' }}>
                🗺️ Map
              </a>
            </div>
          </div>

          {/* Description */}
          {hostel.description && (
            <div className="modal-section">
              <div className="modal-section-title">About this Hostel</div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                {hostel.description}
              </p>
            </div>
          )}

          {/* Room Types */}
          <div className="modal-section">
            <div className="modal-section-title">Select Occupancy Style</div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              We photograph every room configuration — what you see is exactly what you get.
            </p>
            <div className="room-tabs">
              {Object.keys(roomTypes).map((rt) => (
                <button
                  key={rt}
                  className={`room-tab ${activeRoom === rt ? 'active' : ''}`}
                  onClick={() => setActiveRoom(rt)}
                >
                  {rt}
                </button>
              ))}
            </div>
            {activeRoomData && (
              <div className="room-gallery">
                <div className="room-gallery-header">
                  <h4>Photos — {activeRoom}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="room-gallery-price">{formatCurrency(activeRoomData.price)}/year</span>
                    <button
                      className="btn btn-amber btn-sm"
                      onClick={() => onRent(activeRoom, activeRoomData.price)}
                    >
                      Rent Now
                    </button>
                  </div>
                </div>
                <div className="room-gallery-grid">
                  {(activeRoomData.gallery || []).map((photo, i) => (
                    <img key={i} src={photo} alt={`${activeRoom} room`} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Facilities */}
          <div className="modal-section">
            <div className="modal-section-title">Facilities & Amenities</div>
            <div className="amenities-grid">
              {(hostel.facilities || []).map((f) => (
                <div key={f} className="amenity-item">
                  <div className="amenity-icon">{getFacilityIcon(f)}</div>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Kitchen */}
          {(hostel.kitchenPhotos || []).length > 0 && (
            <div className="modal-section">
              <div className="modal-section-title">Shared Kitchen Space</div>
              <div className="room-gallery-grid">
                {(hostel.kitchenPhotos || []).map((p, i) => (
                  <img key={i} src={p} alt="Kitchen area" />
                ))}
              </div>
            </div>
          )}

          {/* Map */}
          <div className="modal-section">
            <div className="modal-section-title">Location</div>
            <div className="map-widget">
              <div className="map-grid" />
              <div className="map-pin-container">
                <div className="map-pin-dot" />
              </div>
              <div className="map-label">
                <span style={{ fontWeight: '700', fontSize: '12px' }}>📍 {hostel.location}</span>
                <a href={hostel.mapsUrl || '#'} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                  Navigate
                </a>
              </div>
            </div>
          </div>

          {/* Agent */}
          <div className="modal-section">
            <div className="modal-section-title">Your Local Agent</div>
            <div className="agent-card">
              <div className="agent-info">
                <div className="agent-avatar">{(hostel.agentName || 'A')[0]}</div>
                <div className="agent-details">
                  <h4>{hostel.agentName}</h4>
                  <p>{hostel.agentPhone} • {hostel.agentEmail}</p>
                  <p style={{ fontSize: '12px', marginTop: '3px', color: 'var(--emerald-600)', fontWeight: '600' }}>
                    ✓ Will escort you from the UMaT Campus Gate
                  </p>
                </div>
              </div>
              <div className="agent-actions">
                <a href={waLink} target="_blank" rel="noreferrer" className="btn btn-success btn-sm">
                  💬 WhatsApp
                </a>
                <a href={`tel:${hostel.agentPhone}`} className="btn btn-outline btn-sm">
                  📞 Call
                </a>
              </div>
            </div>
          </div>

          {/* Tour Form */}
          <div className="modal-section">
            <div className="modal-section-title">Book a Free Inspection Tour</div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              An agent will meet you at the campus gate and personally escort you for a physical tour.
            </p>
            <form onSubmit={submitTour}>
              <div className="tour-form-grid">
                <div className="form-field">
                  <label className="form-label">Your Name</label>
                  <input
                    className="form-input"
                    value={tourForm.name}
                    onChange={(e) => setTourForm({ ...tourForm, name: e.target.value })}
                    placeholder="Full Name"
                    required
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Phone Number</label>
                  <input
                    className="form-input"
                    value={tourForm.phone}
                    onChange={(e) => setTourForm({ ...tourForm, phone: e.target.value })}
                    placeholder="+233 24..."
                    required
                  />
                </div>
              </div>
              <div className="form-field" style={{ marginBottom: '14px' }}>
                <label className="form-label">Preferred Date & Notes</label>
                <textarea
                  className="form-input"
                  value={tourForm.message}
                  onChange={(e) => setTourForm({ ...tourForm, message: e.target.value })}
                  placeholder="e.g. Saturday afternoon, Level 200 student..."
                  rows={3}
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>
              {tourMsg && (
                <div className={tourMsg.includes('Could not') ? 'error-msg' : 'success-msg'} style={{ marginBottom: '12px' }}>
                  {tourMsg}
                </div>
              )}
              <button type="submit" className="btn btn-primary" disabled={tourLoading} style={{ width: '100%', padding: '14px' }}>
                {tourLoading ? 'Sending...' : '📅 Schedule Tour'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================
   AUTH MODAL
============================ */
function AuthModal({ onClose, onSuccess, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ role: 'student', name: '', email: '', phone: '', studentId: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const endpoint = mode === 'login' ? '/api/login' : '/api/signup';
    const body = mode === 'login' ? { email: form.email, password: form.password } : form;
    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Authentication failed.'); setLoading(false); return; }
      localStorage.setItem('hostelHubToken', data.token);
      localStorage.setItem('hostelHubUser', JSON.stringify(data.user));
      onSuccess(data.token, data.user);
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <button
            className="modal-close"
            onClick={onClose}
            style={{ top: '16px', right: '16px', background: 'rgba(255,255,255,0.15)', color: 'white' }}
          >×</button>
          <h2>{mode === 'login' ? 'Welcome Back 👋' : 'Join Hostel Hub'}</h2>
          <p>{mode === 'login' ? 'Sign in to book tours and rent rooms.' : 'Create your free student or manager account.'}</p>
        </div>
        <div className="auth-modal-body">
          <div className="auth-mode-tabs">
            <button className={`auth-mode-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Login</button>
            <button className={`auth-mode-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => setMode('signup')}>Sign Up</button>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mode === 'signup' && (
              <>
                <div className="role-tabs">
                  <div className={`role-tab ${form.role === 'student' ? 'active' : ''}`} onClick={() => setForm({ ...form, role: 'student' })}>
                    🎓 Student
                  </div>
                  <div className={`role-tab ${form.role === 'manager' ? 'active' : ''}`} onClick={() => setForm({ ...form, role: 'manager' })}>
                    💼 Manager
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" required />
                </div>
                <div className="form-field">
                  <label className="form-label">Phone Number</label>
                  <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+233 24..." required />
                </div>
                {form.role === 'student' && (
                  <div className="form-field">
                    <label className="form-label">Student ID (UMaT)</label>
                    <input className="form-input" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} placeholder="e.g. 991823" required />
                  </div>
                )}
              </>
            )}
            <div className="form-field">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@domain.com" required />
            </div>
            <div className="form-field">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required />
            </div>
            {error && <div className="error-msg">{error}</div>}
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '13px', fontSize: '15px' }}>
              {loading ? 'Please wait...' : (mode === 'login' ? 'Sign In →' : 'Create Account →')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ============================
   CHECKOUT MODAL
============================ */
function CheckoutModal({ hostel, roomType, price, token, onClose }) {
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const process = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/hostels/${hostel.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ roomType, price }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`HH-TARKWA-${Date.now().toString().slice(-6).toUpperCase()}`);
      } else {
        alert(data.message || 'Payment failed');
      }
    } catch {
      alert('Error connecting to server.');
    }
    setLoading(false);
  };

  const waLink = `https://wa.me/${(hostel.agentPhone || '').replace(/\s+/g, '')}`;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="checkout-header">
          <h3>{success ? '🎉 Booking Confirmed!' : '🏠 Secure Direct Booking'}</h3>
          <button className="modal-close" onClick={onClose} style={{ position: 'static', background: 'rgba(255,255,255,0.2)', color: 'white' }}>×</button>
        </div>
        <div className="checkout-body">
          {!success ? (
            <>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                You are booking <strong>{roomType}</strong> at <strong>{hostel.name}</strong>.
              </p>
              <div className="checkout-info-box">
                <p><strong>Bank:</strong> {hostel.bankDetails?.bankName || 'Ghana Commercial Bank'}</p>
                <p><strong>Account Name:</strong> {hostel.bankDetails?.accountName || hostel.managerName || 'Hostel Hub Manager'}</p>
                <p><strong>Account Number:</strong> {hostel.bankDetails?.accountNumber || '1029384756'}</p>
              </div>
              <div style={{ borderLeft: '3px solid var(--amber-400)', paddingLeft: '12px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.6' }}>
                <strong>How to pay:</strong> Transfer exactly <strong style={{ color: 'var(--navy-700)' }}>{formatCurrency(price)}</strong> to the bank account above, then click the button below to register your payment receipt.
              </div>
              <button className="btn btn-primary" onClick={process} disabled={loading} style={{ width: '100%', padding: '14px' }}>
                {loading ? 'Processing...' : '✅ I Have Completed the Transfer'}
              </button>
            </>
          ) : (
            <div className="checkout-success">
              <div className="checkout-success-icon">✅</div>
              <h4 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>Room Reservation Confirmed!</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Your payment has been logged in the manager's accounting system.
              </p>
              <div className="checkout-ref">{success}</div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Quote this reference to your agent to collect your keys.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <a href={waLink} target="_blank" rel="noreferrer" className="btn btn-success">
                  💬 WhatsApp Agent
                </a>
                <button className="btn btn-outline" onClick={onClose}>Close</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================
   FLOATING WHATSAPP
============================ */
function FloatingWhatsApp() {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="float-wa">
      {hovered && <div className="float-wa-tooltip">Chat with an Agent</div>}
      <button
        className="float-wa-btn"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => window.open('https://wa.me/233201234567', '_blank')}
        title="Chat on WhatsApp"
      >
        💬
      </button>
    </div>
  );
}

/* ============================
   FOOTER
============================ */
function Footer({ setActiveTab }) {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <h3>🏠 Hostel Hub</h3>
          <p>
            The only student hostel platform in Tarkwa where every room is personally visited,
            photographed, and verified before listing. Find your home near UMaT without the stress.
          </p>
          <span className="footer-tagline">🇬🇭 Proudly Ghanaian</span>
        </div>
        <div className="footer-col">
          <h4>Students</h4>
          <ul className="footer-links">
            <li onClick={() => setActiveTab('browse')}>Browse Hostels</li>
            <li onClick={() => setActiveTab('browse')}>Price Filter</li>
            <li onClick={() => setActiveTab('browse')}>Book a Tour</li>
            <li onClick={() => setActiveTab('browse')}>Pay Online</li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Managers</h4>
          <ul className="footer-links">
            <li onClick={() => setActiveTab('pitch')}>List Your Hostel</li>
            <li onClick={() => setActiveTab('pitch')}>Pricing Plans</li>
            <li onClick={() => setActiveTab('manager-finances')}>Finance Dashboard</li>
            <li onClick={() => setActiveTab('pitch')}>Photography Service</li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Platform</h4>
          <ul className="footer-links">
            <li onClick={() => setActiveTab('roadmap')}>Success Roadmap</li>
            <li>Contact Us</li>
            <li>Privacy Policy</li>
            <li>Terms of Use</li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <span>© {new Date().getFullYear()} Hostel Hub Tarkwa. All rights reserved.</span>
          <span>Built for UMaT students · Tarkwa, Western Region</span>
        </div>
      </div>
    </footer>
  );
}

/* ============================
   MANAGER PORTAL
============================ */
function ManagerPortal({ token, user, activeSection, setActiveSection }) {
  const [finances, setFinances] = useState(null);
  const [bankForm, setBankForm] = useState({ bankName: '', accountName: '', accountNumber: '' });
  const [expenseForm, setExpenseForm] = useState({ hostelId: '', amount: '', category: 'Maintenance', description: '' });
  const [hostelForm, setHostelForm] = useState({
    name: '', location: 'Agric Hill', address: '', pricePerYear: 5000, rating: 4.8,
    mapsUrl: '', facilities: 'Wi-Fi,Water,Security,Electricity Backup',
    agentName: '', agentPhone: '', agentEmail: '', description: '',
    room1Active: true, room1Price: 9000,
    room2Active: true, room2Price: 7000,
    room3Active: false, room3Price: 5500,
    room4Active: false, room4Price: 4500,
    kitchenPhotos: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=900&q=80',
  });
  const [studentForm, setStudentForm] = useState({ name: '', email: '', phone: '', studentId: '', gender: '', institution: '', level: '', emergencyContact: '', hostelId: '', hostelName: '', roomId: '', roomNumber: '', balance: '' });
  const [roomForm, setRoomForm] = useState({ hostelId: '', blockName: 'Block A', roomNumber: '', capacity: 4, status: 'Available' });
  const [paymentForm, setPaymentForm] = useState({ studentId: '', amount: '', description: '' });
  const [maintenanceForm, setMaintenanceForm] = useState({ title: '', description: '', category: 'Electrical', priority: 'Medium', studentId: '', studentName: '', hostelId: '', hostelName: '' });
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '', type: 'General', audience: 'All' });
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', accountStatus: 'Active', managerId: user?.id || '' });
  const [profileImage, setProfileImage] = useState(() => localStorage.getItem('hostelHubProfileImage') || '');
  const [locationOptions, setLocationOptions] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/manager/finances`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setFinances(data);
        if (data.bankDetails) setBankForm(data.bankDetails);
        if (!studentForm.hostelId && data.hostels?.length) setStudentForm(prev => ({ ...prev, hostelId: data.hostels[0].id, hostelName: data.hostels[0].name }));
      }
    } catch {}
    setLoading(false);
  };

  const loadLocationOptions = async () => {
    try {
      const res = await fetch(`${API}/api/locations`);
      const data = await res.json();
      const locations = (data.locations || []).map((item) => item.name).filter(Boolean);
      setLocationOptions(locations);
      if (!locations.length) return;
      setHostelForm((prev) => ({ ...prev, location: locations.includes(prev.location) ? prev.location : locations[0] }));
    } catch {
      setLocationOptions(['UMaT Main Gate / Campus', 'Tarkwa (town centre)', 'Tamso', 'Akyempim', 'Brahabebome', 'Akoon']);
    }
  };

  useEffect(() => { load(); loadLocationOptions(); }, []);
  useEffect(() => {
    setProfileForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      accountStatus: 'Active',
      managerId: user?.id || '',
    });
  }, [user]);

  const saveBankDetails = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    try {
      const res = await fetch(`${API}/api/manager/bank-account`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(bankForm) });
      const data = await res.json();
      if (res.ok) { setSuccess('Bank account linked!'); load(); }
      else setError(data.message || 'Failed.');
    } catch { setError('Network error.'); }
  };

  const logExpense = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    try {
      const res = await fetch(`${API}/api/manager/expenses`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(expenseForm) });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Expense logged!');
        setExpenseForm({ hostelId: '', amount: '', category: 'Maintenance', description: '' });
        load();
      } else setError(data.message || 'Failed.');
    } catch { setError('Network error.'); }
  };

  const createListing = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    const roomTypes = {};
    if (hostelForm.room1Active) roomTypes['1-in-a-room'] = { price: Number(hostelForm.room1Price), gallery: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'] };
    if (hostelForm.room2Active) roomTypes['2-in-a-room'] = { price: Number(hostelForm.room2Price), gallery: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80'] };
    if (hostelForm.room3Active) roomTypes['3-in-a-room'] = { price: Number(hostelForm.room3Price), gallery: ['https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'] };
    if (hostelForm.room4Active) roomTypes['4-in-a-room'] = { price: Number(hostelForm.room4Price), gallery: ['https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80'] };
    const payload = new FormData();
    Object.entries(hostelForm).forEach(([k, v]) => { if (!k.startsWith('room')) payload.append(k, v); });
    payload.append('roomTypes', JSON.stringify(roomTypes));
    Array.from(photos).forEach((p) => payload.append('photos', p));
    try {
      const res = await fetch(`${API}/api/admin/hostels`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: payload });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Failed.'); return; }
      setSuccess('Hostel published!');
      setShowAdd(false);
      load();
    } catch { setError('Network error.'); }
  };

  const addRoom = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    try {
      const res = await fetch(`${API}/api/manager/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(roomForm) });
      const data = await res.json();
      if (res.ok) { setSuccess('Room added successfully'); setRoomForm({ hostelId: roomForm.hostelId, blockName: 'Block A', roomNumber: '', capacity: 4, status: 'Available' }); load(); }
      else setError(data.message || 'Failed.');
    } catch { setError('Network error.'); }
  };

  const registerStudent = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    try {
      const res = await fetch(`${API}/api/manager/students`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(studentForm) });
      const data = await res.json();
      if (res.ok) { setSuccess('Resident registered successfully'); setStudentForm({ name: '', email: '', phone: '', studentId: '', gender: '', institution: '', level: '', emergencyContact: '', hostelId: studentForm.hostelId, hostelName: studentForm.hostelName, roomId: '', roomNumber: '', balance: '' }); load(); }
      else setError(data.message || 'Failed.');
    } catch { setError('Network error.'); }
  };

  const recordPayment = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    try {
      const res = await fetch(`${API}/api/manager/payments`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(paymentForm) });
      const data = await res.json();
      if (res.ok) { setSuccess('Payment recorded'); setPaymentForm({ studentId: '', amount: '', description: '' }); load(); }
      else setError(data.message || 'Failed.');
    } catch { setError('Network error.'); }
  };

  const submitMaintenance = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    try {
      const res = await fetch(`${API}/api/manager/maintenance`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(maintenanceForm) });
      const data = await res.json();
      if (res.ok) { setSuccess('Maintenance request submitted'); setMaintenanceForm({ title: '', description: '', category: 'Electrical', priority: 'Medium', studentId: '', studentName: '', hostelId: '', hostelName: '' }); load(); }
      else setError(data.message || 'Failed.');
    } catch { setError('Network error.'); }
  };

  const submitAnnouncement = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    try {
      const res = await fetch(`${API}/api/manager/announcements`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(announcementForm) });
      const data = await res.json();
      if (res.ok) { setSuccess('Announcement posted'); setAnnouncementForm({ title: '', message: '', type: 'General', audience: 'All' }); load(); }
      else setError(data.message || 'Failed.');
    } catch { setError('Network error.'); }
  };

  const saveProfile = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    try {
      const res = await fetch(`${API}/api/manager/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Failed to update profile'); return; }
      setSuccess('Profile updated successfully');
      load();
    } catch { setError('Network error.'); }
  };

  const handleProfileImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      setProfileImage(result);
      localStorage.setItem('hostelHubProfileImage', result);
      setSuccess('Profile photo updated locally.');
    };
    reader.readAsDataURL(file);
  };

  const hf = (field, val) => setHostelForm({ ...hostelForm, [field]: val });

  return (
    <div className="manager-page">
      <h1>💼 Hostel Operations Dashboard</h1>
      <p>Run your hostel like a modern property business with rooms, residents, payments, maintenance, and announcements in one place.</p>

      <div className="stats-grid">
        <div className="stat-card income">
          <div className="stat-card-label">Total Rooms</div>
          <div className="stat-card-value">{finances?.summary?.totalRooms || 0}</div>
        </div>
        <div className="stat-card expense">
          <div className="stat-card-label">Occupied Rooms</div>
          <div className="stat-card-value">{finances?.summary?.occupiedRooms || 0}</div>
        </div>
        <div className="stat-card net">
          <div className="stat-card-label">Available Rooms</div>
          <div className="stat-card-value">{finances?.summary?.availableRooms || 0}</div>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card income">
          <div className="stat-card-label">Residents</div>
          <div className="stat-card-value">{finances?.summary?.totalStudents || 0}</div>
        </div>
        <div className="stat-card expense">
          <div className="stat-card-label">Pending Payments</div>
          <div className="stat-card-value">{finances?.summary?.pendingPayments || 0}</div>
        </div>
        <div className="stat-card net">
          <div className="stat-card-label">Monthly Revenue</div>
          <div className="stat-card-value">{formatCurrency(finances?.totalIncome || 0)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Pending Maintenance</div>
          <div className="stat-card-value">{finances?.summary?.pendingMaintenance || 0}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {['overview','profile','hostels','rooms','students','payments','maintenance','reports','communications'].map((section) => (
          <button key={section} className={`btn btn-outline btn-sm ${activeSection === section ? 'btn-primary' : ''}`} onClick={() => setActiveSection(section)}>{section === 'overview' ? 'Overview' : section.charAt(0).toUpperCase() + section.slice(1)}</button>
        ))}
      </div>

      {loading && <div className="success-msg">Loading dashboard data…</div>}

      {activeSection === 'profile' && (
        <div style={{ display: 'grid', gap: '24px' }}>
          <div className="panel">
            <h3>Manager Profile</h3>
            <p>Review and update your manager profile details, contact information, and security settings.</p>
            <form onSubmit={saveProfile} style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div className="profile-avatar" style={{ width: '84px', height: '84px', fontSize: '26px' }}>{getInitials(profileForm.name || user?.name)}</div>
                <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                  Upload Profile Image
                  <input type="file" accept="image/*" onChange={handleProfileImage} style={{ display: 'none' }} />
                </label>
                {profileImage && <img src={profileImage} alt="Profile preview" style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover' }} />}
              </div>
              <div className="form-grid-2">
                <div className="form-field"><label className="form-label">Full Name</label><input className="form-input" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} required /></div>
                <div className="form-field"><label className="form-label">Email</label><input className="form-input" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} required /></div>
              </div>
              <div className="form-grid-2">
                <div className="form-field"><label className="form-label">Phone</label><input className="form-input" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} required /></div>
                <div className="form-field"><label className="form-label">Hostel Manager ID</label><input className="form-input" value={profileForm.managerId || user?.id || ''} readOnly /></div>
              </div>
              <div className="form-grid-2">
                <div className="form-field"><label className="form-label">Role</label><input className="form-input" value={user?.role || 'manager'} readOnly /></div>
                <div className="form-field"><label className="form-label">Account Status</label><select className="form-input" value={profileForm.accountStatus} onChange={(e) => setProfileForm({ ...profileForm, accountStatus: e.target.value })}><option value="Active">Active</option><option value="Pending">Pending</option><option value="Suspended">Suspended</option></select></div>
              </div>
              <div className="form-grid-2">
                <div className="form-field"><label className="form-label">Change Password</label><input className="form-input" type="password" placeholder="Enter new password" /></div>
                <div className="form-field"><label className="form-label">Account Settings</label><button type="button" className="btn btn-outline" onClick={() => setSuccess('Account settings opened. Use the save button to keep your changes.')}>Open Settings</button></div>
              </div>
              {error && <div className="error-msg">{error}</div>}{success && <div className="success-msg">{success}</div>}
              <button type="submit" className="btn btn-primary">Save Profile</button>
            </form>
          </div>
        </div>
      )}

      {activeSection === 'overview' && (
        <>
          <div style={{ marginBottom: '24px' }}>
            <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>{showAdd ? '✕ Close Form' : '+ Publish New Hostel'}</button>
          </div>

          {showAdd && (
            <div className="panel" style={{ marginBottom: '24px' }}>
              <h3>List a New Hostel</h3>
              <p>All fields are required. Our team will verify the listing before it goes live.</p>
              <form onSubmit={createListing} style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
                <div className="form-grid-2">
                  <div className="form-field"><label className="form-label">Hostel Name</label><input className="form-input" value={hostelForm.name} onChange={(e) => hf('name', e.target.value)} placeholder="e.g. Royal Palace Lodge" required /></div>
                  <div className="form-field"><label className="form-label">Location</label><select className="form-input" value={hostelForm.location} onChange={(e) => hf('location', e.target.value)} required>{locationOptions.map((location) => (<option key={location} value={location}>{location}</option>))}</select></div>
                </div>
                <div className="form-grid-2">
                  <div className="form-field"><label className="form-label">Street / Landmark</label><input className="form-input" value={hostelForm.address} onChange={(e) => hf('address', e.target.value)} placeholder="e.g. UMaT West Road" required /></div>
                  <div className="form-field"><label className="form-label">Google Maps URL</label><input className="form-input" value={hostelForm.mapsUrl} onChange={(e) => hf('mapsUrl', e.target.value)} placeholder="https://maps.google.com/?q=..." required /></div>
                </div>
                <div className="form-grid-2">
                  <div className="form-field"><label className="form-label">Base Price / Year (GHS)</label><input className="form-input" type="number" value={hostelForm.pricePerYear} onChange={(e) => hf('pricePerYear', Number(e.target.value))} required /></div>
                  <div className="form-field"><label className="form-label">Facilities (comma-separated)</label><input className="form-input" value={hostelForm.facilities} onChange={(e) => hf('facilities', e.target.value)} /></div>
                </div>
                <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px' }}>Room Occupancy Pricing:</p>
                  <div className="form-grid-4">
                    {[1,2,3,4].map((n) => (
                      <label key={n} className="room-checkbox-item"><input type="checkbox" checked={hostelForm[`room${n}Active`]} onChange={(e) => hf(`room${n}Active`, e.target.checked)} />{n}-in-a-room{hostelForm[`room${n}Active`] && <input type="number" className="room-price-input" value={hostelForm[`room${n}Price`]} onChange={(e) => hf(`room${n}Price`, e.target.value)} />}</label>
                    ))}
                  </div>
                </div>
                <div className="form-grid-2">
                  <div className="form-field"><label className="form-label">Agent Name</label><input className="form-input" value={hostelForm.agentName} onChange={(e) => hf('agentName', e.target.value)} required /></div>
                  <div className="form-field"><label className="form-label">Agent Phone</label><input className="form-input" value={hostelForm.agentPhone} onChange={(e) => hf('agentPhone', e.target.value)} required /></div>
                </div>
                <div className="form-field"><label className="form-label">Description</label><textarea className="form-input" value={hostelForm.description} onChange={(e) => hf('description', e.target.value)} rows={3} required style={{ resize: 'vertical' }} /></div>
                <div className="form-field"><label className="form-label">Upload Room Photos</label><input className="form-input" type="file" multiple accept="image/*" onChange={(e) => setPhotos(e.target.files)} /></div>
                {error && <div className="error-msg">{error}</div>}{success && <div className="success-msg">{success}</div>}
                <button type="submit" className="btn btn-primary">✅ Verify & Publish Listing</button>
              </form>
            </div>
          )}

          <div style={{ display: 'grid', gap: '24px' }}>
            <div className="panel">
              <h3>Recent Activity</h3>
              <p>Financial activity and hostel events for quick review.</p>
              <div className="ledger-table-wrapper">
                <table className="ledger-table">
                  <thead><tr><th>Date</th><th>Category</th><th>Details</th><th>Amount</th></tr></thead>
                  <tbody>
                    {(finances?.transactions || []).slice(0, 8).map((tx) => (
                      <tr key={tx.id}><td>{new Date(tx.createdAt).toLocaleDateString()}</td><td>{tx.category}</td><td>{tx.description}</td><td style={{ color: tx.type === 'income' ? 'var(--emerald-500)' : 'var(--red-500)', fontWeight: '800' }}>{tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {activeSection === 'hostels' && (
        <div style={{ display: 'grid', gap: '24px' }}>
          <div className="panel">
            <h3>Hostel Management Workspace</h3>
            <p>Manage hostel details, blocks, capacity, occupancy, photos, and publishing.</p>
            <div className="form-grid-2" style={{ marginTop: '14px' }}>
              <div className="stat-card income">
                <div className="stat-card-label">Hostels Managed</div>
                <div className="stat-card-value">{finances?.hostels?.length || 0}</div>
              </div>
              <div className="stat-card net">
                <div className="stat-card-label">Occupancy</div>
                <div className="stat-card-value">{Math.round(((finances?.summary?.occupiedRooms || 0) / Math.max(finances?.summary?.totalRooms || 1, 1)) * 100)}%</div>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)} style={{ marginTop: '16px' }}>{showAdd ? 'Hide Form' : 'Add Hostel'}</button>
            {showAdd && (
              <div style={{ marginTop: '16px' }}>
                <form onSubmit={createListing} style={{ display: 'grid', gap: '16px' }}>
                  <div className="form-grid-2">...</div>
                </form>
              </div>
            )}
          </div>

          <div className="panel">
            <h3>Hostel Information</h3>
            <div className="ledger-table-wrapper">
              <table className="ledger-table">
                <thead><tr><th>Hostel</th><th>Location</th><th>Capacity</th><th>Occupancy</th><th>Action</th></tr></thead>
                <tbody>
                  {(finances?.hostels || []).map((hostel) => (
                    <tr key={hostel.id}><td>{hostel.name}</td><td>—</td><td>{finances?.summary?.totalRooms || 0}</td><td>{finances?.summary?.occupiedRooms || 0}</td><td><button className="btn btn-outline btn-sm" type="button" onClick={() => setSuccess('Hostel editing is available in the add form.')}>Edit</button></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'rooms' && (
        <div style={{ display: 'grid', gap: '24px' }}>
          <div className="panel">
            <h3>Room Management</h3>
            <p>Create rooms, assign capacities, and track availability for every hostel block.</p>
            <form onSubmit={addRoom} style={{ display: 'grid', gap: '12px' }}>
              <div className="form-grid-2">
                <div className="form-field"><label className="form-label">Hostel</label><select className="form-input" value={roomForm.hostelId} onChange={(e) => setRoomForm({ ...roomForm, hostelId: e.target.value })} required>{(finances?.hostels || []).map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select></div>
                <div className="form-field"><label className="form-label">Block / Building</label><input className="form-input" value={roomForm.blockName} onChange={(e) => setRoomForm({ ...roomForm, blockName: e.target.value })} /></div>
              </div>
              <div className="form-grid-2">
                <div className="form-field"><label className="form-label">Room Number</label><input className="form-input" value={roomForm.roomNumber} onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })} placeholder="A101" required /></div>
                <div className="form-field"><label className="form-label">Capacity</label><input className="form-input" type="number" value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })} required /></div>
              </div>
              <div className="form-field"><label className="form-label">Status</label><select className="form-input" value={roomForm.status} onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value })}><option value="Available">Available</option><option value="Occupied">Occupied</option><option value="Maintenance">Maintenance</option></select></div>
              {error && <div className="error-msg">{error}</div>}{success && <div className="success-msg">{success}</div>}
              <button className="btn btn-primary" type="submit">Add Room</button>
            </form>
          </div>

          <div className="panel">
            <h3>Room Inventory</h3>
            <div className="ledger-table-wrapper">
              <table className="ledger-table">
                <thead><tr><th>Room</th><th>Block</th><th>Capacity</th><th>Occupied</th><th>Available</th><th>Status</th></tr></thead>
                <tbody>
                  {(finances?.rooms || []).map((room) => (
                    <tr key={room.id}><td>{room.roomNumber}</td><td>{room.blockName}</td><td>{room.capacity}</td><td>{room.occupied}</td><td>{room.available}</td><td>{room.status}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'students' && (
        <div style={{ display: 'grid', gap: '24px' }}>
          <div className="panel">
            <h3>Register Resident</h3>
            <form onSubmit={registerStudent} style={{ display: 'grid', gap: '12px' }}>
              <div className="form-grid-2">
                <div className="form-field"><label className="form-label">Full Name</label><input className="form-input" value={studentForm.name} onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} required /></div>
                <div className="form-field"><label className="form-label">Student ID</label><input className="form-input" value={studentForm.studentId} onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })} required /></div>
              </div>
              <div className="form-grid-2">
                <div className="form-field"><label className="form-label">Email</label><input className="form-input" value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} required /></div>
                <div className="form-field"><label className="form-label">Phone</label><input className="form-input" value={studentForm.phone} onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })} required /></div>
              </div>
              <div className="form-grid-2">
                <div className="form-field"><label className="form-label">Gender</label><input className="form-input" value={studentForm.gender} onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })} /></div>
                <div className="form-field"><label className="form-label">Institution</label><input className="form-input" value={studentForm.institution} onChange={(e) => setStudentForm({ ...studentForm, institution: e.target.value })} /></div>
              </div>
              <div className="form-grid-2">
                <div className="form-field"><label className="form-label">Level</label><input className="form-input" value={studentForm.level} onChange={(e) => setStudentForm({ ...studentForm, level: e.target.value })} /></div>
                <div className="form-field"><label className="form-label">Emergency Contact</label><input className="form-input" value={studentForm.emergencyContact} onChange={(e) => setStudentForm({ ...studentForm, emergencyContact: e.target.value })} /></div>
              </div>
              <div className="form-grid-2">
                <div className="form-field"><label className="form-label">Hostel</label><select className="form-input" value={studentForm.hostelId} onChange={(e) => { const selected = (finances?.hostels || []).find((h) => h.id === e.target.value); setStudentForm({ ...studentForm, hostelId: e.target.value, hostelName: selected ? selected.name : '' }); }}><option value="">Select hostel</option>{(finances?.hostels || []).map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select></div>
                <div className="form-field"><label className="form-label">Room Number</label><input className="form-input" value={studentForm.roomNumber} onChange={(e) => setStudentForm({ ...studentForm, roomNumber: e.target.value })} /></div>
              </div>
              <div className="form-field"><label className="form-label">Balance (GHS)</label><input className="form-input" type="number" value={studentForm.balance} onChange={(e) => setStudentForm({ ...studentForm, balance: e.target.value })} /></div>
              {error && <div className="error-msg">{error}</div>}{success && <div className="success-msg">{success}</div>}
              <button className="btn btn-primary" type="submit">Register Resident</button>
            </form>
          </div>

          <div className="panel">
            <h3>Resident Directory</h3>
            <div className="ledger-table-wrapper">
              <table className="ledger-table">
                <thead><tr><th>Name</th><th>Student ID</th><th>Hostel</th><th>Room</th><th>Balance</th><th>Status</th></tr></thead>
                <tbody>
                  {(finances?.students || []).map((student) => (
                    <tr key={student.id}><td>{student.name}</td><td>{student.studentId}</td><td>{student.hostelName || '—'}</td><td>{student.roomNumber || '—'}</td><td>{formatCurrency(student.balance || 0)}</td><td>{student.status || 'Active'}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'reports' && (
        <div style={{ display: 'grid', gap: '24px' }}>
          <div className="panel">
            <h3>Reports & Analytics</h3>
            <p>Track occupancy, payments, maintenance trends, and student population across weekly, monthly, and yearly views.</p>
            <div className="stats-grid">
              <div className="stat-card income"><div className="stat-card-label">Occupancy</div><div className="stat-card-value">{Math.round(((finances?.summary?.occupiedRooms || 0) / Math.max(finances?.summary?.totalRooms || 1, 1)) * 100)}%</div></div>
              <div className="stat-card expense"><div className="stat-card-label">Revenue</div><div className="stat-card-value">{formatCurrency(finances?.totalIncome || 0)}</div></div>
              <div className="stat-card net"><div className="stat-card-label">Students</div><div className="stat-card-value">{finances?.summary?.totalStudents || 0}</div></div>
              <div className="stat-card"><div className="stat-card-label">Maintenance</div><div className="stat-card-value">{finances?.summary?.pendingMaintenance || 0}</div></div>
            </div>
            <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
              <div className="profile-progress-card">
                <div className="profile-progress-top"><span>Weekly Report</span><strong>Healthy</strong></div>
                <div className="profile-progress-bar"><span style={{ width: '78%' }} /></div>
              </div>
              <div className="profile-progress-card">
                <div className="profile-progress-top"><span>Monthly Report</span><strong>On Track</strong></div>
                <div className="profile-progress-bar"><span style={{ width: '64%' }} /></div>
              </div>
              <div className="profile-progress-card">
                <div className="profile-progress-top"><span>Yearly Report</span><strong>Stable</strong></div>
                <div className="profile-progress-bar"><span style={{ width: '82%' }} /></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'payments' && (
        <div style={{ display: 'grid', gap: '24px' }}>
          <div className="panel">
            <h3>Record Payment</h3>
            <form onSubmit={recordPayment} style={{ display: 'grid', gap: '12px' }}>
              <div className="form-field"><label className="form-label">Resident</label><select className="form-input" value={paymentForm.studentId} onChange={(e) => setPaymentForm({ ...paymentForm, studentId: e.target.value })} required>{(finances?.students || []).map((student) => <option key={student.id} value={student.id}>{student.name} ({student.studentId})</option>)}</select></div>
              <div className="form-field"><label className="form-label">Amount (GHS)</label><input className="form-input" type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} required /></div>
              <div className="form-field"><label className="form-label">Description</label><input className="form-input" value={paymentForm.description} onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })} /></div>
              {error && <div className="error-msg">{error}</div>}{success && <div className="success-msg">{success}</div>}
              <button className="btn btn-primary" type="submit">Save Payment</button>
            </form>
          </div>

          <div className="panel">
            <h3>Payment History</h3>
            <div className="ledger-table-wrapper">
              <table className="ledger-table">
                <thead><tr><th>Resident</th><th>Amount</th><th>Category</th><th>Description</th><th>Date</th></tr></thead>
                <tbody>
                  {(finances?.transactions || []).filter((tx) => tx.type === 'income').map((tx) => (
                    <tr key={tx.id}><td>{tx.studentName || '—'}</td><td>{formatCurrency(tx.amount)}</td><td>{tx.category}</td><td>{tx.description}</td><td>{new Date(tx.createdAt).toLocaleDateString()}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'maintenance' && (() => {
        const ROOM_MAINTENANCE_HINTS = {
          'Electrical': { icon: '⚡', color: '#f59e0b', desc: 'Sockets, lighting, wiring faults' },
          'Plumbing':   { icon: '🚿', color: '#3b82f6', desc: 'Pipes, taps, drainage, toilets' },
          'Furniture':  { icon: '🪑', color: '#8b5cf6', desc: 'Beds, desks, wardrobes, doors' },
          'Structural': { icon: '🧱', color: '#ef4444', desc: 'Walls, ceiling, floors, windows' },
          'Cleaning':   { icon: '🧹', color: '#10b981', desc: 'Deep clean, pest control, waste' },
          'General':    { icon: '🔧', color: '#6b7280', desc: 'Miscellaneous repairs' },
        };

        const allRequests = finances?.maintenance || [];
        const allRooms    = finances?.rooms || [];
        const allStudents = finances?.students || [];

        const [mFilter, setMFilter] = React.useState('All');
        const [mStatusFilter, setMStatusFilter] = React.useState('All');
        const [updatingId, setUpdatingId] = React.useState(null);

        const updateStatus = async (id, status) => {
          setUpdatingId(id);
          try {
            await fetch(`${API}/api/manager/maintenance/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ status }),
            });
            load();
          } catch {}
          setUpdatingId(null);
        };

        const filtered = allRequests.filter(r =>
          (mFilter === 'All' || r.category === mFilter) &&
          (mStatusFilter === 'All' || r.status === mStatusFilter)
        );

        const pendingCount    = allRequests.filter(r => r.status === 'Pending').length;
        const inProgressCount = allRequests.filter(r => r.status === 'In Progress').length;
        const completedCount  = allRequests.filter(r => r.status === 'Completed').length;

        // Map rooms to their likely maintenance categories based on capacity & status
        const roomsNeedingAttention = allRooms.filter(r => r.status === 'Maintenance' || r.occupied >= r.capacity);

        return (
          <div style={{ display: 'grid', gap: '24px' }}>

            {/* ── Summary strip ── */}
            <div className="stats-grid">
              <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                <div className="stat-card-label">⏳ Pending</div>
                <div className="stat-card-value">{pendingCount}</div>
              </div>
              <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
                <div className="stat-card-label">🔨 In Progress</div>
                <div className="stat-card-value">{inProgressCount}</div>
              </div>
              <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
                <div className="stat-card-label">✅ Completed</div>
                <div className="stat-card-value">{completedCount}</div>
              </div>
              <div className="stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
                <div className="stat-card-label">🛏️ Rooms Flagged</div>
                <div className="stat-card-value">{roomsNeedingAttention.length}</div>
              </div>
            </div>

            {/* ── Room-by-room maintenance snapshot ── */}
            <div className="panel">
              <h3>🏠 Room Maintenance Snapshot</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Each room type has predictable maintenance needs. Use this to log requests directly against a room.
              </p>
              {allRooms.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No rooms found. Add rooms first under Room Management.</p>
              ) : (
                <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                  {allRooms.map(room => {
                    const occupancy = room.capacity > 0 ? Math.round((room.occupied / room.capacity) * 100) : 0;
                    const residents = allStudents.filter(s => s.room_id === room.id || s.roomId === room.id || s.room_number === room.room_number);
                    const openRequests = allRequests.filter(r =>
                      (r.hostel_id === room.hostel_id || r.hostelId === room.hostelId) &&
                      r.status !== 'Completed'
                    ).length;

                    // Suggest likely maintenance categories based on capacity
                    const suggestions = room.capacity >= 3
                      ? ['Plumbing', 'Electrical', 'Cleaning']
                      : ['Electrical', 'Furniture'];

                    return (
                      <div key={room.id} style={{
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                        background: room.status === 'Maintenance' ? 'rgba(239,68,68,0.05)' : 'var(--bg-subtle)',
                        borderLeft: room.status === 'Maintenance' ? '4px solid #ef4444' : room.occupied >= room.capacity ? '4px solid #f59e0b' : '4px solid #10b981',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <div>
                            <div style={{ fontWeight: '800', fontSize: '15px' }}>Room {room.room_number || room.roomNumber}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{room.block_name || room.blockName || 'Main Block'} · {room.hostel_name || room.hostelName}</div>
                          </div>
                          <span style={{
                            fontSize: '11px', padding: '3px 8px', borderRadius: '20px', fontWeight: '700',
                            background: room.status === 'Maintenance' ? '#fef2f2' : room.status === 'Occupied' ? '#fefce8' : '#f0fdf4',
                            color: room.status === 'Maintenance' ? '#ef4444' : room.status === 'Occupied' ? '#d97706' : '#16a34a',
                          }}>{room.status}</span>
                        </div>

                        {/* Occupancy bar */}
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            <span>Occupancy</span>
                            <span>{room.occupied}/{room.capacity} residents ({occupancy}%)</span>
                          </div>
                          <div style={{ height: '6px', borderRadius: '3px', background: 'var(--border-light)' }}>
                            <div style={{ height: '100%', borderRadius: '3px', width: `${occupancy}%`, background: occupancy >= 100 ? '#f59e0b' : '#10b981', transition: 'width 0.3s' }} />
                          </div>
                        </div>

                        {/* Likely maintenance needs */}
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Likely needs</div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {suggestions.map(cat => (
                              <span key={cat} style={{
                                fontSize: '11px', padding: '2px 8px', borderRadius: '12px',
                                background: ROOM_MAINTENANCE_HINTS[cat]?.color + '20',
                                color: ROOM_MAINTENANCE_HINTS[cat]?.color,
                                fontWeight: '600',
                              }}>
                                {ROOM_MAINTENANCE_HINTS[cat]?.icon} {cat}
                              </span>
                            ))}
                          </div>
                        </div>

                        {openRequests > 0 && (
                          <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '600', marginBottom: '8px' }}>
                            ⚠️ {openRequests} open request{openRequests > 1 ? 's' : ''} for this hostel
                          </div>
                        )}

                        {/* Quick-log button */}
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ width: '100%', marginTop: '4px', fontSize: '12px' }}
                          onClick={() => {
                            setMaintenanceForm(prev => ({
                              ...prev,
                              hostelId: room.hostel_id || room.hostelId || '',
                              hostelName: room.hostel_name || room.hostelName || '',
                              studentName: residents[0]?.name || '',
                              studentId: residents[0]?.id || '',
                              category: suggestions[0],
                              title: `${suggestions[0]} issue in Room ${room.room_number || room.roomNumber}`,
                            }));
                            document.getElementById('maintenance-form-panel')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          + Log Request for this Room
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Log new request ── */}
            <div className="panel" id="maintenance-form-panel">
              <h3>📝 Log Maintenance Request</h3>
              <form onSubmit={submitMaintenance} style={{ display: 'grid', gap: '12px' }}>
                <div className="form-grid-2">
                  <div className="form-field">
                    <label className="form-label">Title</label>
                    <input className="form-input" value={maintenanceForm.title} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, title: e.target.value })} placeholder="e.g. Faulty socket in Room A3" required />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Category</label>
                    <select className="form-input" value={maintenanceForm.category} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, category: e.target.value })}>
                      {Object.entries(ROOM_MAINTENANCE_HINTS).map(([cat, meta]) => (
                        <option key={cat} value={cat}>{meta.icon} {cat} — {meta.desc}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" value={maintenanceForm.description} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })} rows={3} placeholder="Describe the issue in detail..." required />
                </div>
                <div className="form-grid-2">
                  <div className="form-field">
                    <label className="form-label">Priority</label>
                    <select className="form-input" value={maintenanceForm.priority} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, priority: e.target.value })}>
                      <option value="Low">🟢 Low — Not urgent</option>
                      <option value="Medium">🟡 Medium — Fix this week</option>
                      <option value="High">🔴 High — Fix immediately</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Hostel</label>
                    <select className="form-input" value={maintenanceForm.hostelId} onChange={(e) => {
                      const h = (finances?.hostels || []).find(h => h.id === e.target.value);
                      setMaintenanceForm({ ...maintenanceForm, hostelId: e.target.value, hostelName: h?.name || '' });
                    }}>
                      <option value="">— Select hostel —</option>
                      {(finances?.hostels || []).map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-grid-2">
                  <div className="form-field">
                    <label className="form-label">Resident (optional)</label>
                    <select className="form-input" value={maintenanceForm.studentId} onChange={(e) => {
                      const s = allStudents.find(s => s.id === e.target.value);
                      setMaintenanceForm({ ...maintenanceForm, studentId: e.target.value, studentName: s?.name || '' });
                    }}>
                      <option value="">— None / General —</option>
                      {allStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.room_number || s.roomNumber || 'No room'})</option>)}
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Resident Name</label>
                    <input className="form-input" value={maintenanceForm.studentName} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, studentName: e.target.value })} placeholder="Auto-filled or type manually" />
                  </div>
                </div>
                {error && <div className="error-msg">{error}</div>}
                {success && <div className="success-msg">{success}</div>}
                <button className="btn btn-primary" type="submit">Submit Maintenance Request</button>
              </form>
            </div>

            {/* ── Active requests list ── */}
            <div className="panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>🛠️ All Requests</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['All', 'Pending', 'In Progress', 'Completed'].map(s => (
                    <button key={s} className={`btn btn-sm ${mStatusFilter === s ? 'btn-primary' : 'btn-outline'}`} onClick={() => setMStatusFilter(s)}>{s}</button>
                  ))}
                  <select className="form-input" style={{ padding: '4px 8px', fontSize: '12px', width: 'auto' }} value={mFilter} onChange={e => setMFilter(e.target.value)}>
                    <option value="All">All Categories</option>
                    {Object.keys(ROOM_MAINTENANCE_HINTS).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {filtered.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>No requests match the current filter.</p>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {filtered.map(item => {
                    const hint = ROOM_MAINTENANCE_HINTS[item.category] || ROOM_MAINTENANCE_HINTS['General'];
                    const priorityColor = item.priority === 'High' ? '#ef4444' : item.priority === 'Medium' ? '#f59e0b' : '#10b981';
                    const statusColor   = item.status === 'Completed' ? '#10b981' : item.status === 'In Progress' ? '#3b82f6' : '#f59e0b';
                    return (
                      <div key={item.id} style={{
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                        background: 'var(--bg-subtle)',
                        borderLeft: `4px solid ${hint.color}`,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '16px' }}>{hint.icon}</span>
                              <span style={{ fontWeight: '800', fontSize: '14px' }}>{item.title}</span>
                              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: hint.color + '20', color: hint.color, fontWeight: '700' }}>{item.category}</span>
                              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: priorityColor + '15', color: priorityColor, fontWeight: '700' }}>
                                {item.priority === 'High' ? '🔴' : item.priority === 'Medium' ? '🟡' : '🟢'} {item.priority}
                              </span>
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{item.description}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {item.hostel_name || item.hostelName ? `🏠 ${item.hostel_name || item.hostelName}` : ''}
                              {(item.student_name || item.studentName) ? ` · 👤 ${item.student_name || item.studentName}` : ''}
                              {item.created_at ? ` · 🕐 ${new Date(item.created_at).toLocaleDateString()}` : ''}
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', background: statusColor + '15', color: statusColor }}>{item.status}</span>
                            {item.status !== 'Completed' && (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {item.status === 'Pending' && (
                                  <button className="btn btn-sm btn-outline" style={{ fontSize: '11px', color: '#3b82f6', borderColor: '#3b82f6' }} disabled={updatingId === item.id} onClick={() => updateStatus(item.id, 'In Progress')}>
                                    {updatingId === item.id ? '...' : '▶ Start'}
                                  </button>
                                )}
                                <button className="btn btn-sm btn-outline" style={{ fontSize: '11px', color: '#10b981', borderColor: '#10b981' }} disabled={updatingId === item.id} onClick={() => updateStatus(item.id, 'Completed')}>
                                  {updatingId === item.id ? '...' : '✓ Done'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {item.notes && <div style={{ marginTop: '8px', padding: '8px', borderRadius: '6px', background: 'var(--bg-card)', fontSize: '12px', color: 'var(--text-muted)' }}>📋 {item.notes}</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        );
      })()}

      {activeSection === 'communications' && (
        <div style={{ display: 'grid', gap: '24px' }}>
          <div className="panel">
            <h3>Post Announcement</h3>
            <form onSubmit={submitAnnouncement} style={{ display: 'grid', gap: '12px' }}>
              <div className="form-grid-2">
                <div className="form-field"><label className="form-label">Title</label><input className="form-input" value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} required /></div>
                <div className="form-field"><label className="form-label">Type</label><input className="form-input" value={announcementForm.type} onChange={(e) => setAnnouncementForm({ ...announcementForm, type: e.target.value })} /></div>
              </div>
              <div className="form-field"><label className="form-label">Message</label><textarea className="form-input" value={announcementForm.message} onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })} rows={3} required /></div>
              <div className="form-field"><label className="form-label">Audience</label><input className="form-input" value={announcementForm.audience} onChange={(e) => setAnnouncementForm({ ...announcementForm, audience: e.target.value })} /></div>
              {error && <div className="error-msg">{error}</div>}{success && <div className="success-msg">{success}</div>}
              <button className="btn btn-primary" type="submit">Send Update</button>
            </form>
          </div>

          <div className="panel">
            <h3>Announcements</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {(finances?.announcements || []).map((item) => (
                <div key={item.id} style={{ padding: '14px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)' }}>
                  <div style={{ fontWeight: '800', marginBottom: '6px' }}>{item.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>{item.message}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.type} · {item.audience}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================
   STUDENT PORTAL
============================ */
function StudentPortal({ token, user, activeSection, setActiveSection }) {
  const [portal, setPortal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '', gender: '', institution: '', level: '', emergencyContact: '' });
  const [maintenanceForm, setMaintenanceForm] = useState({ title: '', description: '', category: 'General', priority: 'Medium' });
  const [submitting, setSubmitting] = useState(false);

  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/student/portal`, { headers: authHeaders });
      if (!res.ok) throw new Error('Failed to load portal data');
      const data = await res.json();
      setPortal(data);
      const s = data.student || {};
      setProfileForm({
        name: s.name || user?.name || '',
        phone: s.phone || user?.phone || '',
        gender: s.gender || '',
        institution: s.institution || '',
        level: s.level || '',
        emergencyContact: s.emergency_contact || s.emergencyContact || '',
      });
    } catch (e) {
      setError('Could not load your dashboard. Please try refreshing.');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const student      = portal?.student || {};
  const announcements = portal?.announcements || [];
  const maintenance  = portal?.maintenance || [];

  // Derived: hostel and room details from student record
  const hostelId   = student.hostel_id   || student.hostelId   || '';
  const hostelName = student.hostel_name || student.hostelName || '';
  const roomId     = student.room_id     || student.roomId     || '';
  const roomNumber = student.room_number || student.roomNumber || '';
  const balance    = student.balance || 0;
  const status     = student.status  || 'Active';

  const sections = [
    { key: 'profile',       label: 'My Profile',             icon: '👤' },
    { key: 'hostel',        label: 'My Hostel',              icon: '🏠' },
    { key: 'rooms',         label: 'My Room',                icon: '🛏️' },
    { key: 'bookings',      label: 'My Bookings',            icon: '📅' },
    { key: 'payments',      label: 'Payments',               icon: '💳' },
    { key: 'maintenance',   label: 'Maintenance Requests',   icon: '🛠️' },
    { key: 'notifications', label: 'Notifications',          icon: '🔔' },
    { key: 'support',       label: 'Help Center',            icon: '❓' },
  ];

  const saveProfile = async (e) => {
    e.preventDefault(); setError(''); setSuccess(''); setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/student/profile`, { method: 'PUT', headers: authHeaders, body: JSON.stringify(profileForm) });
      const data = await res.json();
      if (res.ok) { setSuccess('Profile updated!'); load(); }
      else setError(data.message || 'Failed to update.');
    } catch { setError('Network error.'); }
    setSubmitting(false);
  };

  const submitMaintenance = async (e) => {
    e.preventDefault(); setError(''); setSuccess(''); setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/student/maintenance`, { method: 'POST', headers: authHeaders, body: JSON.stringify(maintenanceForm) });
      const data = await res.json();
      if (res.ok) { setSuccess('Request submitted!'); setMaintenanceForm({ title: '', description: '', category: 'General', priority: 'Medium' }); load(); }
      else setError(data.message || 'Failed.');
    } catch { setError('Network error.'); }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="page-content" style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
      <p style={{ color: 'var(--text-muted)' }}>Loading your dashboard…</p>
    </div>
  );

  const panelStyle = { padding: '16px 20px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-light)', marginBottom: '12px' };
  const emptyStyle = { color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '40px 20px' };
  const statusColor = status === 'Active' ? '#10b981' : status === 'Pending' ? '#f59e0b' : '#ef4444';

  return (
    <div className="manager-page">
      <h1>🎓 Student Dashboard</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Welcome back, {student.name || user?.name}. Here's your hostel overview.</p>

      {/* Stats strip */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card" style={{ borderLeft: `4px solid ${statusColor}` }}>
          <div className="stat-card-label">Account Status</div>
          <div className="stat-card-value" style={{ fontSize: '18px', color: statusColor }}>{status}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="stat-card-label">🏠 Hostel</div>
          <div className="stat-card-value" style={{ fontSize: '15px' }}>{hostelName || '—'}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div className="stat-card-label">🛏️ Room</div>
          <div className="stat-card-value" style={{ fontSize: '15px' }}>{roomNumber || '—'}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-card-label">💳 Outstanding Balance</div>
          <div className="stat-card-value" style={{ fontSize: '15px', color: balance > 0 ? '#ef4444' : '#10b981' }}>{formatCurrency(balance)}</div>
        </div>
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {sections.map(s => (
          <button key={s.key} className={`btn btn-sm ${activeSection === s.key ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveSection(s.key)}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {error   && <div className="error-msg"   style={{ marginBottom: '16px' }}>{error}</div>}
      {success && <div className="success-msg" style={{ marginBottom: '16px' }}>{success}</div>}

      {/* ── MY PROFILE ── */}
      {activeSection === 'profile' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          <div className="panel">
            <h3>👤 My Profile</h3>
            <form onSubmit={saveProfile} style={{ display: 'grid', gap: '14px' }}>
              <div className="form-grid-2">
                <div className="form-field"><label className="form-label">Full Name</label><input className="form-input" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} required /></div>
                <div className="form-field"><label className="form-label">Phone Number</label><input className="form-input" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} /></div>
              </div>
              <div className="form-grid-2">
                <div className="form-field"><label className="form-label">Gender</label>
                  <select className="form-input" value={profileForm.gender} onChange={e => setProfileForm({...profileForm, gender: e.target.value})}>
                    <option value="">— Select —</option><option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div className="form-field"><label className="form-label">Institution</label><input className="form-input" value={profileForm.institution} onChange={e => setProfileForm({...profileForm, institution: e.target.value})} placeholder="e.g. UMaT" /></div>
              </div>
              <div className="form-grid-2">
                <div className="form-field"><label className="form-label">Level / Year</label><input className="form-input" value={profileForm.level} onChange={e => setProfileForm({...profileForm, level: e.target.value})} placeholder="e.g. Level 200" /></div>
                <div className="form-field"><label className="form-label">Emergency Contact</label><input className="form-input" value={profileForm.emergencyContact} onChange={e => setProfileForm({...profileForm, emergencyContact: e.target.value})} placeholder="+233 24..." /></div>
              </div>
              <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save Profile'}</button>
            </form>
          </div>
          <div className="panel">
            <h3>Account Details</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {[
                ['Email', student.email || user?.email],
                ['Student ID', student.student_id || student.studentId || '—'],
                ['Role', 'Student'],
                ['Member Since', student.created_at ? new Date(student.created_at).toLocaleDateString() : '—'],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <strong>{val}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MY HOSTEL ── */}
      {activeSection === 'hostel' && (
        <div className="panel">
          <h3>🏠 My Hostel</h3>
          {!hostelName ? (
            <div style={emptyStyle}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🏠</div>
              <p>You have not been assigned to a hostel yet.</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>Contact your manager or browse available hostels.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {[
                ['Hostel Name', hostelName],
                ['Room Number', roomNumber || '—'],
                ['Account Status', status],
                ['Manager', student.manager_id ? 'Assigned' : '—'],
                ['Outstanding Balance', formatCurrency(balance)],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{label}</span>
                  <strong style={{ fontSize: '14px' }}>{val}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MY ROOM ── */}
      {activeSection === 'rooms' && (
        <div className="panel">
          <h3>🛏️ My Room</h3>
          {!roomNumber ? (
            <div style={emptyStyle}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🛏️</div>
              <p>No room has been assigned to you yet.</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>Your hostel manager will assign you a room after registration.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ padding: '20px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white', textAlign: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '40px', marginBottom: '8px' }}>🛏️</div>
                <div style={{ fontSize: '28px', fontWeight: '900' }}>Room {roomNumber}</div>
                <div style={{ opacity: 0.85, marginTop: '4px' }}>{hostelName}</div>
              </div>
              {[
                ['Room Number', roomNumber],
                ['Hostel', hostelName || '—'],
                ['Room Type', student.room_type || 'Standard'],
                ['Status', status],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{label}</span>
                  <strong style={{ fontSize: '14px' }}>{val}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MY BOOKINGS ── */}
      {activeSection === 'bookings' && (
        <div className="panel">
          <h3>📅 My Bookings</h3>
          {!hostelName ? (
            <div style={emptyStyle}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>📅</div>
              <p>No bookings yet.</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>When you book or are assigned to a hostel, it will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ ...panelStyle, borderLeft: '4px solid #10b981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: '800', fontSize: '15px' }}>{hostelName}</div>
                  <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '12px', background: '#f0fdf4', color: '#16a34a', fontWeight: '700' }}>Active</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'grid', gap: '4px' }}>
                  <div>🛏️ Room {roomNumber}</div>
                  {student.created_at && <div>📅 Registered: {new Date(student.created_at).toLocaleDateString()}</div>}
                  {balance > 0 && <div style={{ color: '#ef4444', fontWeight: '600' }}>⚠️ Outstanding: {formatCurrency(balance)}</div>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PAYMENTS ── */}
      {activeSection === 'payments' && (
        <div className="panel">
          <h3>💳 Payment Summary</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
              <div style={{ padding: '16px', borderRadius: '10px', background: balance > 0 ? '#fef2f2' : '#f0fdf4', textAlign: 'center', border: `1px solid ${balance > 0 ? '#fca5a5' : '#86efac'}` }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Outstanding Balance</div>
                <div style={{ fontSize: '22px', fontWeight: '900', color: balance > 0 ? '#ef4444' : '#16a34a' }}>{formatCurrency(balance)}</div>
              </div>
              <div style={{ padding: '16px', borderRadius: '10px', background: 'var(--bg-card)', textAlign: 'center', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Account Status</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: statusColor }}>{status}</div>
              </div>
            </div>
            {balance > 0 ? (
              <div style={{ padding: '14px', borderRadius: '8px', background: '#fef3c7', border: '1px solid #fcd34d', fontSize: '13px' }}>
                ⚠️ You have an outstanding balance of <strong>{formatCurrency(balance)}</strong>. Please contact your hostel manager to settle your payment.
              </div>
            ) : (
              <div style={{ padding: '14px', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #86efac', fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>
                ✅ All payments are up to date.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MAINTENANCE ── */}
      {activeSection === 'maintenance' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          <div className="panel">
            <h3>🛠️ Submit a Maintenance Request</h3>
            <form onSubmit={submitMaintenance} style={{ display: 'grid', gap: '12px' }}>
              <div className="form-grid-2">
                <div className="form-field"><label className="form-label">Title</label><input className="form-input" value={maintenanceForm.title} onChange={e => setMaintenanceForm({...maintenanceForm, title: e.target.value})} placeholder="e.g. Broken light switch" required /></div>
                <div className="form-field"><label className="form-label">Category</label>
                  <select className="form-input" value={maintenanceForm.category} onChange={e => setMaintenanceForm({...maintenanceForm, category: e.target.value})}>
                    <option>General</option><option>Electrical</option><option>Plumbing</option><option>Furniture</option><option>Structural</option><option>Cleaning</option>
                  </select>
                </div>
              </div>
              <div className="form-field"><label className="form-label">Description</label><textarea className="form-input" value={maintenanceForm.description} onChange={e => setMaintenanceForm({...maintenanceForm, description: e.target.value})} rows={3} placeholder="Describe the issue…" required /></div>
              <div className="form-field"><label className="form-label">Priority</label>
                <select className="form-input" value={maintenanceForm.priority} onChange={e => setMaintenanceForm({...maintenanceForm, priority: e.target.value})}>
                  <option value="Low">🟢 Low</option><option value="Medium">🟡 Medium</option><option value="High">🔴 High</option>
                </select>
              </div>
              <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Request'}</button>
            </form>
          </div>
          <div className="panel">
            <h3>My Requests</h3>
            {maintenance.length === 0 ? (
              <div style={emptyStyle}><div style={{ fontSize: '32px', marginBottom: '10px' }}>🔧</div><p>No maintenance requests submitted yet.</p></div>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {maintenance.map(item => {
                  const sc = item.status === 'Completed' ? '#10b981' : item.status === 'In Progress' ? '#3b82f6' : '#f59e0b';
                  return (
                    <div key={item.id} style={{ ...panelStyle, borderLeft: `4px solid ${sc}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>{item.title}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.category} · {item.priority} priority · {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</div>
                        </div>
                        <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', fontWeight: '700', background: sc + '20', color: sc, whiteSpace: 'nowrap' }}>{item.status}</span>
                      </div>
                      {item.description && <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>{item.description}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {activeSection === 'notifications' && (
        <div className="panel">
          <h3>🔔 Announcements & Notifications</h3>
          {announcements.length === 0 ? (
            <div style={emptyStyle}><div style={{ fontSize: '32px', marginBottom: '10px' }}>🔔</div><p>No announcements at this time.</p></div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {announcements.map(item => (
                <div key={item.id} style={{ ...panelStyle, borderLeft: '4px solid #6366f1' }}>
                  <div style={{ fontWeight: '800', marginBottom: '4px' }}>{item.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{item.message}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.type} · {item.audience} · {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SUPPORT ── */}
      {activeSection === 'support' && (
        <div className="panel">
          <h3>❓ Help Center</h3>
          <div style={{ display: 'grid', gap: '14px' }}>
            {[
              { q: 'How do I pay my hostel fees?', a: 'Contact your hostel manager directly. They will record your payment and update your balance on the dashboard.' },
              { q: 'My room has an issue — what do I do?', a: 'Go to Maintenance Requests and submit a detailed request. Your manager will receive it and update the status.' },
              { q: 'How do I update my profile information?', a: 'Click "My Profile" in the sidebar and edit your details, then click Save Profile.' },
              { q: 'I was assigned to the wrong room — who do I contact?', a: 'Contact your hostel manager. Their details are available from your hostel listing page.' },
              { q: 'How do I find a new hostel?', a: 'Click "Browse Hostels" in the top navigation bar to explore all verified listings.' },
            ].map((faq, i) => (
              <div key={i} style={{ padding: '14px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '6px' }}>❓ {faq.q}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================
   MAIN STUDENT APP
============================ */
function StudentApp() {
  const [token, setToken] = useState(() => localStorage.getItem('hostelHubToken') || '');
  const [user, setUser] = useState(() => {
    const s = localStorage.getItem('hostelHubUser');
    return s ? JSON.parse(s) : null;
  });

  const [activeTab, setActiveTab] = useState('browse');
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roomType, setRoomType] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [locationOptions, setLocationOptions] = useState([]);
  const [maxPrice, setMaxPrice] = useState(12000);

  const [selectedHostel, setSelectedHostel] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const [checkoutActive, setCheckoutActive] = useState(false);
  const [checkoutRoom, setCheckoutRoom] = useState('');
  const [checkoutPrice, setCheckoutPrice] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [managerSection, setManagerSection] = useState('overview');
  const [studentSection, setStudentSection] = useState('profile');
  const [studentSection, setStudentSection] = useState('profile');
  const [activeTheme, setActiveTheme] = useState(() => {
    if (typeof window === 'undefined') return 'system';
    return localStorage.getItem('hostelHubTheme') || 'system';
  });

  const loadHostels = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, roomType, maxPrice, location: locationFilter });
      const res = await fetch(`${API}/api/hostels?${params}`);
      const data = await res.json();
      const serverHostels = (data.hostels || []).map(normalizeHostel);
      const combinedHostels = [...DEMO_HOSTELS, ...serverHostels].filter((hostel, index, arr) => {
        const key = hostel.id || hostel.name;
        return arr.findIndex((item) => (item.id || item.name) === key) === index;
      });
      setHostels(combinedHostels);
    } catch {
      setHostels(DEMO_HOSTELS);
    }
    setLoading(false);
  };

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const res = await fetch(`${API}/api/locations`);
        const data = await res.json();
        const locations = (data.locations || []).map((item) => item.name).filter(Boolean);
        setLocationOptions(locations);
      } catch {
        setLocationOptions(['UMaT Main Gate / Campus', 'Tarkwa (town centre)', 'Tamso', 'Akyempim', 'Brahabebome', 'Akoon']);
      }
    };

    loadLocations();
  }, []);

  useEffect(() => { loadHostels(); }, [search, roomType, maxPrice, locationFilter]);

  useEffect(() => {
    if (!token) { setUser(null); return; }
    fetch(`${API}/api/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (d.user) { setUser(d.user); localStorage.setItem('hostelHubUser', JSON.stringify(d.user)); } })
      .catch(() => { setToken(''); setUser(null); localStorage.removeItem('hostelHubToken'); localStorage.removeItem('hostelHubUser'); });
  }, [token]);

  useEffect(() => {
    const applyTheme = () => {
      const resolvedTheme = activeTheme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : activeTheme;
      document.body.setAttribute('data-theme', resolvedTheme);
      document.documentElement.style.colorScheme = resolvedTheme;
      localStorage.setItem('hostelHubTheme', activeTheme);
    };

    applyTheme();
    if (activeTheme !== 'system') return undefined;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener?.('change', applyTheme);
    return () => media.removeEventListener?.('change', applyTheme);
  }, [activeTheme]);

  const openHostel = async (hostel) => {
    const normalized = normalizeHostel(hostel);
    try {
      if (normalized.id) {
        const res = await fetch(`${API}/api/hostels/${normalized.id}`);
        const data = await res.json();
        setSelectedHostel(normalizeHostel(data.hostel || normalized));
        setShowDetailModal(true);
        fetch(`${API}/api/hostels/${normalized.id}/visit`, { method: 'POST' }).catch(() => {});
        return;
      }
    } catch {}

    setSelectedHostel(normalized);
    setShowDetailModal(true);
  };

  const handleRent = (rt, price) => {
    if (!user) { setShowDetailModal(false); setAuthMode('login'); setShowAuth(true); return; }
    setCheckoutRoom(rt);
    setCheckoutPrice(price);
    setCheckoutActive(true);
  };

  const requireAuth = () => {
    setShowDetailModal(false);
    setAuthMode('login');
    setShowAuth(true);
  };

  const handleAuthSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    setShowAuth(false);
    if (newUser?.role === 'manager') {
      setActiveTab('manager-finances');
      setManagerSection('overview');
    } else if (newUser?.role === 'student') {
      setActiveTab('student-portal');
      setStudentSection('profile');
    } else if (newUser?.role === 'student') {
      setActiveTab('student-portal');
      setStudentSection('profile');
    }
  };

  const handleLogout = () => {
    setToken(''); setUser(null);
    localStorage.removeItem('hostelHubToken');
    localStorage.removeItem('hostelHubUser');
    setProfilePanelOpen(false);
    setManagerSection('overview');
    setStudentSection('profile');
    setActiveTab('browse');
  };

  return (
    <>
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="nav-logo" onClick={() => setActiveTab('browse')}>
            <div className="nav-logo-icon">🏠</div>
            <span className="nav-logo-text">Hostel Hub</span>
          </div>
          
          <div className={`nav-overlay ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>
          
          <div className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
            <button className={`nav-link ${activeTab === 'browse' ? 'active' : ''}`} onClick={() => { setActiveTab('browse'); setMobileMenuOpen(false); }}>Browse Hostels</button>
            <button className={`nav-link ${activeTab === 'pitch' ? 'active' : ''}`} onClick={() => { setActiveTab('pitch'); setMobileMenuOpen(false); }}>List Your Hostel</button>
            <button className={`nav-link ${activeTab === 'roadmap' ? 'active' : ''}`} onClick={() => { setActiveTab('roadmap'); setMobileMenuOpen(false); }}>Our Story</button>
            {user?.role === 'manager' && (
              <button className={`nav-link ${activeTab === 'manager-finances' ? 'active' : ''}`} onClick={() => { setActiveTab('manager-finances'); setMobileMenuOpen(false); }}>Manager Portal</button>
            )}
          </div>
          <div className="nav-actions">
            {user ? (
              <button className="nav-user-chip" type="button" onClick={() => setProfilePanelOpen((open) => !open)}>
                <div className="nav-user-avatar">{user.name?.[0] || '?'}</div>
                <span className="nav-user-name-desktop">{(user.name || '').split(' ')[0]}</span>
                <span className="nav-user-chevron">▾</span>
              </button>
            ) : (
              <>
                <button className="btn btn-outline btn-sm nav-signin-btn" onClick={() => { setAuthMode('login'); setShowAuth(true); }}>Sign In</button>
                <button className="btn btn-primary btn-sm nav-signup-btn" onClick={() => { setAuthMode('signup'); setShowAuth(true); }}>Sign Up Free</button>
              </>
            )}
          </div>
          <button className="hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* BROWSE PAGE */}
      {activeTab === 'browse' && (
        <>
          {/* HERO */}
          <section className="hero">
            <div className="hero-inner">
              <div className="hero-eyebrow">🏠 Verified Student Housing in Tarkwa, Ghana</div>
              <h1 className="hero-title">
                Find Your Student Home<br /><span className="highlight">Without the Stress</span>
              </h1>
              <p className="hero-subtitle">
                Every hostel room is personally visited, photographed, and verified by our team before listing.
                No fake photos. No surprises.
              </p>

              {/* Search */}
              <div className="hero-search">
                <input
                  className="hero-search-input"
                  placeholder="Search hostels by name, street, or facility..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="hero-search-divider" />
                <select className="hero-search-select" value={roomType} onChange={(e) => setRoomType(e.target.value)}>
                  <option value="">Any Room Type</option>
                  <option value="1-in-a-room">1-in-a-room</option>
                  <option value="2-in-a-room">2-in-a-room</option>
                  <option value="3-in-a-room">3-in-a-room</option>
                  <option value="4-in-a-room">4-in-a-room</option>
                </select>
                <div className="hero-search-divider" />
                <button className="btn btn-amber" onClick={loadHostels} style={{ margin: '4px' }}>
                  🔍 Search
                </button>
              </div>

              {/* Stats */}
              <div className="hero-stats">
                <div className="hero-stat">
                  <div className="hero-stat-num">{hostels.length || '20'}<span className="unit">+</span></div>
                  <div className="hero-stat-label">Verified Hostels</div>
                </div>
                <div className="hero-stat-divider" />
                <div className="hero-stat">
                  <div className="hero-stat-num">500<span className="unit">+</span></div>
                  <div className="hero-stat-label">Happy Students</div>
                </div>
                <div className="hero-stat-divider" />
                <div className="hero-stat">
                  <div className="hero-stat-num">100<span className="unit">%</span></div>
                  <div className="hero-stat-label">Photo Verified</div>
                </div>
              </div>
            </div>
          </section>

          {/* FILTER BAR */}
          <div className="filter-bar-wrapper">
            <div className="filter-bar">
              <div className="filter-search">
                <span className="filter-search-icon">🔍</span>
                <input
                  placeholder="Search hostels..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select className="filter-select" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
                <option value="">All Areas</option>
                {locationOptions.map((location) => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
              <select className="filter-select" value={roomType} onChange={(e) => setRoomType(e.target.value)}>
                <option value="">All Occupancies</option>
                <option value="1-in-a-room">1-in-a-room</option>
                <option value="2-in-a-room">2-in-a-room</option>
                <option value="3-in-a-room">3-in-a-room</option>
                <option value="4-in-a-room">4-in-a-room</option>
              </select>
              <label className="filter-price-label">
                Max Price: <strong>{formatCurrency(maxPrice)}/year</strong>
                <input type="range" min="3000" max="12000" step="250" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} />
              </label>
              <span className="filter-count">{loading ? 'Loading...' : `${hostels.length} hostel${hostels.length !== 1 ? 's' : ''} found`}</span>
            </div>
          </div>

          {/* HOSTEL GRID */}
          <div className="page-content">
            <div className="section-header">
              <div>
                <div className="section-title">Available Hostels Near UMaT</div>
                <div className="section-subtitle">All listings personally verified and photographed by our team</div>
              </div>
            </div>

            {loading ? (
              <div className="hostel-grid">
                {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
              </div>
            ) : hostels.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🏠</div>
                <h3>No hostels found</h3>
                <p>Try adjusting your search or increasing your budget slider.</p>
                <button className="btn btn-primary" onClick={() => { setSearch(''); setRoomType(''); setMaxPrice(800); }}>
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="hostel-grid">
                {hostels.map((h) => (
                  <HostelCard key={h.id} hostel={h} onClick={openHostel} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* PITCH PAGE */}
      {activeTab === 'pitch' && (
        <div className="pitch-page">
          <h1>List Your Hostel with Hostel Hub</h1>
          <p>
            We help hostel managers in Tarkwa connect with verified UMaT students — no stress, no rent chasing.
            Our platform brings students directly to your door.
          </p>
          <div className="pitch-cards">
            <div className="pitch-card">
              <div className="pitch-card-icon">📸</div>
              <h3>Free Professional Photography</h3>
              <p>Your listing fee covers our team visiting to photograph every room configuration (1–4 occupancy) and kitchen facilities. Professional photos drive 4× more bookings.</p>
            </div>
            <div className="pitch-card">
              <div className="pitch-card-icon">🏦</div>
              <h3>Direct Bank Deposits</h3>
              <p>Link your bank account and receive student payments directly — no intermediary, no delays. Full control over your rental income.</p>
            </div>
            <div className="pitch-card">
              <div className="pitch-card-icon">📊</div>
              <h3>Accounting Dashboard</h3>
              <p>Track rent income, log electricity and water bills, record repair costs, and see your net profit — all from one clean dashboard.</p>
            </div>
          </div>
          <div className="pricing-section">
            <h2>Our Win-Win Partnership Model</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              We don't charge expensive monthly subscriptions. We make money only when you make money, with a small one-time listing fee to cover photography costs.
            </p>
            <div className="pricing-grid">
              <div className="pricing-card">
                <h3>1. One-Time Listing & Verification</h3>
                <div className="pricing-price">GHS 200 <span className="note">once-off setup</span></div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: '1.5' }}>
                  Covers the physical visit by our photography team to verify safety, check kitchen/water amenities, and capture high-quality photos of all room occupancies (1-in to 4-in-a-room).
                </p>
                <ul className="pricing-features">
                  <li>Physical verification stamp & badge</li>
                  <li>Professional photoshoot & kitchen verification</li>
                  <li>Interactive listing on the student portal</li>
                  <li>Local agent assigned for campus tours</li>
                </ul>
              </div>
              <div className="pricing-card featured">
                <div className="pricing-badge">🔥 PERFORMANCE PRICING</div>
                <h3>2. Success Booking Commission</h3>
                <div className="pricing-price">3% <span className="note">per student booking</span></div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: '1.5' }}>
                  You only pay commission when we deliver results. When a student chooses a room style, pays directly into your bank, we log it and keep a tiny service commission.
                </p>
                <ul className="pricing-features">
                  <li>No booking, no commission fee</li>
                  <li>Direct bank payouts into your ledger</li>
                  <li>Access to financial bookkeeping ledger</li>
                  <li>Student visitor analytics and click counts</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROADMAP PAGE */}
      {activeTab === 'roadmap' && (
        <div className="roadmap-page">
          <h1>Our Growth Strategy</h1>
          <p>
            Launching a platform is step one. Here's how Hostel Hub dominates the Tarkwa student housing market
            through trust, technology, and local agent networks.
          </p>
          <div className="roadmap-list">
            {[
              { title: 'Trust Through Hand-Checked Rooms', body: 'Students face huge stress because online pictures are often old or fake. Our rule: zero unverified uploads. We send our staff to verify the kitchen, WiFi speed, and photograph exact room structures. Trust is our #1 asset.' },
              { title: 'The Price Range Search Slider', body: 'Students operate on strict budgets. A simple, interactive price filter avoids wasting time on unaffordable options — making the portal stress-free and highly practical.' },
              { title: 'Agent Tour Booking (Anxiety Reduction)', body: 'Freshmen feel lost visiting new areas. By assigning a local tour agent who physically escorts students from the UMaT campus gate to the hostel, we remove anxiety and guarantee listing authenticity.' },
              { title: 'Empowering Managers with Accounting Tools', body: 'By giving hostel managers free tools to list utility expenses and track student rent deposits, managers actively recommend Hostel Hub to other owners — creating organic viral growth.' },
            ].map((step, i) => (
              <div key={i} className="roadmap-item">
                <div className="roadmap-number">{i + 1}</div>
                <div className="roadmap-content">
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STUDENT PORTAL */}
      {activeTab === 'student-portal' && user?.role === 'student' && (
        <StudentPortal token={token} user={user} activeSection={studentSection} setActiveSection={setStudentSection} />
      )}

      {/* STUDENT PORTAL */}
      {activeTab === 'student-portal' && user?.role === 'student' && (
        <StudentPortal token={token} user={user} activeSection={studentSection} setActiveSection={setStudentSection} />
      )}

      {/* MANAGER PORTAL */}
      {activeTab === 'manager-finances' && user?.role === 'manager' && (
        <ManagerPortal token={token} user={user} activeSection={managerSection} setActiveSection={setManagerSection} />
      )}

      {/* FOOTER */}
      <Footer setActiveTab={setActiveTab} />

      {user && profilePanelOpen && (
        <ProfileSidebar
          user={user}
          onClose={() => setProfilePanelOpen(false)}
          onLogout={handleLogout}
          activeTheme={activeTheme}
          onThemeChange={setActiveTheme}
          activeMenuItem={user?.role === 'manager' ? managerSection : studentSection}
          onSelectMenuItem={(section) => {
            if (user?.role === 'manager') {
              setManagerSection(section);
              setActiveTab('manager-finances');
            } else {
              setStudentSection(section);
              setActiveTab('student-portal');
            }
            setProfilePanelOpen(false);
          }}
          unreadCount={3}
          completionPercent={80}
        />
      )}

      {/* FLOATING WHATSAPP */}
      <FloatingWhatsApp />

      {/* HOSTEL DETAIL MODAL */}
      {showDetailModal && selectedHostel && (
        <HostelDetailModal
          hostel={selectedHostel}
          user={user}
          onClose={() => setShowDetailModal(false)}
          onRent={handleRent}
          onRequireAuth={requireAuth}
        />
      )}

      {/* AUTH MODAL */}
      {showAuth && (
        <AuthModal
          initialMode={authMode}
          onClose={() => setShowAuth(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* CHECKOUT MODAL */}
      {checkoutActive && selectedHostel && (
        <CheckoutModal
          hostel={selectedHostel}
          roomType={checkoutRoom}
          price={checkoutPrice}
          token={token}
          onClose={() => setCheckoutActive(false)}
        />
      )}
    </>
  );
}

/* ============================
   ADMIN APP
============================ */
function AdminApp() {
  const [token, setToken] = useState(() => localStorage.getItem('hostelHubAdminToken') || '');
  const [stats, setStats] = useState(null);
  const [hostels, setHostels] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [locationOptions, setLocationOptions] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    name: '', location: 'Agric Hill', address: '', pricePerYear: 5000, rating: 4.8,
    mapsUrl: '', facilities: 'Wi-Fi,Water,Security,Power Backup',
    agentName: 'Ama Mensah', agentPhone: '+233 20 123 4567', agentEmail: 'ama@hostelhub.dev',
    description: '',
    room1Active: true, room1Price: 9000,
    room2Active: true, room2Price: 7000,
    room3Active: false, room3Price: 5500,
    room4Active: false, room4Price: 4500,
    kitchenPhotos: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=900&q=80',
  });
  const [photos, setPhotos] = useState([]);

  const loadDashboard = async () => {
    try {
      const [sR, hR, vR] = await Promise.all([
        fetch(`${API}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/admin/hostels`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/admin/visits`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [sD, hD, vD] = await Promise.all([sR.json(), hR.json(), vR.json()]);
      setStats(sD.stats);
      setHostels(hD.hostels || []);
      setVisits(vD.visits || []);
    } catch {}
  };

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const res = await fetch(`${API}/api/locations`);
        const data = await res.json();
        const locations = (data.locations || []).map((item) => item.name).filter(Boolean);
        setLocationOptions(locations);
        if (locations.length && !form.location) {
          sf('location', locations[0]);
        }
      } catch {
        setLocationOptions(['UMaT Main Gate / Campus', 'Tarkwa (town centre)', 'Tamso', 'Akyempim', 'Brahabebome', 'Akoon']);
      }
    };

    loadLocations();
    if (token) loadDashboard();
  }, [token]);

  const handleAdminLogin = async (e) => {
    e.preventDefault(); setError('');
    try {
      const res = await fetch(`${API}/api/admin/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Admin login failed'); return; }
      localStorage.setItem('hostelHubAdminToken', data.token);
      setToken(data.token);
    } catch { setError('Network error'); }
  };

  const handleCreateHostel = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    const roomTypes = {};
    if (form.room1Active) roomTypes['1-in-a-room'] = { price: Number(form.room1Price), gallery: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'] };
    if (form.room2Active) roomTypes['2-in-a-room'] = { price: Number(form.room2Price), gallery: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80'] };
    if (form.room3Active) roomTypes['3-in-a-room'] = { price: Number(form.room3Price), gallery: ['https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'] };
    if (form.room4Active) roomTypes['4-in-a-room'] = { price: Number(form.room4Price), gallery: ['https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80'] };
    const payload = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (!k.startsWith('room')) payload.append(k, v); });
    payload.append('roomTypes', JSON.stringify(roomTypes));
    Array.from(photos).forEach((p) => payload.append('photos', p));
    try {
      const res = await fetch(`${API}/api/admin/hostels`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: payload });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Failed'); return; }
      setSuccess('Hostel published!');
      await loadDashboard();
    } catch { setError('Network error'); }
  };

  const sf = (k, v) => setForm({ ...form, [k]: v });

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)', padding: '24px' }}>
        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: 'var(--shadow-lg)' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '6px' }}>Admin Console</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>Login with admin credentials to access the control panel.</p>
          <form onSubmit={handleAdminLogin} style={{ display: 'grid', gap: '14px' }}>
            <div className="form-field">
              <label className="form-label">Email</label>
              <input className="form-input" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} required />
            </div>
            <div className="form-field">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required />
            </div>
            {error && <div className="error-msg">{error}</div>}
            <button type="submit" className="btn btn-primary" style={{ padding: '13px' }}>Access Console →</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <div>
          <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Admin Panel</p>
          <h1>Hostel Hub Operations Control</h1>
        </div>
        <button className="btn btn-outline" onClick={() => { localStorage.removeItem('hostelHubAdminToken'); setToken(''); }}>
          Close Console
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          ['Active Hostels', stats?.totalHostels ?? 0],
          ['Students', stats?.totalStudents ?? 0],
          ['Managers', stats?.totalManagers ?? 0],
          ['Tour Bookings', stats?.totalTourRequests ?? 0],
          ['Page Hits', stats?.totalVisits ?? 0],
        ].map(([label, val]) => (
          <div key={label} className="stat-card">
            <div className="stat-card-label">{label}</div>
            <div className="stat-card-value">{val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Add Hostel */}
        <div className="panel">
          <h3>Register New Verified Hostel</h3>
          <form onSubmit={handleCreateHostel} style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
            <div className="form-grid-2">
              <div className="form-field"><label className="form-label">Hostel Name</label><input className="form-input" value={form.name} onChange={(e) => sf('name', e.target.value)} required /></div>
              <div className="form-field"><label className="form-label">Location</label><select className="form-input" value={form.location} onChange={(e) => sf('location', e.target.value)} required>{locationOptions.map((location) => (<option key={location} value={location}>{location}</option>))}</select></div>
            </div>
            <div className="form-grid-2">
              <div className="form-field"><label className="form-label">Street / Landmark</label><input className="form-input" value={form.address} onChange={(e) => sf('address', e.target.value)} required /></div>
              <div className="form-field"><label className="form-label">Google Maps URL</label><input className="form-input" value={form.mapsUrl} onChange={(e) => sf('mapsUrl', e.target.value)} placeholder="https://maps.google.com/?q=..." required /></div>
            </div>
            <div className="form-grid-2">
              <div className="form-field"><label className="form-label">Base Price/Year (GHS)</label><input className="form-input" type="number" value={form.pricePerYear} onChange={(e) => sf('pricePerYear', Number(e.target.value))} required /></div>
              <div className="form-field"><label className="form-label">Rating</label><input className="form-input" type="number" step="0.1" value={form.rating} onChange={(e) => sf('rating', Number(e.target.value))} required /></div>
            </div>
            <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: '12px', fontWeight: '700', marginBottom: '10px' }}>Room Occupancy Pricing:</p>
              <div className="form-grid-4">
                {[1,2,3,4].map((n) => (
                  <label key={n} className="room-checkbox-item">
                    <input type="checkbox" checked={form[`room${n}Active`]} onChange={(e) => sf(`room${n}Active`, e.target.checked)} />
                    {n}-in-a-room
                    {form[`room${n}Active`] && <input type="number" className="room-price-input" value={form[`room${n}Price`]} onChange={(e) => sf(`room${n}Price`, e.target.value)} />}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-field"><label className="form-label">Agent Name</label><input className="form-input" value={form.agentName} onChange={(e) => sf('agentName', e.target.value)} required /></div>
              <div className="form-field"><label className="form-label">Agent Phone</label><input className="form-input" value={form.agentPhone} onChange={(e) => sf('agentPhone', e.target.value)} required /></div>
            </div>
            <div className="form-field"><label className="form-label">Facilities (comma-separated)</label><input className="form-input" value={form.facilities} onChange={(e) => sf('facilities', e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Kitchen Photo URL</label><input className="form-input" value={form.kitchenPhotos} onChange={(e) => sf('kitchenPhotos', e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Upload Room Images</label><input className="form-input" type="file" multiple accept="image/*" onChange={(e) => setPhotos(e.target.files)} /></div>
            <div className="form-field"><label className="form-label">Hostel Description</label><textarea className="form-input" rows={3} value={form.description} onChange={(e) => sf('description', e.target.value)} required style={{ resize: 'vertical' }} /></div>
            {error && <div className="error-msg">{error}</div>}
            {success && <div className="success-msg">{success}</div>}
            <button type="submit" className="btn btn-primary">✅ Verify & Publish Listing</button>
          </form>
        </div>

        {/* Side panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="panel" style={{ maxHeight: '380px', overflowY: 'auto' }}>
            <h3>Visitor Activity Log</h3>
            <div className="ledger-table-wrapper" style={{ marginTop: '12px' }}>
              <table className="ledger-table">
                <thead><tr><th>Time</th><th>User</th><th>Page</th></tr></thead>
                <tbody>
                  {visits.map((v) => (
                    <tr key={v.id}>
                      <td>{new Date(v.timestamp).toLocaleTimeString()}</td>
                      <td><strong>{v.user}</strong></td>
                      <td><span style={{ fontSize: '11px', background: 'var(--bg-subtle)', padding: '2px 7px', borderRadius: '4px' }}>{v.page}</span></td>
                    </tr>
                  ))}
                  {!visits.length && <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '14px' }}>No logs recorded.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div className="panel" style={{ maxHeight: '380px', overflowY: 'auto' }}>
            <h3>Live Listings ({hostels.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              {hostels.map((h) => (
                <div key={h.id} style={{ padding: '12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '14px' }}>{h.name}</strong>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{h.location} · {formatCurrency(h.pricePerYear || h.pricePerMonth)}/year</div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--navy-600)' }}>{h.visits || 0} clicks</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================
   ROOT APP
============================ */
function App() {
  const page = document.body.dataset.page;
  return page === 'admin' ? <AdminApp /> : <StudentApp />;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
