// ================================================================
// HOSTEL HUB v5 — Supabase Auth + Premium UI
// Three independent portals: Student | Manager | Administrator
// ================================================================

const { useState, useEffect, useRef, useCallback, useMemo } = React;

// ── Config (loaded from /api/config on startup) ──────────────
let _supabaseUrl  = '';
let _supabaseAnon = '';

// ── Storage Keys ─────────────────────────────────────────────
const TOKEN_KEY   = 'hh_access_token';
const REFRESH_KEY = 'hh_refresh_token';
const USER_KEY    = 'hh_user';

// ── Auth Storage Helpers ──────────────────────────────────────
function getToken()   { try { return localStorage.getItem(TOKEN_KEY);  } catch { return null; } }
function getRefresh() { try { return localStorage.getItem(REFRESH_KEY); } catch { return null; } }
function getUser()    { try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; } }

function saveSession(token, refresh, user) {
  try {
    localStorage.setItem(TOKEN_KEY,   token);
    localStorage.setItem(REFRESH_KEY, refresh || '');
    localStorage.setItem(USER_KEY,    JSON.stringify(user));
  } catch {}
}

function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
}

// ── API Fetch ─────────────────────────────────────────────────
async function apiFetch(path, opts = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (opts.body instanceof FormData) delete headers['Content-Type'];

  let res = await fetch(path, { ...opts, headers });

  // Auto-refresh on 401
  if (res.status === 401 && getRefresh()) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getToken()}`;
      res = await fetch(path, { ...opts, headers });
    }
  }

  const data = await res.json().catch(() => ({ error: 'Network error' }));
  if (!res.ok) throw new Error(data.message || data.error || 'Request failed');
  return data;
}

async function tryRefreshToken() {
  const refresh = getRefresh();
  if (!refresh) return false;
  try {
    const r = await fetch('/api/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh })
    });
    if (!r.ok) { clearSession(); return false; }
    const d = await r.json();
    saveSession(d.token, d.refresh_token, d.user);
    return true;
  } catch { clearSession(); return false; }
}

// ── Formatters ─────────────────────────────────────────────
const fmtCurrency = v => new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 0 }).format(Number(v || 0));
const fmtDate     = d => d ? new Date(d).toLocaleDateString('en-GH',  { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = d => d ? new Date(d).toLocaleString('en-GH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const getInitials = n => (n || 'HH').split(' ').slice(0, 2).map(p => p[0] || '').join('').toUpperCase();
const formatCurrency = fmtCurrency;

function getFacilityIcon(f) {
  const m = { 'Wi-Fi': '📶', 'Water': '🚰', 'Electricity Backup': '⚡', 'Security': '🔒', 'CCTV': '📷', 'Kitchen': '🍳', 'Laundry': '🧺', 'Parking': '🅿️', 'Generator': '🔋', 'Borehole': '💧', 'Study Room': '📚', 'Common Room': '🛋️', 'Balcony': '🌅', 'AC': '❄️', 'Internet': '🌐' };
  return m[f] || '✓';
}

// ── Password Strength ─────────────────────────────────────
function getPasswordStrength(p) {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}
const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthClasses = ['', 'strength-weak', 'strength-fair', 'strength-good', 'strength-strong'];

// ── Toast ─────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((msg, type = 'info', sub = '', dur = 4500) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type, sub }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), dur);
  }, []);
  const dismiss = useCallback(id => setToasts(t => t.filter(x => x.id !== id)), []);
  return { toasts, toast, dismiss };
}

function ToastContainer({ toasts, dismiss }) {
  if (!toasts.length) return null;
  const icons = { success: '✓', error: '✕', warning: '!', info: 'i' };
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <div className="toast-icon">{icons[t.type] || 'i'}</div>
          <div style={{ flex: 1 }}>
            <div className="toast-message">{t.msg}</div>
            {t.sub && <div className="toast-sub">{t.sub}</div>}
          </div>
          <button className="toast-close" onClick={() => dismiss(t.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ── Shared UI ────────────────────────────────────────────
function Spinner({ dark, size = 20 }) {
  return <div className={`spinner ${dark ? 'spinner-dark' : ''}`} style={{ width: size, height: size, flexShrink: 0 }} />;
}
function PageLoading({ label = 'Loading…' }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'var(--bg)' }}>
      <div style={{ fontSize: 32 }}>🏠</div>
      <Spinner dark size={28} />
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}

function Modal({ open, onClose, title, children, size = '', footer }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal-box ${size ? 'modal-box-' + size : ''}`}>
        <div className="modal-head">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

function StatCard({ icon, iconColor, value, label }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon stat-icon-${iconColor || 'indigo'}`}>{icon}</div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function EmptyState({ icon = '📭', title, sub, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {sub && <div className="empty-sub">{sub}</div>}
      {action}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    verified: 'badge-verified', active: 'badge-active', approved: 'badge-active', confirmed: 'badge-active',
    pending: 'badge-pending', pending_payment: 'badge-pending', pending_verification: 'badge-pending',
    pending_submission: 'badge-pending', pending_more_info: 'badge-pending',
    rejected: 'badge-rejected', failed: 'badge-rejected',
    suspended: 'badge-suspended', cancelled: 'badge-suspended',
    under_review: 'badge-under-review', submitted: 'badge-under-review',
  };
  const labels = {
    verified: 'Verified', active: 'Active', approved: 'Approved', confirmed: 'Confirmed',
    pending: 'Pending', pending_payment: 'Awaiting Payment', pending_verification: 'Pending Verification',
    pending_submission: 'Awaiting Submission', pending_more_info: 'More Info Needed',
    rejected: 'Rejected', failed: 'Failed',
    suspended: 'Suspended', cancelled: 'Cancelled',
    under_review: 'Under Review', submitted: 'Submitted',
  };
  return <span className={`badge ${map[status] || 'badge-pending'}`}>{labels[status] || status}</span>;
}

// ================================================================
// INTELLIGENT LOCATION MANAGEMENT SYSTEM
// ================================================================

function IntelligentLocationSearch({ value, onChange, placeholder = "Search location e.g. Banso...", onAddLocation, className = "" }) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const fetchLocs = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/locations?q=${encodeURIComponent(query)}`);
        setLocations(res.locations || []);
      } catch (e) {
        console.error('Failed to load locations', e);
      }
      setLoading(false);
    };
    if (open) {
      const t = setTimeout(fetchLocs, 300);
      return () => clearTimeout(t);
    }
  }, [query, open]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`loc-search-container ${className}`} ref={wrapperRef}>
      <div className="loc-search-input-wrapper">
        <i>📍</i>
        <input 
          type="text" 
          className="loc-search-input" 
          placeholder={placeholder}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={e => {
            setQuery(e.target.value);
            setOpen(true);
          }}
        />
      </div>
      
      {open && (
        <div className="loc-search-dropdown animate-fadeInUp">
          {loading && <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-sub)' }}>Searching...</div>}
          
          {!loading && locations.length > 0 && locations.map(loc => (
            <div 
              key={loc.id} 
              className="loc-search-item"
              onClick={() => {
                setQuery(loc.name);
                onChange(loc.name);
                setOpen(false);
              }}
            >
              <div className="loc-item-main">
                <div className="loc-item-title">
                  {loc.name}
                  {loc.distance_km <= 1 && <span className="loc-badge loc-badge-green">Walkable</span>}
                  {loc.distance_km > 1 && loc.distance_km <= 3 && <span className="loc-badge loc-badge-blue">Short Commute</span>}
                </div>
                <div className="loc-item-sub">
                  <span>🚗 {loc.driving_mins} mins</span>
                  <span>🚶 {loc.walking_mins} mins</span>
                  {loc.transport_fare_ghs > 0 && <span>💰 GHS {loc.transport_fare_ghs}</span>}
                </div>
              </div>
              <div className="loc-item-stats">
                <div><span className="loc-stat-val">{loc.hostel_count}</span> hostels</div>
                {loc.avg_price_ghs > 0 && <div>~GHS {Math.round(loc.avg_price_ghs)}</div>}
              </div>
            </div>
          ))}

          {!loading && locations.length === 0 && (
            <div className="loc-search-empty">
              No locations found matching "{query}"
            </div>
          )}

          {onAddLocation && (
            <div className="loc-add-btn" onClick={() => { setOpen(false); onAddLocation(query); }}>
              + Add New Location "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CampusLocationMap({ locations, onSelectLocation }) {
  // Simple interactive SVG map for UMaT Tarkwa
  const umatLat = 5.29773;
  const umatLng = -2.00052;
  const [hoveredLoc, setHoveredLoc] = useState(null);

  // Normalization just for display spread
  const getXY = (lat, lng) => {
    const x = 50 + ((lng - umatLng) * 5000); // adjust scale
    const y = 50 - ((lat - umatLat) * 5000); // adjust scale
    return { 
      x: Math.max(5, Math.min(95, x)) + '%', 
      y: Math.max(5, Math.min(95, y)) + '%' 
    };
  };

  return (
    <div className="campus-map-container">
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 40, opacity: 0.1, fontWeight: 900 }}>UMaT TARKWA MAP</span>
      </div>
      
      {/* Central Campus Marker */}
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 5, textAlign: 'center' }}>
        <div style={{ fontSize: 32, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}>🏫</div>
        <div style={{ background: 'var(--brand-indigo)', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 800, marginTop: 4 }}>UMaT Campus</div>
      </div>

      {locations.map(loc => {
        const pos = getXY(loc.gps_lat || umatLat, loc.gps_lng || umatLng);
        let color = '#6b21a8'; // purple (far)
        if (loc.distance_km <= 1) color = '#166534'; // green
        else if (loc.distance_km <= 3) color = '#1e40af'; // blue

        return (
          <div 
            key={loc.id} 
            className="map-marker"
            style={{ position: 'absolute', left: pos.x, top: pos.y, zIndex: 10 }}
            onMouseEnter={() => setHoveredLoc(loc)}
            onMouseLeave={() => setHoveredLoc(null)}
            onClick={() => onSelectLocation(loc.name)}
          >
            <div style={{ width: 14, height: 14, background: color, borderRadius: '50%', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}></div>
            
            {hoveredLoc?.id === loc.id && (
              <div className="map-popup">
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4, color: 'var(--brand-navy)' }}>{loc.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 8 }}>{loc.landmark || 'Tarkwa'}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderTop: '1px solid var(--border-color)', paddingTop: 8, marginTop: 8 }}>
                  <div>🚗 {loc.driving_mins}m | 🚶 {loc.walking_mins}m</div>
                  <div style={{ fontWeight: 700, color: 'var(--brand-indigo)' }}>{loc.distance_km} km</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
                  <div>🏠 {loc.hostel_count} Hostels</div>
                  {loc.avg_price_ghs > 0 && <div style={{ color: 'var(--text-sub)' }}>~GHS {Math.round(loc.avg_price_ghs)}</div>}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AddLocationModal({ initialName, onClose, onAdded, toast }) {
  const [data, setData] = useState({ name: initialName || '', landmark: '', gps_lat: 5.29773, gps_lng: -2.00052, distance_km: 1.5 });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!data.name) return toast('Location name required', 'error');
    setBusy(true);
    try {
      await apiFetch('/api/locations', { method: 'POST', body: JSON.stringify(data) });
      toast('Location added successfully', 'success');
      onAdded(data.name);
    } catch (e) {
      toast(e.message, 'error');
    }
    setBusy(false);
  };

  return (
    <Modal open={true} title="Add New Campus Location" onClose={onClose} size="md">
      <div style={{ display: 'grid', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Location Name *</label>
          <input className="form-input" value={data.name} onChange={e => setData({...data, name: e.target.value})} placeholder="e.g. New Atuabo" />
        </div>
        <div className="form-group">
          <label className="form-label">Prominent Landmark</label>
          <input className="form-input" value={data.landmark} onChange={e => setData({...data, landmark: e.target.value})} placeholder="e.g. Near Shell Filling Station" />
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">GPS Latitude</label>
            <input type="number" step="0.00001" className="form-input" value={data.gps_lat} onChange={e => setData({...data, gps_lat: Number(e.target.value)})} />
          </div>
          <div className="form-group">
            <label className="form-label">GPS Longitude</label>
            <input type="number" step="0.00001" className="form-input" value={data.gps_lng} onChange={e => setData({...data, gps_lng: Number(e.target.value)})} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Distance to UMaT (km)</label>
          <input type="number" step="0.1" className="form-input" value={data.distance_km} onChange={e => setData({...data, distance_km: Number(e.target.value)})} />
          <div style={{ fontSize: 11, color: 'var(--text-sub)', marginTop: 4 }}>Used to auto-calculate walking & driving times.</div>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving...' : 'Add Location'}</button>
      </div>
    </Modal>
  );
}

function AdminLocations({ toast }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/locations');
      setLocations(res.locations);
    } catch(e) { toast(e.message, 'error'); }
    setLoading(false);
  };

  useEffect(() => { fetchLocations(); }, []);

  const toggleStatus = async (loc) => {
    try {
      await apiFetch(`/api/locations/${loc.id}`, { method: 'PUT', body: JSON.stringify({ active: !loc.active }) });
      toast(`Location ${!loc.active ? 'activated' : 'deactivated'}`, 'success');
      fetchLocations();
    } catch(e) { toast(e.message, 'error'); }
  };

  return (
    <div>
      <div className="admin-loc-header">
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--brand-navy)' }}>Locations Management</h2>
          <div style={{ fontSize: 14, color: 'var(--text-sub)' }}>Manage intelligent locations, coordinates, and distance metrics.</div>
        </div>
        <button className="btn btn-primary" onClick={() => setAddModal(true)}>+ Add New Location</button>
      </div>

      {loading ? <div style={{ padding: 40, textAlign: 'center' }}>Loading locations...</div> : (
        <div className="admin-loc-grid">
          {locations.map(loc => (
            <div key={loc.id} className="admin-loc-card animate-fadeInUp">
              <div className="admin-loc-card-header">
                <div className="admin-loc-card-title">{loc.name}</div>
              <div className={`admin-loc-card-status ${loc.active !== false ? 'status-active' : 'status-inactive'}`}>
                  {loc.active !== false ? 'Active' : 'Inactive'}
                </div>
              </div>
              <div className="admin-loc-card-body">
                {loc.nearby_landmark && <p>📍 {loc.nearby_landmark}</p>}
                <p>📏 {loc.distance_km} km to Campus</p>
                <p>🚶 {loc.estimated_walking_mins} mins | 🚗 {loc.estimated_driving_mins} mins</p>
                <p>💰 GHS {loc.avg_transport_fare_ghs} transport fare</p>
                <p>🏠 {loc.hostel_count} registered hostels</p>
              </div>
              <div className="admin-loc-card-actions">
                <button className="btn btn-outline btn-sm" onClick={() => toggleStatus(loc)}>
                  {loc.active !== false ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {addModal && <AddLocationModal onClose={() => setAddModal(false)} onAdded={() => { setAddModal(false); fetchLocations(); }} toast={toast} />}
    </div>
  );
}

// ================================================================
// PREMIUM PUBLIC LANDING PAGE & ROLE SELECTION AUTH
// ================================================================
function AuthPage({ onLogin }) {
  const [view, setView] = useState('landing'); // landing | role-select | student-login | student-signup | manager-login | manager-apply | admin-login | forgot | check-email
  const [selectedHostel, setSelectedHostel] = useState(null);

  if (view === 'landing') {
    return (
      <>
        <PublicLandingPage setView={setView} onSelectHostel={h => setSelectedHostel(h)} />
        {selectedHostel && (
          <StudentHostelDetail hostel={selectedHostel} user={null} toast={() => {}} onClose={() => setSelectedHostel(null)} onBooked={() => setView('role-select')} />
        )}
      </>
    );
  }

  if (view === 'role-select' || ((view === 'student-login' || view === 'student-signup' || view === 'login' || view === 'signup') && selectedHostel)) {
    return (
      <>
        <PublicLandingPage setView={setView} onSelectHostel={h => setSelectedHostel(h)} />
        {selectedHostel && (
          <StudentHostelDetail hostel={selectedHostel} user={null} toast={() => {}} onClose={() => setSelectedHostel(null)} onBooked={() => setView('role-select')} />
        )}
        {view === 'role-select' ? (
          <RoleSelectAuthModal setView={setView} onClose={() => setView(selectedHostel ? 'landing' : 'landing')} />
        ) : (
          <Modal open={true} onClose={() => setView('landing')} title="" size="sm" className="premium-modal">
            <div className="auth-card premium-glass" style={{ padding: 0, boxShadow: 'none', border: 'none', background: 'transparent' }}>
              {(view === 'student-login' || view === 'login') && <LoginForm onLogin={onLogin} setView={setView} roleLabel="Student" />}
              {(view === 'student-signup' || view === 'signup') && <SignupForm onLogin={onLogin} setView={setView} />}
            </div>
          </Modal>
        )}
      </>
    );
  }

  return (
    <div className="auth-page glass-theme">
      <AuthLeft view={view} setView={setView} />
      <div className="auth-right">
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'flex-start' }}>
          <button className="btn btn-outline btn-sm" onClick={() => setView('landing')} style={{ color: 'var(--text-sub)' }}>
            <span style={{ marginRight: 8 }}>←</span> Back to Homepage
          </button>
        </div>
        <div className="auth-card premium-glass animate-fadeInUp">
          {(view === 'student-login' || view === 'login') && <LoginForm onLogin={onLogin} setView={setView} roleLabel="Student" />}
          {(view === 'student-signup' || view === 'signup') && <SignupForm onLogin={onLogin} setView={setView} />}
          {(view === 'manager-login') && <LoginForm onLogin={onLogin} setView={setView} roleLabel="Hostel Manager" />}
          {(view === 'admin-login') && <LoginForm onLogin={onLogin} setView={setView} roleLabel="Administrator" />}
          {view === 'forgot' && <ForgotPassword setView={setView} />}
          {view === 'check-email' && <CheckEmailScreen setView={setView} />}
        </div>
      </div>
    </div>
  );
}

function RoleSelectAuthModal({ setView, onClose }) {
  return (
    <Modal open={true} onClose={onClose} title="✨ Welcome to HostelHub" size="md" className="premium-modal">
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 15, color: 'var(--text-sub)' }}>Select how you would like to access the platform</div>
      </div>
      <div className="role-select-grid">
        <div className="role-select-card premium-card" onClick={() => setView('student-login')}>
          <div className="role-select-icon">🎓</div>
          <div className="role-select-title">Student Portal</div>
          <div className="role-select-sub">Discover hostels, book rooms, schedule physical tours, & submit receipts.</div>
          <button className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: 12 }}>Sign In as Student</button>
          <button className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 6, fontSize: 13 }} onClick={e => { e.stopPropagation(); setView('student-signup'); }}>New? Create Account</button>
        </div>

        <div className="role-select-card premium-card" onClick={() => setView('manager-login')}>
          <div className="role-select-icon">🏢</div>
          <div className="role-select-title">Hostel Manager</div>
          <div className="role-select-sub">Manage rooms, verify resident payments, & issue official digital receipts.</div>
          <button className="btn btn-primary btn-sm" style={{ width: '100%', background: 'var(--brand-navy)', marginTop: 12 }}>Manager Sign In</button>
        </div>

        <div className="role-select-card premium-card" onClick={() => setView('admin-login')}>
          <div className="role-select-icon">🔑</div>
          <div className="role-select-title">Administrator</div>
          <div className="role-select-sub">Platform control, co-admin roles, verifications, error monitor & analytics.</div>
          <button className="btn btn-primary btn-sm" style={{ width: '100%', background: 'var(--gray-800)', marginTop: 12 }}>Admin Portal</button>
        </div>
      </div>
    </Modal>
  );
}

