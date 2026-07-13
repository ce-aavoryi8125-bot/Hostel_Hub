const { useState, useEffect, useRef } = React;

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const API = '';

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

  const submitTour = async (e) => {
    e.preventDefault();
    if (!user) { onRequireAuth(); return; }
    setTourLoading(true);
    try {
      const res = await fetch(`${API}/api/hostels/${hostel.id}/tour-request`, {
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
          <span>© 2025 Hostel Hub Tarkwa. All rights reserved.</span>
          <span>Built for UMaT students · Tarkwa, Western Region</span>
        </div>
      </div>
    </footer>
  );
}

/* ============================
   MANAGER PORTAL
============================ */
function ManagerPortal({ token, user }) {
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
  const [photos, setPhotos] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    try {
      const res = await fetch(`${API}/api/manager/finances`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setFinances(data);
        if (data.bankDetails) setBankForm(data.bankDetails);
      }
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const saveBankDetails = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    try {
      const res = await fetch(`${API}/api/manager/bank-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(bankForm),
      });
      const data = await res.json();
      if (res.ok) { setSuccess('Bank account linked!'); load(); }
      else setError(data.message || 'Failed.');
    } catch { setError('Network error.'); }
  };

  const logExpense = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    try {
      const res = await fetch(`${API}/api/manager/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(expenseForm),
      });
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

  const hf = (field, val) => setHostelForm({ ...hostelForm, [field]: val });

  return (
    <div className="manager-page">
      <h1>💼 Manager Dashboard</h1>
      <p>Track rent income, log maintenance expenses, and publish new hostel listings.</p>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card income">
          <div className="stat-card-label">Gross Rent Income</div>
          <div className="stat-card-value">{formatCurrency(finances?.totalIncome || 0)}</div>
        </div>
        <div className="stat-card expense">
          <div className="stat-card-label">Total Expenses</div>
          <div className="stat-card-value">{formatCurrency(finances?.totalExpense || 0)}</div>
        </div>
        <div className="stat-card net">
          <div className="stat-card-label">Net Revenue</div>
          <div className="stat-card-value">{formatCurrency(finances?.netProfit || 0)}</div>
        </div>
      </div>

      {/* Add Hostel Toggle */}
      <div style={{ marginBottom: '24px' }}>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? '✕ Close Form' : '+ Publish New Hostel'}
        </button>
      </div>

      {/* Add Hostel Form */}
      {showAdd && (
        <div className="panel" style={{ marginBottom: '24px' }}>
          <h3>List a New Hostel</h3>
          <p>All fields are required. Our team will verify the listing before it goes live.</p>
          <form onSubmit={createListing} style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
            <div className="form-grid-2">
              <div className="form-field">
                <label className="form-label">Hostel Name</label>
                <input className="form-input" value={hostelForm.name} onChange={(e) => hf('name', e.target.value)} placeholder="e.g. Royal Palace Lodge" required />
              </div>
              <div className="form-field">
                <label className="form-label">Location</label>
                <input className="form-input" value={hostelForm.location} onChange={(e) => hf('location', e.target.value)} required />
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-field">
                <label className="form-label">Street / Landmark</label>
                <input className="form-input" value={hostelForm.address} onChange={(e) => hf('address', e.target.value)} placeholder="e.g. UMaT West Road" required />
              </div>
              <div className="form-field">
                <label className="form-label">Google Maps URL</label>
                <input className="form-input" value={hostelForm.mapsUrl} onChange={(e) => hf('mapsUrl', e.target.value)} placeholder="https://maps.google.com/?q=..." required />
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-field">
                <label className="form-label">Base Price / Year (GHS)</label>
                <input className="form-input" type="number" value={hostelForm.pricePerYear} onChange={(e) => hf('pricePerYear', Number(e.target.value))} required />
              </div>
              <div className="form-field">
                <label className="form-label">Facilities (comma-separated)</label>
                <input className="form-input" value={hostelForm.facilities} onChange={(e) => hf('facilities', e.target.value)} />
              </div>
            </div>
            <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px' }}>Room Occupancy Pricing:</p>
              <div className="form-grid-4">
                {[1,2,3,4].map((n) => (
                  <label key={n} className="room-checkbox-item">
                    <input type="checkbox" checked={hostelForm[`room${n}Active`]} onChange={(e) => hf(`room${n}Active`, e.target.checked)} />
                    {n}-in-a-room
                    {hostelForm[`room${n}Active`] && (
                      <input type="number" className="room-price-input" value={hostelForm[`room${n}Price`]} onChange={(e) => hf(`room${n}Price`, e.target.value)} />
                    )}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-field">
                <label className="form-label">Agent Name</label>
                <input className="form-input" value={hostelForm.agentName} onChange={(e) => hf('agentName', e.target.value)} required />
              </div>
              <div className="form-field">
                <label className="form-label">Agent Phone</label>
                <input className="form-input" value={hostelForm.agentPhone} onChange={(e) => hf('agentPhone', e.target.value)} required />
              </div>
            </div>
            <div className="form-field">
              <label className="form-label">Description</label>
              <textarea className="form-input" value={hostelForm.description} onChange={(e) => hf('description', e.target.value)} rows={3} required style={{ resize: 'vertical' }} />
            </div>
            <div className="form-field">
              <label className="form-label">Upload Room Photos</label>
              <input className="form-input" type="file" multiple accept="image/*" onChange={(e) => setPhotos(e.target.files)} />
            </div>
            {error && <div className="error-msg">{error}</div>}
            {success && <div className="success-msg">{success}</div>}
            <button type="submit" className="btn btn-primary">✅ Verify & Publish Listing</button>
          </form>
        </div>
      )}

      {/* Two-column: Ledger + Side forms */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        <div className="panel">
          <h3>Bookings & Transactions Ledger</h3>
          <p>All student rent payments and your logged expenses appear here.</p>
          <div className="ledger-table-wrapper">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Date</th><th>Category</th><th>Hostel</th><th>Type</th><th>Details</th><th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(finances?.transactions || []).map((tx) => (
                  <tr key={tx.id}>
                    <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td><strong>{tx.category}</strong></td>
                    <td>{tx.hostelName}</td>
                    <td><span className={`tx-badge ${tx.type}`}>{tx.type.toUpperCase()}</span></td>
                    <td>{tx.type === 'income' ? `${tx.studentName} (${tx.studentEmail})` : tx.description}</td>
                    <td style={{ color: tx.type === 'income' ? 'var(--emerald-500)' : 'var(--red-500)', fontWeight: '800' }}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
                {!finances?.transactions?.length && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No transactions yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="panel">
            <h3>Link Bank Account</h3>
            <p>Students' payments will route directly to this account.</p>
            <form onSubmit={saveBankDetails} style={{ display: 'grid', gap: '12px' }}>
              <div className="form-field">
                <label className="form-label">Bank Name</label>
                <input className="form-input" value={bankForm.bankName} onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })} placeholder="e.g. GCB Bank" required />
              </div>
              <div className="form-field">
                <label className="form-label">Account Name</label>
                <input className="form-input" value={bankForm.accountName} onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })} placeholder="Business or personal name" required />
              </div>
              <div className="form-field">
                <label className="form-label">Account Number</label>
                <input className="form-input" value={bankForm.accountNumber} onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })} placeholder="1029384756" required />
              </div>
              {success && <div className="success-msg">{success}</div>}
              <button type="submit" className="btn btn-primary btn-sm">Update Bank Details</button>
            </form>
          </div>

          <div className="panel">
            <h3>Log Expense</h3>
            <p>Record utility bills and maintenance costs.</p>
            <form onSubmit={logExpense} style={{ display: 'grid', gap: '12px' }}>
              <div className="form-field">
                <label className="form-label">Property</label>
                <select className="form-input filter-select" value={expenseForm.hostelId} onChange={(e) => setExpenseForm({ ...expenseForm, hostelId: e.target.value })}>
                  <option value="">General Operation</option>
                  {(finances?.hostels || []).map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Category</label>
                <select className="form-input filter-select" value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} required>
                  <option value="Maintenance">Maintenance & Repairs</option>
                  <option value="Electricity">Electricity Prepaid</option>
                  <option value="Water">Water Bill</option>
                  <option value="Wifi">Internet Subscription</option>
                  <option value="Waste">Waste Management</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Amount (GHS)</label>
                <input className="form-input" type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} placeholder="Cost in GHS" required />
              </div>
              <div className="form-field">
                <label className="form-label">Description</label>
                <input className="form-input" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="e.g. Fixed light switch" required />
              </div>
              {error && <div className="error-msg">{error}</div>}
              <button type="submit" className="btn btn-success btn-sm">Log Expenditure</button>
            </form>
          </div>
        </div>
      </div>
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
  const [maxPrice, setMaxPrice] = useState(12000);

  const [selectedHostel, setSelectedHostel] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const [checkoutActive, setCheckoutActive] = useState(false);
  const [checkoutRoom, setCheckoutRoom] = useState('');
  const [checkoutPrice, setCheckoutPrice] = useState(0);

  const loadHostels = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, roomType, maxPrice, location: locationFilter });
      const res = await fetch(`${API}/api/hostels?${params}`);
      const data = await res.json();
      setHostels(data.hostels || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadHostels(); }, [search, roomType, maxPrice, locationFilter]);

  useEffect(() => {
    if (!token) { setUser(null); return; }
    fetch(`${API}/api/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (d.user) { setUser(d.user); localStorage.setItem('hostelHubUser', JSON.stringify(d.user)); } })
      .catch(() => { setToken(''); setUser(null); localStorage.removeItem('hostelHubToken'); localStorage.removeItem('hostelHubUser'); });
  }, [token]);

  const openHostel = async (hostel) => {
    try {
      const res = await fetch(`${API}/api/hostels/${hostel.id}`);
      const data = await res.json();
      setSelectedHostel(data.hostel);
      setShowDetailModal(true);
      fetch(`${API}/api/hostels/${hostel.id}/visit`, { method: 'POST' });
    } catch {
      setSelectedHostel(hostel);
      setShowDetailModal(true);
    }
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
    if (newUser?.role === 'manager') setActiveTab('manager-finances');
  };

  const handleLogout = () => {
    setToken(''); setUser(null);
    localStorage.removeItem('hostelHubToken');
    localStorage.removeItem('hostelHubUser');
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
          <div className="nav-links">
            <button className={`nav-link ${activeTab === 'browse' ? 'active' : ''}`} onClick={() => setActiveTab('browse')}>Browse Hostels</button>
            <button className={`nav-link ${activeTab === 'pitch' ? 'active' : ''}`} onClick={() => setActiveTab('pitch')}>List Your Hostel</button>
            <button className={`nav-link ${activeTab === 'roadmap' ? 'active' : ''}`} onClick={() => setActiveTab('roadmap')}>Our Story</button>
            {user?.role === 'manager' && (
              <button className={`nav-link ${activeTab === 'manager-finances' ? 'active' : ''}`} onClick={() => setActiveTab('manager-finances')}>Manager Portal</button>
            )}
          </div>
          <div className="nav-actions">
            {user ? (
              <>
                <div className="nav-user-chip">
                  <div className="nav-user-avatar">{user.name?.[0] || '?'}</div>
                  {user.name?.split(' ')[0]}
                </div>
                <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <button className="btn btn-outline btn-sm" onClick={() => { setAuthMode('login'); setShowAuth(true); }}>Sign In</button>
                <button className="btn btn-primary btn-sm" onClick={() => { setAuthMode('signup'); setShowAuth(true); }}>Sign Up Free</button>
              </>
            )}
          </div>
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
                <option value="Agric Hill">Agric Hill</option>
                <option value="Akyempim">Akyempim</option>
                <option value="Akoon">Akoon</option>
                <option value="Brahabebome">Brahabebome</option>
                <option value="Tamso">Tamso</option>
                <option value="New Canaan">New Canaan</option>
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

      {/* MANAGER PORTAL */}
      {activeTab === 'manager-finances' && user?.role === 'manager' && (
        <ManagerPortal token={token} user={user} />
      )}

      {/* FOOTER */}
      <Footer setActiveTab={setActiveTab} />

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
  const [loginForm, setLoginForm] = useState({ email: 'admin@hostelhub.dev', password: 'admin123' });
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

  useEffect(() => { if (token) loadDashboard(); }, [token]);

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
              <div className="form-field"><label className="form-label">Location</label><input className="form-input" value={form.location} onChange={(e) => sf('location', e.target.value)} required /></div>
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