function PublicLandingPage({ setView, onSelectHostel, children }) {
  const [hostels, setHostels] = useState([]);
  const [locations, setLocations] = useState([]);
  const [searchLoc, setSearchLoc] = useState('');
  const [searchRoom, setSearchRoom] = useState('');
  const [searchPrice, setSearchPrice] = useState('99999');
  const [searchGender, setSearchGender] = useState('');
  const [howStep, setHowStep] = useState('student');

  useEffect(() => {
    apiFetch('/api/hostels?verified=true')
      .then(d => setHostels(d.hostels || []))
      .catch(() => {});

    apiFetch('/api/locations')
      .then(d => setLocations(d.locations || []))
      .catch(() => {});
  }, []);

  const topLocations = [
    { name: 'Banso', count: '12 Hostels', icon: '📍', desc: 'Near UMaT Main Gate & Lecture Halls' },
    { name: 'Bankyim', count: '18 Hostels', icon: '🏘️', desc: 'High density student residential area' },
    { name: 'Cyanide', count: '9 Hostels', icon: '🏫', desc: 'Short walk to main engineering blocks' },
    { name: 'New Atuabo', count: '7 Hostels', icon: '🌲', desc: 'Quiet, premium residential lodges' },
    { name: 'Akoon', count: '11 Hostels', icon: '⛏️', desc: 'Close to UMaT Mines campus' },
    { name: 'Tarkwa Station', count: '15 Hostels', icon: '🚌', desc: 'Commercial central hub with direct transport' }
  ];

  const handleSearch = () => {
    const el = document.getElementById('featured-hostels');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredHostels = hostels.filter(h => {
    if (searchLoc && !(h.location || '').toLowerCase().includes(searchLoc.toLowerCase())) return false;
    if (searchGender && h.genderPreference && h.genderPreference !== 'Co-ed' && h.genderPreference !== searchGender) return false;
    if (Number(searchPrice) < 99999 && Number(h.pricePerYear || h.price_per_year) > Number(searchPrice)) return false;
    return true;
  });

  return (
    <div className="pub-landing-page">
      <nav className="pub-landing-nav">
        <div className="pub-landing-nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="pub-landing-nav-logo-icon">🏠</div>
          <div>
            <div className="pub-landing-nav-title">HostelHub</div>
          </div>
          <span className="pub-landing-nav-badge">UMaT Tarkwa</span>
        </div>

        <div className="pub-landing-nav-links">
          <a className="pub-landing-nav-link" href="#featured-hostels">Explore Hostels</a>
          <a className="pub-landing-nav-link" href="#locations">Locations</a>
          <a className="pub-landing-nav-link" href="#why-us">Why Us</a>
          <a className="pub-landing-nav-link" href="#how-it-works">How It Works</a>
          <a className="pub-landing-nav-link" href="#testimonials">Reviews</a>
          <a className="pub-landing-nav-link" href="#for-managers">For Managers</a>
        </div>

        <div className="pub-landing-nav-actions">
          <button className="btn btn-outline btn-sm" onClick={() => setView('role-select')}>Sign In</button>
          <button className="btn btn-primary btn-sm" onClick={() => setView('role-select')}>Get Started ➔</button>
        </div>
      </nav>

      <header className="pub-hero-section">
        <div className="pub-hero-bg-glow" />
        <div className="pub-hero-content animate-fadeInUp">
          <div className="pub-hero-badge">
            <span>🛡️ #1 Verified Student Accommodation Platform</span>
          </div>

          <h1 className="pub-hero-title">
            Find Your Ideal Student Home <br />
            At <span className="pub-hero-title-accent">UMaT Tarkwa</span>
          </h1>

          <p className="pub-hero-subtitle">
            Discover 100% physically verified student hostels, schedule physical tours, book rooms securely, and eliminate middleman agent scams — all in one platform.
          </p>

          <div className="pub-hero-search-box">
            <div className="pub-search-field">
              <div className="pub-search-label">📍 Location in Tarkwa</div>
              <IntelligentLocationSearch 
                value={searchLoc} 
                onChange={v => setSearchLoc(v)} 
                placeholder="All Locations in Tarkwa" 
                className="pub-hero-loc-search"
              />
            </div>

            <div className="pub-search-field">
              <div className="pub-search-label">🛏️ Room Category</div>
              <select className="pub-search-input" value={searchRoom} onChange={e => setSearchRoom(e.target.value)}>
                <option value="">Any Room Category</option>
                <option value="1_in_room">One in a Room</option>
                <option value="2_in_room">Two in a Room</option>
                <option value="3_in_room">Three in a Room</option>
                <option value="4_in_room">Four in a Room</option>
              </select>
            </div>

            <div className="pub-search-field">
              <div className="pub-search-label">💰 Max Budget / Year</div>
              <select className="pub-search-input" value={searchPrice} onChange={e => setSearchPrice(e.target.value)}>
                <option value="99999">Any Budget</option>
                <option value="5000">Under GHS 5,000</option>
                <option value="8000">Under GHS 8,000</option>
                <option value="12000">Under GHS 12,000</option>
              </select>
            </div>

            <div className="pub-search-field">
              <div className="pub-search-label">👥 Gender Preference</div>
              <select className="pub-search-input" value={searchGender} onChange={e => setSearchGender(e.target.value)}>
                <option value="">Co-ed / All</option>
                <option value="Male-only">Male Only</option>
                <option value="Female-only">Female Only</option>
              </select>
            </div>

            <button className="pub-search-btn" onClick={handleSearch}>
              <span>🔍 Search</span>
            </button>
          </div>

          <div className="pub-proof-strip">
            <div className="pub-proof-item"><span className="pub-proof-icon">🎓</span> 2,500+ UMaT Students Housed</div>
            <div className="pub-proof-item"><span className="pub-proof-icon">🛡️</span> 100% Admin Verified Hostels</div>
            <div className="pub-proof-item"><span className="pub-proof-icon">🚫</span> Zero Agent Fees & Scams</div>
            <div className="pub-proof-item"><span className="pub-proof-icon">⭐</span> 4.9★ Average Rating</div>
          </div>
        </div>
      </header>

      <section className="pub-section" id="featured-hostels">
        <div className="pub-section-header">
          <span className="pub-section-tag">Featured Accommodations</span>
          <h2 className="pub-section-title">Explore Verified Hostels Near UMaT</h2>
          <p className="pub-section-subtitle">Every hostel listed on HostelHub is physically inspected and verified by administrators before publication.</p>
        </div>

        <div className="pub-hostel-grid">
          {(filteredHostels.length > 0 ? filteredHostels : hostels).slice(0, 6).map(h => (
            <div key={h.id} className="pub-hostel-card">
              <div className="pub-hostel-img-wrap">
                <img className="pub-hostel-img" src={h.photos?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80'} alt={h.name} loading="lazy" />
                <div className="pub-hostel-badge-top">
                  <span className={`badge ${h.verificationStatus === 'premium_partner' ? 'badge-verified' : 'badge-info'}`}>
                    {h.verificationStatus === 'premium_partner' ? '💎 Premium Partner' : '🛡️ Admin Verified'}
                  </span>
                </div>
                <div className="pub-hostel-distance-badge">📍 {h.distanceKm || 1.2} km from UMaT</div>
                <div className="pub-hostel-price-tag">{fmtCurrency(h.pricePerYear || h.price_per_year)}/yr</div>
              </div>

              <div className="pub-hostel-body">
                <div className="pub-hostel-name">{h.name}</div>
                <div className="pub-hostel-loc">📍 {h.location} • {h.address}</div>
                <div className="pub-hostel-facs">
                  {(h.facilities || ['Wi-Fi', 'Water', 'Security', 'Generator']).slice(0, 4).map(f => (
                    <span key={f} className="pub-hostel-fac-pill">{f}</span>
                  ))}
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
                  <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => onSelectHostel(h)}>View Photos & Details</button>
                  <button className="btn btn-primary btn-sm" onClick={() => setView('role-select')}>Book Now</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="pub-section" id="locations" style={{ background: 'var(--bg-white)', borderRadius: 'var(--radius-xl)' }}>
        <div className="pub-section-header">
          <span className="pub-section-tag">Campus Neighborhoods</span>
          <h2 className="pub-section-title">Popular Hostel Locations in Tarkwa</h2>
          <p className="pub-section-subtitle">Choose from top student residential areas with easy transport access to lecture rooms.</p>
        </div>

        <div className="pub-location-grid">
          {locations.slice(0, 6).map(loc => (
            <div key={loc.name} className="pub-location-card" onClick={() => { setSearchLoc(loc.name); handleSearch(); }}>
              <div className="pub-location-icon">{loc.distance_km <= 1 ? '🏫' : loc.distance_km <= 3 ? '📍' : '🚌'}</div>
              <div>
                <div className="pub-location-name">{loc.name}</div>
                <div className="pub-location-sub">{loc.hostel_count} Hostels • {loc.distance_km} km to campus</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16, color: 'var(--brand-navy)' }}>Interactive Campus Map</h3>
          <CampusLocationMap locations={locations} onSelectLocation={(name) => { setSearchLoc(name); handleSearch(); }} />
        </div>
      </section>

      <section className="pub-section" id="why-us">
        <div className="pub-section-header">
          <span className="pub-section-tag">Platform Advantages</span>
          <h2 className="pub-section-title">Built Specially for UMaT Students</h2>
          <p className="pub-section-subtitle">We solved the hassle of finding student accommodation in Tarkwa so you can focus on your studies.</p>
        </div>

        <div className="pub-why-grid">
          {[
            ['🛡️', '100% Physical Verification', 'Administrators physically visit and inspect every hostel before issuing a verified badge.'],
            ['📅', 'Schedule Guided Physical Tours', 'Request a physical tour on your preferred date and time before making any financial commitment.'],
            ['📷', 'Categorized Room Galleries', 'View actual room photos categorized for 1-in-a-room, 2-in-a-room, kitchen, and washrooms.'],
            ['💳', 'Transparent Payment Receipts', 'Submit payment proof online and get official digital PDF receipts automatically on manager approval.'],
            ['🔧', 'Maintenance Issue Tracking', 'Submit maintenance requests with Before & After repair photo uploads to ensure issues get fixed fast.'],
            ['🚫', 'Zero Illegal Agent Scams', 'Connect directly with verified hostel managers without paying illegal middleman inspection fees.']
          ].map(([icon, title, desc]) => (
            <div key={title} className="pub-why-card">
              <div className="pub-why-icon-box">{icon}</div>
              <div className="pub-why-title">{title}</div>
              <div className="pub-why-desc">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="pub-section" id="how-it-works" style={{ background: 'var(--bg-white)', borderRadius: 'var(--radius-xl)' }}>
        <div className="pub-section-header">
          <span className="pub-section-tag">Simple & Transparent</span>
          <h2 className="pub-section-title">How HostelHub Works</h2>
          <p className="pub-section-subtitle">A seamless journey from hostel discovery to official move-in.</p>
        </div>

        <div className="pub-step-toggle">
          <button className={`btn btn-sm ${howStep === 'student' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setHowStep('student')}>🎓 For Students</button>
          <button className={`btn btn-sm ${howStep === 'manager' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setHowStep('manager')}>🏢 For Hostel Managers</button>
        </div>

        {howStep === 'student' ? (
          <div className="pub-step-grid">
            {[
              ['1', 'Search & Filter', 'Browse hostels by Tarkwa location, room category, budget, and distance from UMaT campus.'],
              ['2', 'Request Physical Tour', 'Pick a date and time slot to visit the physical hostel before making any payment.'],
              ['3', 'Book & Submit Proof', 'Reserve your preferred room category and upload your Mobile Money or bank transaction receipt.'],
              ['4', 'Move In & Get Receipt', 'Receive your verified digital PDF receipt and official move-in instructions from the manager.']
            ].map(([num, title, desc]) => (
              <div key={num} className="pub-step-card">
                <div className="pub-step-number">{num}</div>
                <div className="pub-step-title">{title}</div>
                <div className="pub-step-desc">{desc}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="pub-step-grid">
            {[
              ['1', 'Apply for Listing', 'Submit your hostel details, room capacities, facilities, and business registration details.'],
              ['2', 'Admin Physical Audit', 'HostelHub administrators physically inspect your property to issue the Verified Partner Badge.'],
              ['3', 'Receive Student Bookings', 'Manage room availability, review payment submissions, and approve guided physical tours.'],
              ['4', 'Automate Revenue & Receipts', 'Track rent payments, issue official receipts, and manage student maintenance requests effortlessly.']
            ].map(([num, title, desc]) => (
              <div key={num} className="pub-step-card">
                <div className="pub-step-number" style={{ background: 'var(--brand-indigo)' }}>{num}</div>
                <div className="pub-step-title">{title}</div>
                <div className="pub-step-desc">{desc}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="pub-section" id="testimonials">
        <div className="pub-section-header">
          <span className="pub-section-tag">Student Feedback</span>
          <h2 className="pub-section-title">Loved by UMaT Students</h2>
          <p className="pub-section-subtitle">Real experiences from students living in verified Tarkwa hostels.</p>
        </div>

        <div className="pub-testimonial-grid">
          {[
            ['AK', 'Ama Kofi', 'Level 300 • Mining Engineering', '"Found my 1-in-a-room hostel at Banso in 10 minutes. The verification badge gave me confidence it was legitimate. Best platform for UMaT students!"'],
            ['KM', 'Kwame Mensah', 'Level 200 • Computer Science', '"No agents calling me at 6 AM demanding inspection fees. I scheduled a tour, visited Tarkwa Hostel Haven, and paid directly through Mobile Money."'],
            ['EB', 'Emmanuel Boateng', 'Level 400 • Petroleum Engineering', '"The maintenance photo tracking is incredible. Had a plumbing issue, uploaded a photo on Thursday, and the manager fixed it by Friday morning."']
          ].map(([avatar, name, role, text]) => (
            <div key={name} className="pub-testimonial-card">
              <div className="pub-testimonial-stars">★★★★★</div>
              <div className="pub-testimonial-text">{text}</div>
              <div className="pub-testimonial-author">
                <div className="pub-testimonial-avatar">{avatar}</div>
                <div>
                  <div className="pub-testimonial-name">{name}</div>
                  <div className="pub-testimonial-role">{role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="pub-section" id="for-managers">
        <div className="pub-manager-banner">
          <div className="pub-manager-banner-text">
            <h3 className="pub-manager-banner-title">Own or Manage a Hostel in Tarkwa?</h3>
            <p className="pub-manager-banner-sub">Partner with HostelHub to reach thousands of UMaT students, fill room vacancies faster, verify payment submissions, and manage residents professionally.</p>
          </div>
          <button className="btn btn-amber btn-lg" onClick={() => setView('role-select')}>Apply for Hostel Listing ➔</button>
        </div>
      </section>

      <section className="pub-section">
        <div className="pub-cta-banner">
          <h2 style={{ fontSize: 32, fontWeight: 900, fontFamily: 'Plus Jakarta Sans', marginBottom: 12 }}>Ready to Secure Your Student Accommodation?</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', maxWidth: 600, margin: '0 auto 28px' }}>Join thousands of UMaT students who enjoy safe, verified, and hassle-free hostel living.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-amber btn-lg" onClick={() => setView('role-select')}>Find My Hostel Now ➔</button>
            <button className="btn btn-outline btn-lg" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }} onClick={() => setView('role-select')}>Sign In to Account</button>
          </div>
        </div>
      </section>

      <footer className="pub-landing-footer">
        <div className="pub-footer-grid">
          <div>
            <div className="pub-footer-brand">🏠 HostelHub</div>
            <div className="pub-footer-text">The official verified student accommodation discovery and booking platform for the University of Mines and Technology (UMaT), Tarkwa, Ghana.</div>
          </div>

          <div>
            <div className="pub-footer-heading">Quick Links</div>
            <div className="pub-footer-links">
              <a className="pub-footer-link" href="#featured-hostels">Explore Hostels</a>
              <a className="pub-footer-link" href="#locations">Campus Locations</a>
              <a className="pub-footer-link" href="#why-us">Why HostelHub</a>
              <a className="pub-footer-link" href="#how-it-works">How It Works</a>
            </div>
          </div>

          <div>
            <div className="pub-footer-heading">Top Neighborhoods</div>
            <div className="pub-footer-links">
              <span className="pub-footer-link" onClick={() => { setSearchLoc('Banso'); handleSearch(); }}>Banso (Main Gate)</span>
              <span className="pub-footer-link" onClick={() => { setSearchLoc('Bankyim'); handleSearch(); }}>Bankyim</span>
              <span className="pub-footer-link" onClick={() => { setSearchLoc('Cyanide'); handleSearch(); }}>Cyanide</span>
              <span className="pub-footer-link" onClick={() => { setSearchLoc('Akoon'); handleSearch(); }}>Akoon (Mines Campus)</span>
            </div>
          </div>

          <div>
            <div className="pub-footer-heading">Portal Access</div>
            <div className="pub-footer-links">
              <span className="pub-footer-link" onClick={() => setView('role-select')}>Student Sign In</span>
              <span className="pub-footer-link" onClick={() => setView('role-select')}>Manager Portal</span>
              <span className="pub-footer-link" onClick={() => setView('role-select')}>Admin Console</span>
              <span className="pub-footer-link" onClick={() => setView('role-select')}>Manager Application</span>
            </div>
          </div>
        </div>

        <div className="pub-footer-bottom">
          <div>© 2026 HostelHub — University of Mines and Technology (UMaT), Tarkwa. All rights reserved.</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 999, background: 'var(--success)' }} />
            <span>Supabase API v5 Active</span>
          </div>
        </div>
      </footer>

      {children}
    </div>
  );
}

function AuthLeft({ view }) {
  const content = {
    login:  { badge: '🔐 Secure Sign In',   title: 'Welcome back to Hostel Hub', sub: 'Your verified student accommodation platform for UMaT Tarkwa.' },
    signup: { badge: '🎓 Student Account',   title: 'Find your perfect student home', sub: 'Join thousands of UMaT students who trust Hostel Hub for safe, verified accommodation.' },
    apply:  { badge: '🏢 Partner with Us',   title: 'List your hostel on Hostel Hub', sub: 'Get verified, reach thousands of students, and manage your hostel professionally.' },
    forgot: { badge: '🔑 Account Recovery',  title: 'Reset your password', sub: 'We\'ll send a secure reset link to your email address.' },
    'check-email': { badge: '📬 Email Sent', title: 'Check your inbox', sub: 'A link has been sent. Click it to complete the process.' },
  };
  const c = content[view] || content.login;
  return (
    <div className="auth-left">
      <div className="auth-brand">
        <div className="auth-brand-icon">🏠</div>
        <div className="auth-brand-name">Hostel Hub</div>
      </div>
      <div className="auth-hero-content">
        <div className="auth-hero-badge">{c.badge}</div>
        <h1 className="auth-hero-title">{c.title.split(' ').slice(0, -2).join(' ')} <span className="accent">{c.title.split(' ').slice(-2).join(' ')}</span></h1>
        <p className="auth-hero-sub">{c.sub}</p>
        <div className="auth-features">
          {[
            ['🛡️', 'Verified Hostels', 'Every listing approved by administrators'],
            ['💳', 'Secure Payments', 'Direct proof-of-payment system'],
            ['📋', 'Official Receipts', 'Generated automatically on approval'],
            ['🔔', 'Live Updates',    'Real-time booking notifications'],
          ].map(([icon, title, desc]) => (
            <div className="auth-feature" key={title}>
              <div className="auth-feature-icon">{icon}</div>
              <div>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{title}</div>
                <div className="auth-feature-text">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="auth-testimonial">
        <div className="auth-testimonial-text">"Found my hostel in 10 minutes. The verification badge gave me confidence it was legitimate. Best platform for UMaT students!"</div>
        <div className="auth-testimonial-author">
          <div className="auth-testimonial-avatar">AK</div>
          <div>
            <div className="auth-testimonial-name">Ama Kofi</div>
            <div className="auth-testimonial-role">Level 300 · Mining Engineering, UMaT</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Login Form ────────────────────────────────────────────
function LoginForm({ onLogin, setView, roleLabel }) {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy]       = useState(false);
  const [err, setErr]         = useState('');

  const submit = async e => {
    e.preventDefault();
    if (!email || !password) { setErr('Please enter your email and password.'); return; }
    setBusy(true); setErr('');
    try {
      const data = await apiFetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      
      saveSession(data.token, data.refresh_token, data.user);
      onLogin(data.user);
    } catch (e) {
      setErr(e.message === 'Invalid email or password' ? 'Incorrect email or password. Please try again.' : e.message);
    }
    setBusy(false);
  };

  return (
    <>
      <div className="auth-card-header">
        <h2 className="auth-card-title">{roleLabel ? `${roleLabel} Sign In` : 'Sign in to your account'}</h2>
        <p className="auth-card-sub">{roleLabel ? `Access your ${roleLabel.toLowerCase()} dashboard` : 'Welcome back — your hostel is waiting'}</p>
      </div>
      <form className="auth-form" onSubmit={submit}>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <div className="input-group premium-input">
            <span className="input-icon">✉</span>
            <input className="form-input" type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} autoFocus required />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <div className="input-group premium-input">
            <span className="input-icon">🔑</span>
            <input className="form-input" type={showPwd ? 'text' : 'password'} placeholder="Your password"
              value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="button" className="input-action" onClick={() => setShowPwd(v => !v)} aria-label="Toggle password">{showPwd ? '🙈' : '👁'}</button>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--brand-indigo)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setView('forgot')}>Forgot password?</span>
        </div>
        {err && <div className="alert alert-danger" style={{ marginBottom: 16 }}><span className="alert-icon">⚠</span>{err}</div>}
        <button type="submit" className="btn btn-primary btn-premium" style={{ width: '100%', padding: '14px 20px', fontSize: 15 }} disabled={busy}>
          {busy ? <Spinner /> : 'Sign In'}
        </button>
      </form>
      {(!roleLabel || roleLabel === 'Student') && (
        <>
          <div className="auth-divider"><span>New to Hostel Hub?</span></div>
          <div style={{ display: 'grid', gap: 10 }}>
            <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => setView('signup')}>🎓 Create Student Account</button>
          </div>
        </>
      )}
    </>
  );
}


// ── Student Sign Up ───────────────────────────────────────
function SignupForm({ onLogin, setView }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', studentIndex: '', institution: 'University of Mines and Technology', faculty: '', department: '', level: '' });
  const [showPwd, setShowPwd]   = useState(false);
  const [busy, setBusy]         = useState(false);
  const [err, setErr]           = useState('');
  const [step, setStep]         = useState(1); // 1=account, 2=profile
  const strength = getPasswordStrength(form.password);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setErr('Passwords do not match.'); return; }
    if (form.password.length < 8) { setErr('Password must be at least 8 characters.'); return; }
    setBusy(true); setErr('');
    try {
      const data = await apiFetch('/api/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name, email: form.email.trim().toLowerCase(),
          phone: form.phone, password: form.password,
          studentIndex: form.studentIndex, institution: form.institution,
          faculty: form.faculty, department: form.department, level: form.level,
        })
      });
      saveSession(data.token, data.refresh_token, data.user);
      onLogin(data.user);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <>
      <div className="auth-card-header">
        <h2 className="auth-card-title">Create your student account</h2>
        <p className="auth-card-sub">Step {step} of 2 — {step === 1 ? 'Account details' : 'Academic profile'}</p>
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {[1, 2].map(s => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 99, background: s <= step ? 'var(--brand-indigo)' : 'var(--gray-200)', transition: 'background 0.3s' }} />
        ))}
      </div>
      <form className="auth-form" onSubmit={step === 1 ? e => { e.preventDefault(); if (!form.name || !form.email || !form.phone || !form.password) { setErr('All fields are required.'); return; } setErr(''); setStep(2); } : submit}>
        {step === 1 && (
          <>
            <div className="auth-form-row">
              <div className="form-group">
                <label className="form-label">Full Name <span className="req">*</span></label>
                <input className="form-input premium-input" value={form.name} onChange={set('name')} placeholder="Your full name" required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number <span className="req">*</span></label>
                <input className="form-input premium-input" value={form.phone} onChange={set('phone')} placeholder="+233 24 …" required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address <span className="req">*</span></label>
              <div className="input-group premium-input">
                <span className="input-icon">✉</span>
                <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password <span className="req">*</span></label>
              <div className="input-group premium-input">
                <span className="input-icon">🔑</span>
                <input className="form-input" type={showPwd ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Create a strong password" required />
                <button type="button" className="input-action" onClick={() => setShowPwd(v => !v)}>{showPwd ? '🙈' : '👁'}</button>
              </div>
              {form.password && (
                <div style={{ marginTop: 8 }}>
                  <div className="strength-bar">{[1, 2, 3, 4].map(i => <div key={i} className={`strength-seg ${i <= strength ? 'active-' + (strength - 1) : ''}`} />)}</div>
                  <span className={`strength-label ${strengthClasses[strength]}`}>{strengthLabels[strength]}</span>
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password <span className="req">*</span></label>
              <input className="form-input premium-input" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat your password" required />
            </div>
          </>
        )}
        {step === 2 && (
          <div className="animate-fadeInUp">
            <div className="auth-form-row">
              <div className="form-group">
                <label className="form-label">Student ID</label>
                <input className="form-input premium-input" value={form.studentIndex} onChange={set('studentIndex')} placeholder="e.g. UMaT/2024/0001" required />
              </div>
              <div className="form-group">
                <label className="form-label">Level / Year</label>
                <select className="form-input form-select premium-input" value={form.level} onChange={set('level')} required>
                  <option value="">Select level</option>
                  {['Level 100', 'Level 200', 'Level 300', 'Level 400', 'Level 500', 'Postgraduate'].map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Institution</label>
              <input className="form-input premium-input" value={form.institution} onChange={set('institution')} style={{ background: 'var(--gray-50)', cursor: 'not-allowed' }} readOnly />
            </div>
            <div className="auth-form-row">
              <div className="form-group">
                <label className="form-label">Faculty</label>
                <input className="form-input premium-input" value={form.faculty} onChange={set('faculty')} placeholder="e.g. Engineering" required />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="form-input premium-input" value={form.department} onChange={set('department')} placeholder="e.g. Mining" required />
              </div>
            </div>
          </div>
        )}
        {err && <div className="alert alert-danger" style={{ marginBottom: 16 }}><span className="alert-icon">⚠</span>{err}</div>}
        <div style={{ display: 'flex', gap: 12 }}>
          {step === 2 && <button type="button" className="btn btn-outline" onClick={() => setStep(1)} style={{ padding: '14px 20px' }}>← Back</button>}
          <button type="submit" className="btn btn-primary btn-premium" style={{ flex: 1, padding: '14px 20px', fontSize: 15 }} disabled={busy}>
            {busy ? <Spinner /> : step === 1 ? 'Continue →' : 'Create Account'}
          </button>
        </div>
      </form>
      <div className="auth-switch" style={{ marginTop: 24, textAlign: 'center' }}>
        <span style={{ fontSize: 14, color: 'var(--text-sub)' }}>Already have an account? </span>
        <span style={{ fontSize: 14, color: 'var(--brand-indigo)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setView('login')}>Sign In</span>
      </div>
    </>
  );
}


// ── Manager Application Form ──────────────────────────────
function ManagerApplyForm({ setView }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    hostelNameApplied: '', hostelLocationApplied: '', hostelAddressApplied: '',
    hostelDescriptionApplied: '', gpsLocation: '', numRoomsApplied: '',
    capacityApplied: '', paymentMethodsApplied: '', applicationNotes: '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState('');
  const [done, setDone] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const strength = getPasswordStrength(form.password);

  const submit = async e => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setErr('Passwords do not match.'); return; }
    setBusy(true); setErr('');
    try {
      await apiFetch('/api/manager-apply', {
        method: 'POST',
        body: JSON.stringify({ ...form, numRoomsApplied: Number(form.numRoomsApplied), capacityApplied: Number(form.capacityApplied) })
      });
      setDone(true);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  if (done) return (
    <>
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
        <h2 className="auth-card-title">Application Submitted!</h2>
        <p className="auth-card-sub" style={{ marginBottom: 24 }}>Our team will review your hostel details and contact you within 2–3 business days.</p>
        <div style={{ display: 'grid', gap: 10 }}>
          <button className="btn btn-primary" onClick={() => setView('login')}>Sign In to Check Status</button>
          <button className="btn btn-outline" onClick={() => setView('login')}>Back to Login</button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="auth-card-header">
        <h2 className="auth-card-title">Become a Hostel Partner</h2>
        <p className="auth-card-sub">Step {step} of 2 — {step === 1 ? 'Your account' : 'Hostel details'}</p>
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {[1, 2].map(s => <div key={s} style={{ flex: 1, height: 4, borderRadius: 99, background: s <= step ? 'var(--brand-amber)' : 'var(--gray-200)', transition: 'background 0.3s' }} />)}
      </div>
      <form className="auth-form" onSubmit={step === 1 ? e => { e.preventDefault(); if (!form.name || !form.email || !form.phone || !form.password) { setErr('All fields required.'); return; } setErr(''); setStep(2); } : submit}>
        {step === 1 && (
          <>
            <div className="auth-form-row">
              <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" value={form.name} onChange={set('name')} required /></div>
              <div className="form-group"><label className="form-label">Phone *</label><input className="form-input" value={form.phone} onChange={set('phone')} placeholder="+233 24…" required /></div>
            </div>
            <div className="form-group"><label className="form-label">Email Address *</label><input className="form-input" type="email" value={form.email} onChange={set('email')} required /></div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input className="form-input" type="password" value={form.password} onChange={set('password')} placeholder="Minimum 8 characters" required />
              {form.password && (<div style={{ marginTop: 6 }}><div className="strength-bar">{[1,2,3,4].map(i=><div key={i} className={`strength-seg ${i<=strength?'active-'+(strength-1):''}`}/>)}</div><span className={`strength-label ${strengthClasses[strength]}`}>{strengthLabels[strength]}</span></div>)}
            </div>
            <div className="form-group"><label className="form-label">Confirm Password *</label><input className="form-input" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} required /></div>
          </>
        )}
        {step === 2 && (
          <>
            <div className="auth-form-row">
              <div className="form-group"><label className="form-label">Hostel Name *</label><input className="form-input" value={form.hostelNameApplied} onChange={set('hostelNameApplied')} placeholder="e.g. Palm View Lodge" required /></div>
              <div className="form-group"><label className="form-label">Location / Area *</label><input className="form-input" value={form.hostelLocationApplied} onChange={set('hostelLocationApplied')} placeholder="Near UMaT Gate" required /></div>
            </div>
            <div className="form-group"><label className="form-label">Street Address</label><input className="form-input" value={form.hostelAddressApplied} onChange={set('hostelAddressApplied')} placeholder="Full address" /></div>
            <div className="form-group"><label className="form-label">GPS / Coordinates</label><input className="form-input" value={form.gpsLocation} onChange={set('gpsLocation')} placeholder="e.g. 5.3000, -1.9833" /></div>
            <div className="auth-form-row">
              <div className="form-group"><label className="form-label">Number of Rooms</label><input className="form-input" type="number" value={form.numRoomsApplied} onChange={set('numRoomsApplied')} placeholder="20" /></div>
              <div className="form-group"><label className="form-label">Total Capacity</label><input className="form-input" type="number" value={form.capacityApplied} onChange={set('capacityApplied')} placeholder="60" /></div>
            </div>
            <div className="form-group"><label className="form-label">Description *</label><textarea className="form-input form-textarea" value={form.hostelDescriptionApplied} onChange={set('hostelDescriptionApplied')} rows={3} placeholder="Describe your hostel — location, amenities, target students…" required /></div>
            <div className="form-group"><label className="form-label">Payment Methods</label><input className="form-input" value={form.paymentMethodsApplied} onChange={set('paymentMethodsApplied')} placeholder="e.g. MTN MoMo, GCB Bank" /></div>
            <div className="form-group"><label className="form-label">Additional Notes</label><textarea className="form-input form-textarea" value={form.applicationNotes} onChange={set('applicationNotes')} rows={2} /></div>
          </>
        )}
        {err && <div className="alert alert-danger"><span className="alert-icon">⚠</span>{err}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          {step === 2 && <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>}
          <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: 13 }} disabled={busy}>
            {busy ? <Spinner /> : step === 1 ? 'Continue →' : '🏢 Submit Application'}
          </button>
        </div>
      </form>
      <div className="auth-switch" style={{ marginTop: 12 }}>
        <a onClick={() => setView('login')}>← Back to sign in</a>
      </div>
    </>
  );
}

// ── Forgot Password ───────────────────────────────────────
function ForgotPassword({ setView }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy]   = useState(false);
  const [sent, setSent]   = useState(false);
  const [err, setErr]     = useState('');

  const submit = async e => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      await apiFetch('/api/forgot-password', { method: 'POST', body: JSON.stringify({ email: email.trim().toLowerCase() }) });
      setSent(true);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  if (sent) return <CheckEmailScreen setView={setView} email={email} />;

  return (
    <>
      <div className="auth-card-header">
        <h2 className="auth-card-title">Forgot your password?</h2>
        <p className="auth-card-sub">Enter your email and we'll send a reset link.</p>
      </div>
      <form className="auth-form" onSubmit={submit}>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <div className="input-group">
            <span className="input-icon">✉</span>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
          </div>
        </div>
        {err && <div className="alert alert-danger"><span className="alert-icon">⚠</span>{err}</div>}
        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 13 }} disabled={busy}>
          {busy ? <Spinner /> : 'Send Reset Link'}
        </button>
      </form>
      <div className="auth-switch" style={{ marginTop: 16 }}><a onClick={() => setView('login')}>← Back to sign in</a></div>
    </>
  );
}

function CheckEmailScreen({ setView, email }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 0' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>📬</div>
      <h2 className="auth-card-title">Check your email</h2>
      <p className="auth-card-sub" style={{ marginBottom: 24 }}>
        {email ? `We sent a link to ${email}.` : 'A link has been sent to your email.'} Click it to reset your password.
      </p>
      <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => setView('login')}>← Back to sign in</button>
    </div>
  );
}

// ================================================================
// PENDING MANAGER SCREEN
// ================================================================
function ManagerPendingScreen({ user, onLogout }) {
  const [info, setInfo]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/manager/application-status')
      .then(d => setInfo(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const status = info?.status || user?.status || 'pending';
  const statusColor = { pending: 'var(--warning)', rejected: 'var(--danger)', active: 'var(--success)', suspended: 'var(--text-muted)' };
  const statusIcon  = { pending: '⏳', rejected: '❌', active: '✅', suspended: '⏸' };

  return (
    <div className="pending-screen">
      <div className="pending-card animate-scaleIn">
        <div style={{ width: 80, height: 80, background: status === 'rejected' ? 'var(--danger-bg)' : 'var(--warning-bg)', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 36, margin: '0 auto 24px' }}>
          {statusIcon[status] || '⏳'}
        </div>
        <h1 className="pending-title">
          {status === 'pending' ? 'Application Under Review' : status === 'rejected' ? 'Application Not Approved' : status === 'suspended' ? 'Account Suspended' : 'Account Activated!'}
        </h1>
        <p className="pending-sub">
          {status === 'pending'   ? 'Your hostel manager application has been received. Our team is reviewing your information and will respond within 2–3 business days.' :
           status === 'rejected'  ? 'Your application was not approved at this time. Please review the reason below or contact support.' :
           status === 'suspended' ? 'Your account has been temporarily suspended. Please contact support for assistance.' :
           'Your application was approved. Please sign out and sign back in to access the Manager Dashboard.'}
        </p>

        {info?.applicationInfo && (
          <div className="pending-info-grid">
            {[
              ['Hostel Applied', info.applicationInfo.hostelNameApplied || '—'],
              ['Location',       info.applicationInfo.hostelLocationApplied || '—'],
              ['Status',        <span style={{ color: statusColor[status], fontWeight: 700, textTransform: 'capitalize' }}>{status}</span>],
              info.applicationInfo.rejectionReason && ['Reason', info.applicationInfo.rejectionReason],
              info.applicationInfo.reviewedAt && ['Reviewed', fmtDate(info.applicationInfo.reviewedAt)],
            ].filter(Boolean).map(([l, v]) => (
              <div className="pending-info-row" key={l}><span className="pending-info-label">{l}</span><span className="pending-info-value">{v}</span></div>
            ))}
          </div>
        )}

        {status === 'pending' && (
          <div className="pending-steps">
            {[
              ['✓', 'Application submitted and received',    'var(--success)'],
              ['2', 'Administrator reviews your details',    'var(--brand-indigo)'],
              ['3', 'Optional: physical hostel inspection',  'var(--gray-300)'],
              ['4', 'Account activation and hostel listing', 'var(--gray-300)'],
            ].map(([n, t, c]) => (
              <div className="pending-step" key={t}>
                <div className="pending-step-num" style={{ background: c }}>{n}</div>
                <div className="pending-step-text">{t}</div>
              </div>
            ))}
          </div>
        )}

        <div className="pending-actions">
          <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => window.location.reload()}>🔄 Refresh Status</button>
          <button className="btn btn-outline" style={{ width: '100%', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }} onClick={onLogout}>Sign Out</button>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// DASHBOARD SHELL — Shared sidebar + topbar for all portals
// ================================================================
function DashboardShell({ role, navItems, page, setPage, user, onLogout, badge, children, title, subtitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const shellClass = role === 'admin' ? 'admin-shell' : role === 'manager' ? 'manager-shell' : '';
  return (
    <div className={`dashboard-shell ${shellClass}`}>
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo">🏠</div>
          <div>
            <div className="sidebar-brand-name">Hostel Hub</div>
            <div className="sidebar-brand-sub">{role === 'admin' ? 'Admin Console' : role === 'manager' ? 'Manager Portal' : 'Student Portal'}</div>
          </div>
        </div>
        {navItems.map((section, si) => (
          <div className="sidebar-section" key={si}>
            {section.label && <div className="sidebar-section-label">{section.label}</div>}
            {section.items.map(item => (
              <button key={item.id} className={`sidebar-item ${page === item.id ? 'active' : ''}`}
                onClick={() => { setPage(item.id); setSidebarOpen(false); }}>
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
                {item.badge > 0 && <span className={`sidebar-badge ${item.badgeAmber ? 'sidebar-badge-amber' : ''}`}>{item.badge}</span>}
              </button>
            ))}
          </div>
        ))}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{getInitials(user?.name)}</div>
            <div>
              <div className="sidebar-user-name">{user?.name || 'User'}</div>
              <div className="sidebar-user-role">{role === 'admin' ? 'Administrator' : role === 'manager' ? 'Hostel Manager' : 'Student'}</div>
            </div>
          </div>
          <button className="sidebar-logout" onClick={onLogout}>🚪 Sign Out</button>
        </div>
      </aside>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)}>☰</button>
          <div>
            <div className="topbar-title">{title}</div>
            {subtitle && <div className="topbar-sub">{subtitle}</div>}
          </div>
        </div>
        <div className="topbar-actions">
          {badge > 0 && <div className="topbar-btn"><span>🔔</span><span className="topbar-notif-badge" /></div>}
          <div className="topbar-user">
            <div className="topbar-avatar">{getInitials(user?.name)}</div>
            <div>
              <div className="topbar-username">{user?.name}</div>
              <div className="topbar-role">{role === 'admin' ? 'Admin' : role === 'manager' ? 'Manager' : 'Student'}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="dashboard-main">
        <div className="page-content animate-fadeInUp">{children}</div>
      </div>
    </div>
  );
}

// ================================================================
// STUDENT PORTAL
// ================================================================
function StudentPortal({ user, onLogout, toast }) {
  const [page, setPage] = useState('browse');
  const [portalData, setPortalData] = useState(null);
  const [notifCount, setNotifCount] = useState(0);

  const loadPortal = useCallback(async () => {
    try {
      const d = await apiFetch('/api/student/portal');
      setPortalData(d);
      setNotifCount((d.notifications || []).filter(n => !n.read).length);
    } catch {}
  }, []);

  useEffect(() => { loadPortal(); }, [loadPortal]);

  const navItems = [{
    label: 'Main', items: [
      { id: 'browse', icon: '🔍', label: 'Browse Hostels' },
      { id: 'my-hostel', icon: '🏠', label: 'My Hostel' },
      { id: 'payments', icon: '💳', label: 'Payments & Receipts' },
      { id: 'maintenance', icon: '🔧', label: 'Maintenance' },
      { id: 'notifications', icon: '🔔', label: 'Notifications', badge: notifCount },
    ]
  }, {
    label: 'Account', items: [
      { id: 'profile', icon: '👤', label: 'My Profile' },
    ]
  }];

  const titles = { browse: 'Browse Hostels', 'my-hostel': 'My Hostel', payments: 'Payments & Receipts', maintenance: 'Maintenance', notifications: 'Notifications', profile: 'Profile' };

  return (
    <DashboardShell role="student" navItems={navItems} page={page} setPage={setPage}
      user={user} onLogout={onLogout} badge={notifCount}
      title={titles[page] || 'Student Portal'} subtitle="UMaT Verified Accommodation">
      {page === 'browse'        && <StudentBrowse user={user} toast={toast} onBooked={loadPortal} />}
      {page === 'my-hostel'     && <StudentMyHostel portalData={portalData} />}
      {page === 'payments'      && <StudentPayments portalData={portalData} toast={toast} />}
      {page === 'maintenance'   && <StudentMaintenance portalData={portalData} onRefresh={loadPortal} toast={toast} />}
      {page === 'notifications' && <StudentNotifications portalData={portalData} onRefresh={loadPortal} />}
      {page === 'profile'       && <StudentProfile user={user} toast={toast} />}
    </DashboardShell>
  );
}

function StudentBrowse({ user, toast, onBooked }) {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [locationFilter, setLocationFilter] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [roomTypeFilter, setRoomTypeFilter] = useState('');
  const [locations, setLocations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    apiFetch('/api/locations').then(d => setLocations(d.locations || [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)          params.set('search', search);
      if (verifiedOnly)    params.set('verified', 'true');
      if (locationFilter)  params.set('location', locationFilter);
      if (maxPrice)        params.set('maxPrice', maxPrice);
      if (roomTypeFilter)  params.set('roomType', roomTypeFilter);
      const d = await apiFetch('/api/hostels?' + params);
      setHostels(d.hostels || []);
    } catch (e) { toast(e.message, 'error'); }
    setLoading(false);
  }, [search, verifiedOnly, locationFilter, maxPrice, roomTypeFilter]);

  useEffect(() => { load(); }, [load]);

  const clearAll = () => { setSearch(''); setVerifiedOnly(false); setLocationFilter(''); setMaxPrice(''); setRoomTypeFilter(''); };
  const hasFilters = search || verifiedOnly || locationFilter || maxPrice || roomTypeFilter;

  // Get unique locations from loaded hostels
  const hostelLocations = [...new Set(locations.map(l => l.name).filter(Boolean))].sort();

  return (
    <div>
      {/* Search bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="pub-filter-search" style={{ flex: 1, minWidth: 240 }}>
          <span style={{ color: 'var(--text-muted)' }}>🔍</span>
          <input placeholder="Search by hostel name, area, landmark…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className={`pub-filter-verified ${verifiedOnly ? 'active' : ''}`} onClick={() => setVerifiedOnly(v => !v)}>
          🛡️ Verified Only
        </button>
        <button className={`btn btn-outline btn-sm ${showFilters ? 'btn-primary' : ''}`} style={{ gap: 6 }} onClick={() => setShowFilters(f => !f)}>
          🎛️ Filters {hasFilters && <span className="sidebar-badge" style={{ marginLeft: 4 }}>!</span>}
        </button>
        {hasFilters && <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }} onClick={clearAll}>✕ Clear</button>}
        <span className="pub-filter-count">{hostels.length} hostel{hostels.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Advanced filters panel */}
      {showFilters && (
        <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
          <div className="form-group" style={{ zIndex: 90 }}>
            <label className="form-label">Location</label>
            <IntelligentLocationSearch 
              value={locationFilter} 
              onChange={v => setLocationFilter(v)} 
              placeholder="All locations"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Max Price / Year (GHS)</label>
            <select className="form-input form-select" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}>
              <option value="">Any price</option>
              {[3000,4000,5000,6000,7000,8000,10000].map(p => <option key={p} value={p}>Up to {fmtCurrency(p)}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Room Type</label>
            <select className="form-input form-select" value={roomTypeFilter} onChange={e => setRoomTypeFilter(e.target.value)}>
              <option value="">All room types</option>
              {['1-in-a-room','2-in-a-room','3-in-a-room','4-in-a-room','Self-Contained','Executive Room'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      )}

      {loading ? <div className="page-loading"><Spinner dark /></div> :
        hostels.length === 0 ? (
          <EmptyState icon="🏠" title="No hostels found" sub="Try adjusting your search filters or clearing them."
            action={<button className="btn btn-outline" onClick={clearAll}>Clear All Filters</button>} />
        ) : (
          <div className="pub-hostel-grid">
            {hostels.map(h => <HostelCard key={h.id} hostel={h} onClick={() => setSelected(h)} />)}
          </div>
        )}
      {selected && <StudentHostelDetail hostel={selected} user={user} toast={toast} onClose={() => setSelected(null)} onBooked={() => { setSelected(null); onBooked(); }} />}
    </div>
  );
}

function HostelCard({ hostel, onClick }) {
  const verified = hostel.verification_status === 'verified';
  const photos = hostel.photos || [];
  const img = photos[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80';
  const rt = hostel.room_types || hostel.roomTypes || {};
  const prices = Object.values(rt).map(r => Number(r.price || 0)).filter(Boolean);
  const minPrice = prices.length ? Math.min(...prices) : (hostel.price_per_year || 0);
  return (
    <div className="hostel-card" onClick={onClick}>
      <div className="hostel-card-img">
        <img src={img} alt={hostel.name} loading="lazy" />
        <div className="hostel-card-badges">
          {verified && <span className="hostel-card-badge-verified">🛡️ Verified</span>}
          <span className="hostel-card-badge-rating">⭐ {hostel.rating || 4.5}</span>
        </div>
      </div>
      <div className="hostel-card-body">
        <div className="hostel-card-location">📍 {hostel.location}</div>
        <div className="hostel-card-name">{hostel.name}</div>
        <div className="hostel-card-amenities">
          {(hostel.facilities || []).slice(0, 4).map(f => <span key={f} className="hostel-amenity-pill">{getFacilityIcon(f)} {f}</span>)}
        </div>
        <div className="hostel-card-footer">
          <div>
            <div className="hostel-price-from">From</div>
            <div className="hostel-price-val">{fmtCurrency(minPrice)}</div>
            <div className="hostel-price-per">/year</div>
          </div>
          <div className="hostel-room-chips">
            {Object.keys(rt).slice(0, 3).map(k => <span key={k} className="hostel-room-chip">{k}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentHostelDetail({ hostel, user, toast, onClose, onBooked }) {
  const [activeRoom, setActiveRoom] = useState('');
  const [step, setStep]   = useState(null); // null|'submit'|'done'|'tour'|'tour-done'
  const [payMethods, setPayMethods] = useState([]);
  const [booking, setBooking]   = useState(null);
  const [payment, setPayment]   = useState(null);
  const [subForm, setSubForm]   = useState({ paymentMethodId: '', transactionReference: '', paidAt: '', notes: '' });
  const [tourForm, setTourForm] = useState({ name: user?.name || '', phone: user?.phone || '', preferredDate: '', preferredTime: '10:00 AM', notes: '' });
  const [proofFile, setProofFile] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [busy, setBusy] = useState(false);

  const rt = hostel.room_types || hostel.roomTypes || {};
  const rtKeys = Object.keys(rt);
  useEffect(() => { if (rtKeys.length) setActiveRoom(rtKeys[0]); }, [hostel.id]);
  const verified = hostel.verification_status === 'verified' || hostel.verificationStatus === 'verified';
  const gallery = hostel.gallery || {};
  const photos = hostel.photos || [];
  const activeRoomData = rt[activeRoom] || {};

  // Get room-specific images (show ONLY images for the selected room type)
  const getRoomImages = (roomKey) => {
    const roomData = rt[roomKey] || {};
    // 1. Room-specific gallery (keyed by room name)
    const galleryKey = roomKey.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
    if (gallery[roomKey] && gallery[roomKey].length > 0) return gallery[roomKey];
    if (gallery[galleryKey] && gallery[galleryKey].length > 0) return gallery[galleryKey];
    // 2. gallery array on the room type object
    if (roomData.gallery && roomData.gallery.length > 0) return roomData.gallery;
    // 3. Fall back to general hostel photos
    return photos.length > 0 ? photos : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80'];
  };

  const roomImages = getRoomImages(activeRoom);
  const coverImg = roomImages[0] || photos[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80';

  const initiate = async (roomType, price) => {
    if (!user) { toast('Please sign in to book a hostel room.', 'warning'); return; }
    setBusy(true);
    try {
      const d = await apiFetch('/api/payments/initiate', { method: 'POST', body: JSON.stringify({ hostelId: hostel.id, roomType, amount: price }) });
      setPayMethods(d.paymentMethods || []);
      setBooking(d.booking); setPayment(d.payment); setStep('submit');
      if ((d.paymentMethods || []).length === 0) {
        toast('No payment methods set up. Contact the manager to arrange payment directly.', 'info');
      }
    } catch (e) {
      if (e.message?.includes('already have an active')) toast('You already have an active booking for this hostel.', 'info');
      else if (e.message?.includes('configured') || e.message?.includes('503')) toast('Booking system is being set up. Please try again in a moment.', 'warning');
      else toast(e.message, 'error');
    }
    setBusy(false);
  };

  const submitTour = async () => {
    if (!tourForm.name || !tourForm.phone || !tourForm.preferredDate) {
      toast('Please provide your name, phone and preferred date', 'warning'); return;
    }
    setBusy(true);
    try {
      await apiFetch(`/api/hostels/${hostel.id}/tour-request`, {
        method: 'POST',
        body: JSON.stringify({
          name: tourForm.name, phone: tourForm.phone,
          message: tourForm.notes,
          preferredDate: tourForm.preferredDate,
          preferredTime: tourForm.preferredTime,
          studentId: user?.sub || user?.id
        })
      });
      setStep('tour-done');
      toast('Tour request submitted! The manager will confirm your visit.', 'success');
    } catch (e) { toast(e.message, 'error'); }
    setBusy(false);
  };

  const submitProof = async () => {
    if (!subForm.paymentMethodId || !subForm.transactionReference) { toast('Select payment method and enter transaction reference.', 'warning'); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      const safePayment = payment || {};
      const safeBooking = booking || {};
      fd.append('reference', safePayment.reference || ''); fd.append('hostelId', hostel.id);
      fd.append('roomType', safeBooking.room_type || activeRoom); fd.append('amount', safeBooking.amount || activeRoomData.price || 0);
      fd.append('paymentMethodId', subForm.paymentMethodId);
      fd.append('transactionReference', subForm.transactionReference);
      fd.append('paidAt', subForm.paidAt || new Date().toISOString());
      fd.append('notes', subForm.notes);
      if (proofFile) fd.append('receiptFile', proofFile);
      await apiFetch('/api/payments/submit-proof', { method: 'POST', body: fd });
      setStep('done'); toast('Payment proof submitted! Manager will verify shortly.', 'success'); onBooked();
    } catch (e) { toast(e.message, 'error'); }
    setBusy(false);
  };

  return (
    <div className="detail-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="detail-sheet">
        <div className="detail-handle" />
        <button className="detail-close" onClick={onClose}>✕</button>
        {/* Hero image — shows ONLY images for the selected room type */}
        <div style={{ position: 'relative' }}>
          <div style={{ height: 270, overflow: 'hidden', background: 'var(--gray-200)', cursor: 'pointer' }}
            onClick={() => roomImages.length > 0 && setLightbox({ imgs: roomImages, idx: 0 })}>
            <img src={coverImg} alt={hostel.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} />
            {activeRoom && <div style={{ position:'absolute',bottom:10,left:14,background:'rgba(0,0,0,.65)',color:'#fff',fontSize:12,fontWeight:700,padding:'4px 10px',borderRadius:20 }}>
              📷 {activeRoom} · {roomImages.length} photo{roomImages.length!==1?'s':''}
            </div>}
          </div>
          {roomImages.length > 1 && (
            <div style={{ display:'flex',gap:5,padding:'7px 14px',overflowX:'auto',background:'var(--bg-subtle)' }}>
              {roomImages.slice(0,8).map((img,i)=>(
                <div key={i} onClick={()=>setLightbox({imgs:roomImages,idx:i})} style={{ width:60,height:44,borderRadius:5,overflow:'hidden',flexShrink:0,cursor:'pointer',border:i===0?'2px solid var(--brand-indigo)':'2px solid transparent' }}>
                  <img src={img} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="detail-body">
          {step === 'submit' && (
            <div style={{ background: 'var(--info-bg)', border: '1px solid rgba(59,130,246,.2)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 24 }}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <h3 style={{ fontWeight: 800, margin: 0 }}>💳 Submit Payment Proof</h3>
                <button className="btn btn-outline btn-sm" onClick={()=>setStep(null)}>✕ Cancel</button>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 14 }}>
                Booking <strong>{booking?.room_type}</strong> at <strong>{hostel.name}</strong> for <strong>{fmtCurrency(booking?.amount)}/year</strong>.<br/>
                Pay the manager directly then upload proof of payment below.
              </p>
              {payMethods.length === 0 ? (
                <div className="alert alert-warning"><span className="alert-icon">⚠</span><div>No payment methods configured yet. Contact manager: <strong>{hostel.manager_phone || hostel.manager_email || 'see manager details below'}</strong></div></div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  <div className="form-group"><label className="form-label">Payment Method *</label>
                    <select className="form-input form-select" value={subForm.paymentMethodId} onChange={e => setSubForm(f => ({ ...f, paymentMethodId: e.target.value }))}>
                      <option value="">— Choose payment method —</option>
                      {payMethods.map(m => <option key={m.id} value={m.id}>{m.paymentType} · {m.accountName} · {m.accountNumber}{m.bankName?' ('+m.bankName+')':''}</option>)}
                    </select>
                    {subForm.paymentMethodId && payMethods.find(m=>m.id===subForm.paymentMethodId)?.instructions && (
                      <div style={{marginTop:6,padding:'8px 12px',background:'var(--warning-bg)',borderRadius:'var(--radius-sm)',fontSize:12}}>📋 {payMethods.find(m=>m.id===subForm.paymentMethodId)?.instructions}</div>
                    )}
                  </div>
                  <div className="form-group"><label className="form-label">Transaction / Reference No. *</label><input className="form-input" value={subForm.transactionReference} onChange={e => setSubForm(f => ({ ...f, transactionReference: e.target.value }))} placeholder="MoMo ref, bank transaction ID…" /></div>
                  <div className="grid-2">
                    <div className="form-group"><label className="form-label">Date Paid</label><input className="form-input" type="date" value={subForm.paidAt} onChange={e => setSubForm(f => ({ ...f, paidAt: e.target.value }))} /></div>
                    <div className="form-group"><label className="form-label">Proof Screenshot</label><input type="file" accept="image/*,.pdf" onChange={e => setProofFile(e.target.files[0])} style={{ fontSize: 13, paddingTop: 8 }} /></div>
                  </div>
                  <button className="btn btn-primary" style={{width:'100%',padding:13}} onClick={submitProof} disabled={busy}>{busy ? <Spinner /> : '✓ Submit Payment Proof'}</button>
                </div>
              )}
            </div>
          )}
          {step === 'done' && <div className="alert alert-success" style={{ marginBottom: 20 }}><span className="alert-icon">✅</span><div><strong>Proof submitted!</strong> Manager will verify and send you an official receipt. Check your Payments tab.</div></div>}
          {step === 'tour-done' && <div className="alert" style={{background:'#fff7ed',border:'1px solid rgba(245,158,11,.3)',marginBottom:20}}><span className="alert-icon">📅</span><div><strong>Tour requested!</strong> The manager will contact you at {tourForm.phone} to confirm your visit.</div></div>}
          {step === 'tour' && (
            <div style={{background:'#fff7ed',border:'1px solid rgba(245,158,11,.3)',borderRadius:'var(--radius-lg)',padding:20,marginBottom:24}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <h3 style={{fontWeight:800,margin:0}}>📅 Request a Hostel Tour</h3>
                <button className="btn btn-outline btn-sm" onClick={()=>setStep(null)}>✕</button>
              </div>
              <p style={{fontSize:13,color:'var(--text-sub)',marginBottom:14}}>Request a physical tour of <strong>{hostel.name}</strong>. The manager will confirm a convenient time.</p>
              <div style={{display:'grid',gap:12}}>
                <div className="grid-2">
                  <div className="form-group"><label className="form-label">Your Name *</label><input className="form-input" value={tourForm.name} onChange={e=>setTourForm(f=>({...f,name:e.target.value}))}/></div>
                  <div className="form-group"><label className="form-label">Phone Number *</label><input className="form-input" value={tourForm.phone} onChange={e=>setTourForm(f=>({...f,phone:e.target.value}))} placeholder="+233 24..."/></div>
                </div>
                <div className="grid-2">
                  <div className="form-group"><label className="form-label">Preferred Date *</label><input className="form-input" type="date" value={tourForm.preferredDate} onChange={e=>setTourForm(f=>({...f,preferredDate:e.target.value}))}/></div>
                  <div className="form-group"><label className="form-label">Preferred Time</label>
                    <select className="form-input form-select" value={tourForm.preferredTime} onChange={e=>setTourForm(f=>({...f,preferredTime:e.target.value}))}>
                      <option value="">Any time</option>
                      {['8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM'].map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group"><label className="form-label">Notes (optional)</label><textarea className="form-input form-textarea" rows={2} value={tourForm.notes} onChange={e=>setTourForm(f=>({...f,notes:e.target.value}))} placeholder="e.g. I'm a Level 200 student looking for 2-in-a-room..."/></div>
                <button className="btn btn-amber" style={{width:'100%',padding:13}} onClick={submitTour} disabled={busy}>{busy?<Spinner/>:'📅 Submit Tour Request'}</button>
              </div>
            </div>
          )}
          <div className="detail-top-row">
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                {verified && <span className="verified-shield">🛡️ UMaT Verified</span>}
                <span className="badge badge-info">⭐ {hostel.rating || 4.5}</span>
              </div>
              <h2 className="detail-title">{hostel.name}</h2>
              <div className="detail-location">📍 {hostel.address}, {hostel.location}</div>
            </div>
            <div className="detail-price-box">
              <div className="detail-price-from">From</div>
              <div className="detail-price-big">{fmtCurrency(hostel.price_per_year || 0)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>/year</div>
            </div>
          </div>
          {verified && <div className="alert alert-success" style={{ marginBottom: 18 }}><span className="alert-icon">🛡️</span><div><strong>Hostel Hub Verified</strong> — Reviewed and approved by Hostel Hub administrators. Verified {fmtDate(hostel.verified_at)}.</div></div>}
          {hostel.description && <div className="detail-section"><div className="detail-section-title">About</div><p style={{ fontSize: 14, color: 'var(--text-sub)', lineHeight: 1.7 }}>{hostel.description}</p></div>}
          {rtKeys.length > 0 && (
            <div className="detail-section">
              <div className="detail-section-title">Room Types & Pricing</div>
              <div className="room-tabs">{rtKeys.map(k => <button key={k} className={`room-tab ${activeRoom === k ? 'active' : ''}`} onClick={() => setActiveRoom(k)}>{k}</button>)}</div>
              {activeRoomData && (
                <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: getRoomImages(activeRoom).length > 1 ? 14 : 0 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{activeRoom}</div>
                      {activeRoomData.description && <div style={{fontSize:13,color:'var(--text-muted)',marginBottom:6}}>{activeRoomData.description}</div>}
                      <div style={{ display: 'flex', gap: 14, fontSize: 13, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        {activeRoomData.occupants && <span>👥 {activeRoomData.occupants} person{activeRoomData.occupants>1?'s':''}/room</span>}
                        {activeRoomData.beds && <span>🛏️ {activeRoomData.beds} bed{activeRoomData.beds>1?'s':''}</span>}
                        {activeRoomData.available != null && <span style={{ color: activeRoomData.available>0?'var(--success)':'var(--danger)', fontWeight: 700 }}>{activeRoomData.available>0?`✅ ${activeRoomData.available} available`:'❌ Fully booked'}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--brand-navy)' }}>{fmtCurrency(activeRoomData.price || 0)}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>/year</div>
                      {!step && (
                        <div style={{display:'flex',gap:8,justifyContent:'flex-end',flexWrap:'wrap'}}>
                          <button className="btn btn-outline btn-sm" onClick={()=>{ if(!user) { toast('Please sign in to request a tour.', 'warning'); return; } setStep('tour'); }}>📅 Tour</button>
                          <button className="btn btn-amber btn-sm" disabled={busy} onClick={() => initiate(activeRoom, activeRoomData.price)}>{busy ? <Spinner /> : '🏠 Book Now'}</button>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Room-specific image thumbnails */}
                  {getRoomImages(activeRoom).length > 1 && (
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))',gap:6}}>
                      {getRoomImages(activeRoom).slice(0,6).map((img,i)=>(
                        <div key={i} onClick={()=>setLightbox({imgs:getRoomImages(activeRoom),idx:i})} style={{aspectRatio:'4/3',overflow:'hidden',borderRadius:6,cursor:'pointer'}}>
                          <img src={img} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {(hostel.facilities || []).length > 0 && (
            <div className="detail-section">
              <div className="detail-section-title">Facilities & Amenities</div>
              <div className="detail-amenities">{hostel.facilities.map(f => <div key={f} className="detail-amenity"><div className="detail-amenity-icon">{getFacilityIcon(f)}</div><span>{f}</span></div>)}</div>
            </div>
          )}
          {(hostel.services||[]).length > 0 && (
            <div className="detail-section">
              <div className="detail-section-title">Services</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {hostel.services.map(s=><span key={s} style={{padding:'4px 12px',background:'var(--info-bg)',color:'var(--info)',borderRadius:20,fontSize:13,fontWeight:600}}>{s}</span>)}
              </div>
            </div>
          )}
          {hostel.rules && <div className="detail-section"><div className="detail-section-title">🏠 Rules & Regulations</div><div style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.8, whiteSpace: 'pre-wrap', background: 'var(--bg-subtle)', padding: 16, borderRadius: 'var(--radius-md)' }}>{hostel.rules}</div></div>}
          {hostel.manager_name && (
            <div className="detail-section">
              <div className="detail-section-title">Hostel Manager</div>
              <div className="detail-agent-card">
                <div className="detail-agent-avatar">{getInitials(hostel.manager_name)}</div>
                <div style={{flex:1}}><div style={{fontWeight:700,fontSize:15}}>{hostel.manager_name}</div><div style={{fontSize:13,color:'var(--text-muted)'}}>{hostel.manager_phone}</div></div>
              </div>
            </div>
          )}
          {/* Bottom CTAs */}
          {!step && (
            <div style={{display:'flex',gap:10,paddingTop:16,borderTop:'1px solid var(--border)',flexWrap:'wrap'}}>
              <button className="btn btn-outline" style={{flex:1}} onClick={()=>setStep('tour')}>📅 Request a Tour</button>
              <button className="btn btn-primary" style={{flex:2}} disabled={busy} onClick={()=>rtKeys.length>0?initiate(activeRoom,activeRoomData.price):toast('No rooms available','warning')}>{busy?<Spinner/>:'🏠 Book a Room'}</button>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={()=>setLightbox(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.95)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <button onClick={()=>setLightbox(null)} style={{position:'absolute',top:20,right:20,background:'none',border:'none',color:'#fff',fontSize:32,cursor:'pointer',zIndex:1}}>✕</button>
          <button onClick={e=>{e.stopPropagation();setLightbox(l=>({...l,idx:(l.idx-1+l.imgs.length)%l.imgs.length}));}} style={{position:'absolute',left:16,background:'rgba(255,255,255,.15)',border:'none',color:'#fff',fontSize:32,padding:'10px 18px',borderRadius:8,cursor:'pointer'}}>‹</button>
          <div onClick={e=>e.stopPropagation()} style={{maxWidth:'90vw',maxHeight:'85vh',display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
            <img src={lightbox.imgs[lightbox.idx]} alt="" style={{maxWidth:'90vw',maxHeight:'78vh',objectFit:'contain',borderRadius:8}}/>
            <div style={{color:'rgba(255,255,255,.6)',fontSize:13}}>{lightbox.idx+1} / {lightbox.imgs.length}</div>
            <div style={{display:'flex',gap:5,overflowX:'auto',maxWidth:'90vw'}}>
              {lightbox.imgs.map((img,i)=><img key={i} src={img} alt="" onClick={()=>setLightbox(l=>({...l,idx:i}))} style={{width:52,height:38,objectFit:'cover',borderRadius:4,cursor:'pointer',opacity:i===lightbox.idx?1:0.45,border:i===lightbox.idx?'2px solid white':'2px solid transparent',flexShrink:0}}/>)}
            </div>
          </div>
          <button onClick={e=>{e.stopPropagation();setLightbox(l=>({...l,idx:(l.idx+1)%l.imgs.length}));}} style={{position:'absolute',right:16,background:'rgba(255,255,255,.15)',border:'none',color:'#fff',fontSize:32,padding:'10px 18px',borderRadius:8,cursor:'pointer'}}>›</button>
        </div>
      )}
    </div>
  );
}

function StudentMyHostel({ portalData }) {
  if (portalData === null) return <div className="page-loading"><Spinner dark /></div>;
  const sp = portalData?.student || {};
  if (!sp.hostel_id && !sp.hostelId) return <EmptyState icon="🏠" title="No Hostel Yet" sub="Browse hostels and book a room to get started." />;
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div className="card"><div className="card-header"><span className="card-title">🏠 My Current Hostel</span></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
            {[['Hostel', sp.hostel_name || '—'], ['Room', sp.room_number || '—'], ['Status', <StatusBadge key="s" status="active" />], ['Balance', <span key="b" style={{ color: (sp.balance || 0) > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>{fmtCurrency(sp.balance || 0)}</span>]].map(([l, v]) => (
              <div key={l} style={{ background: 'var(--bg-subtle)', padding: 14, borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {(portalData?.announcements || []).length > 0 && (
        <div className="card"><div className="card-header"><span className="card-title">📢 Announcements</span></div>
          <div className="card-body" style={{ display: 'grid', gap: 12 }}>
            {portalData.announcements.map(a => (
              <div key={a.id} style={{ padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--brand-indigo)' }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{a.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-sub)' }}>{a.message}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{fmtDate(a.created_at)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StudentPayments({ portalData, toast }) {
  const [tab, setTab] = useState('submissions');
  const [receiptModal, setReceiptModal] = useState(null);
  if (portalData === null) return <div className="page-loading"><Spinner dark /></div>;
  const subs = portalData?.paymentSubmissions || [];
  const recs = portalData?.receipts || [];
  return (
    <div>
      <div className="tabs"><button className={`tab-btn ${tab === 'submissions' ? 'active' : ''}`} onClick={() => setTab('submissions')}>Submissions</button><button className={`tab-btn ${tab === 'receipts' ? 'active' : ''}`} onClick={() => setTab('receipts')}>Receipts</button></div>
      {tab === 'submissions' && (subs.length === 0 ? <EmptyState icon="💳" title="No payment submissions" sub="Your submissions will appear here after booking." /> :
        <div className="card"><div className="table-wrap"><table><thead><tr><th>Hostel</th><th>Room</th><th>Amount</th><th>Ref</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>{subs.map(s => <tr key={s.id}><td className="td-primary">{s.hostel_name}</td><td>{s.room_type}</td><td style={{ fontWeight: 700 }}>{fmtCurrency(s.amount)}</td><td style={{ fontFamily: 'monospace', fontSize: 11 }}>{s.transaction_reference}</td><td>{fmtDate(s.created_at)}</td><td><StatusBadge status={s.status} /></td></tr>)}</tbody>
        </table></div></div>)}
      {tab === 'receipts' && (recs.length === 0 ? <EmptyState icon="🧾" title="No receipts yet" sub="Receipts are generated after payment verification." /> :
        <div style={{ display: 'grid', gap: 14 }}>
          {recs.map(r => (
            <div key={r.id} className="card card-hover" onClick={() => setReceiptModal(r)}>
              <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div><div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>🧾 {r.receipt_number}</div><div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{r.hostel_name} • {r.room_type}</div><div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Verified {fmtDate(r.verified_at)}</div></div>
                <div style={{ textAlign: 'right' }}><div style={{ fontSize: 22, fontWeight: 900, color: 'var(--brand-navy)' }}>{fmtCurrency(r.amount_paid)}</div><button className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>View Receipt</button></div>
              </div>
            </div>
          ))}
        </div>)}
      {receiptModal && <ReceiptModal receipt={receiptModal} onClose={() => setReceiptModal(null)} />}
    </div>
  );
}

function ReceiptModal({ receipt, onClose }) {
  return (
    <Modal open={true} onClose={onClose} title="Official Receipt" size="lg"
      footer={<><button className="btn btn-outline btn-sm" onClick={onClose}>Close</button><button className="btn btn-primary btn-sm no-print" onClick={() => window.print()}>🖨️ Print</button></>}>
      <div className="receipt">
        <div className="receipt-header">
          <div><div className="receipt-logo">🏠 Hostel Hub</div><div className="receipt-logo-sub">Official Accommodation Receipt</div></div>
          <div><div className="receipt-title">RECEIPT</div><div className="receipt-num">{receipt.receipt_number}</div><div className="receipt-verified-badge">✓ Verified by Manager</div></div>
        </div>
        <div className="receipt-section">
          <div className="receipt-section-title">Student Information</div>
          <div className="receipt-grid">
            <div className="receipt-field"><label>Name</label><span>{receipt.student_name}</span></div>
            <div className="receipt-field"><label>Hostel</label><span>{receipt.hostel_name}</span></div>
            <div className="receipt-field"><label>Room Type</label><span>{receipt.room_type}</span></div>
            <div className="receipt-field"><label>Academic Year</label><span>{receipt.academic_year || '—'}</span></div>
          </div>
        </div>
        <div className="receipt-section">
          <div className="receipt-section-title">Payment Details</div>
          <div className="receipt-grid">
            <div className="receipt-field"><label>Method</label><span>{receipt.payment_method}</span></div>
            <div className="receipt-field"><label>Transaction Ref</label><span style={{ fontFamily: 'monospace' }}>{receipt.transaction_reference}</span></div>
            <div className="receipt-field"><label>Verified</label><span>{fmtDateTime(receipt.verified_at)}</span></div>
            <div className="receipt-field"><label>Confirmed By</label><span>{receipt.manager_confirmation || 'Manager'}</span></div>
          </div>
        </div>
        <div className="receipt-amount-box"><div><div className="receipt-amount-label">Total Paid</div></div><div className="receipt-amount-value">{fmtCurrency(receipt.amount_paid)}</div></div>
        <div className="receipt-footer">
          <div><div style={{ fontWeight: 700 }}>Hostel Hub</div><div>Verified Student Accommodation</div></div>
          <div className="receipt-signature"><div className="receipt-signature-line" /><div>Authorized Signature</div><div style={{ fontWeight: 700, marginTop: 2 }}>{receipt.manager_confirmation || 'Manager'}</div></div>
        </div>
      </div>
    </Modal>
  );
}

function StudentMaintenance({ portalData, onRefresh, toast }) {
  if (portalData === null) return <div className="page-loading"><Spinner dark /></div>;
  const requests = portalData?.maintenance || [];
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'General', priority: 'Medium' });
  const [busy, setBusy] = useState(false);
  const submit = async e => {
    e.preventDefault(); setBusy(true);
    try { await apiFetch('/api/student/maintenance', { method: 'POST', body: JSON.stringify(form) }); toast('Request submitted!', 'success'); setShowForm(false); setForm({ title: '', description: '', category: 'General', priority: 'Medium' }); onRefresh(); }
    catch (e) { toast(e.message, 'error'); }
    setBusy(false);
  };
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}><button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Request</button></div>
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="card-title">🔧 New Maintenance Request</span><button className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}>✕</button></div>
          <div className="card-body">
            <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
              <div className="form-group"><label className="form-label">Title *</label><input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">Category</label><select className="form-input form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{['General', 'Plumbing', 'Electrical', 'Carpentry', 'Cleaning', 'Security'].map(c => <option key={c}>{c}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Priority</label><select className="form-input form-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>{['Low', 'Medium', 'High', 'Urgent'].map(p => <option key={p}>{p}</option>)}</select></div>
              </div>
              <div className="form-group"><label className="form-label">Description *</label><textarea className="form-input form-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} required /></div>
              <div style={{ display: 'flex', gap: 10 }}><button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? <Spinner /> : 'Submit'}</button></div>
            </form>
          </div>
        </div>
      )}
      {requests.length === 0 ? <EmptyState icon="🔧" title="No requests" sub="Submit a request when something needs fixing." /> :
        <div style={{ display: 'grid', gap: 12 }}>
          {requests.map(r => (
            <div key={r.id} className="card"><div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div><div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{r.title}</div><div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>{r.category} • {r.priority} Priority</div><div style={{ fontSize: 13, color: 'var(--text-sub)' }}>{r.description}</div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{fmtDate(r.created_at)}</div></div>
                <span className={`badge ${r.status === 'Completed' ? 'badge-active' : r.status === 'In Progress' ? 'badge-under-review' : 'badge-pending'}`}>{r.status}</span>
              </div>
            </div></div>
          ))}
        </div>}
    </div>
  );
}

function StudentNotifications({ portalData, onRefresh }) {
  if (portalData === null) return <div className="page-loading"><Spinner dark /></div>;
  const notifs = portalData?.notifications || [];
  const markRead = async id => { try { await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' }); onRefresh(); } catch {} };
  return notifs.length === 0 ? <EmptyState icon="🔔" title="No notifications" sub="You're all caught up!" /> :
    <div style={{ display: 'grid', gap: 10 }}>
      {notifs.map(n => (
        <div key={n.id} className="card" style={{ opacity: n.read ? 0.6 : 1 }}>
          <div className="card-body" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: n.read ? 'var(--bg-subtle)' : 'var(--info-bg)', display: 'grid', placeItems: 'center', fontSize: 18, flexShrink: 0 }}>{n.type === 'payment' ? '💳' : '🔔'}</div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{n.title}</div><div style={{ fontSize: 13, color: 'var(--text-sub)' }}>{n.message}</div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>{fmtDateTime(n.created_at)}</div></div>
            {!n.read && <button className="btn btn-outline btn-sm" onClick={() => markRead(n.id)}>Mark read</button>}
          </div>
        </div>
      ))}
    </div>;
}

function StudentProfile({ user, toast }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    gender: user?.gender || '',
    institution: user?.institution || 'University of Mines and Technology',
    faculty: user?.faculty || '',
    department: user?.department || '',
    level: user?.level || '',
    emergencyContact: user?.emergency_contact || user?.emergencyContact || '',
    studentIndex: user?.student_id || user?.studentIndex || '',
  });
  // Fetch latest profile data on mount to populate fields from the database
  useEffect(() => {
    apiFetch('/api/student/portal').then(d => {
      const st = d?.student || {};
      setForm(f => ({
        ...f,
        gender: st.gender || f.gender,
        institution: st.institution || f.institution,
        faculty: st.faculty || f.faculty,
        department: st.department || f.department,
        level: st.level || f.level,
        emergencyContact: st.emergency_contact || f.emergencyContact,
        studentIndex: st.student_id || f.studentIndex,
      }));
    }).catch(() => {});
  }, []);
  const [busy, setBusy] = useState(false);
  const save = async e => {
    e.preventDefault(); setBusy(true);
    try { await apiFetch('/api/student/profile', { method: 'PUT', body: JSON.stringify(form) }); toast('Profile updated!', 'success'); }
    catch (e) { toast(e.message, 'error'); }
    setBusy(false);
  };
  return (
    <div style={{ maxWidth: 600 }}>
      <div className="card"><div className="card-header"><span className="card-title">👤 My Profile</span></div>
        <div className="card-body">
          <form onSubmit={save} style={{ display: 'grid', gap: 14 }}>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            </div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Student Index</label><input className="form-input" value={form.studentIndex} onChange={e => setForm(f => ({ ...f, studentIndex: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Level</label><select className="form-input form-select" value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}><option value="">Select</option>{['Level 100', 'Level 200', 'Level 300', 'Level 400', 'Postgraduate'].map(l => <option key={l}>{l}</option>)}</select></div>
            </div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Faculty</label><input className="form-input" value={form.faculty} onChange={e => setForm(f => ({ ...f, faculty: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Department</label><input className="form-input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} /></div>
            </div>
            <div className="form-group"><label className="form-label">Emergency Contact</label><input className="form-input" value={form.emergencyContact} onChange={e => setForm(f => ({ ...f, emergencyContact: e.target.value }))} placeholder="+233 24…" /></div>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? <Spinner /> : 'Save Changes'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// MANAGER PORTAL
// ================================================================
function ManagerPortal({ user, onLogout, toast }) {
  const [page, setPage] = useState('dashboard');
  const [finances, setFinances] = useState(null);
  const [queue, setQueue] = useState({ submissions: [], payments: [], bookings: [] });

  const loadAll = useCallback(async () => {
    try {
      const [f, q] = await Promise.all([apiFetch('/api/manager/finances'), apiFetch('/api/payments/verification-queue')]);
      setFinances(f); setQueue(q);
    } catch {}
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const pendingPay  = (queue.submissions || []).filter(s => s.status === 'submitted').length;
  const pendingMaint = (finances?.maintenance || []).filter(m => m.status === 'Pending').length;
  const pendingTours = finances?.summary?.pendingTours || (finances?.tourRequests || []).filter(t => t.status === 'pending').length;

  const navItems = [
    { label: 'Overview', items: [{ id: 'dashboard', icon: '📊', label: 'Dashboard' }, { id: 'residents', icon: '👥', label: 'Residents' }, { id: 'rooms', icon: '🛏️', label: 'Rooms' }] },
    { label: 'Payments', items: [{ id: 'verification', icon: '✅', label: 'Verify Payments', badge: pendingPay, badgeAmber: true }, { id: 'finances', icon: '💰', label: 'Financials' }] },
    { label: 'Operations', items: [{ id: 'tour-requests', icon: '📅', label: 'Tour Requests', badge: pendingTours, badgeAmber: true }, { id: 'maintenance', icon: '🔧', label: 'Maintenance', badge: pendingMaint }, { id: 'announcements', icon: '📢', label: 'Announcements' }, { id: 'payment-methods', icon: '🏦', label: 'Payment Methods' }] },
    { label: 'Account', items: [{ id: 'profile', icon: '👤', label: 'Profile' }] },
  ];

  const titles = { dashboard: 'Dashboard', residents: 'Residents', rooms: 'Rooms', verification: 'Verify Payments', finances: 'Financials', 'tour-requests': 'Tour Requests', maintenance: 'Maintenance', announcements: 'Announcements', 'payment-methods': 'Payment Methods', profile: 'Profile' };

  return (
    <DashboardShell role="manager" navItems={navItems} page={page} setPage={setPage}
      user={user} onLogout={onLogout} badge={pendingPay}
      title={titles[page] || 'Manager Portal'} subtitle={finances?.hostels?.[0]?.name || 'Hostel Manager'}>
      {page === 'dashboard'        && <ManagerDashboard finances={finances} queue={queue} setPage={setPage} />}
      {page === 'residents'        && <ManagerResidents finances={finances} onRefresh={loadAll} toast={toast} />}
      {page === 'rooms'            && <ManagerRooms finances={finances} onRefresh={loadAll} toast={toast} />}
      {page === 'verification'     && <ManagerVerification queue={queue} onRefresh={loadAll} toast={toast} />}
      {page === 'finances'         && <ManagerFinances finances={finances} onRefresh={loadAll} toast={toast} />}
      {page === 'maintenance'      && <ManagerMaintenance finances={finances} onRefresh={loadAll} toast={toast} />}
      {page === 'announcements'    && <ManagerAnnouncements finances={finances} onRefresh={loadAll} toast={toast} />}
      {page === 'tour-requests'   && <ManagerTourRequests finances={finances} onRefresh={loadAll} toast={toast} />}
      {page === 'payment-methods'  && <ManagerPaymentMethods toast={toast} />}
      {page === 'profile'          && <ManagerProfile user={user} toast={toast} />}
    </DashboardShell>
  );
}

function ManagerDashboard({ finances, queue, setPage }) {
  if (!finances) return <div className="page-loading"><Spinner dark /></div>;
  const { summary, totalIncome, totalExpense, netProfit, hostels } = finances;
  const pending = (queue?.submissions || []).filter(s => s.status === 'submitted').length;
  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg,#1a1a3e,#2d2b8a)', borderRadius: 'var(--radius-xl)', padding: '28px 32px', marginBottom: 24, color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, background: 'radial-gradient(circle,rgba(245,158,11,.15),transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,.45)', marginBottom: 8 }}>Manager Portal</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{hostels?.[0]?.name || 'Your Hostel'}</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,.55)' }}>{summary?.totalStudents || 0} residents • {summary?.totalRooms || 0} rooms • {summary?.occupiedRooms || 0} occupied</div>
        </div>
      </div>
      <div className="stats-grid stats-grid-4" style={{ marginBottom: 24 }}>
        <StatCard icon="👥" iconColor="indigo" value={summary?.totalStudents || 0} label="Residents" />
        <StatCard icon="🛏️" iconColor="green"  value={summary?.availableRooms || 0} label="Available Rooms" />
        <StatCard icon="💰" iconColor="amber"  value={fmtCurrency(totalIncome)} label="Total Income" />
        <StatCard icon="✅" iconColor="blue"   value={pending} label="Pending Verifications" />
      </div>
      {pending > 0 && <div className="alert alert-warning" style={{ marginBottom: 20 }}><span className="alert-icon">⚠</span><div><strong>{pending} payment{pending !== 1 ? 's' : ''} awaiting verification.</strong><button className="btn btn-amber btn-sm" style={{ marginTop: 8, display: 'block' }} onClick={() => setPage('verification')}>Review Now</button></div></div>}
      <div className="content-grid">
        <div className="card"><div className="card-header"><span className="card-title">💳 Recent Transactions</span><button className="btn btn-outline btn-sm" onClick={() => setPage('finances')}>View All</button></div>
          {(finances.transactions || []).length === 0 ? <div className="card-body"><EmptyState icon="💸" title="No transactions" /></div> :
            <div className="table-wrap"><table><thead><tr><th>Description</th><th>Type</th><th>Amount</th><th>Date</th></tr></thead>
              <tbody>{(finances.transactions || []).slice(0, 5).map(t => <tr key={t.id}><td className="td-primary">{t.description}</td><td><span className={`badge ${t.type === 'income' ? 'badge-active' : 'badge-rejected'}`}>{t.type}</span></td><td style={{ fontWeight: 700, color: t.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>{t.type === 'income' ? '+' : '-'}{fmtCurrency(t.amount)}</td><td className="td-muted">{fmtDate(t.created_at)}</td></tr>)}</tbody>
            </table></div>}
        </div>
        <div className="card"><div className="card-header"><span className="card-title">📊 Summary</span></div>
          <div className="card-body" style={{ display: 'grid', gap: 10 }}>
            {[['Income', fmtCurrency(totalIncome), 'var(--success)'], ['Expenses', fmtCurrency(totalExpense), 'var(--danger)'], ['Net Profit', fmtCurrency(netProfit), netProfit >= 0 ? 'var(--success)' : 'var(--danger)']].map(([l, v, c]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{l}</span>
                <span style={{ fontWeight: 800, color: c }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ManagerResidents({ finances, onRefresh, toast }) {
  const residents = finances?.students || [];
  const rooms     = finances?.rooms    || [];
  const hostels   = finances?.hostels  || [];
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name:'',email:'',phone:'',studentId:'',gender:'',level:'',hostelId:'',roomId:'',balance:0 });
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const set = k => e => setForm(f => ({...f,[k]:e.target.value}));
  const filtered = residents.filter(s => !search || (s.name||s.user_profiles?.name||'').toLowerCase().includes(search.toLowerCase()));
  const addResident = async e => {
    e.preventDefault(); setBusy(true);
    try { await apiFetch('/api/manager/students',{method:'POST',body:JSON.stringify(form)}); toast('Resident added!','success'); setShowAdd(false); onRefresh(); }
    catch(e){ toast(e.message,'error'); } setBusy(false);
  };
  const remove = async id => {
    if (!confirm('Remove resident?')) return;
    try { await apiFetch(`/api/manager/students/${id}`,{method:'DELETE'}); toast('Removed','info'); onRefresh(); }
    catch(e){ toast(e.message,'error'); }
  };
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,gap:12,flexWrap:'wrap'}}>
        <div className="pub-filter-search" style={{flex:1,maxWidth:320}}><span style={{color:'var(--text-muted)'}}>🔍</span><input placeholder="Search residents…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <button className="btn btn-primary" onClick={()=>setShowAdd(true)}>+ Add Resident</button>
      </div>
      {showAdd && (
        <div className="card" style={{marginBottom:20}}>
          <div className="card-header"><span className="card-title">👤 Add Resident</span><button className="btn btn-outline btn-sm" onClick={()=>setShowAdd(false)}>✕</button></div>
          <div className="card-body">
            <form onSubmit={addResident} style={{display:'grid',gap:12}}>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" value={form.name} onChange={set('name')} required/></div>
                <div className="form-group"><label className="form-label">Email *</label><input className="form-input" type="email" value={form.email} onChange={set('email')} required/></div>
              </div>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">Phone *</label><input className="form-input" value={form.phone} onChange={set('phone')} required/></div>
                <div className="form-group"><label className="form-label">Student ID *</label><input className="form-input" value={form.studentId} onChange={set('studentId')} required/></div>
              </div>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">Hostel</label><select className="form-input form-select" value={form.hostelId} onChange={e=>{const h=hostels.find(x=>x.id===e.target.value);setForm(f=>({...f,hostelId:e.target.value,hostelName:h?.name||''}))}}><option value="">Select hostel</option>{hostels.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Room</label><select className="form-input form-select" value={form.roomId} onChange={e=>{const r=rooms.find(x=>x.id===e.target.value);setForm(f=>({...f,roomId:e.target.value,roomNumber:r?.room_number||''}))}}><option value="">Select room</option>{rooms.map(r=><option key={r.id} value={r.id}>{r.room_number} ({r.available} free)</option>)}</select></div>
              </div>
              <div style={{display:'flex',gap:10}}><button type="button" className="btn btn-outline" onClick={()=>setShowAdd(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={busy}>{busy?<Spinner/>:'Add'}</button></div>
            </form>
          </div>
        </div>
      )}
      {filtered.length===0 ? <EmptyState icon="👥" title="No residents" sub="Add residents manually or they can self-register."/> :
        <div className="card"><div className="table-wrap"><table>
          <thead><tr><th>Name</th><th>Room</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>{filtered.map(s=>{
            const name = s.name || s.user_profiles?.name || '—';
            const email= s.email|| s.user_profiles?.email|| '';
            return (<tr key={s.id}><td><div className="td-primary">{name}</div><div className="td-muted">{email}</div></td><td>{s.room_number||'—'}</td><td><StatusBadge status={(s.status||'active').toLowerCase()}/></td><td><button className="btn btn-outline btn-sm" style={{color:'var(--danger)'}} onClick={()=>remove(s.id)}>Remove</button></td></tr>);
          })}</tbody>
        </table></div></div>}
    </div>
  );
}

function ManagerRooms({ finances, onRefresh, toast }) {
  const rooms   = finances?.rooms   || [];
  const hostels = finances?.hostels || [];
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ hostelId:'', roomNumber:'', blockName:'Main Block', capacity:2 });
  const [busy, setBusy] = useState(false);
  const addRoom = async e => {
    e.preventDefault(); setBusy(true);
    try { await apiFetch('/api/manager/rooms',{method:'POST',body:JSON.stringify(form)}); toast('Room created!','success'); setShowAdd(false); onRefresh(); }
    catch(e){ toast(e.message,'error'); } setBusy(false);
  };
  const updateStatus = async (id,status) => {
    try { await apiFetch(`/api/manager/rooms/${id}`,{method:'PUT',body:JSON.stringify({status})}); onRefresh(); }
    catch(e){ toast(e.message,'error'); }
  };
  const statusColor = {Available:'var(--success)',Occupied:'var(--info)',Maintenance:'var(--warning)'};
  return (
    <div>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:20}}><button className="btn btn-primary" onClick={()=>setShowAdd(true)}>+ Add Room</button></div>
      {showAdd && (
        <div className="card" style={{marginBottom:20}}>
          <div className="card-header"><span className="card-title">🛏️ Add Room</span><button className="btn btn-outline btn-sm" onClick={()=>setShowAdd(false)}>✕</button></div>
          <div className="card-body">
            <form onSubmit={addRoom} style={{display:'grid',gap:12}}>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">Hostel *</label><select className="form-input form-select" value={form.hostelId} onChange={e=>setForm(f=>({...f,hostelId:e.target.value}))} required><option value="">Select</option>{hostels.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Room Number *</label><input className="form-input" value={form.roomNumber} onChange={e=>setForm(f=>({...f,roomNumber:e.target.value}))} placeholder="e.g. A101" required/></div>
              </div>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">Block</label><input className="form-input" value={form.blockName} onChange={e=>setForm(f=>({...f,blockName:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Capacity</label><input className="form-input" type="number" min="1" value={form.capacity} onChange={e=>setForm(f=>({...f,capacity:Number(e.target.value)}))}/></div>
              </div>
              <div style={{display:'flex',gap:10}}><button type="button" className="btn btn-outline" onClick={()=>setShowAdd(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={busy}>{busy?<Spinner/>:'Add Room'}</button></div>
            </form>
          </div>
        </div>
      )}
      {rooms.length===0 ? <EmptyState icon="🛏️" title="No rooms yet" sub="Add rooms to manage occupancy."/> :
        <div className="card"><div className="table-wrap"><table>
          <thead><tr><th>Room</th><th>Block</th><th>Capacity</th><th>Occupied</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>{rooms.map(r=>(
            <tr key={r.id}>
              <td className="td-primary">{r.room_number}</td><td className="td-muted">{r.block_name}</td><td>{r.capacity}</td><td>{r.occupied}</td>
              <td><span className="badge" style={{background:`${statusColor[r.status]}22`,color:statusColor[r.status],border:`1px solid ${statusColor[r.status]}44`}}>{r.status}</span></td>
              <td><select className="form-input form-select" style={{fontSize:12,padding:'4px 8px',width:'auto'}} value={r.status} onChange={e=>updateStatus(r.id,e.target.value)}>{['Available','Occupied','Maintenance'].map(s=><option key={s}>{s}</option>)}</select></td>
            </tr>
          ))}</tbody>
        </table></div></div>}
    </div>
  );
}

function ManagerVerification({ queue, onRefresh, toast }) {
  const all = queue?.submissions || [];
  const pending = all.filter(s=>s.status==='submitted');
  const [busy, setBusy] = useState(null);
  const [noteModal, setNoteModal] = useState(null);
  const [note, setNote] = useState('');
  const act = async (id,action) => {
    setBusy(id);
    try { await apiFetch(`/api/payments/verification-queue/${id}`,{method:'PATCH',body:JSON.stringify({action,notes:note})}); toast(`Payment ${action}d!`,'success'); setNoteModal(null); setNote(''); onRefresh(); }
    catch(e){ toast(e.message,'error'); } setBusy(null);
  };
  return (
    <div>
      {pending.length>0 && <div className="alert alert-warning" style={{marginBottom:20}}><span className="alert-icon">⏳</span><strong>{pending.length} payment{pending.length!==1?'s':''} awaiting verification.</strong></div>}
      {all.length===0 ? <EmptyState icon="💳" title="No submissions" sub="Payment proofs will appear here."/> :
        <div className="card"><div className="table-wrap"><table>
          <thead><tr><th>Student</th><th>Hostel</th><th>Amount</th><th>Ref</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{all.map(s=>(
            <tr key={s.id}>
              <td><div className="td-primary">{s.student_name}</div><div className="td-muted">{s.student_email}</div></td>
              <td className="td-muted">{s.hostel_name}</td>
              <td style={{fontWeight:700}}>{fmtCurrency(s.amount)}</td>
              <td style={{fontFamily:'monospace',fontSize:11}}>{s.transaction_reference}</td>
              <td className="td-muted">{fmtDate(s.created_at)}</td>
              <td><StatusBadge status={s.status}/></td>
              <td>
                {s.status==='submitted' && <div style={{display:'flex',gap:6}}>
                  <button className="btn btn-success btn-sm" disabled={!!busy} onClick={()=>act(s.id,'approve')}>{busy===s.id?<Spinner/>:'✓ Approve'}</button>
                  <button className="btn btn-outline btn-sm" style={{color:'var(--warning)',borderColor:'var(--warning)'}} disabled={!!busy} onClick={()=>{setNoteModal({id:s.id,action:'request_more_info'});setNote('');}}>More Info</button>
                  <button className="btn btn-danger btn-sm" disabled={!!busy} onClick={()=>{setNoteModal({id:s.id,action:'reject'});setNote('');}}>✕</button>
                </div>}
                {s.receipt_file_url && <a href={s.receipt_file_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{marginTop:4}}>View Proof</a>}
              </td>
            </tr>
          ))}</tbody>
        </table></div></div>}
      {noteModal && (
        <Modal open={true} onClose={()=>setNoteModal(null)} title={noteModal.action==='reject'?'Reject Payment':'Request More Info'} size="sm"
          footer={<><button className="btn btn-outline btn-sm" onClick={()=>setNoteModal(null)}>Cancel</button><button className={`btn btn-sm ${noteModal.action==='reject'?'btn-danger':'btn-primary'}`} disabled={!!busy} onClick={()=>act(noteModal.id,noteModal.action)}>{busy?<Spinner/>:noteModal.action==='reject'?'Reject':'Send'}</button></>}>
          <div className="form-group"><label className="form-label">Notes</label><textarea className="form-input form-textarea" value={note} onChange={e=>setNote(e.target.value)} rows={4}/></div>
        </Modal>
      )}
    </div>
  );
}

function ManagerFinances({ finances, onRefresh, toast }) {
  const txs = finances?.transactions || [];
  const [tab, setTab] = useState('all');
  const [showExp, setShowExp] = useState(false);
  const [form, setForm] = useState({ amount:'', category:'', description:'', hostelId:'' });
  const [busy, setBusy] = useState(false);
  const filtered = tab==='all' ? txs : txs.filter(t=>t.type===tab);
  const totalIncome  = txs.filter(t=>t.type==='income').reduce((s,t)=>s+Number(t.amount),0);
  const totalExpense = txs.filter(t=>t.type==='expense').reduce((s,t)=>s+Number(t.amount),0);
  const logExpense = async e => {
    e.preventDefault(); setBusy(true);
    try { await apiFetch('/api/manager/expenses',{method:'POST',body:JSON.stringify({...form,hostelId:form.hostelId||(finances?.hostels?.[0]?.id||'')})}); toast('Expense logged!','success'); setShowExp(false); onRefresh(); }
    catch(e){ toast(e.message,'error'); } setBusy(false);
  };
  return (
    <div>
      <div className="stats-grid stats-grid-3" style={{marginBottom:20}}>
        <StatCard icon="💚" iconColor="green"  value={fmtCurrency(totalIncome)}  label="Total Income"/>
        <StatCard icon="🔴" iconColor="red"    value={fmtCurrency(totalExpense)} label="Total Expenses"/>
        <StatCard icon="📊" iconColor="indigo" value={fmtCurrency(totalIncome-totalExpense)} label="Net Profit"/>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:10}}>
        <div className="tabs" style={{marginBottom:0}}>
          {[['all','All'],['income','Income'],['expense','Expenses']].map(([id,l])=><button key={id} className={`tab-btn ${tab===id?'active':''}`} onClick={()=>setTab(id)}>{l}</button>)}
        </div>
        <button className="btn btn-primary btn-sm" onClick={()=>setShowExp(true)}>+ Log Expense</button>
      </div>
      {showExp && (
        <div className="card" style={{marginBottom:16}}>
          <div className="card-header"><span className="card-title">Log Expense</span><button className="btn btn-outline btn-sm" onClick={()=>setShowExp(false)}>✕</button></div>
          <div className="card-body">
            <form onSubmit={logExpense} style={{display:'grid',gap:12}}>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">Amount (GHS) *</label><input className="form-input" type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} required/></div>
                <div className="form-group"><label className="form-label">Category *</label><select className="form-input form-select" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} required><option value="">Select</option>{['Electricity','Water','Maintenance','Cleaning','Security','Internet','Repairs','Supplies','Other'].map(c=><option key={c}>{c}</option>)}</select></div>
              </div>
              <div className="form-group"><label className="form-label">Description *</label><input className="form-input" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} required/></div>
              <div style={{display:'flex',gap:10}}><button type="button" className="btn btn-outline" onClick={()=>setShowExp(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={busy}>{busy?<Spinner/>:'Log'}</button></div>
            </form>
          </div>
        </div>
      )}
      <div className="card"><div className="table-wrap">
        {filtered.length===0 ? <div style={{padding:40,textAlign:'center',color:'var(--text-muted)'}}>No transactions</div> :
          <table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th>Amount</th></tr></thead>
          <tbody>{filtered.map(t=><tr key={t.id}><td className="td-muted">{fmtDate(t.created_at)}</td><td className="td-primary">{t.description}</td><td className="td-muted">{t.category}</td><td><span className={`badge ${t.type==='income'?'badge-active':'badge-rejected'}`}>{t.type}</span></td><td style={{fontWeight:700,color:t.type==='income'?'var(--success)':'var(--danger)'}}>{t.type==='income'?'+':'-'}{fmtCurrency(t.amount)}</td></tr>)}</tbody>
          </table>}
      </div></div>
    </div>
  );
}

function ManagerTourRequests({ finances, onRefresh, toast }) {
  const tours = finances?.tourRequests || [];
  const [busy, setBusy] = useState(null);
  const [noteModal, setNoteModal] = useState(null);
  const [note, setNote] = useState('');

  const act = async (id, status) => {
    setBusy(id);
    try {
      await apiFetch(`/api/manager/tour-requests/${id}`, { method: 'PATCH', body: JSON.stringify({ status, notes: note }) });
      toast(`Tour request ${status}!`, 'success');
      setNoteModal(null); setNote('');
      onRefresh();
    } catch (e) { toast(e.message, 'error'); }
    setBusy(null);
  };

  const statusColor = { pending: 'var(--warning)', confirmed: 'var(--success)', cancelled: 'var(--danger)', completed: 'var(--info)' };

  if (!finances) return <div className="page-loading"><Spinner dark /></div>;
  return (
    <div>
      {tours.filter(t => t.status === 'pending').length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <span className="alert-icon">📅</span>
          <strong>{tours.filter(t => t.status === 'pending').length} tour request{tours.filter(t => t.status === 'pending').length !== 1 ? 's' : ''} awaiting confirmation.</strong>
        </div>
      )}
      {tours.length === 0 ? <EmptyState icon="📅" title="No tour requests" sub="Students who request physical tours will appear here." /> :
        <div className="card"><div className="table-wrap"><table>
          <thead><tr><th>Student</th><th>Hostel</th><th>Date</th><th>Time</th><th>Message</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{tours.map(t => (
            <tr key={t.id}>
              <td><div className="td-primary">{t.name}</div><div className="td-muted">{t.phone}</div></td>
              <td className="td-muted">{t.hostel_name}</td>
              <td className="td-muted">{t.preferred_date ? fmtDate(t.preferred_date) : '—'}</td>
              <td className="td-muted">{t.preferred_time || '—'}</td>
              <td style={{ maxWidth: 200, fontSize: 12, color: 'var(--text-sub)' }}>{t.message || t.special_notes || '—'}</td>
              <td><span className="badge" style={{ background: `${statusColor[t.status] || 'var(--gray-400)'}22`, color: statusColor[t.status] || 'var(--gray-600)', border: `1px solid ${statusColor[t.status] || 'var(--gray-400)'}44`, textTransform: 'capitalize' }}>{t.status}</span></td>
              <td>
                {t.status === 'pending' && <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-success btn-sm" disabled={!!busy} onClick={() => act(t.id, 'confirmed')}>{busy === t.id ? <Spinner /> : '✓ Confirm'}</button>
                  <button className="btn btn-danger btn-sm" disabled={!!busy} onClick={() => { setNoteModal({ id: t.id, status: 'cancelled' }); setNote(''); }}>✕</button>
                </div>}
                {t.status === 'confirmed' && <button className="btn btn-outline btn-sm" disabled={!!busy} onClick={() => act(t.id, 'completed')}>Mark Done</button>}
              </td>
            </tr>
          ))}</tbody>
        </table></div></div>}
      {noteModal && (
        <Modal open={true} onClose={() => setNoteModal(null)} title="Cancel Tour Request" size="sm"
          footer={<><button className="btn btn-outline btn-sm" onClick={() => setNoteModal(null)}>Back</button><button className="btn btn-danger btn-sm" disabled={!!busy} onClick={() => act(noteModal.id, noteModal.status)}>{busy ? <Spinner /> : 'Cancel Tour'}</button></>}>
          <div className="form-group"><label className="form-label">Reason (optional)</label><textarea className="form-input form-textarea" value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="e.g. Hostel fully occupied for that date…" /></div>
        </Modal>
      )}
    </div>
  );
}

function ManagerMaintenance({ finances, onRefresh, toast }) {
  const requests = finances?.maintenance || [];
  const update = async (id,status) => {
    try { await apiFetch(`/api/manager/maintenance/${id}`,{method:'PUT',body:JSON.stringify({status})}); toast('Updated!','success'); onRefresh(); }
    catch(e){ toast(e.message,'error'); }
  };
  return requests.length===0 ? <EmptyState icon="🔧" title="No maintenance requests" sub="Resident requests appear here."/> :
    <div style={{display:'grid',gap:12}}>
      {requests.map(r=>(
        <div key={r.id} className="card"><div className="card-body">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,flexWrap:'wrap'}}>
            <div style={{flex:1}}><div style={{fontWeight:800,fontSize:15,marginBottom:4}}>{r.title}</div><div style={{fontSize:12,color:'var(--text-muted)',marginBottom:6}}>From: {r.student_name} • {r.category} • {r.priority} Priority</div><div style={{fontSize:13,color:'var(--text-sub)'}}>{r.description}</div><div style={{fontSize:11,color:'var(--text-muted)',marginTop:6}}>{fmtDate(r.created_at)}</div></div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',flexShrink:0}}>
              <span className={`badge ${r.status==='Completed'?'badge-active':r.status==='In Progress'?'badge-under-review':'badge-pending'}`}>{r.status}</span>
              {r.status!=='Completed' && <button className="btn btn-success btn-sm" onClick={()=>update(r.id,r.status==='Pending'?'In Progress':'Completed')}>{r.status==='Pending'?'Start':'Complete'}</button>}
            </div>
          </div>
        </div></div>
      ))}
    </div>;
}

function ManagerAnnouncements({ finances, onRefresh, toast }) {
  const anns    = finances?.announcements || [];
  const hostels = finances?.hostels       || [];
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:'', message:'', type:'General', audience:'All', hostelId:'' });
  const [busy, setBusy] = useState(false);
  const submit = async e => {
    e.preventDefault(); setBusy(true);
    try { await apiFetch('/api/manager/announcements',{method:'POST',body:JSON.stringify({...form,hostelId:form.hostelId||(hostels[0]?.id||'')})}); toast('Announcement sent!','success'); setShowForm(false); onRefresh(); }
    catch(e){ toast(e.message,'error'); } setBusy(false);
  };
  return (
    <div>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:20}}><button className="btn btn-primary" onClick={()=>setShowForm(true)}>+ New Announcement</button></div>
      {showForm && (
        <div className="card" style={{marginBottom:20}}>
          <div className="card-header"><span className="card-title">📢 Announcement</span><button className="btn btn-outline btn-sm" onClick={()=>setShowForm(false)}>✕</button></div>
          <div className="card-body">
            <form onSubmit={submit} style={{display:'grid',gap:12}}>
              <div className="form-group"><label className="form-label">Title *</label><input className="form-input" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required/></div>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">Type</label><select className="form-input form-select" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>{['General','Urgent','Reminder','Event'].map(t=><option key={t}>{t}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Audience</label><select className="form-input form-select" value={form.audience} onChange={e=>setForm(f=>({...f,audience:e.target.value}))}>{['All','Residents'].map(a=><option key={a}>{a}</option>)}</select></div>
              </div>
              <div className="form-group"><label className="form-label">Message *</label><textarea className="form-input form-textarea" value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} rows={4} required/></div>
              <div style={{display:'flex',gap:10}}><button type="button" className="btn btn-outline" onClick={()=>setShowForm(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={busy}>{busy?<Spinner/>:'Send'}</button></div>
            </form>
          </div>
        </div>
      )}
      {anns.length===0 ? <EmptyState icon="📢" title="No announcements" sub="Send announcements to notify residents."/> :
        <div style={{display:'grid',gap:12}}>
          {anns.map(a=><div key={a.id} className="card"><div className="card-body"><div style={{fontWeight:800,fontSize:15,marginBottom:4}}>{a.title}</div><div style={{fontSize:12,color:'var(--text-muted)',marginBottom:8}}>{a.type} • {a.audience} • {fmtDate(a.created_at)}</div><div style={{fontSize:13,color:'var(--text-sub)'}}>{a.message}</div></div></div>)}
        </div>}
    </div>
  );
}

function ManagerPaymentMethods({ toast }) {
  const [methods, setMethods] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ hostelId:'', paymentType:'Mobile Money', accountName:'', accountNumber:'', bankName:'', instructions:'' });
  const [busy, setBusy] = useState(false);
  const load = async () => {
    try {
      const [m,f] = await Promise.all([apiFetch('/api/manager/payment-methods'),apiFetch('/api/manager/finances')]);
      setMethods(m.paymentMethods||[]); setHostels(f.hostels||[]);
    } catch {}
  };
  useEffect(()=>{ load(); },[]);
  const add = async e => {
    e.preventDefault(); setBusy(true);
    try { await apiFetch('/api/manager/payment-methods',{method:'POST',body:JSON.stringify(form)}); toast('Method added!','success'); setShowForm(false); load(); }
    catch(e){ toast(e.message,'error'); } setBusy(false);
  };
  const del = async id => {
    if (!confirm('Remove?')) return;
    try { await apiFetch(`/api/manager/payment-methods/${id}`,{method:'DELETE'}); toast('Removed','info'); load(); }
    catch(e){ toast(e.message,'error'); }
  };
  return (
    <div>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:20}}><button className="btn btn-primary" onClick={()=>setShowForm(true)}>+ Add Method</button></div>
      {showForm && (
        <div className="card" style={{marginBottom:20}}>
          <div className="card-header"><span className="card-title">🏦 Payment Method</span><button className="btn btn-outline btn-sm" onClick={()=>setShowForm(false)}>✕</button></div>
          <div className="card-body">
            <form onSubmit={add} style={{display:'grid',gap:12}}>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">Hostel *</label><select className="form-input form-select" value={form.hostelId} onChange={e=>setForm(f=>({...f,hostelId:e.target.value}))} required><option value="">Select</option>{hostels.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Type *</label><select className="form-input form-select" value={form.paymentType} onChange={e=>setForm(f=>({...f,paymentType:e.target.value}))}>{['Mobile Money','Bank Transfer','GCB','Ecobank','Other'].map(t=><option key={t}>{t}</option>)}</select></div>
              </div>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">Account Name *</label><input className="form-input" value={form.accountName} onChange={e=>setForm(f=>({...f,accountName:e.target.value}))} required/></div>
                <div className="form-group"><label className="form-label">Account / MoMo *</label><input className="form-input" value={form.accountNumber} onChange={e=>setForm(f=>({...f,accountNumber:e.target.value}))} required/></div>
              </div>
              <div className="form-group"><label className="form-label">Instructions</label><textarea className="form-input form-textarea" value={form.instructions} onChange={e=>setForm(f=>({...f,instructions:e.target.value}))} rows={3}/></div>
              <div style={{display:'flex',gap:10}}><button type="button" className="btn btn-outline" onClick={()=>setShowForm(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={busy}>{busy?<Spinner/>:'Add'}</button></div>
            </form>
          </div>
        </div>
      )}
      {methods.length===0 ? <EmptyState icon="🏦" title="No payment methods" sub="Add methods so students know how to pay."/> :
        <div style={{display:'grid',gap:12}}>
          {methods.map(m=><div key={m.id} className="card"><div className="card-body" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,flexWrap:'wrap'}}><div><div style={{fontWeight:800,fontSize:15,marginBottom:4}}>{m.payment_type}</div><div style={{fontSize:14,color:'var(--text-sub)'}}>{m.account_name} • {m.account_number}</div>{m.instructions&&<div style={{fontSize:12,color:'var(--text-muted)',marginTop:6,fontStyle:'italic'}}>{m.instructions}</div>}</div><button className="btn btn-outline btn-sm" style={{color:'var(--danger)'}} onClick={()=>del(m.id)}>Remove</button></div></div>)}
        </div>}
    </div>
  );
}

function ManagerProfile({ user, toast }) {
  const [form, setForm] = useState({ name:user?.name||'', email:user?.email||'', phone:user?.phone||'', password:'' });
  const [busy, setBusy] = useState(false);
  const save = async e => {
    e.preventDefault(); setBusy(true);
    try { await apiFetch('/api/manager/profile',{method:'PUT',body:JSON.stringify(form)}); toast('Saved!','success'); }
    catch(e){ toast(e.message,'error'); } setBusy(false);
  };
  return (
    <div style={{maxWidth:560}}>
      <div className="card"><div className="card-header"><span className="card-title">👤 Manager Profile</span></div>
        <div className="card-body">
          <form onSubmit={save} style={{display:'grid',gap:14}}>
            <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/></div>
            <div className="form-group"><label className="form-label">New Password <span style={{color:'var(--text-muted)',fontSize:12}}>(leave blank to keep current)</span></label><input className="form-input" type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="Enter new password to change"/></div>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy?<Spinner/>:'Save Changes'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// ADMIN PORTAL
// ================================================================
function AdminPortal({ user, onLogout, toast }) {
  const [page, setPage] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const loadStats = useCallback(async () => {
    try { const d = await apiFetch('/api/admin/stats'); setStats(d.stats); } catch {}
  }, []);
  useEffect(() => { loadStats(); }, [loadStats]);
  const pendingBadge = (stats?.pendingManagers || 0) + (stats?.pendingHostels || 0);
  const navItems = [
    { label:'Overview', items:[{id:'dashboard',icon:'📊',label:'Dashboard'},{id:'analytics',icon:'📈',label:'Analytics & Charts'},{id:'audit',icon:'📋',label:'Audit Trail'}] },
    { label:'Hostels', items:[{id:'hostels',icon:'🏠',label:'All Hostels'},{id:'verification',icon:'🛡️',label:'Verification Queue',badge:stats?.pendingHostels||0,badgeAmber:true}] },
    { label:'Users & Admin', items:[{id:'applications',icon:'📝',label:'Manager Applications',badge:stats?.pendingManagers||0,badgeAmber:true},{id:'users',icon:'👥',label:'User Management'},{id:'co_admins',icon:'🔑',label:'Co-Administrators'}] },
    { label:'System & Log', items:[{id:'locations',icon:'📍',label:'Locations'},{id:'demo_data',icon:'🧪',label:'Demo Data Tools'},{id:'announcements',icon:'📢',label:'Announcements'},{id:'payments',icon:'💳',label:'Payments Overview'},{id:'error_logs',icon:'⚠️',label:'Error Monitor'}] },
  ];
  const titles = { dashboard:'Dashboard', analytics:'Rich Analytics & Charts', audit:'Audit Log', hostels:'Hostel Management', verification:'Verification Queue', applications:'Manager Applications', users:'User Management', co_admins:'Co-Administrator Management', locations:'Intelligent Locations', demo_data:'Demo Data Lifecycle & Controls', announcements:'Announcements', payments:'Payments Overview', error_logs:'System Error Monitoring' };
  return (
    <DashboardShell role="admin" navItems={navItems} page={page} setPage={setPage}
      user={user} onLogout={onLogout} badge={pendingBadge}
      title={titles[page]||'Admin Console'} subtitle="Hostel Hub Administration">
      {page==='dashboard'     && <AdminDashboard stats={stats} setPage={setPage}/>}
      {page==='analytics'     && <AdminAnalytics toast={toast}/>}
      {page==='audit'         && <AdminAuditLog toast={toast}/>}
      {page==='hostels'       && <AdminHostels toast={toast} onRefresh={loadStats}/>}
      {page==='verification'  && <AdminVerification toast={toast} onRefresh={loadStats}/>}
      {page==='applications'  && <AdminApplications toast={toast} onRefresh={loadStats}/>}
      {page==='users'         && <AdminUsers toast={toast}/>}
      {page==='co_admins'     && <AdminCoAdmins toast={toast}/>}
      {page==='locations'     && <AdminLocations toast={toast}/>}
      {page==='demo_data'     && <AdminDemoData toast={toast}/>}
      {page==='announcements' && <AdminAnnouncements toast={toast}/>}
      {page==='payments'      && <AdminPayments toast={toast}/>}
      {page==='error_logs'    && <AdminErrorLogs toast={toast}/>}
    </DashboardShell>
  );
}

function AdminDashboard({ stats, setPage }) {
  if (!stats) return <div className="page-loading"><Spinner dark/></div>;
  const cards = [
    {icon:'🏠',color:'indigo',value:stats.totalHostels,  label:'Total Hostels'},
    {icon:'👥',color:'green', value:stats.totalStudents,  label:'Students'},
    {icon:'🏢',color:'amber', value:stats.totalManagers,  label:'Managers'},
    {icon:'🛡️',color:'blue',  value:stats.verifiedHostels,label:'Verified Hostels'},
    {icon:'⏳',color:'red',   value:stats.pendingManagers,label:'Pending Applications'},
    {icon:'📋',color:'purple',value:stats.activeBookings, label:'Active Bookings'},
    {icon:'💳',color:'amber', value:stats.pendingPayments,label:'Payment Queue'},
    {icon:'🔧',color:'red',   value:stats.maintenanceOpen,label:'Open Maintenance'},
  ];
  return (
    <div>
      <div className="admin-hero">
        <div className="admin-hero-text">
          <div className="admin-hero-label">Administrator</div>
          <h2 className="admin-hero-title">Platform Overview</h2>
          <div className="admin-hero-sub">Manage hostels, users, verifications, and platform settings.</div>
        </div>
        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
          {stats.pendingManagers>0 && <button className="btn btn-amber" onClick={()=>setPage('applications')}>⚠️ {stats.pendingManagers} Pending Application{stats.pendingManagers!==1?'s':''}</button>}
          {stats.pendingHostels>0  && <button className="btn btn-ghost"  onClick={()=>setPage('verification')}>🛡️ {stats.pendingHostels} Hostel{stats.pendingHostels!==1?'s':''} to Verify</button>}
        </div>
      </div>
      <div className="stats-grid stats-grid-4" style={{marginBottom:24}}>
        {cards.map((c,i)=><StatCard key={i} icon={c.icon} iconColor={c.color} value={c.value} label={c.label}/>)}
      </div>
      {stats.pendingManagers>0 && <div className="alert alert-warning" style={{marginBottom:12}}><span className="alert-icon">👤</span><div><strong>{stats.pendingManagers} manager application{stats.pendingManagers!==1?'s':''} pending.</strong><button className="btn btn-amber btn-sm" style={{marginTop:8,display:'block'}} onClick={()=>setPage('applications')}>Review</button></div></div>}
      {stats.pendingHostels>0  && <div className="alert alert-info"    style={{marginBottom:12}}><span className="alert-icon">🏠</span><div><strong>{stats.pendingHostels} hostel{stats.pendingHostels!==1?'s':''} awaiting verification.</strong><button className="btn btn-primary btn-sm" style={{marginTop:8,display:'block'}} onClick={()=>setPage('verification')}>Review</button></div></div>}
    </div>
  );
}

function AdminHostels({ toast, onRefresh }) {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [managers, setManagers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [manageModal, setManageModal] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [assignMgrId, setAssignMgrId] = useState('');
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState(false);
  const load = async () => {
    setLoading(true);
    try {
      const [h,m] = await Promise.all([apiFetch('/api/admin/hostels'), apiFetch('/api/admin/active-managers')]);
      setHostels(h.hostels||[]); setManagers(m.managers||[]);
    } catch(e){ toast(e.message,'error'); }
    setLoading(false);
  };
  useEffect(()=>{ load(); },[]);
  const del = async id => {
    if (!confirm('Delete hostel? This cannot be undone.')) return;
    try { await apiFetch(`/api/admin/hostels/${id}`,{method:'DELETE'}); toast('Deleted','info'); load(); onRefresh(); }
    catch(e){ toast(e.message,'error'); }
  };
  const assignManager = async () => {
    if (!assignMgrId){ toast('Select a manager','warning'); return; }
    setBusy(true);
    try { await apiFetch(`/api/admin/hostels/${assignModal.id}/assign-manager`,{method:'POST',body:JSON.stringify({managerId:assignMgrId})}); toast('Assigned!','success'); setAssignModal(null); setAssignMgrId(''); load(); }
    catch(e){ toast(e.message,'error'); } setBusy(false);
  };
  const filtered = hostels.filter(h => !filter || (h.name||'').toLowerCase().includes(filter.toLowerCase()) || (h.location||'').toLowerCase().includes(filter.toLowerCase()));
  const verBadge = { verified:'badge-verified', pending:'badge-pending', under_review:'badge-under-review', rejected:'badge-rejected', suspended:'badge-suspended' };
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,gap:12,flexWrap:'wrap'}}>
        <div className="pub-filter-search" style={{flex:1,maxWidth:320}}><span style={{color:'var(--text-muted)'}}>🔍</span><input placeholder="Search hostels…" value={filter} onChange={e=>setFilter(e.target.value)}/></div>
        <button className="btn btn-primary" onClick={()=>setShowCreate(true)}>+ Enlist New Hostel</button>
      </div>
      {showCreate && <div style={{marginBottom:24}}><EnlistHostelWizard toast={toast} managers={managers} onDone={()=>{setShowCreate(false);load();onRefresh();}} onCancel={()=>setShowCreate(false)}/></div>}
      {loading ? <div className="page-loading"><Spinner dark/></div> : filtered.length===0 ? <EmptyState icon="🏠" title="No hostels"/> :
        <div className="card"><div className="table-wrap"><table>
          <thead><tr><th>Hostel</th><th>Location</th><th>Manager</th><th>Verification</th><th>Published</th><th>Actions</th></tr></thead>
          <tbody>{filtered.map(h=>(
            <tr key={h.id}>
              <td><div className="td-primary">{h.name}</div><div className="td-muted">{h.address}</div></td>
              <td className="td-muted">{h.location}</td>
              <td>{h.manager_name?<div><div style={{fontWeight:600,fontSize:13}}>{h.manager_name}</div><div className="td-muted">{h.manager_email}</div></div>:<span className="td-muted">Unassigned</span>}</td>
              <td><span className={`badge ${verBadge[h.verification_status]||'badge-pending'}`}>{(h.verification_status||'pending').replace('_',' ')}</span></td>
              <td><span className={`badge ${h.is_published?'badge-active':'badge-suspended'}`}>{h.is_published?'Live':'Hidden'}</span></td>
              <td><div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                <button className="btn btn-outline btn-sm" onClick={()=>setManageModal(h)}>Manage</button>
                <button className="btn btn-outline btn-sm" onClick={()=>{setAssignModal(h);setAssignMgrId(h.manager_id||'');}}>Assign Mgr</button>
                <button className="btn btn-outline btn-sm" style={{color:'var(--danger)'}} onClick={()=>del(h.id)}>Delete</button>
              </div></td>
            </tr>
          ))}</tbody>
        </table></div></div>}
      {assignModal && (
        <Modal open={true} onClose={()=>setAssignModal(null)} title={`Assign Manager — ${assignModal.name}`} size="sm"
          footer={<><button className="btn btn-outline btn-sm" onClick={()=>setAssignModal(null)}>Cancel</button><button className="btn btn-primary btn-sm" disabled={busy} onClick={assignManager}>{busy?<Spinner/>:'Assign'}</button></>}>
          <div className="form-group"><label className="form-label">Active Manager</label>
            <select className="form-input form-select" value={assignMgrId} onChange={e=>setAssignMgrId(e.target.value)}>
              <option value="">— Select —</option>
              {managers.map(m=><option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
            </select>
          </div>
          {managers.length===0 && <div className="alert alert-warning" style={{marginTop:10}}><span className="alert-icon">⚠</span>No active managers. Approve a manager application first.</div>}
        </Modal>
      )}
      {manageModal && <AdminHostelDetail hostel={manageModal} toast={toast} onClose={()=>{setManageModal(null);load();onRefresh();}}/>}
    </div>
  );
}

function EnlistHostelWizard({ toast, managers, onDone, onCancel }) {
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [addLocModal, setAddLocModal] = useState(false);
  const [newLocName, setNewLocName] = useState('');

  // Step 1: Basic Information
  const [basic, setBasic] = useState({
    name: '',
    description: '',
    ownerName: '',
    managerId: '',
    managerName: '',
    contactNumbers: '',
    email: '',
    gpsAddress: '',
    address: '',
    location: 'Banso',
    mapsUrl: '',
    nearestLandmark: '',
    distanceKm: 1.2
  });

  // Step 2: Pricing & Room Capacities
  const [roomTypes, setRoomTypes] = useState({
    '1_in_room': { name: 'One in a Room', price: 8500, available: 5, occupancy: 1, gender: 'Co-ed', active: true },
    '2_in_room': { name: 'Two in a Room', price: 6200, available: 12, occupancy: 2, gender: 'Co-ed', active: true },
    '3_in_room': { name: 'Three in a Room', price: 4800, available: 8, occupancy: 3, gender: 'Co-ed', active: false },
    '4_in_room': { name: 'Four in a Room', price: 3800, available: 4, occupancy: 4, gender: 'Co-ed', active: false }
  });

  // Step 3: Facilities
  const ALL_FACILITIES = [
    'WiFi', 'Kitchen', 'Washrooms', 'Bathrooms', 'Study Room', 'Reading Area',
    'Common Room', 'TV Room', 'Laundry', 'Parking', 'Security', 'CCTV',
    'Generator', 'Borehole', 'Water Storage', 'Cleaning Service', 'Air Conditioning',
    'Wardrobes', 'Fans'
  ];
  const [facilities, setFacilities] = useState(['WiFi', 'Water Storage', 'Security', 'Kitchen', 'Generator']);

  // Step 4: Categorized Images
  const [galleries, setGalleries] = useState({
    exterior: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80'],
    '1_in_room': ['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=900&q=80'],
    '2_in_room': ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80'],
    '3_in_room': ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'],
    '4_in_room': ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=900&q=80'],
    facilities: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=900&q=80']
  });

  const [urlInput, setUrlInput] = useState('');
  const [activeCat, setActiveCat] = useState('exterior');

  // Step 5: Services & Rules
  const ALL_SERVICES = [
    'Shuttle Service', 'Mini Mart', 'Room Cleaning', 'Security Guard',
    'Maintenance Support', 'Trash Disposal', 'Laundry Service', 'Study Hall Access'
  ];
  const [services, setServices] = useState(['Security Guard', 'Trash Disposal', 'Maintenance Support']);
  const [rules, setRules] = useState('1. No loud music after 10 PM.\n2. Keep common areas clean.\n3. Visitors must register at security.');

  const toggleFac = f => setFacilities(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);
  const toggleSvc = s => setServices(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const addImageUrl = () => {
    if (!urlInput.trim()) return;
    setGalleries(g => ({
      ...g,
      [activeCat]: [...(g[activeCat] || []), urlInput.trim()]
    }));
    setUrlInput('');
  };

  const removeImage = (cat, idx) => {
    setGalleries(g => ({
      ...g,
      [cat]: (g[cat] || []).filter((_, i) => i !== idx)
    }));
  };

  const handleFileUpload = (cat, files) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        setGalleries(g => ({
          ...g,
          [cat]: [...(g[cat] || []), e.target.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const submitEnlistment = async () => {
    if (!basic.name || !basic.description || !basic.address) {
      toast('Please fill in basic hostel details (Name, Address, Description)', 'warning');
      setStep(1);
      return;
    }
    setBusy(true);
    try {
      const activeRooms = {};
      Object.entries(roomTypes).forEach(([k, v]) => {
        if (v.active) activeRooms[k] = { price: v.price, available: v.available, occupancy: v.occupancy, gender: v.gender };
      });

      const coverPhotos = galleries.exterior.length ? galleries.exterior : [galleries['1_in_room']?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80'];

      const payload = {
        name: basic.name,
        description: basic.description,
        ownerName: basic.ownerName,
        managerId: basic.managerId,
        managerName: basic.managerName,
        contactNumbers: basic.contactNumbers,
        email: basic.email,
        gpsAddress: basic.gpsAddress,
        address: basic.address,
        location: basic.location,
        mapsUrl: basic.mapsUrl,
        nearestLandmark: basic.nearestLandmark,
        distanceKm: basic.distanceKm,
        pricePerYear: Object.values(activeRooms)[0]?.price || 5000,
        roomTypes: JSON.stringify(activeRooms),
        facilities: facilities.join(','),
        services: services.join(','),
        gallery: JSON.stringify(galleries),
        photos: JSON.stringify(coverPhotos),
        rules
      };

      await apiFetch('/api/admin/hostels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      toast('🎉 Hostel successfully enlisted!', 'success');
      onDone();
    } catch (e) {
      toast(e.message, 'error');
    }
    setBusy(false);
  };

  return (
    <div className="card" style={{ border: '2px solid var(--brand-indigo)' }}>
      <div className="card-header" style={{ background: 'var(--brand-navy)', color: '#fff', padding: '16px 24px' }}>
        <div>
          <span className="card-title" style={{ color: '#fff', fontSize: 18 }}>📋 Enlist & Onboard New Hostel</span>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>6-Step Administrator Physical Verification Wizard</div>
        </div>
        <button className="btn btn-outline btn-sm" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} onClick={onCancel}>✕ Close</button>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)', overflowX: 'auto' }}>
        {[
          [1, '1. Basic Info'],
          [2, '2. Room Pricing'],
          [3, '3. Facilities'],
          [4, '4. Image Galleries'],
          [5, '5. Services & Rules'],
          [6, '6. Review & Publish']
        ].map(([sNum, label]) => (
          <div key={sNum} onClick={() => setStep(sNum)} style={{
            padding: '12px 18px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            borderBottom: step === sNum ? '3px solid var(--brand-indigo)' : '3px solid transparent',
            color: step === sNum ? 'var(--brand-indigo)' : 'var(--text-muted)',
            whiteSpace: 'nowrap',
            background: step === sNum ? '#fff' : 'transparent'
          }}>
            {label}
          </div>
        ))}
      </div>

      <div className="card-body" style={{ padding: 24 }}>
        {step === 1 && (
          <div style={{ display: 'grid', gap: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>Step 1: Basic Information & Property Location</h3>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Hostel Name *</label><input className="form-input" value={basic.name} onChange={e => setBasic(b => ({ ...b, name: e.target.value }))} placeholder="e.g. Royal Gold Student Lodge" /></div>
              <div className="form-group" style={{ zIndex: 100 }}>
                <label className="form-label">Tarkwa Location Zone *</label>
                <IntelligentLocationSearch 
                  value={basic.location} 
                  onChange={v => setBasic(b => ({ ...b, location: v }))} 
                  onAddLocation={name => { setNewLocName(name); setAddLocModal(true); }}
                />
              </div>
            </div>

            {addLocModal && <AddLocationModal initialName={newLocName} onClose={() => setAddLocModal(false)} onAdded={name => { setBasic(b => ({ ...b, location: name })); setAddLocModal(false); }} toast={toast} />}

            <div className="grid-2">
              <div className="form-group"><label className="form-label">Property Owner Name</label><input className="form-input" value={basic.ownerName} onChange={e => setBasic(b => ({ ...b, ownerName: e.target.value }))} placeholder="e.g. Chief Nana Mensah" /></div>
              <div className="form-group"><label className="form-label">Assigned Manager</label>
                <select className="form-input form-select" value={basic.managerId} onChange={e => {
                  const val = e.target.value;
                  const mgr = (managers || []).find(m => m.id === val);
                  setBasic(b => ({ ...b, managerId: val, managerName: mgr ? mgr.name : '', email: mgr ? mgr.email : b.email, contactNumbers: mgr ? mgr.phone : b.contactNumbers }));
                }}>
                  <option value="">— Unassigned —</option>
                  {(managers || []).map(m => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group"><label className="form-label">Contact Phones *</label><input className="form-input" value={basic.contactNumbers} onChange={e => setBasic(b => ({ ...b, contactNumbers: e.target.value }))} placeholder="+233 24 123 4567, +233 50 987 6543" /></div>
              <div className="form-group"><label className="form-label">Manager Email Address</label><input className="form-input" type="email" value={basic.email} onChange={e => setBasic(b => ({ ...b, email: e.target.value }))} placeholder="manager@hostel.com" /></div>
            </div>

            <div className="grid-2">
              <div className="form-group"><label className="form-label">Ghana GPS Digital Address</label><input className="form-input" value={basic.gpsAddress} onChange={e => setBasic(b => ({ ...b, gpsAddress: e.target.value }))} placeholder="WS-045-8912" /></div>
              <div className="form-group"><label className="form-label">Physical Address / Street *</label><input className="form-input" value={basic.address} onChange={e => setBasic(b => ({ ...b, address: e.target.value }))} placeholder="Block C, Off Banso-Campus Main Road" /></div>
            </div>

            <div className="grid-3">
              <div className="form-group"><label className="form-label">Google Maps URL / Embed</label><input className="form-input" value={basic.mapsUrl} onChange={e => setBasic(b => ({ ...b, mapsUrl: e.target.value }))} placeholder="https://maps.google.com/..." /></div>
              <div className="form-group"><label className="form-label">Nearest Landmark</label><input className="form-input" value={basic.nearestLandmark} onChange={e => setBasic(b => ({ ...b, nearestLandmark: e.target.value }))} placeholder="Opposite UMaT Main Library" /></div>
              <div className="form-group"><label className="form-label">Distance to UMaT (km)</label><input className="form-input" type="number" step="0.1" value={basic.distanceKm} onChange={e => setBasic(b => ({ ...b, distanceKm: Number(e.target.value) }))} /></div>
            </div>

            <div className="form-group"><label className="form-label">Hostel Description & Overview *</label><textarea className="form-input form-textarea" rows={3} value={basic.description} onChange={e => setBasic(b => ({ ...b, description: e.target.value }))} placeholder="Provide a thorough description of the hostel, security features, water access, and proximity to lecture rooms..." /></div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn btn-primary" onClick={() => setStep(2)}>Next: Room Pricing & Capacity ➔</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'grid', gap: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>Step 2: Room Categories, Annual Rates & Capacity</h3>
            <p style={{ fontSize: 13, color: 'var(--text-sub)' }}>Enable and configure pricing for each room type available at this hostel.</p>

            <div style={{ display: 'grid', gap: 14 }}>
              {Object.entries(roomTypes).map(([key, rt]) => (
                <div key={key} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16, background: rt.active ? '#fff' : 'var(--bg-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
                      <input type="checkbox" checked={rt.active} onChange={e => setRoomTypes(r => ({ ...r, [key]: { ...r[key], active: e.target.checked } }))} style={{ width: 18, height: 18, accentColor: 'var(--brand-indigo)' }} />
                      <span>{rt.name}</span>
                    </label>
                    <span className={`badge ${rt.active ? 'badge-active' : 'badge-suspended'}`}>{rt.active ? 'Available' : 'Disabled'}</span>
                  </div>

                  {rt.active && (
                    <div className="grid-4" style={{ marginTop: 12 }}>
                      <div className="form-group"><label className="form-label">Annual Price (GHS) *</label><input className="form-input" type="number" value={rt.price} onChange={e => setRoomTypes(r => ({ ...r, [key]: { ...r[key], price: Number(e.target.value) } }))} /></div>
                      <div className="form-group"><label className="form-label">Rooms Available</label><input className="form-input" type="number" value={rt.available} onChange={e => setRoomTypes(r => ({ ...r, [key]: { ...r[key], available: Number(e.target.value) } }))} /></div>
                      <div className="form-group"><label className="form-label">Occupancy / Room</label><input className="form-input" type="number" value={rt.occupancy} onChange={e => setRoomTypes(r => ({ ...r, [key]: { ...r[key], occupancy: Number(e.target.value) } }))} /></div>
                      <div className="form-group"><label className="form-label">Gender Restriction</label>
                        <select className="form-input form-select" value={rt.gender} onChange={e => setRoomTypes(r => ({ ...r, [key]: { ...r[key], gender: e.target.value } }))}>
                          <option value="Co-ed">Co-ed / Mixed</option>
                          <option value="Male-only">Male Only</option>
                          <option value="Female-only">Female Only</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
              <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>Next: Facilities ➔</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'grid', gap: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>Step 3: Comprehensive Facilities & Amenities Taxonomy</h3>
            <p style={{ fontSize: 13, color: 'var(--text-sub)' }}>Select all amenities physically inspected during administrator audit.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {ALL_FACILITIES.map(fac => (
                <label key={fac} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: `1.5px solid ${facilities.includes(fac) ? 'var(--brand-indigo)' : 'var(--gray-200)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', background: facilities.includes(fac) ? 'rgba(99,102,241,.06)' : 'white', fontWeight: 600, fontSize: 13 }}>
                  <input type="checkbox" checked={facilities.includes(fac)} onChange={() => toggleFac(fac)} style={{ width: 16, height: 16, accentColor: 'var(--brand-indigo)' }} />
                  <span>{fac}</span>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
              <button className="btn btn-outline" onClick={() => setStep(2)}>← Back</button>
              <button className="btn btn-primary" onClick={() => setStep(4)}>Next: Categorized Images ➔</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ display: 'grid', gap: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>Step 4: Categorized Image Galleries & Photo Uploads</h3>
            <p style={{ fontSize: 13, color: 'var(--text-sub)' }}>Upload high-resolution photos for exterior, room types, and common facilities.</p>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                ['exterior', '🏢 Exterior & Compound'],
                ['1_in_room', '🛏️ 1-in-a-Room'],
                ['2_in_room', '👥 2-in-a-Room'],
                ['3_in_room', '🛏️ 3-in-a-Room'],
                ['4_in_room', '🛏️ 4-in-a-Room'],
                ['facilities', '🚿 Facilities & Kitchen']
              ].map(([catKey, label]) => (
                <button key={catKey} className={`btn btn-sm ${activeCat === catKey ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveCat(catKey)}>
                  {label} ({(galleries[catKey] || []).length})
                </button>
              ))}
            </div>

            <div style={{ border: '2px dashed var(--brand-indigo)', borderRadius: 'var(--radius-lg)', padding: 20, textAlign: 'center', background: 'rgba(99,102,241,.03)' }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>📷 Upload Images for {activeCat.replace('_', ' ')}</div>
              <div style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 12 }}>Drag & drop image files here or enter image URL</div>
              <div style={{ display: 'flex', gap: 10, maxWidth: 500, margin: '0 auto 12px' }}>
                <input className="form-input form-input-sm" value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="Paste image URL..." />
                <button className="btn btn-outline btn-sm" onClick={addImageUrl}>Add URL</button>
              </div>
              <div>
                <input type="file" multiple accept="image/*" id="gallery-file-input" style={{ display: 'none' }} onChange={e => handleFileUpload(activeCat, e.target.files)} />
                <label htmlFor="gallery-file-input" className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>📁 Browse Local Photo Files</label>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, marginTop: 10 }}>
              {(galleries[activeCat] || []).map((imgUrl, i) => (
                <div key={i} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={() => removeImage(activeCat, i)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(220,38,38,.85)', color: '#fff', border: 'none', borderRadius: 999, width: 22, height: 22, cursor: 'pointer', fontSize: 12 }}>✕</button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
              <button className="btn btn-outline" onClick={() => setStep(3)}>← Back</button>
              <button className="btn btn-primary" onClick={() => setStep(5)}>Next: Services & Rules ➔</button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div style={{ display: 'grid', gap: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>Step 5: Included Services & House Rules</h3>

            <div>
              <label className="form-label" style={{ marginBottom: 8 }}>Included Services</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {ALL_SERVICES.map(svc => (
                  <label key={svc} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: `1.5px solid ${services.includes(svc) ? 'var(--brand-indigo)' : 'var(--gray-200)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', background: services.includes(svc) ? 'rgba(99,102,241,.06)' : 'white', fontWeight: 600, fontSize: 13 }}>
                    <input type="checkbox" checked={services.includes(svc)} onChange={() => toggleSvc(svc)} style={{ width: 16, height: 16, accentColor: 'var(--brand-indigo)' }} />
                    <span>{svc}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group"><label className="form-label">Hostel Regulations & Rules</label><textarea className="form-input form-textarea" rows={4} value={rules} onChange={e => setRules(e.target.value)} /></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
              <button className="btn btn-outline" onClick={() => setStep(4)}>← Back</button>
              <button className="btn btn-primary" onClick={() => setStep(6)}>Next: Final Review ➔</button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div style={{ display: 'grid', gap: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>Step 6: Audit Review & Enlistment Confirmation</h3>

            <div style={{ background: 'var(--bg-subtle)', padding: 18, borderRadius: 'var(--radius-lg)', display: 'grid', gap: 12 }}>
              <div className="grid-2">
                <div><strong>Hostel Name:</strong> {basic.name || 'Not specified'}</div>
                <div><strong>Zone Location:</strong> {basic.location}</div>
                <div><strong>Address:</strong> {basic.address || 'Not specified'}</div>
                <div><strong>Distance:</strong> {basic.distanceKm} km from UMaT</div>
                <div><strong>Manager:</strong> {basic.managerName || 'Unassigned'}</div>
                <div><strong>Contact:</strong> {basic.contactNumbers || 'N/A'}</div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <strong>Configured Room Types:</strong>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
                  {Object.entries(roomTypes).filter(([_, v]) => v.active).map(([k, v]) => (
                    <span key={k} className="badge badge-info">{k.replace('_', ' ')}: {fmtCurrency(v.price)}/yr ({v.available} rooms)</span>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <strong>Facilities ({facilities.length}):</strong> {facilities.join(', ')}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <strong>Image Gallery Photos ({Object.values(galleries).flat().length}):</strong>
                <div style={{ display: 'flex', gap: 6, marginTop: 6, overflowX: 'auto' }}>
                  {Object.values(galleries).flat().slice(0, 8).map((img, i) => (
                    <img key={i} src={img} alt="" style={{ width: 50, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
              <button className="btn btn-outline" onClick={() => setStep(5)}>← Back</button>
              <button className="btn btn-primary btn-lg" disabled={busy} onClick={submitEnlistment}>
                {busy ? <Spinner /> : '🚀 Enlist & Save Hostel'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminHostelDetail({ hostel, toast, onClose }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [tab, setTab] = useState('overview');
  
  // Edit State
  const [editForm, setEditForm] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [activeMediaCat, setActiveMediaCat] = useState('exterior');

  const load = async () => {
    try { 
      const d = await apiFetch(`/api/admin/hostels/${hostel.id}`); 
      setData(d); 
      setEditForm({
        name: d.hostel.name || '',
        location: d.hostel.location || '',
        address: d.hostel.address || '',
        description: d.hostel.description || '',
        rules: d.hostel.rules || '',
        photos: d.hostel.photos || [],
        gallery: d.hostel.gallery || {}
      });
    } catch {}
  };
  useEffect(()=>{ load(); },[]);

  const verify = async action => {
    setBusy(true);
    try { await apiFetch(`/api/admin/hostels/${hostel.id}/verify`,{method:'PATCH',body:JSON.stringify({action,notes:note})}); toast(`Hostel ${action}d!`,'success'); load(); }
    catch(e){ toast(e.message,'error'); } setBusy(false);
  };

  const saveEdits = async () => {
    setBusy(true);
    try {
      const payload = { ...editForm, gallery: JSON.stringify(editForm.gallery), photos: JSON.stringify(editForm.photos) };
      await apiFetch(`/api/admin/hostels/${hostel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      toast('Hostel updated successfully!', 'success');
      load();
    } catch(e) {
      toast(e.message, 'error');
    }
    setBusy(false);
  };

  const addMediaUrl = () => {
    if (!urlInput.trim()) return;
    if (activeMediaCat === 'cover') {
      setEditForm(f => ({ ...f, photos: [...f.photos, urlInput.trim()] }));
    } else {
      setEditForm(f => ({
        ...f,
        gallery: { ...f.gallery, [activeMediaCat]: [...(f.gallery[activeMediaCat]||[]), urlInput.trim()] }
      }));
    }
    setUrlInput('');
  };

  const removeMedia = (cat, idx) => {
    if (cat === 'cover') {
      setEditForm(f => ({ ...f, photos: f.photos.filter((_,i)=>i!==idx) }));
    } else {
      setEditForm(f => ({
        ...f,
        gallery: { ...f.gallery, [cat]: (f.gallery[cat]||[]).filter((_,i)=>i!==idx) }
      }));
    }
  };

  const h = data?.hostel || hostel;
  const verLog = data?.verificationLog || [];
  const statusMap = {approve:'✅ Approve & Publish',set_under_review:'🔍 Set Under Review',reject:'❌ Reject',suspend:'⏸ Suspend',reinstate:'✅ Reinstate'};
  const allowedActions = h.verification_status==='verified'?['suspend']:h.verification_status==='suspended'?['reinstate','reject']:h.verification_status==='pending'?['approve','set_under_review','reject']:['approve','reject'];

  return (
    <Modal open={true} onClose={onClose} title={`Manage — ${h.name}`} size="lg">
      <div style={{display:'flex', borderBottom:'1px solid var(--border)', marginBottom:20, gap:20}}>
        {['overview','edit','media'].map(t => (
          <div key={t} onClick={()=>setTab(t)} style={{
            paddingBottom:10, cursor:'pointer', fontWeight:600, textTransform:'capitalize',
            color: tab===t ? 'var(--brand-indigo)' : 'var(--text-muted)',
            borderBottom: tab===t ? '2px solid var(--brand-indigo)' : '2px solid transparent'
          }}>{t === 'overview' ? 'Verification' : t === 'edit' ? 'Edit Details' : 'Media Manager'}</div>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{display:'grid',gap:16}}>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
            <span className={`badge badge-lg ${h.verification_status==='verified'?'badge-verified':h.verification_status==='rejected'?'badge-rejected':h.verification_status==='suspended'?'badge-suspended':'badge-pending'}`}>🛡️ {(h.verification_status||'pending').replace('_',' ')}</span>
            <span className={`badge badge-lg ${h.is_published?'badge-active':'badge-suspended'}`}>{h.is_published?'Published':'Unpublished'}</span>
          </div>
          <div className="grid-2">
            {[['Location',h.location],['Address',h.address],['Price',fmtCurrency(h.price_per_year)+'/yr'],['Manager',h.manager_name||'Unassigned']].map(([l,v])=>(
              <div key={l} style={{background:'var(--bg-subtle)',padding:12,borderRadius:'var(--radius-md)'}}><div style={{fontSize:11,color:'var(--text-muted)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4}}>{l}</div><div style={{fontWeight:700,fontSize:14}}>{v}</div></div>
            ))}
          </div>
          <div style={{padding:16,background:'var(--bg-subtle)',borderRadius:'var(--radius-lg)',border:'1px solid var(--border)'}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:10}}>Verification Actions</div>
            <div className="form-group" style={{marginBottom:12}}><label className="form-label">Notes</label><textarea className="form-input form-textarea" value={note} onChange={e=>setNote(e.target.value)} rows={2}/></div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {allowedActions.map(a=><button key={a} className={`btn btn-sm ${a==='approve'||a==='reinstate'?'btn-success':a==='reject'||a==='suspend'?'btn-danger':'btn-primary'}`} disabled={busy} onClick={()=>verify(a)}>{busy?<Spinner/>:statusMap[a]}</button>)}
            </div>
          </div>
          {verLog.length>0 && (
            <div>
              <div style={{fontWeight:700,fontSize:14,marginBottom:10}}>Verification History</div>
              <div style={{display:'grid',gap:8}}>
                {verLog.map(l=><div key={l.id} style={{padding:'10px 14px',background:'var(--bg-subtle)',borderRadius:'var(--radius-md)',fontSize:13}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><strong>{l.action}</strong><span style={{color:'var(--text-muted)'}}>{fmtDateTime(l.created_at)}</span></div><div style={{color:'var(--text-muted)'}}>{l.old_status} → {l.new_status} · {l.admin_name}</div>{l.notes&&<div style={{marginTop:4,fontStyle:'italic',color:'var(--text-sub)'}}>{l.notes}</div>}</div>)}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'edit' && editForm && (
        <div style={{display:'grid',gap:16}}>
          <div className="grid-2">
            <div className="form-group"><label className="form-label">Hostel Name</label><input className="form-input" value={editForm.name} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))}/></div>
            <div className="form-group"><label className="form-label">Location Zone</label><input className="form-input" value={editForm.location} onChange={e=>setEditForm(f=>({...f,location:e.target.value}))}/></div>
          </div>
          <div className="form-group"><label className="form-label">Address</label><input className="form-input" value={editForm.address} onChange={e=>setEditForm(f=>({...f,address:e.target.value}))}/></div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-input form-textarea" rows={4} value={editForm.description} onChange={e=>setEditForm(f=>({...f,description:e.target.value}))}/></div>
          <div className="form-group"><label className="form-label">Rules</label><textarea className="form-input form-textarea" rows={3} value={editForm.rules} onChange={e=>setEditForm(f=>({...f,rules:e.target.value}))}/></div>
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <button className="btn btn-primary" onClick={saveEdits} disabled={busy}>{busy?<Spinner/>:'Save Changes'}</button>
          </div>
        </div>
      )}

      {tab === 'media' && editForm && (
        <div style={{display:'grid',gap:20}}>
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <select className="form-input form-select" style={{maxWidth:200}} value={activeMediaCat} onChange={e=>setActiveMediaCat(e.target.value)}>
              <option value="cover">Cover / Header Photos</option>
              <option value="exterior">Exterior</option>
              <option value="1_in_room">1 In A Room</option>
              <option value="2_in_room">2 In A Room</option>
              <option value="3_in_room">3 In A Room</option>
              <option value="4_in_room">4 In A Room</option>
              <option value="facilities">Facilities</option>
            </select>
            <input className="form-input" placeholder="Paste image URL..." value={urlInput} onChange={e=>setUrlInput(e.target.value)} style={{flex:1}}/>
            <button className="btn btn-outline" onClick={addMediaUrl}>+ Add URL</button>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:12}}>
            {(activeMediaCat === 'cover' ? editForm.photos : (editForm.gallery[activeMediaCat]||[])).map((url, i) => (
              <div key={i} style={{position:'relative',borderRadius:'var(--radius-md)',overflow:'hidden',aspectRatio:'1/1',border:'1px solid var(--border)'}}>
                <img src={url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                <button onClick={()=>removeMedia(activeMediaCat, i)} style={{position:'absolute',top:4,right:4,background:'rgba(255,0,0,0.8)',color:'#fff',border:'none',borderRadius:'50%',width:24,height:24,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12}}>✕</button>
              </div>
            ))}
            {(activeMediaCat === 'cover' ? editForm.photos : (editForm.gallery[activeMediaCat]||[])).length === 0 && <div style={{color:'var(--text-muted)',gridColumn:'1/-1',fontSize:13,textAlign:'center',padding:20}}>No media found for this category.</div>}
          </div>

          <div style={{display:'flex',justifyContent:'flex-end',marginTop:10}}>
            <button className="btn btn-primary" onClick={saveEdits} disabled={busy}>{busy?<Spinner/>:'Save Media Configuration'}</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function AdminVerification({ toast, onRefresh }) {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const load = async () => {
    setLoading(true);
    try { const d = await apiFetch('/api/admin/hostels?verification=pending'); setHostels(d.hostels||[]); }
    catch {} setLoading(false);
  };
  useEffect(()=>{ load(); },[]);
  return (
    <div>
      {loading ? <div className="page-loading"><Spinner dark/></div> :
        hostels.length===0 ? <EmptyState icon="🛡️" title="No pending verifications" sub="All hostels are verified or no new submissions."/> :
        <div style={{display:'grid',gap:14}}>
          {hostels.map(h=>(
            <div key={h.id} className="card"><div className="card-body" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,flexWrap:'wrap'}}>
              <div><div style={{fontWeight:800,fontSize:16,marginBottom:4}}>{h.name}</div><div style={{fontSize:13,color:'var(--text-muted)',marginBottom:6}}>📍 {h.address}, {h.location}</div>{h.description&&<div style={{fontSize:13,color:'var(--text-sub)'}}>{h.description.substring(0,120)}…</div>}{h.manager_name&&<div style={{marginTop:8,fontSize:13,color:'var(--text-muted)'}}>Manager: {h.manager_name}</div>}</div>
              <div style={{display:'flex',gap:8,flexShrink:0}}><span className="badge badge-pending">{(h.verification_status||'pending').replace('_',' ')}</span><button className="btn btn-primary btn-sm" onClick={()=>setSelected(h)}>Review</button></div>
            </div></div>
          ))}
        </div>}
      {selected && <AdminHostelDetail hostel={selected} toast={toast} onClose={()=>{setSelected(null);load();onRefresh();}}/>}
    </div>
  );
}

function AdminApplications({ toast, onRefresh }) {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('pending');
  const [busy, setBusy]         = useState(null);
  const [noteModal, setNoteModal] = useState(null);
  const [note, setNote]         = useState('');
  const load = async () => {
    setLoading(true);
    try { const d = await apiFetch('/api/admin/manager-applications'); setManagers(d.managers||[]); }
    catch {} setLoading(false);
  };
  useEffect(()=>{ load(); },[]);
  const act = async (id, action) => {
    setBusy(id);
    try { await apiFetch(`/api/admin/manager-applications/${id}`,{method:'PATCH',body:JSON.stringify({action,notes:note,rejectionReason:note})}); toast(`Manager ${action}d!`,'success'); setNoteModal(null); setNote(''); load(); onRefresh(); }
    catch(e){ toast(e.message,'error'); } setBusy(null);
  };
  const filtered = managers.filter(m => (m.status||'pending') === tab);
  const counts = { pending: managers.filter(m=>(m.status||'pending')==='pending').length, active: managers.filter(m=>m.status==='active').length, rejected: managers.filter(m=>m.status==='rejected').length };
  return (
    <div>
      <div className="tabs" style={{marginBottom:20}}>
        {[['pending',`Pending (${counts.pending})`],['active',`Approved (${counts.active})`],['rejected',`Rejected (${counts.rejected})`]].map(([id,l])=>(
          <button key={id} className={`tab-btn ${tab===id?'active':''}`} onClick={()=>setTab(id)}>{l}</button>
        ))}
      </div>
      {loading ? <div className="page-loading"><Spinner dark/></div> :
        filtered.length===0 ? <EmptyState icon="📝" title={`No ${tab} applications`}/> :
        <div style={{display:'grid',gap:14}}>
          {filtered.map(m=>(
            <div key={m.id} className="card"><div className="card-body">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,flexWrap:'wrap'}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:16,marginBottom:4}}>{m.name}</div>
                  <div style={{fontSize:13,color:'var(--text-muted)',marginBottom:6}}>{m.email} • {m.phone}</div>
                  {m.hostel_name_applied&&<div style={{fontSize:13,color:'var(--text-sub)',marginBottom:4}}>Applied for: <strong>{m.hostel_name_applied}</strong>{m.hostel_location_applied?` in ${m.hostel_location_applied}`:''}</div>}
                  {m.hostel_description_applied&&<div style={{fontSize:13,color:'var(--text-muted)'}}>{(m.hostel_description_applied||'').substring(0,120)}…</div>}
                  <div style={{fontSize:12,color:'var(--text-muted)',marginTop:6}}>Applied: {fmtDate(m.created_at)}</div>
                  {m.rejection_reason&&<div style={{fontSize:13,color:'var(--danger)',marginTop:6}}>Reason: {m.rejection_reason}</div>}
                </div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap',flexShrink:0}}>
                  <StatusBadge status={m.status||'pending'}/>
                  {tab==='pending' && <>
                    <button className="btn btn-success btn-sm" disabled={!!busy} onClick={()=>act(m.id,'approve')}>{busy===m.id?<Spinner/>:'✓ Approve'}</button>
                    <button className="btn btn-danger btn-sm"  disabled={!!busy} onClick={()=>{setNoteModal({id:m.id,action:'reject'});setNote('');}}>✕ Reject</button>
                  </>}
                  {tab==='active' && <button className="btn btn-outline btn-sm" style={{color:'var(--warning)'}} disabled={!!busy} onClick={()=>act(m.id,'suspend')}>Suspend</button>}
                  {tab==='rejected' && <button className="btn btn-primary btn-sm" disabled={!!busy} onClick={()=>act(m.id,'reinstate')}>Reinstate</button>}
                </div>
              </div>
            </div></div>
          ))}
        </div>}
      {noteModal && (
        <Modal open={true} onClose={()=>setNoteModal(null)} title="Rejection Reason" size="sm"
          footer={<><button className="btn btn-outline btn-sm" onClick={()=>setNoteModal(null)}>Cancel</button><button className="btn btn-danger btn-sm" disabled={!!busy} onClick={()=>act(noteModal.id,noteModal.action)}>{busy?<Spinner/>:'Reject'}</button></>}>
          <div className="form-group"><label className="form-label">Reason for rejection</label><textarea className="form-input form-textarea" value={note} onChange={e=>setNote(e.target.value)} rows={4} placeholder="Explain why…"/></div>
        </Modal>
      )}
    </div>
  );
}

function AdminUsers({ toast }) {
  const [data, setData] = useState({ students:[], managers:[], admins:[] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('students');
  const [search, setSearch] = useState('');
  const load = async () => {
    setLoading(true);
    try { const d = await apiFetch('/api/admin/users'); setData(d); } catch {} setLoading(false);
  };
  useEffect(()=>{ load(); },[]);
  const delStudent = async id => {
    if (!confirm('Delete account?')) return;
    try { await apiFetch(`/api/admin/users/students/${id}`,{method:'DELETE'}); toast('Deleted','info'); load(); } catch(e){ toast(e.message,'error'); }
  };
  const filter = arr => !search ? arr : arr.filter(u=>(u.name||'').toLowerCase().includes(search.toLowerCase())||(u.email||'').toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap',alignItems:'center'}}>
        <div className="pub-filter-search" style={{flex:1,maxWidth:320}}><span style={{color:'var(--text-muted)'}}>🔍</span><input placeholder="Search users…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <div className="tabs" style={{marginBottom:0}}>
          {[['students',`Students (${data.students.length})`],['managers',`Managers (${data.managers.length})`],['admins',`Admins (${data.admins.length})`]].map(([id,l])=>(
            <button key={id} className={`tab-btn ${tab===id?'active':''}`} onClick={()=>setTab(id)}>{l}</button>
          ))}
        </div>
      </div>
      {loading ? <div className="page-loading"><Spinner dark/></div> :
        <div className="card"><div className="table-wrap">
          {tab==='students' && <table><thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Joined</th><th>Action</th></tr></thead>
            <tbody>{filter(data.students).map(s=><tr key={s.id}><td className="td-primary">{s.name}</td><td className="td-muted">{s.email}</td><td><StatusBadge status={s.status||'active'}/></td><td className="td-muted">{fmtDate(s.created_at)}</td><td><button className="btn btn-outline btn-sm" style={{color:'var(--danger)'}} onClick={()=>delStudent(s.id)}>Delete</button></td></tr>)}</tbody>
          </table>}
          {tab==='managers' && <table><thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Joined</th></tr></thead>
            <tbody>{filter(data.managers).map(m=><tr key={m.id}><td className="td-primary">{m.name}</td><td className="td-muted">{m.email}</td><td><StatusBadge status={m.status||'pending'}/></td><td className="td-muted">{fmtDate(m.created_at)}</td></tr>)}</tbody>
          </table>}
          {tab==='admins' && <table><thead><tr><th>Name</th><th>Email</th><th>Joined</th></tr></thead>
            <tbody>{data.admins.map(a=><tr key={a.id}><td className="td-primary">{a.name}</td><td className="td-muted">{a.email}</td><td className="td-muted">{fmtDate(a.created_at)}</td></tr>)}</tbody>
          </table>}
        </div></div>}
    </div>
  );
}

function AdminAnnouncements({ toast }) {
  const [anns, setAnns] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:'', message:'', type:'info', audience:'all' });
  const [busy, setBusy] = useState(false);
  const load = async () => { try { const d = await apiFetch('/api/admin/announcements'); setAnns(d.announcements||[]); } catch {} };
  useEffect(()=>{ load(); },[]);
  const create = async e => {
    e.preventDefault(); setBusy(true);
    try { await apiFetch('/api/admin/announcements',{method:'POST',body:JSON.stringify(form)}); toast('Published!','success'); setShowForm(false); load(); }
    catch(e){ toast(e.message,'error'); } setBusy(false);
  };
  const del = async id => { try { await apiFetch(`/api/admin/announcements/${id}`,{method:'DELETE'}); toast('Deleted','info'); load(); } catch {} };
  const typeColor = { info:'badge-info', warning:'badge-pending', success:'badge-active', urgent:'badge-rejected' };
  return (
    <div>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:20}}><button className="btn btn-primary" onClick={()=>setShowForm(true)}>+ New Announcement</button></div>
      {showForm && (
        <div className="card" style={{marginBottom:20}}>
          <div className="card-header"><span className="card-title">📢 Platform Announcement</span><button className="btn btn-outline btn-sm" onClick={()=>setShowForm(false)}>✕</button></div>
          <div className="card-body">
            <form onSubmit={create} style={{display:'grid',gap:12}}>
              <div className="form-group"><label className="form-label">Title *</label><input className="form-input" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required/></div>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">Type</label><select className="form-input form-select" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>{['info','warning','success','urgent'].map(t=><option key={t}>{t}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Audience</label><select className="form-input form-select" value={form.audience} onChange={e=>setForm(f=>({...f,audience:e.target.value}))}>{['all','students','managers'].map(a=><option key={a}>{a}</option>)}</select></div>
              </div>
              <div className="form-group"><label className="form-label">Message *</label><textarea className="form-input form-textarea" value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} rows={4} required/></div>
              <div style={{display:'flex',gap:10}}><button type="button" className="btn btn-outline" onClick={()=>setShowForm(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={busy}>{busy?<Spinner/>:'Publish'}</button></div>
            </form>
          </div>
        </div>
      )}
      {anns.length===0 ? <EmptyState icon="📢" title="No announcements" sub="Create platform-wide announcements."/> :
        <div style={{display:'grid',gap:12}}>
          {anns.map(a=>(
            <div key={a.id} className="card"><div className="card-body" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
              <div><div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}><span className={`badge ${typeColor[a.type]||'badge-info'}`}>{a.type}</span><span className="badge badge-info">{a.audience}</span></div><div style={{fontWeight:700,fontSize:15,marginBottom:4}}>{a.title}</div><div style={{fontSize:13,color:'var(--text-sub)'}}>{a.message}</div><div style={{fontSize:11,color:'var(--text-muted)',marginTop:6}}>{fmtDateTime(a.created_at)}</div></div>
              <button className="btn btn-outline btn-sm" style={{color:'var(--danger)',flexShrink:0}} onClick={()=>del(a.id)}>Delete</button>
            </div></div>
          ))}
        </div>}
    </div>
  );
}

function AdminPayments({ toast }) {
  const [data, setData] = useState({ payments:[], submissions:[], receipts:[] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('submissions');
  const load = async () => { setLoading(true); try { const d = await apiFetch('/api/admin/payments'); setData(d); } catch {} setLoading(false); };
  useEffect(()=>{ load(); },[]);
  return (
    <div>
      <div className="stats-grid stats-grid-3" style={{marginBottom:20}}>
        <StatCard icon="📋" iconColor="indigo" value={data.submissions.length} label="Submissions"/>
        <StatCard icon="✅" iconColor="green"  value={data.receipts.length}    label="Receipts"/>
        <StatCard icon="⏳" iconColor="amber"  value={data.submissions.filter(s=>s.status==='submitted').length} label="Pending"/>
      </div>
      <div className="tabs" style={{marginBottom:20}}>
        {[['submissions','Submissions'],['receipts','Receipts']].map(([id,l])=><button key={id} className={`tab-btn ${tab===id?'active':''}`} onClick={()=>setTab(id)}>{l}</button>)}
      </div>
      {loading ? <div className="page-loading"><Spinner dark/></div> :
        <div className="card"><div className="table-wrap">
          {tab==='submissions' && (data.submissions.length===0 ? <div style={{padding:40,textAlign:'center',color:'var(--text-muted)'}}>No submissions</div> :
            <table><thead><tr><th>Student</th><th>Hostel</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>{data.submissions.map(s=><tr key={s.id}><td className="td-primary">{s.student_name}</td><td className="td-muted">{s.hostel_name}</td><td style={{fontWeight:700}}>{fmtCurrency(s.amount)}</td><td><StatusBadge status={s.status}/></td><td className="td-muted">{fmtDate(s.created_at)}</td></tr>)}</tbody>
            </table>)}
          {tab==='receipts' && (data.receipts.length===0 ? <div style={{padding:40,textAlign:'center',color:'var(--text-muted)'}}>No receipts</div> :
            <table><thead><tr><th>Receipt No.</th><th>Student</th><th>Hostel</th><th>Amount</th><th>Verified</th></tr></thead>
            <tbody>{data.receipts.map(r=><tr key={r.id}><td style={{fontFamily:'monospace',fontWeight:700}}>{r.receipt_number}</td><td className="td-primary">{r.student_name}</td><td className="td-muted">{r.hostel_name}</td><td style={{fontWeight:700}}>{fmtCurrency(r.amount_paid)}</td><td className="td-muted">{fmtDate(r.verified_at)}</td></tr>)}</tbody>
            </table>)}
        </div></div>}
    </div>
  );
}

// ─── ADMIN ANALYTICS WITH SVG CHARTS ─────────────────────────────────────────
function AdminAnalytics({ toast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/admin/analytics')
      .then(d => setData(d.analytics))
      .catch(e => toast && toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><Spinner dark /></div>;
  if (!data) return <EmptyState icon="📊" title="Analytics unavailable" />;

  const maxRev = Math.max(...data.monthlyRevenue.map(m => m.revenue), 1);
  const maxLoc = Math.max(...data.locationDistribution.map(l => l.count), 1);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div className="stats-grid stats-grid-4">
        <StatCard icon="🏠" iconColor="indigo" value={data.totalHostels} label="Total Hostels" />
        <StatCard icon="🛡️" iconColor="green" value={data.verifiedHostels} label="Verified Hostels" />
        <StatCard icon="📊" iconColor="amber" value={`${data.occupancyRate}%`} label="Occupancy Rate" />
        <StatCard icon="💰" iconColor="purple" value={fmtCurrency(data.totalRevenue)} label="Estimated Revenue" />
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">📈 Monthly Revenue & Booking Trends</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 200, paddingBottom: 24, paddingTop: 16, borderBottom: '1px solid var(--border)' }}>
              {data.monthlyRevenue.map((m, i) => {
                const heightPct = Math.round((m.revenue / maxRev) * 100);
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-indigo)', marginBottom: 4 }}>
                      {m.revenue >= 1000 ? `${Math.round(m.revenue / 1000)}k` : m.revenue}
                    </div>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: 36,
                        height: `${Math.max(12, heightPct)}%`,
                        background: 'linear-gradient(180deg, var(--brand-indigo) 0%, var(--brand-violet) 100%)',
                        borderRadius: '6px 6px 0 0',
                        transition: 'height 0.4s ease'
                      }}
                      title={`${m.month}: ${fmtCurrency(m.revenue)} (${m.bookings} bookings)`}
                    />
                    <div style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 8, fontWeight: 600 }}>{m.month}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 14, fontSize: 13, color: 'var(--text-muted)' }}>
              <span>Total Bookings: <strong>{data.totalBookings}</strong></span>
              <span>Physical Tours: <strong>{data.totalTours}</strong></span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">📍 Top Hostel Locations in Tarkwa</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gap: 12 }}>
              {data.locationDistribution.map((loc, i) => {
                const widthPct = Math.round((loc.count / maxLoc) * 100);
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                      <span>{loc.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{loc.count} hostel{loc.count !== 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ height: 10, width: '100%', background: 'var(--bg-subtle)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.max(8, widthPct)}%`, background: 'var(--brand-amber)', borderRadius: 999 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CO-ADMINISTRATOR MANAGEMENT ─────────────────────────────────────────────
function AdminCoAdmins({ toast }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', manageHostels: true, manageManagers: true, manageStudents: true, manageBookings: true, manageTours: true, managePayments: true, viewAnalytics: true, systemSettings: false });

  const load = async () => {
    setLoading(true);
    try {
      const d = await apiFetch('/api/admin/co-admins');
      setAdmins(d.admins || []);
    } catch (e) {
      toast(e.message, 'error');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createAdmin = async e => {
    e.preventDefault();
    setBusy(true);
    try {
      await apiFetch('/api/admin/co-admins', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          permissions: {
            manage_hostels: form.manageHostels,
            manage_managers: form.manageManagers,
            manage_students: form.manageStudents,
            manage_bookings: form.manageBookings,
            manage_tours: form.manageTours,
            manage_payments: form.managePayments,
            view_analytics: form.viewAnalytics,
            system_settings: form.systemSettings
          }
        })
      });
      toast('Co-administrator account created successfully!', 'success');
      setShowAdd(false);
      setForm({ name: '', email: '', password: '', manageHostels: true, manageManagers: true, manageStudents: true, manageBookings: true, manageTours: true, managePayments: true, viewAnalytics: true, systemSettings: false });
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
    setBusy(false);
  };

  const removeAdmin = async (id, email) => {
    if (!confirm(`Are you sure you want to remove co-administrator ${email}?`)) return;
    try {
      await apiFetch(`/api/admin/co-admins/${id}`, { method: 'DELETE' });
      toast('Co-administrator removed', 'info');
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontWeight: 800, fontSize: 18 }}>Co-Administrators</h3>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Manage platform admin accounts and assign operational permissions</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Co-Admin</button>
      </div>

      {showAdd && (
        <Modal open={true} onClose={() => setShowAdd(false)} title="➕ Create Co-Administrator Account" size="md">
          <form onSubmit={createAdmin} style={{ display: 'grid', gap: 14 }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Temporary Password *</label>
              <input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label" style={{ marginBottom: 8 }}>Granted Permissions</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {[
                  ['manageHostels', 'Manage Hostels'],
                  ['manageManagers', 'Manage Managers'],
                  ['manageStudents', 'Manage Students'],
                  ['manageBookings', 'Manage Bookings'],
                  ['manageTours', 'Manage Physical Tours'],
                  ['managePayments', 'Verify Payments'],
                  ['viewAnalytics', 'View Analytics'],
                  ['systemSettings', 'System Settings']
                ].map(([key, label]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    <input type="checkbox" checked={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} style={{ accentColor: 'var(--brand-indigo)' }} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? <Spinner /> : 'Create Account'}</button>
            </div>
          </form>
        </Modal>
      )}

      {loading ? <div className="page-loading"><Spinner dark /></div> :
        admins.length === 0 ? <EmptyState icon="👤" title="No co-administrators registered" /> :
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Admin Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {admins.map(a => (
                  <tr key={a.id}>
                    <td className="td-primary">{a.name} {a.is_super_admin && <span className="badge badge-verified" style={{ marginLeft: 6 }}>Super Admin</span>}</td>
                    <td className="td-muted">{a.email}</td>
                    <td><span className="badge badge-info">{a.is_super_admin ? 'Super Admin' : 'Co-Admin'}</span></td>
                    <td><StatusBadge status={a.status || 'active'} /></td>
                    <td>
                      {!a.is_super_admin && a.email !== 'ce-aavoryi8125@st.umat.edu.gh' && (
                        <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }} onClick={() => removeAdmin(a.id, a.email)}>Remove</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>}
    </div>
  );
}

// ─── SYSTEM ERROR MONITORING DASHBOARD ─────────────────────────────────────────
function AdminErrorLogs({ toast }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const d = await apiFetch('/api/admin/error-logs');
      setLogs(d.logs || []);
    } catch (e) {
      toast(e.message, 'error');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resolveLog = async id => {
    try {
      await apiFetch(`/api/admin/error-logs/${id}/resolve`, { method: 'PATCH' });
      toast('Error log marked as resolved', 'success');
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const filtered = logs.filter(l => filter === 'all' ? true : filter === 'unresolved' ? !l.resolved : l.level === filter);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ fontWeight: 800, fontSize: 18 }}>System Error Logs</h3>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Centralized API, DB, Auth, and runtime error tracking feed</div>
        </div>
        <div className="tabs" style={{ marginBottom: 0 }}>
          {[['all', `All (${logs.length})`], ['unresolved', `Unresolved (${logs.filter(l => !l.resolved).length})`], ['critical', 'Critical'], ['error', 'Errors']].map(([id, label]) => (
            <button key={id} className={`tab-btn ${filter === id ? 'active' : ''}`} onClick={() => setFilter(id)}>{label}</button>
          ))}
        </div>
      </div>

      {loading ? <div className="page-loading"><Spinner dark /></div> :
        filtered.length === 0 ? <EmptyState icon="🟢" title="No system errors reported" sub="All API services operating normally." /> :
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map(l => (
            <div key={l.id} className="card" style={{ borderLeft: `4px solid ${l.level === 'critical' ? 'var(--danger)' : l.resolved ? 'var(--success)' : 'var(--warning)'}` }}>
              <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                    <span className={`badge ${l.level === 'critical' ? 'badge-rejected' : 'badge-pending'}`}>{l.level.toUpperCase()}</span>
                    <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{l.endpoint || l.source}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>• {fmtDateTime(l.timestamp)}</span>
                    {l.resolved && <span className="badge badge-active">Resolved</span>}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>{l.message}</div>
                  {l.ip_address && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>IP: {l.ip_address}</div>}
                  {l.stack_trace && (
                    <details style={{ marginTop: 8 }}>
                      <summary style={{ fontSize: 12, cursor: 'pointer', color: 'var(--brand-indigo)', fontWeight: 600 }}>View Stack Trace</summary>
                      <pre style={{ marginTop: 6, padding: 10, background: '#1e1e2e', color: '#a6adc8', borderRadius: 'var(--radius-sm)', fontSize: 11, overflowX: 'auto' }}>{l.stack_trace}</pre>
                    </details>
                  )}
                </div>
                {!l.resolved && (
                  <button className="btn btn-outline btn-sm" style={{ color: 'var(--success)', flexShrink: 0 }} onClick={() => resolveLog(l.id)}>✓ Mark Resolved</button>
                )}
              </div>
            </div>
          ))}
        </div>}
    </div>
  );
}

function AdminAuditLog({ toast }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ apiFetch('/api/admin/audit-log').then(d=>setLogs(d.logs||[])).catch(()=>{}).finally(()=>setLoading(false)); },[]);
  const actionColor = a => a.includes('delete')||a.includes('reject')?'var(--danger)':a.includes('approve')||a.includes('reinstate')?'var(--success)':'var(--brand-indigo)';
  return loading ? <div className="page-loading"><Spinner dark/></div> :
    logs.length===0 ? <EmptyState icon="📋" title="No audit logs yet" sub="Actions will be logged here after running the SQL migration."/> :
    <div className="card"><div className="table-wrap"><table>
      <thead><tr><th>Time</th><th>Admin</th><th>Action</th><th>Entity</th></tr></thead>
      <tbody>{logs.map(l=><tr key={l.id}><td className="td-muted" style={{whiteSpace:'nowrap'}}>{fmtDateTime(l.created_at)}</td><td className="td-primary">{l.admin_name}</td><td><span style={{fontSize:12,fontWeight:700,color:actionColor(l.action),fontFamily:'monospace'}}>{l.action}</span></td><td className="td-muted">{l.entity_type}: {l.entity_name||l.entity_id?.substring(0,8)}</td></tr>)}
      </tbody>
    </table></div></div>;
}

// ─── DEMO DATA MANAGEMENT ─────────────────────────────────────────────
function AdminDemoData({ toast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('hostels');

  const load = async () => {
    setLoading(true);
    try {
      const d = await apiFetch('/api/admin/demo-data');
      setData(d.demoData);
    } catch (e) {
      toast(e.message, 'error');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleFlag = async (table, id, currentVal) => {
    try {
      await apiFetch('/api/admin/demo-data/toggle', {
        method: 'PATCH',
        body: JSON.stringify({ table, id, isDemo: !currentVal })
      });
      toast(`Updated demo flag for ${table}`, 'success');
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const archiveDemoHostels = async () => {
    if (!confirm('Hide all demo hostels from public browsing?')) return;
    setBusy(true);
    try {
      await apiFetch('/api/admin/demo-data/archive-all', { method: 'POST' });
      toast('Demo hostels archived', 'info');
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
    setBusy(false);
  };

  const purgeDemoData = async () => {
    if (!confirm('⚠️ Are you SURE you want to permanently purge all demo hostels and profiles?')) return;
    setBusy(true);
    try {
      await apiFetch('/api/admin/demo-data/purge', { method: 'DELETE' });
      toast('Demo data permanently purged', 'success');
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
    setBusy(false);
  };

  const seedDemoData = async () => {
    setBusy(true);
    try {
      await apiFetch('/api/admin/demo-data/seed', { method: 'POST' });
      toast('Sample demo data seeded successfully!', 'success');
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
    setBusy(false);
  };

  if (loading) return <div className="page-loading"><Spinner dark /></div>;
  if (!data) return <EmptyState icon="🧪" title="Demo Data Tools Unavailable" />;

  const hostels = data.hostels || [];
  const userProfiles = data.userProfiles || [];

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div className="stats-grid stats-grid-4">
        <StatCard icon="🏠" iconColor="indigo" value={data.stats.totalHostels} label="Total Hostels" />
        <StatCard icon="🧪" iconColor="amber" value={data.stats.demoHostels} label="Demo Hostels" />
        <StatCard icon="👥" iconColor="green" value={data.stats.totalUsers} label="Total User Profiles" />
        <StatCard icon="🏷️" iconColor="purple" value={data.stats.demoUsers} label="Demo User Profiles" />
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <span className="card-title">🧪 Demo Data Lifecycle & Controls</span>
            <div style={{ fontSize: 13, color: 'var(--text-sub)' }}>Separate presentation/testing records from production user data</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-outline btn-sm" disabled={busy} onClick={archiveDemoHostels}>📦 Hide Demo Hostels</button>
            <button className="btn btn-outline btn-sm" disabled={busy} onClick={seedDemoData}>{busy ? <Spinner /> : '🌱 Seed Sample Demo Data'}</button>
            <button className="btn btn-danger btn-sm" disabled={busy} onClick={purgeDemoData}>🗑️ Purge Demo Data</button>
          </div>
        </div>
        <div className="card-body">
          <div className="tabs" style={{ marginBottom: 16 }}>
            <button className={`tab-btn ${tab === 'hostels' ? 'active' : ''}`} onClick={() => setTab('hostels')}>Hostels ({hostels.length})</button>
            <button className={`tab-btn ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>User Profiles ({userProfiles.length})</button>
          </div>

          {tab === 'hostels' && (
            <div className="table-wrap">
              {hostels.length === 0 ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No hostels in system</div> :
                <table>
                  <thead>
                    <tr><th>Hostel Name</th><th>Location</th><th>Visibility</th><th>Demo Flag</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {hostels.map(h => (
                      <tr key={h.id}>
                        <td className="td-primary">{h.name}</td>
                        <td className="td-muted">{h.location}</td>
                        <td><span className={`badge ${h.is_published ? 'badge-active' : 'badge-suspended'}`}>{h.is_published ? 'Public' : 'Hidden'}</span></td>
                        <td>
                          <span className={`badge ${h.is_demo ? 'badge-pending' : 'badge-verified'}`}>
                            {h.is_demo ? '🧪 Demo Data' : '🏢 Production'}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-outline btn-sm" onClick={() => toggleFlag('hostels', h.id, h.is_demo)}>
                            {h.is_demo ? 'Mark Production' : 'Mark Demo'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>}
            </div>
          )}

          {tab === 'users' && (
            <div className="table-wrap">
              {userProfiles.length === 0 ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No user profiles found</div> :
                <table>
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Role</th><th>Demo Flag</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {userProfiles.map(u => (
                      <tr key={u.id}>
                        <td className="td-primary">{u.name}</td>
                        <td className="td-muted">{u.email}</td>
                        <td><span className="badge badge-info">{u.role}</span></td>
                        <td>
                          <span className={`badge ${u.is_demo ? 'badge-pending' : 'badge-verified'}`}>
                            {u.is_demo ? '🧪 Demo Data' : '👤 Production'}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-outline btn-sm" onClick={() => toggleFlag('user_profiles', u.id, u.is_demo)}>
                            {u.is_demo ? 'Mark Production' : 'Mark Demo'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ================================================================
// ROOT APP — Session management and role routing
// ================================================================
function App() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const { toasts, toast, dismiss } = useToast();

  // On mount: verify existing session
  useEffect(() => {
    const token   = getToken();
    const cached  = getUser();

    if (!token || !cached) { setLoading(false); return; }

    // Validate token with server
    apiFetch('/api/me')
      .then(d => {
        const fresh = { ...cached, ...d.user };
        saveSession(token, getRefresh(), fresh);
        setUser(fresh);
      })
      .catch(async () => {
        // Token invalid — try refresh
        const ok = await tryRefreshToken();
        if (ok) {
          try {
            const d = await apiFetch('/api/me');
            setUser({ ...getUser(), ...d.user });
          } catch { clearSession(); }
        } else {
          clearSession();
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = useCallback(u => {
    setUser(u);
    toast(`Welcome back, ${u.name || 'User'}! Successfully signed in.`, 'success');
  }, [toast]);

  const handleLogout = useCallback(async () => {
    try { await apiFetch('/api/logout', { method: 'POST' }); } catch {}
    clearSession();
    setUser(null);
    toast('You have been signed out.', 'info');
  }, []);

  if (loading) return <PageLoading label="Verifying session…" />;

  if (!user) return (
    <>
      <AuthPage onLogin={handleLogin} />
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  );

  // Force Password Reset Flow
  if (user.requireReset) return (
    <>
      <ForcePasswordResetScreen user={user} onLogout={handleLogout} onResetSuccess={() => setUser({...user, requireReset: false})} toast={toast} />
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  );

  // Manager pending/rejected/suspended
  if (user.role === 'manager' && user.status !== 'active') return (
    <>
      <ManagerPendingScreen user={user} onLogout={handleLogout} />
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  );

  // Student portal
  if (user.role === 'student') return (
    <>
      <StudentPortal user={user} onLogout={handleLogout} toast={toast} />
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  );

  // Manager portal
  if (user.role === 'manager') return (
    <>
      <ManagerPortal user={user} onLogout={handleLogout} toast={toast} />
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  );

  // Admin portal
  if (user.role === 'admin') return (
    <>
      <AdminPortal user={user} onLogout={handleLogout} toast={toast} />
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  );

  // Unknown role fallback
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ fontWeight: 700 }}>Unknown role: {user.role}</h2>
        <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={handleLogout}>Sign Out</button>
      </div>
    </div>
  );
}

// ── Force Password Reset Screen ──────────────────────────────
function ForcePasswordResetScreen({ user, onLogout, onResetSuccess, toast }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async e => {
    e.preventDefault();
    if (password.length < 8) { setErr('Password must be at least 8 characters long.'); return; }
    if (password !== confirm) { setErr('Passwords do not match.'); return; }
    
    setBusy(true); setErr('');
    try {
      await apiFetch('/api/reset-temporary-password', {
        method: 'POST',
        body: JSON.stringify({ newPassword: password })
      });
      toast('Password updated successfully. Welcome aboard!', 'success');
      onResetSuccess();
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  };

  return (
    <div className="glass-theme" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="auth-card premium-glass animate-fadeInUp" style={{ maxWidth: 480, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand-navy)', marginBottom: 8 }}>Update Default Password</h2>
          <p style={{ fontSize: 14, color: 'var(--text-sub)' }}>For security reasons, you must change your temporary password before accessing your {user.role === 'manager' ? 'Hostel Manager' : ''} dashboard.</p>
        </div>
        
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input className="form-input premium-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input className="form-input premium-input" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required />
          </div>
          
          {err && <div className="alert alert-danger" style={{ marginBottom: 16 }}><span className="alert-icon">⚠</span>{err}</div>}
          
          <button type="submit" className="btn btn-primary btn-premium" style={{ width: '100%', padding: '14px 20px' }} disabled={busy}>
            {busy ? <Spinner /> : 'Save New Password & Continue'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button className="btn btn-outline btn-sm" onClick={onLogout} disabled={busy}>Sign Out</button>
        </div>
      </div>
    </div>
  );
}

// Mount
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
