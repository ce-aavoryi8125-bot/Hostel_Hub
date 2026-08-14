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



// ── Theme State Hook ───────────────────────────────────────
function useTheme() {
  const [themeMode, setThemeModeState] = useState(() => {
    try { return localStorage.getItem('hostelhub_theme') || 'light'; } catch { return 'light'; }
  });

  const setThemeMode = useCallback(mode => {
    setThemeModeState(mode);
    try { localStorage.setItem('hostelhub_theme', mode); } catch {}
  }, []);

  const activeTheme = useMemo(() => {
    if (themeMode === 'system') {
      return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    return themeMode === 'dark' ? 'dark' : 'light';
  }, [themeMode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme);
    if (activeTheme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [activeTheme]);

  const toggleTheme = useCallback(() => {
    setThemeMode(activeTheme === 'dark' ? 'light' : 'dark');
  }, [activeTheme, setThemeMode]);

  return { themeMode, setThemeMode, activeTheme, toggleTheme };
}

// ================================================================
// PREMIUM PUBLIC LANDING PAGE & ROLE SELECTION AUTH
// ================================================================
function AuthPage({ onLogin }) {
  const { activeTheme, toggleTheme } = useTheme();
  // On admin.html (data-page="admin"), go straight to admin login — skip public landing
  const isAdminPage = document.body.dataset.page === 'admin';
  const [view, setView] = useState(isAdminPage ? 'admin-login' : 'landing'); // landing | role-select | student-login | student-signup | manager-login | manager-apply | admin-login | forgot | check-email
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [demoPreset, setDemoPreset] = useState(null);

  const handleSelectDemo = (e, p, r) => {
    setDemoPreset({ email: e, password: p, role: r });
  };

  if (view === 'landing') {
    return (
      <>
        <PublicLandingPage setView={setView} onSelectHostel={h => setSelectedHostel(h)} activeTheme={activeTheme} toggleTheme={toggleTheme} />
        {selectedHostel && (
          <StudentHostelDetail hostel={selectedHostel} user={null} toast={() => {}} onClose={() => setSelectedHostel(null)} onBooked={() => setView('role-select')} />
        )}
      </>
    );
  }

  if (view === 'role-select' || ((view === 'student-login' || view === 'student-signup' || view === 'login' || view === 'signup') && selectedHostel)) {
    return (
      <>
        <PublicLandingPage setView={setView} onSelectHostel={h => setSelectedHostel(h)} activeTheme={activeTheme} toggleTheme={toggleTheme} />
        {selectedHostel && (
          <StudentHostelDetail hostel={selectedHostel} user={null} toast={() => {}} onClose={() => setSelectedHostel(null)} onBooked={() => setView('role-select')} />
        )}
        {view === 'role-select' ? (
          <RoleSelectAuthModal setView={setView} onSelectDemo={handleSelectDemo} onClose={() => setView(selectedHostel ? 'landing' : 'landing')} activeTheme={activeTheme} toggleTheme={toggleTheme} />
        ) : (
          <Modal open={true} onClose={() => setView('landing')} title="" size="sm" className="premium-modal">
            <div className="auth-card premium-glass" style={{ padding: 0, boxShadow: 'none', border: 'none', background: 'transparent' }}>
              {(view === 'student-login' || view === 'login') && <LoginForm onLogin={onLogin} setView={setView} roleLabel="Student" demoPreset={demoPreset} />}
              {(view === 'student-signup' || view === 'signup') && <SignupForm onLogin={onLogin} setView={setView} />}
            </div>
          </Modal>
        )}
      </>
    );
  }

  return (
    <div className="auth-page-dark">
      <div className="auth-card-wrapper">
        <AuthIllustration view={view} />
        <div className="auth-right-form-panel">
          {(view === 'student-login' || view === 'login') && <LoginForm onLogin={onLogin} setView={setView} roleLabel="Student" demoPreset={demoPreset} />}
          {(view === 'student-signup' || view === 'signup') && <SignupForm onLogin={onLogin} setView={setView} />}
          {(view === 'manager-login') && <LoginForm onLogin={onLogin} setView={setView} roleLabel="Hostel Manager" demoPreset={demoPreset} />}
          {(view === 'admin-login') && <LoginForm onLogin={onLogin} setView={setView} roleLabel="Administrator" demoPreset={demoPreset} />}
          {(view === 'manager-apply') && <ManagerApplyForm setView={setView} />}
          {view === 'forgot' && <ForgotPassword setView={setView} />}
          {view === 'check-email' && <CheckEmailScreen setView={setView} />}
        </div>
      </div>
    </div>
  );
}

function RoleSelectAuthModal({ setView, onSelectDemo, onClose, activeTheme, toggleTheme }) {
  return (
    <div className="hostelhub-auth-overlay animate-fadeIn">
      <div className="hostelhub-auth-content-wrap">
        {/* Top Header Bar */}
        <div className="hostelhub-auth-top-bar">
          <div className="hostelhub-auth-brand">
            <div className="hostelhub-auth-logo-box">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
                <rect x="10" y="7" width="4" height="3" rx="0.5" fill="currentColor"/>
              </svg>
            </div>
            <span className="hostelhub-auth-brand-name">
              Hostel<span>Hub</span>
            </span>
          </div>

          <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 10 }}>
            {toggleTheme && (
              <button
                type="button"
                className="theme-toggle-btn"
                onClick={toggleTheme}
                title={`Switch to ${activeTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
              >
                <span>{activeTheme === 'dark' ? '☀️' : '🌙'}</span>
                <span>{activeTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            )}
            <button className="hostelhub-auth-close-btn" style={{ position: 'static', transform: 'none' }} onClick={onClose} title="Close Modal">
              ✕
            </button>
          </div>
        </div>

        {/* Title Block */}
        <div className="hostelhub-auth-title-block">
          <h1 className="hostelhub-auth-main-title">
            Welcome to <span className="hostelhub-auth-gradient-text">HostelHub</span>
          </h1>
          <div className="hostelhub-auth-accent-line"></div>
          <p className="hostelhub-auth-sub-title">Select how you would like to access the platform</p>
        </div>

        <div style={{ width: '100%', maxWidth: 780, marginBottom: 24 }}>
          <DemoCredentialsBanner onSelectDemo={(e, p, r) => {
            if (onSelectDemo) onSelectDemo(e, p, r);
            if (r === 'Student') setView('student-login');
            else if (r === 'Hostel Manager') setView('manager-login');
            else setView('admin-login');
          }} />
        </div>

        {/* 2 Portal Cards (Student & Hostel Manager) */}
        <div className="hostelhub-cards-grid">
          {/* Card 1: Student Portal */}
          <div className="hostelhub-portal-card card-student" onClick={() => setView('student-login')}>
            <div className="portal-icon-wrapper icon-student">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                <path d="M12 3L1 9L12 15L23 9L12 3Z" fill="url(#gradCapGrad)" stroke="#c084fc" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M5 13.18V17.5C5 18.88 8.13 20 12 20C15.87 20 19 18.88 19 17.5V13.18" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"/>
                <path d="M23 9V17" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="23" cy="17" r="1.5" fill="#f59e0b"/>
                <defs>
                  <linearGradient id="gradCapGrad" x1="1" y1="3" x2="23" y2="15" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#9333ea"/>
                    <stop offset="1" stopColor="#581c87"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <h3 className="portal-card-title">Student Portal</h3>
            <p className="portal-card-desc">
              Find hostels, compare rooms, schedule physical tours, & book online.
            </p>

            <div className="portal-card-actions">
              <button className="portal-btn btn-student-primary" onClick={(e) => { e.stopPropagation(); setView('student-login'); }}>
                <span>Student Sign In</span>
                <span className="btn-arrow">→</span>
              </button>

              <button className="portal-btn btn-student-secondary" onClick={(e) => { e.stopPropagation(); setView('student-signup'); }}>
                <span style={{ fontSize: 15 }}>👤⁺</span>
                <span>New? Create Account</span>
              </button>
            </div>

            {/* Student Illustration */}
            <div className="portal-card-illustration">
              <svg width="190" height="95" viewBox="0 0 200 100" fill="none">
                {/* Cozy room background with glowing window & sparkles */}
                <rect x="10" y="20" width="45" height="55" rx="4" fill="#1e1b4b" opacity="0.6"/>
                <path d="M10 47H55" stroke="#4c1d95" strokeWidth="1.5"/>
                <path d="M32 20V75" stroke="#4c1d95" strokeWidth="1.5"/>
                {/* Beanbag */}
                <ellipse cx="100" cy="78" rx="42" ry="18" fill="#581c87"/>
                <ellipse cx="100" cy="74" rx="35" ry="14" fill="#6b21a8"/>
                {/* Student sitting */}
                <circle cx="98" cy="46" r="11" fill="#f43f5e"/>
                <path d="M88 64C88 56 108 56 108 64V76H88V64Z" fill="#3b0764"/>
                {/* Book reading glowing */}
                <polygon points="86,60 98,65 110,60 98,56" fill="#fde047"/>
                <circle cx="98" cy="61" r="16" fill="#fef08a" opacity="0.2"/>
                {/* Backpack */}
                <rect x="42" y="60" width="22" height="28" rx="6" fill="#7c3aed"/>
                <rect x="47" y="65" width="12" height="14" rx="3" fill="#a855f7"/>
              </svg>
            </div>
          </div>

          {/* Card 2: Hostel Manager */}
          <div className="hostelhub-portal-card card-manager" onClick={() => setView('manager-login')}>
            <div className="portal-icon-wrapper icon-manager">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                <path d="M3 21H21" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round"/>
                <path d="M5 21V7L12 3L19 7V21" fill="url(#buildingGrad)" stroke="#3b82f6" strokeWidth="1.5"/>
                <rect x="8" y="9" width="3" height="3" rx="0.5" fill="#93c5fd"/>
                <rect x="13" y="9" width="3" height="3" rx="0.5" fill="#93c5fd"/>
                <rect x="8" y="14" width="3" height="3" rx="0.5" fill="#93c5fd"/>
                <rect x="13" y="14" width="3" height="3" rx="0.5" fill="#93c5fd"/>
                <rect x="10" y="18" width="4" height="3" fill="#60a5fa"/>
                <defs>
                  <linearGradient id="buildingGrad" x1="5" y1="3" x2="19" y2="21" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#2563eb"/>
                    <stop offset="1" stopColor="#1e3a8a"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <h3 className="portal-card-title">Hostel Manager</h3>
            <p className="portal-card-desc">
              Manage your hostel, residents, payments, & operations.
            </p>

            <div className="portal-card-actions">
              <button className="portal-btn btn-manager-primary" onClick={(e) => { e.stopPropagation(); setView('manager-login'); }}>
                <span>Manager Sign In</span>
                <span className="btn-arrow">→</span>
              </button>
            </div>

            {/* Hostel Building Night Illustration */}
            <div className="portal-card-illustration">
              <svg width="190" height="95" viewBox="0 0 200 100" fill="none">
                {/* Night sky trees */}
                <circle cx="25" cy="70" r="15" fill="#1e3a8a" opacity="0.6"/>
                <circle cx="175" cy="70" r="15" fill="#1e3a8a" opacity="0.6"/>
                {/* Hostel Building */}
                <rect x="45" y="30" width="110" height="65" rx="6" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5"/>
                {/* Roof */}
                <path d="M40 32L100 10L160 32Z" fill="#1e3a8a"/>
                {/* Lit Windows */}
                <rect x="58" y="42" width="14" height="14" rx="2" fill="#fbbf24" opacity="0.9"/>
                <rect x="82" y="42" width="14" height="14" rx="2" fill="#60a5fa" opacity="0.9"/>
                <rect x="106" y="42" width="14" height="14" rx="2" fill="#fbbf24" opacity="0.9"/>
                <rect x="130" y="42" width="14" height="14" rx="2" fill="#60a5fa" opacity="0.9"/>
                <rect x="58" y="64" width="14" height="14" rx="2" fill="#60a5fa" opacity="0.9"/>
                <rect x="130" y="64" width="14" height="14" rx="2" fill="#fbbf24" opacity="0.9"/>
                {/* Entrance Door */}
                <rect x="92" y="64" width="16" height="31" rx="2" fill="#3b82f6"/>
                <circle cx="100" cy="78" r="8" fill="#fef08a" opacity="0.6"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="hostelhub-auth-footer">
          <div className="hostelhub-auth-badges">
            <span className="badge-check">✓</span>
            <span>Secure</span>
            <span className="dot">•</span>
            <span>Reliable</span>
            <span className="dot">•</span>
            <span>Trusted</span>
          </div>
          <p className="hostelhub-auth-subfooter">Powering seamless hostel management</p>
          <div className="hostelhub-auth-copyright">
            © 2025 HostelHub. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}

function PublicLandingPage({ setView, onSelectHostel, activeTheme, toggleTheme, children }) {
  const [hostels, setHostels] = useState([]);
  const [locations, setLocations] = useState([]);
  const [searchLoc, setSearchLoc] = useState('');
  const [searchGender, setSearchGender] = useState('');
  const [searchPrice, setSearchPrice] = useState('99999');
  const [howStep, setHowStep] = useState('student');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedForAuth, setSelectedForAuth] = useState(null);

  useEffect(() => {
    apiFetch('/api/hostels?verified=true')
      .then(d => setHostels(d.hostels || []))
      .catch(() => {});

    apiFetch('/api/locations')
      .then(d => setLocations(d.locations || []))
      .catch(() => {});
  }, []);

  const demoFeaturedHostels = [
    {
      id: 'banso-royal',
      name: 'Banso Royal Student Lodge',
      location: 'Banso (Main Gate), Tarkwa',
      address: 'Plot 12, UMaT Main Road, Banso, Tarkwa',
      rating: 4.8,
      reviewsCount: 38,
      distanceKm: 0.5,
      price_per_year: 4500,
      verificationStatus: 'verified',
      photos: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80'],
      facilities: ['Wi-Fi', 'Generator', 'Water', 'Security', 'Study Room']
    },
    {
      id: 'ayensu-plaza',
      name: 'Ayensu Plaza Hostel',
      location: 'Ayensu / East Gate, Tarkwa',
      address: 'Opposite UMaT East Gate, Ayensu, Tarkwa',
      rating: 4.7,
      reviewsCount: 29,
      distanceKm: 0.8,
      price_per_year: 5200,
      verificationStatus: 'verified',
      photos: ['https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=900&q=80'],
      facilities: ['Wi-Fi', 'Water', 'Security', 'Common Room', 'AC']
    },
    {
      id: 'gaza-hall',
      name: 'Gaza Student Hall (Mines Section)',
      location: 'Akoon (Mines), Tarkwa',
      address: 'Mines Road, Akoon, Tarkwa',
      rating: 4.6,
      reviewsCount: 42,
      distanceKm: 1.5,
      price_per_year: 3800,
      verificationStatus: 'verified',
      photos: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80'],
      facilities: ['Borehole Water', 'Security', 'Kitchen', 'Study Room']
    },
    {
      id: 'kingdom-hostel',
      name: 'Kingdom Hostel Tarkwa',
      location: 'Brahabebome, Tarkwa',
      address: 'Near Brahabebome Junction, Tarkwa',
      rating: 4.5,
      reviewsCount: 19,
      distanceKm: 2.0,
      price_per_year: 4200,
      verificationStatus: 'verified',
      photos: ['https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'],
      facilities: ['Wi-Fi', 'CCTV', 'Water', 'Generator', 'Parking']
    },
    {
      id: 'evandy-lodge',
      name: 'Evandy Student Lodge',
      location: 'Yenkea, Tarkwa',
      address: 'Yenkea Hill Top, Tarkwa',
      rating: 4.9,
      reviewsCount: 54,
      distanceKm: 1.2,
      price_per_year: 4800,
      verificationStatus: 'verified',
      photos: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80'],
      facilities: ['Wi-Fi', 'AC', 'Generator', 'Laundry', 'Security']
    },
    {
      id: 'pentagon-villa',
      name: 'Pentagon Villa Hostel',
      location: 'Adidome Junction, Tarkwa',
      address: 'Adidome Road, Tarkwa',
      rating: 4.4,
      reviewsCount: 31,
      distanceKm: 1.8,
      price_per_year: 3500,
      verificationStatus: 'verified',
      photos: ['https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=900&q=80'],
      facilities: ['Water', 'Security', 'Common Room', 'Kitchen']
    }
  ];

  const featuredList = hostels.length >= 5 ? hostels : demoFeaturedHostels;
  const [wishlist, setWishlist] = useState([]);

  const toggleWishlist = (hostelId, name, e) => {
    if (e) e.stopPropagation();
    setWishlist(prev => prev.includes(hostelId) ? prev.filter(id => id !== hostelId) : [...prev, hostelId]);
  };

  const handleCardClick = (h) => {
    setSelectedForAuth(h);
    setShowAuthModal(true);
  };

  const handleSearch = () => {
    const el = document.getElementById('featured-hostels');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToSection = (id) => (e) => {
    if (e) e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="pub-landing-page">
      {/* Top Navbar Header matching hostelhub_homepage_reference.png */}
      <nav className="pub-replica-nav">
        <div className="pub-landing-nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="pub-replica-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <span className="pub-replica-logo-text">HostelHub</span>
          <span className="pub-replica-umat-badge">UMaT Tarkwa</span>
        </div>

        <div className="pub-replica-nav-links">
          <a className="pub-replica-nav-link" href="#featured-hostels" onClick={scrollToSection('featured-hostels')}>Explore Hostels</a>
          <a className="pub-replica-nav-link" href="#locations" onClick={scrollToSection('locations')}>Locations</a>
          <a className="pub-replica-nav-link" href="#why-us" onClick={scrollToSection('why-us')}>Why Us</a>
          <a className="pub-replica-nav-link" href="#how-it-works" onClick={scrollToSection('how-it-works')}>How It Works</a>
          <a className="pub-replica-nav-link" href="#testimonials" onClick={scrollToSection('testimonials')}>Reviews</a>
          <a className="pub-replica-nav-link" href="#for-managers" onClick={scrollToSection('for-managers')}>For Managers</a>
        </div>

        <div className="pub-replica-nav-actions">
          {toggleTheme && (
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={`Switch to ${activeTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              <span>{activeTheme === 'dark' ? '☀️' : '🌙'}</span>
              <span>{activeTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          )}
          <button className="pub-replica-btn-signin" onClick={() => setView('role-select')}>Sign In</button>
          <button className="pub-replica-btn-getstarted" onClick={() => setView('role-select')}>Get Started</button>
        </div>
      </nav>

      {/* Hero Section — GHHostels-Inspired Photography Banner */}
      <section className="pub-ref-hero-section">
        <div className="pub-ref-hero-bg-img" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=1920&q=80')" }}></div>
        <div className="pub-ref-hero-overlay"></div>

        <div className="pub-ref-hero-content">
          <div className="pub-ref-hero-badge">
            <span>🏛️ UMAT TARKWA STUDENT ACCOMMODATION MARKETPLACE</span>
          </div>

          <h1 className="pub-ref-hero-title">
            Find a hostel you'll feel at home in near <span className="pub-ref-violet-accent">UMaT, Tarkwa</span>
          </h1>

          <p className="pub-ref-hero-sub">
            Discover physically inspected and UMaT-verified student accommodation around Tarkwa. Compare room prices, view photo galleries, schedule physical tours, and receive official Mobile Money digital receipts — with zero middleman agent fees.
          </p>

          {/* Standalone Marketplace Search Panel */}
          <div className="pub-ref-search-glass-card">
            <div className="pub-ref-search-field">
              <span className="pub-ref-search-icon">📍</span>
              <select 
                value={searchLoc} 
                onChange={e => setSearchLoc(e.target.value)}
                style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: 14, fontWeight: 600, color: '#0f172a' }}
              >
                <option value="">All Locations in Tarkwa</option>
                {locations.map(loc => (
                  <option key={loc.id || loc.name} value={loc.name}>{loc.name}</option>
                ))}
              </select>
            </div>

            <div className="pub-ref-search-field">
              <span className="pub-ref-search-icon">👥</span>
              <select value={searchGender} onChange={e => setSearchGender(e.target.value)}>
                <option value="">All Gender Types</option>
                <option value="Co-ed">Co-ed Hostels</option>
                <option value="Male-only">Male Only</option>
                <option value="Female-only">Female Only</option>
              </select>
            </div>

            <button className="pub-ref-search-btn" onClick={handleSearch}>
              🔍 Search Hostels
            </button>
          </div>

          {/* 4 Trust Feature Cards */}
          <div className="pub-ref-props-grid">
            <div className="pub-ref-prop-item">
              <div className="pub-ref-prop-icon">🛡️</div>
              <div>
                <div className="pub-ref-prop-title">Physically Inspected</div>
                <div className="pub-ref-prop-sub">Verified campus officers</div>
              </div>
            </div>

            <div className="pub-ref-prop-item">
              <div className="pub-ref-prop-icon">📍</div>
              <div>
                <div className="pub-ref-prop-title">Near UMaT Campus</div>
                <div className="pub-ref-prop-sub">Minutes to lecture halls</div>
              </div>
            </div>

            <div className="pub-ref-prop-item">
              <div className="pub-ref-prop-icon">👛</div>
              <div>
                <div className="pub-ref-prop-title">Direct Manager Pricing</div>
                <div className="pub-ref-prop-sub">Zero agent fees</div>
              </div>
            </div>

            <div className="pub-ref-prop-item">
              <div className="pub-ref-prop-icon">⚡</div>
              <div>
                <div className="pub-ref-prop-title">Instant Digital Receipts</div>
                <div className="pub-ref-prop-sub">Verified MoMo payments</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Stats Strip */}
      <div className="pub-ref-stats-strip-container">
        <div className="pub-ref-stats-strip">
          <div className="pub-ref-stat-item">
            <div className="pub-ref-stat-icon">🏢</div>
            <div>
              <div className="pub-ref-stat-num">{hostels.length > 0 ? hostels.length : '120+'}</div>
              <div className="pub-ref-stat-lbl">Listed Hostels</div>
            </div>
          </div>

          <div className="pub-ref-stat-item">
            <div className="pub-ref-stat-icon">📍</div>
            <div>
              <div className="pub-ref-stat-num">{locations.length > 0 ? locations.length : '15+'}</div>
              <div className="pub-ref-stat-lbl">Tarkwa Locations</div>
            </div>
          </div>

          <div className="pub-ref-stat-item">
            <div className="pub-ref-stat-icon">👥</div>
            <div>
              <div className="pub-ref-stat-num">5,000+</div>
              <div className="pub-ref-stat-lbl">UMaT Students Served</div>
            </div>
          </div>

          <div className="pub-ref-stat-item">
            <div className="pub-ref-stat-icon">🛡️</div>
            <div>
              <div className="pub-ref-stat-num">100%</div>
              <div className="pub-ref-stat-lbl">Verified Listings</div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Hostels Near UMaT Section */}
      <section className="pub-section" id="featured-hostels">
        <div className="pub-ref-section-header">
          <div>
            <h2 className="pub-ref-section-title">Verified Hostels Near UMaT</h2>
            <div className="pub-ref-section-sub">Physically inspected accommodations close to UMaT lecture halls.</div>
          </div>
          <a className="pub-ref-view-all" href="#locations">View all hostels &rarr;</a>
        </div>

        <div className="pub-ref-hostel-grid">
          {featuredList.slice(0, 6).map(h => (
            <div key={h.id} className="pub-ref-hostel-card">
              <div className="pub-ref-card-img-wrap">
                <img 
                  className="pub-ref-card-img" 
                  src={h.photos?.[0] || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80'} 
                  alt={h.name} 
                  loading="lazy" 
                />
                <div className="pub-ref-badge-top-left">
                  {['verified', 'featured'].includes(h.verificationStatus || h.verification_status) ? (
                    <span className="pub-ref-badge-verified">🛡️ UMaT Verified</span>
                  ) : (
                    <span className="pub-ref-badge-pending">⏳ Verification pending</span>
                  )}
                </div>
                <button 
                  className="pub-ref-fav-btn" 
                  onClick={e => toggleWishlist(h.id, h.name, e)}
                  title={wishlist.includes(h.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                  {wishlist.includes(h.id) ? '❤️' : '♡'}
                </button>
              </div>

              <div className="pub-ref-card-body">
                <h3 className="pub-ref-hostel-name">{h.name}</h3>
                <div className="pub-ref-hostel-loc">📍 {h.location}</div>

                <div className="pub-ref-specs-row" style={{ marginTop: 8, marginBottom: 12 }}>
                  <div className="pub-ref-spec-item">
                    <span>🚶 {h.distanceKm || h.distance_km || 0.8} km to UMaT</span>
                  </div>
                  <div className="pub-ref-spec-item">
                    <span>from <strong>{fmtCurrency(h.price_per_year || h.pricePerYear || 3500)}</strong>/yr</span>
                  </div>
                </div>

                <button className="pub-ref-details-btn" onClick={() => handleCardClick(h)}>
                  View Hostel Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Explore Hostels by Location Section (Dynamically driven by locations dataset) */}
      <section className="pub-section" id="locations">
        <div className="pub-ref-section-header">
          <div>
            <h2 className="pub-ref-section-title">Explore Hostels by Location Zone</h2>
            <div className="pub-ref-section-sub">Discover student residential neighborhoods in Tarkwa near UMaT.</div>
          </div>
          <a className="pub-ref-view-all" href="#locations">View all locations &rarr;</a>
        </div>

        <div className="pub-ref-location-grid">
          {(locations.length > 0 ? locations : [
            { name: 'Banso (Main Gate)', hostel_count: 12, distance_km: 0.5 },
            { name: 'Akoon (Mines)', hostel_count: 6, distance_km: 1.5 },
            { name: 'Adidome Junction', hostel_count: 9, distance_km: 1.8 },
            { name: 'Brahabebome', hostel_count: 8, distance_km: 2.0 },
            { name: 'Yenkea', hostel_count: 11, distance_km: 1.2 },
          ]).slice(0, 6).map((loc, idx) => {
            const locPhotos = [
              'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=700&q=80',
              'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=700&q=80',
              'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=700&q=80',
              'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=700&q=80',
              'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=700&q=80'
            ];
            return (
              <div key={loc.id || loc.name} className="pub-ref-loc-card" onClick={() => { setSearchLoc(loc.name); handleSearch(); }}>
                <div className="pub-ref-loc-img-wrap">
                  <img src={locPhotos[idx % locPhotos.length]} alt={loc.name} className="pub-ref-loc-img" />
                </div>
                <div className="pub-ref-loc-info">
                  <div className="pub-ref-loc-name">📍 {loc.name}</div>
                  <div className="pub-ref-loc-cnt">{loc.hostel_count || 8} Verified Hostels • {loc.distance_km || loc.distanceKm || 1.2} km to UMaT</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why Choose HostelHub Section */}
      <section className="pub-section" id="why-us">
        <div className="pub-ref-section-header" style={{ textAlign: 'center', display: 'block' }}>
          <h2 className="pub-ref-section-title">Built Specially for UMaT Students</h2>
          <div className="pub-ref-section-sub">Solving student accommodation challenges with transparency and trust.</div>
        </div>

        <div className="pub-ref-why-grid">
          {[
            ['🛡️', '100% Physical Verification', 'Administrators physically inspect every hostel before issuing a verified badge.'],
            ['📅', 'Schedule Guided Physical Tours', 'Request a physical tour on your preferred date and time slot before paying.'],
            ['📷', 'Categorized Room Galleries', 'View actual room photos categorized for 1-in-a-room, 2-in-a-room, kitchen & washroom.'],
            ['💳', 'Transparent Payment Receipts', 'Submit payment proof online and get official digital PDF receipts automatically on manager approval.'],
            ['🔧', 'Maintenance Issue Tracking', 'Submit maintenance requests with Before & After repair photo uploads to ensure fast fixes.'],
            ['🚫', 'Zero Illegal Agent Scams', 'Connect directly with verified hostel managers without paying illegal middleman fees.']
          ].map(([icon, title, desc]) => (
            <div key={title} className="pub-ref-why-card">
              <div className="pub-ref-why-icon">{icon}</div>
              <h3 className="pub-ref-why-title">{title}</h3>
              <p className="pub-ref-why-desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How HostelHub Works Section */}
      <section className="pub-section" id="how-it-works">
        <div className="pub-ref-section-header" style={{ textAlign: 'center', display: 'block' }}>
          <span className="pub-ref-tag">SIMPLE & TRANSPARENT</span>
          <h2 className="pub-ref-section-title" style={{ marginTop: 6 }}>How HostelHub Works</h2>
          <div className="pub-ref-section-sub">A seamless journey from hostel discovery to official move-in.</div>
        </div>

        <div className="pub-ref-how-grid">
          {[
            ['1', '🔍', 'Search & Explore', 'Search hostels by Tarkwa location, room category, budget, and distance from UMaT campus.'],
            ['2', '🛡️', 'View Verified Details', 'Browse verified photos, room availability, amenities, and distance to lecture halls.'],
            ['3', '👤', 'Create an Account', 'Sign up as a UMaT student and connect directly with verified hostel managers.'],
            ['4', '🔑', 'Book & Move In', 'Reserve your room, upload payment proof, and receive your official digital receipt & key.']
          ].map(([num, icon, title, desc]) => (
            <div key={num} className="pub-ref-how-card">
              <div className="pub-ref-how-step-num">{num}</div>
              <div className="pub-ref-how-icon">{icon}</div>
              <h3 className="pub-ref-how-title">{title}</h3>
              <p className="pub-ref-how-desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Own or Manage a Hostel Banner */}
      <section className="pub-section" id="for-managers">
        <div className="pub-ref-manager-banner">
          <div className="pub-ref-manager-content">
            <h2 className="pub-ref-manager-title">Own or Manage a Hostel in Tarkwa?</h2>
            <p className="pub-ref-manager-sub">
              List your hostel on HostelHub and reach 1,000s of UMaT students looking for accommodation.
            </p>
            <button className="pub-ref-manager-btn" onClick={() => setView('manager-login')}>
              🚀 List Your Hostel
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials / Reviews Section */}
      <section className="pub-section" id="testimonials">
        <div className="pub-ref-section-header">
          <div>
            <h2 className="pub-ref-section-title">Loved by UMaT Students</h2>
            <div className="pub-ref-section-sub">Real experiences from students living in verified Tarkwa hostels.</div>
          </div>
          <a className="pub-ref-view-all" href="#testimonials">View all reviews &rarr;</a>
        </div>

        <div className="pub-ref-review-grid">
          {[
            {
              stars: '⭐⭐⭐⭐⭐',
              text: '"HostelHub made it so easy to find a safe and affordable place close to campus. Highly recommended!"',
              name: 'Kwame Mensah',
              sub: 'Level 300, Mechanical Engineering',
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80'
            },
            {
              stars: '⭐⭐⭐⭐⭐',
              text: '"I found my hostel within a day. The information is accurate and the hostels are actually verified."',
              name: 'Ama Serwaa',
              sub: 'Level 200, Computer Science',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
            },
            {
              stars: '⭐⭐⭐⭐⭐',
              text: '"Verified listings give me confidence. Great platform for every UMaT student!"',
              name: 'Kofi Boateng',
              sub: 'Level 400, Mining Engineering',
              avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80'
            }
          ].map(r => (
            <div key={r.name} className="pub-ref-review-card">
              <div className="pub-ref-review-stars">{r.stars}</div>
              <p className="pub-ref-review-text">{r.text}</p>
              <div className="pub-ref-review-user">
                <img src={r.avatar} alt={r.name} className="pub-ref-review-avatar" />
                <div>
                  <div className="pub-ref-review-name">{r.name}</div>
                  <div className="pub-ref-review-sub">{r.sub}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer matching hostelhub_homepage_reference.png */}
      <footer className="pub-ref-footer">
        <div className="pub-ref-footer-inner">
          <div className="pub-ref-footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div className="pub-replica-logo-icon">🏠</div>
              <span style={{ fontSize: 20, fontWeight: 900, color: '#ffffff' }}>HostelHub</span>
            </div>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, maxWidth: 280 }}>
              The official verified student accommodation discovery and booking platform for the University of Mines and Technology (UMaT), Tarkwa, Ghana.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <span className="pub-ref-social-icon">FB</span>
              <span className="pub-ref-social-icon">X</span>
              <span className="pub-ref-social-icon">IG</span>
              <span className="pub-ref-social-icon">YT</span>
            </div>
          </div>

          <div className="pub-ref-footer-col">
            <div className="pub-ref-footer-head">Quick Links</div>
            <a href="#featured-hostels">Explore Hostels</a>
            <a href="#locations">Campus Locations</a>
            <a href="#why-us">Why Us</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#testimonials">Reviews</a>
          </div>

          <div className="pub-ref-footer-col">
            <div className="pub-ref-footer-head">For Students</div>
            <a onClick={() => setView('student-signup')}>Create Account</a>
            <a onClick={() => setView('student-login')}>Sign In</a>
            <a href="#why-us">Safety Tips</a>
            <a href="#how-it-works">FAQs</a>
            <a href="#for-managers">Contact Us</a>
          </div>

          <div className="pub-ref-footer-col">
            <div className="pub-ref-footer-head">For Managers</div>
            <a onClick={() => setView('manager-login')}>List Your Hostel</a>
            <a onClick={() => setView('manager-login')}>Manager Login</a>
            <a href="#for-managers">Guidelines</a>
            <a href="#for-managers">Support</a>
          </div>

          <div className="pub-ref-footer-col">
            <div className="pub-ref-footer-head">Contact Us</div>
            <div style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 6 }}>📞 +233 24 123 4567</div>
            <div style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 6 }}>✉️ support@hostelhub.com</div>
            <div style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 16 }}>📍 UMaT, Tarkwa, Ghana</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="pub-ref-app-badge">App Store</button>
              <button className="pub-ref-app-badge">Google Play</button>
            </div>
          </div>
        </div>

        <div className="pub-ref-footer-bottom">
          <div>© 2026 HostelHub — University of Mines and Technology (UMaT), Tarkwa. All rights reserved.</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <span>Privacy Policy</span>
            <span>Terms of Use</span>
          </div>
        </div>
      </footer>

      {/* Authentication Gate Modal (Instruction #11) */}
      {showAuthModal && (
        <Modal open={true} onClose={() => setShowAuthModal(false)} title="🔒 Sign In to Access Hostel Details" size="md">
          <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#eff6ff', color: '#6366f1', display: 'grid', placeItems: 'center', fontSize: 32, margin: '0 auto 16px' }}>🔒</div>
            <h3 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 8px', color: 'var(--text)' }}>
              Sign In to View Hostel Details
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-sub)', maxWidth: 420, margin: '0 auto 24px', lineHeight: 1.6 }}>
              Please create a free UMaT student account or sign in to view room photos, amenities, schedule physical tours, and complete your booking for <strong>{selectedForAuth?.name || 'this hostel'}</strong>.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-outline" style={{ padding: '11px 22px', borderRadius: 10 }} onClick={() => { setShowAuthModal(false); setView('student-login'); }}>
                Sign In
              </button>
              <button className="btn btn-primary" style={{ padding: '11px 24px', borderRadius: 10 }} onClick={() => { setShowAuthModal(false); setView('student-signup'); }}>
                Create Account
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AuthIllustration({ view }) {
  return (
    <div className="auth-left-illustration">
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        <svg viewBox="0 0 500 480" width="100%" height="100%" style={{ maxHeight: 420, filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.45))' }}>
          <defs>
            <linearGradient id="phoneGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1e2230" />
              <stop offset="100%" stopColor="#151722" />
            </linearGradient>
            <linearGradient id="screenGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#282c3c" />
              <stop offset="100%" stopColor="#1a1d29" />
            </linearGradient>
            <linearGradient id="purpleGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="lockGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#000000" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Background Ambient Foliage & Geometry */}
          <path d="M 40,320 Q 20,220 80,180 Q 140,240 100,340 Z" fill="#1e293b" opacity="0.4" />
          <path d="M 60,340 Q 30,260 110,230 Q 160,290 120,380 Z" fill="#0f172a" opacity="0.6" />
          <circle cx="410" cy="340" r="28" fill="#1e2230" />
          
          {/* Potted Plant Right */}
          <path d="M 395,350 L 425,350 L 420,390 L 400,390 Z" fill="#6366f1" opacity="0.8" />
          <path d="M 410,350 Q 380,310 370,270 Q 420,300 410,350 Z" fill="#14b8a6" />
          <path d="M 410,350 Q 440,310 450,270 Q 400,300 410,350 Z" fill="#0d9488" />
          <path d="M 410,350 Q 410,290 410,250 Q 425,290 410,350 Z" fill="#2dd4bf" />

          {/* Center Smartphone Mockup */}
          <g filter="url(#shadow)">
            <rect x="155" y="55" width="190" height="370" rx="32" fill="url(#phoneGrad)" stroke="#373c52" strokeWidth="4" />
            <rect x="165" y="65" width="170" height="350" rx="24" fill="url(#screenGrad)" />
            {/* Speaker notch */}
            <rect x="220" y="73" width="60" height="10" rx="5" fill="#12141d" />
            
            {/* Screen UI Elements */}
            {/* User Profile Avatar */}
            <circle cx="250" cy="115" r="18" fill="#3b4259" />
            <path d="M 240,113 C 240,107 245,103 250,103 C 255,103 260,107 260,113 Z" fill="#a5b4fc" />
            <path d="M 234,130 C 234,121 241,118 250,118 C 259,118 266,121 266,130 Z" fill="#a5b4fc" />

            {/* Form Placeholder lines on screen */}
            <rect x="185" y="148" width="130" height="8" rx="4" fill="#3b4259" />
            <rect x="185" y="165" width="130" height="14" rx="4" fill="#242838" stroke="#3b4259" strokeWidth="1" />
            <rect x="185" y="195" width="130" height="8" rx="4" fill="#3b4259" />
            <rect x="185" y="212" width="130" height="14" rx="4" fill="#242838" stroke="#3b4259" strokeWidth="1" />

            {/* Password Dot Dots */}
            <circle cx="198" cy="219" r="2.5" fill="#818cf8" />
            <circle cx="206" cy="219" r="2.5" fill="#818cf8" />
            <circle cx="214" cy="219" r="2.5" fill="#818cf8" />
            <circle cx="222" cy="219" r="2.5" fill="#818cf8" />
            <circle cx="230" cy="219" r="2.5" fill="#818cf8" />
            <circle cx="238" cy="219" r="2.5" fill="#818cf8" />

            {/* Screen Primary Button */}
            <rect x="185" y="244" width="130" height="26" rx="8" fill="url(#purpleGrad)" />
            <rect x="225" y="253" width="50" height="8" rx="4" fill="#ffffff" opacity="0.9" />

            {/* Room Card Item inside app */}
            <rect x="185" y="285" width="130" height="58" rx="10" fill="#242838" stroke="#373c52" strokeWidth="1" />
            <rect x="193" y="293" width="40" height="42" rx="6" fill="#373c52" />
            <rect x="240" y="296" width="65" height="7" rx="3.5" fill="#e2e8f0" />
            <rect x="240" y="308" width="45" height="5" rx="2.5" fill="#94a3b8" />
            <rect x="240" y="322" width="35" height="8" rx="4" fill="#22c55e" />
          </g>

          {/* Floating 3D Lock Badge Top Right of Phone */}
          <g transform="translate(295, 30)" filter="url(#shadow)">
            <rect x="0" y="0" width="70" height="70" rx="20" fill="url(#lockGrad)" />
            {/* Lock Arch */}
            <path d="M 23,32 L 23,24 C 23,17 47,17 47,24 L 47,32" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
            <rect x="18" y="30" width="34" height="26" rx="6" fill="#ffffff" />
            <circle cx="35" cy="41" r="3.5" fill="#4f46e5" />
            <path d="M 35,43 L 35,49" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* Floating Verified Notification Bubble Right */}
          <g transform="translate(325, 175)" filter="url(#shadow)">
            <rect x="0" y="0" width="44" height="44" rx="14" fill="#22c55e" />
            <path d="M 14,22 L 20,28 L 30,16" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          {/* Sitting Student Character Left */}
          <g transform="translate(45, 250)">
            {/* Beanbag chair */}
            <path d="M 10,70 C 0,110 80,135 110,95 C 130,70 100,45 70,50 Z" fill="#2d3348" />
            {/* Student Body (Purple Hoodie) */}
            <path d="M 45,45 C 35,45 30,65 35,85 L 85,85 C 90,65 80,45 70,45 Z" fill="#6366f1" />
            {/* Head */}
            <circle cx="58" cy="28" r="13" fill="#fbcfe8" />
            <path d="M 48,24 C 48,15 68,15 68,24 C 68,18 53,18 48,24 Z" fill="#1e1b4b" />
            {/* Legs */}
            <path d="M 40,85 L 90,85 C 100,85 115,100 125,100" stroke="#f8fafc" strokeWidth="12" strokeLinecap="round" />
            {/* Laptop */}
            <path d="M 60,65 L 90,65 L 95,78 L 55,78 Z" fill="#cbd5e1" />
            <rect x="62" y="50" width="26" height="16" rx="3" fill="#e2e8f0" transform="rotate(-10 75 58)" />
          </g>

          {/* Standing Female Student Right */}
          <g transform="translate(315, 205)">
            {/* Head & Hair */}
            <circle cx="35" cy="30" r="12" fill="#fed7aa" />
            <path d="M 23,26 C 20,10 48,10 47,26 C 47,15 28,15 23,26 Z" fill="#1e1b4b" />
            <circle cx="37" cy="105" width="7" height="40" fill="#fed7aa" rx="3" />
            {/* Phone in hand */}
            <rect x="14" y="55" width="10" height="18" rx="2" fill="#e2e8f0" transform="rotate(20 19 64)" />
          </g>
        </svg>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <div style={{ color: '#ffffff', fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em', marginBottom: 4 }}>
            Verified Student Accommodation
          </div>
          <div style={{ color: '#94a3b8', fontSize: 13, maxWidth: 320, lineHeight: 1.5 }}>
            Book 100% physically verified UMaT Tarkwa hostels securely with zero agent middleman scams.
          </div>
        </div>
      </div>
    </div>
  );
}

/// ── Quick Demo Login Banner Component ───────────────────────────
function DemoCredentialsBanner({ onSelectDemo }) {
  return (
    <div className="demo-credentials-banner animate-fadeIn" style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
      <div className="demo-banner-head" style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-heading)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>⚡ HOSTEL HUB DEMO ACCESS — Click to Auto-Login:</span>
      </div>
      <div className="demo-pills-row" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="demo-pill"
          onClick={() => onSelectDemo && onSelectDemo('student@hostelhub.dev', 'Student@Hub2024!', 'Student')}
          title="Login as Demo Student"
        >
          <span>🎓 Student Demo</span>
          <code>student@hostelhub.dev</code>
        </button>

        <button
          type="button"
          className="demo-pill"
          onClick={() => onSelectDemo && onSelectDemo('manager@hostelhub.dev', 'Manager@Hub2024!', 'Hostel Manager')}
          title="Login as Demo Manager"
        >
          <span>🏢 Manager Demo</span>
          <code>manager@hostelhub.dev</code>
        </button>

        <button
          type="button"
          className="demo-pill"
          onClick={() => onSelectDemo && onSelectDemo('admin@hostelhub.dev', 'Admin@HostelHub2024!', 'Administrator')}
          title="Login as Demo Administrator"
        >
          <span>🔑 Admin Demo</span>
          <code>admin@hostelhub.dev</code>
        </button>
      </div>
    </div>
  );
}

// ── Unified Login Form Component ──────────────────────────────
function LoginForm({ onLogin, setView, roleLabel = 'Student', demoPreset = null }) {
  const [email, setEmail]     = useState(() => demoPreset?.email || localStorage.getItem('hh_remember_email') || '');
  const [role, setRole]       = useState(() => demoPreset?.role || roleLabel);
  const [password, setPassword] = useState(() => demoPreset?.password || '');
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('hh_remember_email'));
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy]       = useState(false);
  const [err, setErr]         = useState('');

  useEffect(() => {
    if (demoPreset) {
      if (demoPreset.email) setEmail(demoPreset.email);
      if (demoPreset.password) setPassword(demoPreset.password);
      if (demoPreset.role) setRole(demoPreset.role);
    }
  }, [demoPreset]);

  const handleFillDemo = async (demoEmail, demoPassword, demoRole) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setRole(demoRole);
    setErr('');
    setBusy(true);
    try {
      const data = await apiFetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email: demoEmail.trim().toLowerCase(), password: demoPassword })
      });
      saveSession(data.token, data.refresh_token, data.user);
      onLogin(data.user);
    } catch (e) {
      setErr(e.message === 'Invalid email or password' ? 'Incorrect email or password.' : e.message);
    } finally {
      setBusy(false);
    }
  };

  const submit = async e => {
    e.preventDefault();
    if (!email || !password) { setErr('Please enter your email and password.'); return; }
    setBusy(true); setErr('');
    try {
      const data = await apiFetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      if (rememberMe) {
        localStorage.setItem('hh_remember_email', email.trim());
      } else {
        localStorage.removeItem('hh_remember_email');
      }
      saveSession(data.token, data.refresh_token, data.user);
      onLogin(data.user);
    } catch (e) {
      setErr(e.message === 'Invalid email or password' ? 'Incorrect email or password. Please try again.' : e.message);
    }
    setBusy(false);
  };

  return (
    <div style={{ width: '100%', maxWidth: 440, margin: '0 auto' }}>
      {/* Top Header Row with Logo & Home Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setView('landing')}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'grid', placeItems: 'center', fontSize: 18, color: '#fff', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}>
            🏠
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-heading)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Hostel<span style={{ color: '#818cf8' }}>Hub</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              UMaT Tarkwa
            </div>
          </div>
        </div>

        <button 
          onClick={() => setView('landing')} 
          style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', color: 'var(--text)', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease' }}
        >
          ← Home
        </button>
      </div>

      {/* Main Titles */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.03em', margin: '0 0 4px 0' }}>
          Welcome back
        </h1>
        <div style={{ fontSize: 14, color: 'var(--text-sub)' }}>
          New here?{' '}
          <span 
            style={{ color: 'var(--brand-indigo)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }} 
            onClick={() => setView(role === 'Hostel Manager' ? 'manager-apply' : 'signup')}
          >
            {role === 'Hostel Manager' ? 'Apply for Hostel Listing' : 'Book a Room Now'}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <DemoCredentialsBanner onSelectDemo={handleFillDemo} />
      </div>

      {/* Role Selection Tabs — Admin tab only shown on /admin page */}
      <div className="dark-role-tabs">
        <button 
          type="button" 
          className={`dark-role-tab-btn ${role === 'Student' ? 'active' : ''}`} 
          onClick={() => setRole('Student')}
        >
          🎓 Student
        </button>
        <button 
          type="button" 
          className={`dark-role-tab-btn ${role === 'Hostel Manager' ? 'active' : ''}`} 
          onClick={() => setRole('Hostel Manager')}
        >
          🏢 Manager
        </button>
        {document.body.dataset.page === 'admin' && (
          <button 
            type="button" 
            className={`dark-role-tab-btn ${role === 'Administrator' ? 'active' : ''}`} 
            onClick={() => setRole('Administrator')}
          >
            🔑 Admin
          </button>
        )}
      </div>

      {/* Form */}
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="dark-form-group" style={{ marginBottom: 0 }}>
          <label className="dark-form-label">Enter email id</label>
          <div className="dark-input-wrapper">
            <input 
              type="email" 
              className="dark-form-input" 
              placeholder="e.g. student@umat.edu.gh"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              autoFocus 
              required 
            />
          </div>
        </div>

        <div className="dark-form-group" style={{ marginBottom: 0 }}>
          <label className="dark-form-label">Enter password</label>
          <div className="dark-input-wrapper">
            <input 
              type={showPwd ? 'text' : 'password'} 
              className="dark-form-input" 
              placeholder="Enter password"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              style={{ paddingRight: 42 }}
            />
            <button 
              type="button" 
              className="dark-pwd-toggle" 
              onClick={() => setShowPwd(!showPwd)} 
              aria-label="Toggle password"
            >
              {showPwd ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        {/* Checkbox and Forgot Password Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
          <label className="dark-checkbox-label">
            <input 
              type="checkbox" 
              checked={rememberMe} 
              onChange={e => setRememberMe(e.target.checked)} 
            />
            <span>Remember me?</span>
          </label>
          
          <span 
            style={{ fontSize: 13, color: '#818cf8', fontWeight: 600, cursor: 'pointer' }} 
            onClick={() => setView('forgot')}
          >
            Forgot password?
          </span>
        </div>

        {/* Error Alert */}
        {err && (
          <div className="alert alert-danger" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '12px 14px', borderRadius: 10, fontSize: 13 }}>
            <span className="alert-icon">⚠</span> {err}
          </div>
        )}

        {/* Primary Action Button */}
        <button 
          type="submit" 
          className="dark-btn-primary" 
          disabled={busy}
          style={{ marginTop: 4 }}
        >
          {busy ? <Spinner /> : 'Login'}
        </button>
      </form>

      {/* Footer Copyright Wording */}
      <div style={{ marginTop: 24, fontSize: 11, color: '#64748b', textAlign: 'center', borderTop: '1px solid #282b3a', paddingTop: 16 }}>
        © 2023–2026 Student Room Book by HostelHub • UMaT Tarkwa
      </div>
    </div>
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

      <DemoCredentialsBanner onSelectDemo={(e, p, r) => setView('login')} />

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
              <input className="form-input premium-input" value={form.institution} onChange={set('institution')} style={{ cursor: 'not-allowed' }} readOnly />
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
    <div style={{ width: '100%', maxWidth: 420, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setView('landing')}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'grid', placeItems: 'center', fontSize: 18, color: '#fff' }}>
            🏠
          </div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#ffffff' }}>Hostel<span style={{ color: '#818cf8' }}>Hub</span></div>
        </div>
        <button onClick={() => setView('login')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#cbd5e1', padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer' }}>
          ← Back
        </button>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#ffffff', margin: '0 0 6px 0' }}>Forgot password?</h1>
        <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>Enter your email and we'll send a reset link.</p>
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="dark-form-group" style={{ marginBottom: 0 }}>
          <label className="dark-form-label">Enter email id</label>
          <div className="dark-input-wrapper">
            <input className="dark-form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
          </div>
        </div>
        {err && <div className="alert alert-danger" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '12px 14px', borderRadius: 10, fontSize: 13 }}><span className="alert-icon">⚠</span>{err}</div>}
        <button type="submit" className="dark-btn-primary" disabled={busy}>
          {busy ? <Spinner /> : 'Send Reset Link'}
        </button>
      </form>
    </div>
  );
}

function CheckEmailScreen({ setView, email }) {
  return (
    <div style={{ width: '100%', maxWidth: 420, margin: '0 auto', textAlign: 'center', padding: '24px 0' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>📬</div>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: '#ffffff', marginBottom: 12 }}>Check your email</h2>
      <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 28, lineHeight: 1.6 }}>
        {email ? `We sent a link to ${email}.` : 'A reset link has been sent to your email.'} Click it to reset your password.
      </p>
      <button className="dark-btn-primary" style={{ background: '#333748', boxShadow: 'none' }} onClick={() => setView('login')}>
        ← Back to sign in
      </button>
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
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('hostelhub_theme') || 'light');
  const [showAppearance, setShowAppearance] = useState(false);

  useEffect(() => {
    let active = themeMode;
    if (themeMode === 'system') {
      active = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', active);
    if (active === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [themeMode]);

  const shellClass = role === 'admin' ? 'admin-shell' : role === 'manager' ? 'manager-shell' : '';

  return (
    <div className={`dashboard-shell ${shellClass}`}>
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo-group">
            <div className="sidebar-logo">🏠</div>
            <div>
              <div className="sidebar-brand-name">Hostel<span>Hub</span></div>
              <div className="sidebar-brand-sub">{role === 'admin' ? 'Admin Console' : role === 'manager' ? 'Manager Portal' : 'Student Portal'}</div>
            </div>
          </div>
          <button className="sidebar-collapse-btn" title="Collapse Sidebar">«</button>
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
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-user-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'User'}</div>
              <div className="sidebar-user-role">{role === 'admin' ? 'Administrator' : role === 'manager' ? 'Hostel Manager' : 'Student'}</div>
            </div>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>˅</span>
          </div>
          <button className="sidebar-logout" onClick={onLogout}>🚪 Sign Out</button>
        </div>
      </aside>

      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)}>☰</button>
          <div>
            <div className="topbar-title">{title}</div>
            {subtitle && <div className="topbar-sub">{subtitle}</div>}
          </div>
        </div>

        <div className="topbar-actions">
          {/* Topbar Search Input */}
          <div className="location-search-box" style={{ padding: '7px 14px', minWidth: 200 }}>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>🔍</span>
            <input 
              placeholder="Search..." 
              onChange={e => {
                if (typeof window.__onTopbarSearch === 'function') window.__onTopbarSearch(e.target.value);
              }} 
            />
          </div>

          {/* Light / Dark Mode Toggle & Appearance Dropdown */}
          <div className="theme-switcher-container">
            <button className="theme-switcher-btn" onClick={() => setShowAppearance(a => !a)} title="Toggle Theme">
              <span className={`theme-toggle-icon ${themeMode === 'light' ? 'active' : ''}`}>☀️</span>
              <span className={`theme-toggle-icon ${themeMode === 'dark' ? 'active' : ''}`}>🌙</span>
            </button>

            {showAppearance && (
              <div className="appearance-dropdown">
                <div className="appearance-dropdown-title">Appearance</div>
                <div 
                  className={`appearance-option ${themeMode === 'light' ? 'active' : ''}`}
                  onClick={() => { setThemeMode('light'); localStorage.setItem('hostelhub_theme', 'light'); setShowAppearance(false); }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>☀️ Light Mode</span>
                  {themeMode === 'light' && <span>✓</span>}
                </div>
                <div 
                  className={`appearance-option ${themeMode === 'dark' ? 'active' : ''}`}
                  onClick={() => { setThemeMode('dark'); localStorage.setItem('hostelhub_theme', 'dark'); setShowAppearance(false); }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>🌙 Dark Mode</span>
                  {themeMode === 'dark' && <span>✓</span>}
                </div>
                <div 
                  className={`appearance-option ${themeMode === 'system' ? 'active' : ''}`}
                  onClick={() => { setThemeMode('system'); localStorage.setItem('hostelhub_theme', 'system'); setShowAppearance(false); }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>🖥️ System Mode</span>
                  {themeMode === 'system' && <span>✓</span>}
                </div>
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <div 
            className="topbar-btn" 
            title="Notifications"
            style={{ cursor: setPage ? 'pointer' : 'default', position: 'relative' }}
            onClick={() => setPage && setPage('notifications')}
          >
            <span>🔔</span>
            {badge > 0 && <span className="topbar-notif-badge">{badge}</span>}
          </div>

          {/* Profile User Pill */}
          <div className="topbar-user">
            <div className="topbar-avatar">{getInitials(user?.name)}</div>
            <div>
              <div className="topbar-username">{user?.name || 'User'}</div>
              <div className="topbar-role">{role === 'admin' ? 'Administrator' : role === 'manager' ? 'Hostel Manager' : 'Student'}</div>
            </div>
            <span style={{ fontSize: 10, marginLeft: 4, color: '#94a3b8' }}>˅</span>
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
  const [page, setPage] = useState('overview');
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
      { id: 'overview', icon: '📊', label: 'Dashboard' },
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

  const titles = { overview: 'Dashboard', browse: 'Browse Hostels', 'my-hostel': 'My Hostel', payments: 'Payments & Receipts', maintenance: 'Maintenance', notifications: 'Notifications', profile: 'Profile' };

  return (
    <DashboardShell role="student" navItems={navItems} page={page} setPage={setPage}
      user={user} onLogout={onLogout} badge={notifCount}
      title={titles[page] || 'Student Portal'} subtitle="UMaT Verified Accommodation">
      {page === 'overview'     && <StudentOverviewDashboard user={user} portalData={portalData} setPage={setPage} />}
      {page === 'browse'       && <StudentBrowse user={user} toast={toast} onBooked={loadPortal} />}
      {page === 'my-hostel'    && <StudentMyHostel portalData={portalData} />}
      {page === 'payments'     && <StudentPayments portalData={portalData} toast={toast} />}
      {page === 'maintenance'  && <StudentMaintenance portalData={portalData} onRefresh={loadPortal} toast={toast} />}
      {page === 'notifications'&& <StudentNotifications portalData={portalData} onRefresh={loadPortal} />}
      {page === 'profile'      && <StudentProfile user={user} toast={toast} />}
    </DashboardShell>
  );
}

function StudentOverviewDashboard({ user, portalData, setPage }) {
  if (!portalData) return <div className="page-loading"><Spinner dark /></div>;
  const student = portalData.student || {};
  const receipts = portalData.receipts || [];
  const notifications = portalData.notifications || [];
  const unreadNotifs = notifications.filter(n => !n.read).length;
  const latestReceipt = receipts[0];
  const hasBooking = !!student.hostel_name || !!student.hostel_id;
  const paymentStatus = student.payment_status || (latestReceipt ? 'verified' : 'unpaid');

  let nextActionText = 'Browse hostels around Tarkwa to initiate your room booking.';
  let nextActionBtn = 'Find a Hostel';
  let nextActionTarget = 'browse';

  if (paymentStatus === 'submitted' || paymentStatus === 'pending') {
    nextActionText = 'Your payment proof has been submitted and is currently awaiting manager verification.';
    nextActionBtn = 'View Payment Status';
    nextActionTarget = 'payments';
  } else if (paymentStatus === 'verified' || latestReceipt) {
    nextActionText = 'Your payment is verified! Official UMaT accommodation receipt generated.';
    nextActionBtn = 'View Receipt';
    nextActionTarget = 'payments';
  } else if (hasBooking) {
    nextActionText = `You have selected ${student.hostel_name || 'a room'}. Complete payment proof upload to finalize verification.`;
    nextActionBtn = 'Proceed to Payment';
    nextActionTarget = 'payments';
  }

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Welcome Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)', borderRadius: 'var(--radius-xl)', padding: '28px 32px', color: '#ffffff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#0D9488', marginBottom: 6 }}>UMaT Student Portal</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px 0', color: '#ffffff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            WELCOME BACK, {user?.name ? user.name.toUpperCase() : 'STUDENT'}
          </h2>
          <div style={{ fontSize: 14, color: '#CBD5E1' }}>Track your accommodation journey, payments, and official receipt status.</div>
        </div>
      </div>

      {/* Your Accommodation Journey Grid */}
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14, color: 'var(--text-heading)' }}>Your Accommodation Journey</h3>
        <div className="stats-grid stats-grid-4">
          <div className="stat-card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748B', marginBottom: 6 }}>Current Booking</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {student.hostel_name || 'No Active Booking'}
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{student.room_number ? `Room: ${student.room_number}` : 'Select a hostel'}</div>
          </div>

          <div className="stat-card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748B', marginBottom: 6 }}>Payment Status</div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>
              {paymentStatus === 'verified' ? <span style={{ color: '#059669' }}>✅ Verified</span> :
               paymentStatus === 'submitted' || paymentStatus === 'pending' ? <span style={{ color: '#D97706' }}>⏳ Pending Verification</span> :
               <span style={{ color: '#64748B' }}>Unpaid</span>}
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{latestReceipt ? `Ref: ${latestReceipt.reference}` : 'No receipt yet'}</div>
          </div>

          <div className="stat-card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748B', marginBottom: 6 }}>Official Receipt</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
              {latestReceipt ? '🧾 Available' : 'Not Issued'}
            </div>
            <div style={{ fontSize: 12, color: '#0F766E', marginTop: 4, cursor: 'pointer', fontWeight: 700 }} onClick={() => setPage('payments')}>
              {latestReceipt ? 'View Receipt →' : 'Complete booking'}
            </div>
          </div>

          <div className="stat-card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748B', marginBottom: 6 }}>Notifications</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
              🔔 {unreadNotifs} New
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{notifications.length} total messages</div>
          </div>
        </div>
      </div>

      {/* Next Action Callout */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0F766E', marginBottom: 4 }}>NEXT RECOMMENDED ACTION</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{nextActionText}</div>
        </div>
        <button className="btn btn-primary" onClick={() => setPage(nextActionTarget)}>
          {nextActionBtn} →
        </button>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14, color: 'var(--text-heading)' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <button className="btn btn-outline" style={{ padding: 16, justifyContent: 'flex-start', fontSize: 14, fontWeight: 700 }} onClick={() => setPage('browse')}>
            🔍 Find a Hostel
          </button>
          <button className="btn btn-outline" style={{ padding: 16, justifyContent: 'flex-start', fontSize: 14, fontWeight: 700 }} onClick={() => setPage('my-hostel')}>
            🏠 My Hostel & Room
          </button>
          <button className="btn btn-outline" style={{ padding: 16, justifyContent: 'flex-start', fontSize: 14, fontWeight: 700 }} onClick={() => setPage('payments')}>
            💳 Payments & Receipts
          </button>
          <button className="btn btn-outline" style={{ padding: 16, justifyContent: 'flex-start', fontSize: 14, fontWeight: 700 }} onClick={() => setPage('notifications')}>
            🔔 Notifications ({unreadNotifs})
          </button>
        </div>
      </div>
    </div>
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

function VerificationDetailModal({ open, onClose, hostel }) {
  if (!open) return null;
  return (
    <Modal open={true} onClose={onClose} title="🛡️ Hostel Hub Verified Listing" size="md">
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ background: 'var(--success-bg)', padding: 16, borderRadius: 12, border: '1px solid rgba(16,185,129,0.3)', display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ fontSize: 32 }}>🛡️</div>
          <div>
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--success)' }}>Officially Inspected & Verified</h4>
            <div style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 2 }}>{hostel?.name || 'This hostel'} has passed Hostel Hub's multi-step physical verification.</div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--success)', fontWeight: 800, fontSize: 16 }}>✓</span>
            <div><div style={{ fontWeight: 700, fontSize: 14 }}>Location Physically Checked</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>GPS coordinates and distance from UMaT campus verified on-site in Tarkwa.</div></div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--success)', fontWeight: 800, fontSize: 16 }}>✓</span>
            <div><div style={{ fontWeight: 700, fontSize: 14 }}>Hostel Physically Inspected</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Facilities, water supply, security, and room conditions checked in person.</div></div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--success)', fontWeight: 800, fontSize: 16 }}>✓</span>
            <div><div style={{ fontWeight: 700, fontSize: 14 }}>Room & Pricing Verified</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Prices and bed capacities confirmed directly with management (zero inflated rates).</div></div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--success)', fontWeight: 800, fontSize: 16 }}>✓</span>
            <div><div style={{ fontWeight: 700, fontSize: 14 }}>Manager Identity Confirmed</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Official Ghana Card identity & mobile money payout channel verified.</div></div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-primary" onClick={onClose}>Got it</button>
        </div>
      </div>
    </Modal>
  );
}

function LegalProtectionModal({ policyType, onClose }) {
  if (!policyType) return null;
  const titles = {
    terms: '📜 Terms & Conditions of Service',
    privacy: '🔒 Privacy Policy & Data Protection',
    cancellation: '↩️ Cancellation, Refund & Dispute Policy',
    support: '📞 Student Support & Help Center'
  };

  return (
    <Modal open={true} onClose={onClose} title={titles[policyType] || 'Platform Policy'} size="lg">
      <div style={{ display: 'grid', gap: 16, fontSize: 13, lineHeight: 1.7, color: 'var(--text-sub)' }}>
        {policyType === 'terms' && (
          <>
            <h4 style={{ margin: 0, fontSize: 15, color: 'var(--text-heading)', fontWeight: 800 }}>1. Accommodation Marketplace Agreement</h4>
            <p>Hostel Hub acts as an official accommodation discovery and booking verification engine connecting students of the University of Mines and Technology (UMaT), Tarkwa, with verified hostel managers.</p>
            <h4 style={{ margin: 0, fontSize: 15, color: 'var(--text-heading)', fontWeight: 800 }}>2. Student Obligations</h4>
            <p>Students agree to provide accurate registration information, pay fees directly to verified hostel accounts via Mobile Money or Bank Transfer, and submit valid transaction proof references.</p>
            <h4 style={{ margin: 0, fontSize: 15, color: 'var(--text-heading)', fontWeight: 800 }}>3. Hostel Verification Standards</h4>
            <p>Only listings physically inspected by Hostel Hub administrators displaying the 🛡️ UMaT Verified badge are guaranteed for location, facility condition, and pricing integrity.</p>
          </>
        )}

        {policyType === 'privacy' && (
          <>
            <h4 style={{ margin: 0, fontSize: 15, color: 'var(--text-heading)', fontWeight: 800 }}>1. Personal Data Protection</h4>
            <p>Hostel Hub collects student names, UMaT index numbers, emails, phone numbers, and payment reference proofs strictly for accommodation booking and receipt generation.</p>
            <h4 style={{ margin: 0, fontSize: 15, color: 'var(--text-heading)', fontWeight: 800 }}>2. Confidentiality & Security</h4>
            <p>All data transmitted is encrypted using SSL/TLS encryption. Credentials and service secrets are strictly isolated on backend servers. Data is never sold to third-party advertisers.</p>
          </>
        )}

        {policyType === 'cancellation' && (
          <>
            <h4 style={{ margin: 0, fontSize: 15, color: 'var(--text-heading)', fontWeight: 800 }}>1. Rent Cancellation & Refund Framework</h4>
            <p>If a student cancels a booking before manager verification, full payment proof may be withdrawn. Once manager verifies payment and generates a receipt, refunds are subject to individual hostel rules.</p>
            <h4 style={{ margin: 0, fontSize: 15, color: 'var(--text-heading)', fontWeight: 800 }}>2. Dispute Resolution & Guarantees</h4>
            <p>If a room condition fails to match verified listing parameters upon arrival, Hostel Hub administrators intervene to reassign accommodation or enforce manager refund payout.</p>
          </>
        )}

        {policyType === 'support' && (
          <>
            <div style={{ background: 'var(--info-bg)', padding: 16, borderRadius: 12, border: '1px solid rgba(59,130,246,0.3)', display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ fontSize: 32 }}>📞</div>
              <div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--info)' }}>UMaT Campus Support Hotline</h4>
                <div style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 2 }}>Direct assistance for students & hostel managers in Tarkwa.</div>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ padding: 12, background: 'var(--bg-subtle)', borderRadius: 8 }}><strong>Phone Hotline (Pilot):</strong> +233 24 000 0000 (To be activated for live pilot)</div>
              <div style={{ padding: 12, background: 'var(--bg-subtle)', borderRadius: 8 }}><strong>Email Support:</strong> pilot-support@hostelhub.dev</div>
              <div style={{ padding: 12, background: 'var(--bg-subtle)', borderRadius: 8 }}><strong>Campus Desk:</strong> UMaT Campus Desk (Tarkwa, Ghana)</div>
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
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
  const [showVerifModal, setShowVerifModal] = useState(false);
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
                {verified && <span className="verified-shield" style={{ cursor: 'pointer' }} onClick={() => setShowVerifModal(true)}>🛡️ UMaT Verified</span>}
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
          {verified && (
            <div className="alert alert-success" style={{ marginBottom: 18, cursor: 'pointer' }} onClick={() => setShowVerifModal(true)}>
              <span className="alert-icon">🛡️</span>
              <div>
                <strong>Hostel Hub Verified</strong> — Reviewed and approved by Hostel Hub administrators. Click to view verification details.
              </div>
            </div>
          )}
          {showVerifModal && <VerificationDetailModal open={true} onClose={() => setShowVerifModal(false)} hostel={hostel} />}
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
                <div style={{ textAlign: 'right' }}><div style={{ fontSize: 22, fontWeight: 900, color: 'var(--brand-navy)' }}>{fmtCurrency(r.amount_paid)}</div><button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={(e) => { e.stopPropagation(); setReceiptModal(r); }}>View Receipt</button></div>
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
  const pendingSubmissions = (queue?.submissions || []).filter(s => s.status === 'submitted');
  const pending = pendingSubmissions.length;
  const verifiedCount = (finances?.transactions || []).filter(t => t.type === 'income').length;
  const mgrName = hostels?.[0]?.manager_name || 'Hostel Manager';

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Welcome Banner */}
      <div style={{ background: 'linear-gradient(135deg,#0F172A,#1E293B)', borderRadius: 'var(--radius-xl)', padding: '28px 32px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#0D9488', marginBottom: 6 }}>Hostel Management Portal</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>WELCOME BACK, {mgrName.toUpperCase()}</div>
          <div style={{ fontSize: 14, color: '#CBD5E1' }}>{hostels?.[0]?.name || 'UMaT Partner Accommodation'} • {summary?.totalStudents || 0} residents • {summary?.totalRooms || 0} rooms</div>
        </div>
      </div>

      {/* 5 Summary Cards */}
      <div className="stats-grid stats-grid-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <StatCard icon="📋" iconColor="indigo" value={summary?.totalStudents || 0} label="Active Bookings" />
        <StatCard icon="⏳" iconColor="amber"  value={pending} label="Pending Verification" />
        <StatCard icon="✅" iconColor="green"  value={verifiedCount || 1} label="Approved Payments" />
        <StatCard icon="🛏️" iconColor="blue"   value={summary?.availableRooms || 0} label="Available Rooms" />
        <StatCard icon="🔒" iconColor="purple" value={summary?.occupiedRooms || 0} label="Occupied Rooms" />
      </div>

      {/* PROMINENT PENDING PAYMENT VERIFICATION SECTION */}
      <div className="card" style={{ border: pending > 0 ? '2px solid #F59E0B' : '1px solid var(--border)' }}>
        <div className="card-header" style={{ background: pending > 0 ? 'rgba(245, 158, 11, 0.08)' : 'transparent' }}>
          <div>
            <span className="card-title" style={{ fontSize: 16, fontWeight: 800 }}>PENDING PAYMENT VERIFICATION</span>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Payments submitted by students requiring proof review and manager approval.</div>
          </div>
          {pending > 0 && (
            <button className="btn btn-amber btn-sm" onClick={() => setPage('verification')}>
              Review All ({pending})
            </button>
          )}
        </div>

        {pendingSubmissions.length === 0 ? (
          <div className="card-body">
            <EmptyState icon="✅" title="All payments verified" sub="No pending student payment proofs awaiting review." />
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Hostel</th>
                  <th>Room</th>
                  <th>Amount</th>
                  <th>Payment Ref</th>
                  <th>Proof</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingSubmissions.slice(0, 5).map(sub => (
                  <tr key={sub.id}>
                    <td className="td-primary">
                      <div><strong>{sub.student_name || sub.user_profiles?.name || 'Student'}</strong></div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub.student_email || ''}</div>
                    </td>
                    <td>{sub.hostel_name || 'Hostel'}</td>
                    <td>{sub.room_type || 'Standard'}</td>
                    <td style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>{fmtCurrency(sub.amount || 0)}</td>
                    <td><code style={{ fontSize: 12 }}>{sub.reference || sub.id}</code></td>
                    <td>
                      <span className="badge badge-amber">📷 Proof Attached</span>
                    </td>
                    <td className="td-muted">{fmtDate(sub.created_at)}</td>
                    <td>
                      <button className="btn btn-amber btn-sm" onClick={() => setPage('verification')}>
                        Review Payment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Financial Overview Grid */}
      <div className="content-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">💳 Recent Transactions</span>
            <button className="btn btn-outline btn-sm" onClick={() => setPage('finances')}>View All</button>
          </div>
          {(finances.transactions || []).length === 0 ? (
            <div className="card-body"><EmptyState icon="💸" title="No transactions" /></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Description</th><th>Type</th><th>Amount</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {(finances.transactions || []).slice(0, 5).map(t => (
                    <tr key={t.id}>
                      <td className="td-primary">{t.description}</td>
                      <td><span className={`badge ${t.type === 'income' ? 'badge-active' : 'badge-rejected'}`}>{t.type}</span></td>
                      <td style={{ fontWeight: 700, color: t.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                        {t.type === 'income' ? '+' : '-'}{fmtCurrency(t.amount)}
                      </td>
                      <td className="td-muted">{fmtDate(t.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">📊 Financial Summary</span></div>
          <div className="card-body" style={{ display: 'grid', gap: 10 }}>
            {[
              ['Income', fmtCurrency(totalIncome), 'var(--success)'],
              ['Expenses', fmtCurrency(totalExpense), 'var(--danger)'],
              ['Net Profit', fmtCurrency(netProfit), netProfit >= 0 ? 'var(--success)' : 'var(--danger)']
            ].map(([l, v, c]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{l}</span>
                <span style={{ fontWeight: 800, color: c, fontSize: 15 }}>{v}</span>
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

  const summaryCards = [
    { icon: '🏠', color: 'indigo', value: stats.totalHostels,    label: 'Total Hostels' },
    { icon: '🛡️', color: 'green',  value: stats.verifiedHostels, label: 'Verified Hostels' },
    { icon: '⏳', color: 'amber',  value: stats.pendingHostels || 0, label: 'Pending Verification' },
    { icon: '👥', color: 'blue',   value: stats.totalStudents,   label: 'Total Students' },
    { icon: '📋', color: 'purple', value: stats.activeBookings,  label: 'Active Bookings' },
  ];

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Admin Welcome Hero */}
      <div className="admin-hero" style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)', borderRadius: 'var(--radius-xl)', padding: '28px 32px', color: '#ffffff' }}>
        <div className="admin-hero-text">
          <div className="admin-hero-label" style={{ color: '#0D9488', fontWeight: 800 }}>UMaT Platform Administration</div>
          <h2 className="admin-hero-title" style={{ fontSize: 24, fontWeight: 800, margin: '4px 0', color: '#ffffff' }}>Operational Overview</h2>
          <div className="admin-hero-sub" style={{ color: '#CBD5E1', fontSize: 14 }}>Manage hostels, verification queue, student accounts, and payment workflows.</div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {stats.pendingManagers > 0 && <button className="btn btn-amber" onClick={() => setPage('applications')}>⚠️ {stats.pendingManagers} Pending Manager{stats.pendingManagers !== 1 ? 's' : ''}</button>}
          {stats.pendingHostels > 0  && <button className="btn btn-primary" onClick={() => setPage('verification')}>🛡️ {stats.pendingHostels} Hostel{stats.pendingHostels !== 1 ? 's' : ''} to Verify</button>}
        </div>
      </div>

      {/* 5 Primary Summary Cards */}
      <div className="stats-grid stats-grid-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {summaryCards.map((c, i) => <StatCard key={i} icon={c.icon} iconColor={c.color} value={c.value} label={c.label} />)}
      </div>

      {/* Operational Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
        {/* HOSTEL MANAGEMENT SECTION */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ fontSize: 15, fontWeight: 800 }}>🏠 HOSTEL MANAGEMENT</span>
          </div>
          <div className="card-body" style={{ display: 'grid', gap: 10 }}>
            <button className="btn btn-outline" style={{ justifyContent: 'space-between' }} onClick={() => setPage('hostels')}>
              <span>All Hostels Directory ({stats.totalHostels})</span>
              <span>→</span>
            </button>
            <button className="btn btn-outline" style={{ justifyContent: 'space-between' }} onClick={() => setPage('verification')}>
              <span>Pending Verification ({stats.pendingHostels || 0})</span>
              <span className="badge badge-amber">🛡️ Review</span>
            </button>
            <button className="btn btn-primary" style={{ marginTop: 4 }} onClick={() => setPage('hostels')}>
              + Add New Hostel
            </button>
          </div>
        </div>

        {/* USER MANAGEMENT SECTION */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ fontSize: 15, fontWeight: 800 }}>👥 USER MANAGEMENT</span>
          </div>
          <div className="card-body" style={{ display: 'grid', gap: 10 }}>
            <button className="btn btn-outline" style={{ justifyContent: 'space-between' }} onClick={() => setPage('users')}>
              <span>Registered Students ({stats.totalStudents})</span>
              <span>→</span>
            </button>
            <button className="btn btn-outline" style={{ justifyContent: 'space-between' }} onClick={() => setPage('applications')}>
              <span>Hostel Managers ({stats.totalManagers})</span>
              {stats.pendingManagers > 0 && <span className="badge badge-amber">{stats.pendingManagers} Pending</span>}
            </button>
          </div>
        </div>

        {/* BOOKINGS & PAYMENTS SECTION */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ fontSize: 15, fontWeight: 800 }}>💳 BOOKINGS & PAYMENTS</span>
          </div>
          <div className="card-body" style={{ display: 'grid', gap: 10 }}>
            <button className="btn btn-outline" style={{ justifyContent: 'space-between' }} onClick={() => setPage('audit')}>
              <span>Active Student Bookings ({stats.activeBookings})</span>
              <span>→</span>
            </button>
            <button className="btn btn-outline" style={{ justifyContent: 'space-between' }} onClick={() => setPage('payments')}>
              <span>Payment Verification ({stats.pendingPayments || 0})</span>
              <span className="badge badge-info">💳 Overview</span>
            </button>
          </div>
        </div>
      </div>
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
            <span className="card-title">💰 Financial Commission Ledger & Payouts</span>
          </div>
          <div className="card-body" style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Gross Booking Value</div><div style={{ fontSize: 18, fontWeight: 800 }}>{fmtCurrency(data.totalRevenue || 0)}</div></div>
              <span style={{ fontSize: 24 }}>💳</span>
            </div>

            <div className="grid-2" style={{ gap: 10 }}>
              <div style={{ padding: '12px 14px', background: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-indigo)', textTransform: 'uppercase' }}>Hostel Hub Commission (5%)</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--brand-indigo)', marginTop: 4 }}>{fmtCurrency(Math.round((data.totalRevenue || 0) * 0.05))}</div>
              </div>
              <div style={{ padding: '12px 14px', background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase' }}>Manager Net Payouts (95%)</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--success)', marginTop: 4 }}>{fmtCurrency((data.totalRevenue || 0) - Math.round((data.totalRevenue || 0) * 0.05))}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', paddingTop: 6, borderTop: '1px solid var(--border)' }}>
              <span>Conversion Rate: <strong style={{ color: 'var(--success)' }}>{data.totalBookings > 0 ? `${Math.round(((data.completedBookings || data.totalBookings) / data.totalBookings) * 100)}%` : '0% (Pilot)'}</strong></span>
              <span>Average Rent: <strong>{data.totalBookings > 0 ? fmtCurrency(Math.round(data.totalRevenue / data.totalBookings)) + '/yr' : 'GHS 0.00'}</strong></span>
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
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [actorFilter, setActorFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, yesterday, last7, last30, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortField, setSortField] = useState('created_at'); // created_at, admin_name, action, entity_type
  const [sortOrder, setSortOrder] = useState('desc'); // desc | asc
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [expandedLogId, setExpandedLogId] = useState(null);

  // Load audit logs from API
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('limit', 'all'); // fetch full dataset so client can filter smoothly
      const d = await apiFetch(`/api/admin/audit-log?${queryParams.toString()}`);
      setLogs(d.logs || []);
    } catch (e) {
      if (toast) toast(e.message || 'Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Extract unique filter dropdown values from dataset
  const uniqueActions = useMemo(() => {
    const set = new Set();
    logs.forEach(l => { if (l.action) set.add(l.action); });
    return Array.from(set).sort();
  }, [logs]);

  const uniqueActors = useMemo(() => {
    const set = new Set();
    logs.forEach(l => { if (l.admin_name) set.add(l.admin_name); });
    return Array.from(set).sort();
  }, [logs]);

  const uniqueEntities = useMemo(() => {
    const set = new Set();
    logs.forEach(l => { if (l.entity_type) set.add(l.entity_type); });
    return Array.from(set).sort();
  }, [logs]);

  // Filter & Sort Logic
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      // 1. Search Query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const detailsStr = typeof l.details === 'object' ? JSON.stringify(l.details).toLowerCase() : (l.details || '').toLowerCase();
        const matchesSearch =
          (l.admin_name || '').toLowerCase().includes(q) ||
          (l.action || '').toLowerCase().includes(q) ||
          (l.entity_type || '').toLowerCase().includes(q) ||
          (l.entity_name || '').toLowerCase().includes(q) ||
          (l.entity_id || '').toLowerCase().includes(q) ||
          detailsStr.includes(q);

        if (!matchesSearch) return false;
      }

      // 2. Action Filter
      if (actionFilter !== 'all' && l.action !== actionFilter) {
        return false;
      }

      // 3. Actor Filter
      if (actorFilter !== 'all' && l.admin_name !== actorFilter) {
        return false;
      }

      // 4. Entity Type Filter
      if (entityFilter !== 'all' && l.entity_type !== entityFilter) {
        return false;
      }

      // 5. Date Range Filter
      if (dateFilter !== 'all' && l.created_at) {
        const logDate = new Date(l.created_at);
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (dateFilter === 'today') {
          if (logDate < startOfToday) return false;
        } else if (dateFilter === 'yesterday') {
          const startOfYesterday = new Date(startOfToday);
          startOfYesterday.setDate(startOfYesterday.getDate() - 1);
          if (logDate < startOfYesterday || logDate >= startOfToday) return false;
        } else if (dateFilter === 'last7') {
          const sevenDaysAgo = new Date(startOfToday);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          if (logDate < sevenDaysAgo) return false;
        } else if (dateFilter === 'last30') {
          const thirtyDaysAgo = new Date(startOfToday);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          if (logDate < thirtyDaysAgo) return false;
        } else if (dateFilter === 'custom') {
          if (startDate) {
            const s = new Date(startDate);
            if (logDate < s) return false;
          }
          if (endDate) {
            const e = new Date(endDate);
            e.setHours(23, 59, 59, 999);
            if (logDate > e) return false;
          }
        }
      }

      return true;
    }).sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';

      if (sortField === 'created_at') {
        valA = new Date(valA).getTime() || 0;
        valB = new Date(valB).getTime() || 0;
      } else {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [logs, search, actionFilter, actorFilter, entityFilter, dateFilter, startDate, endDate, sortField, sortOrder]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, actionFilter, actorFilter, entityFilter, dateFilter, startDate, endDate, pageSize]);

  // Pagination bounds
  const totalFiltered = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = totalFiltered === 0 ? 0 : (validPage - 1) * pageSize + 1;
  const endIndex = Math.min(validPage * pageSize, totalFiltered);
  const paginatedLogs = filteredLogs.slice((validPage - 1) * pageSize, validPage * pageSize);

  // Clear all filters handler
  const isFiltered = search || actionFilter !== 'all' || actorFilter !== 'all' || entityFilter !== 'all' || dateFilter !== 'all' || startDate || endDate;
  const clearFilters = () => {
    setSearch('');
    setActionFilter('all');
    setActorFilter('all');
    setEntityFilter('all');
    setDateFilter('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Sort header click handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // CSV Export Handler
  const exportCSV = () => {
    if (filteredLogs.length === 0) {
      if (toast) toast('No audit records to export', 'warning');
      return;
    }
    const headers = ['Timestamp', 'Admin Name', 'Action', 'Entity Type', 'Entity Name', 'Entity ID', 'Details'];
    const rows = filteredLogs.map(l => [
      l.created_at ? new Date(l.created_at).toISOString() : '',
      `"${(l.admin_name || '').replace(/"/g, '""')}"`,
      `"${(l.action || '').replace(/"/g, '""')}"`,
      `"${(l.entity_type || '').replace(/"/g, '""')}"`,
      `"${(l.entity_name || '').replace(/"/g, '""')}"`,
      `"${(l.entity_id || '').replace(/"/g, '""')}"`,
      `"${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hostelhub_audit_log_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (toast) toast(`Exported ${filteredLogs.length} audit records to CSV`, 'success');
  };

  // Action Chip Formatter
  const renderActionChip = (action) => {
    const act = (action || '').toLowerCase();
    let type = 'amber';

    if (act.includes('delete') || act.includes('reject') || act.includes('suspend')) {
      type = 'danger';
    } else if (act.includes('approve') || act.includes('activate') || act.includes('reinstate') || act.includes('verify')) {
      type = 'success';
    } else if (act.includes('assign') || act.includes('create') || act.includes('onboard') || act.includes('login')) {
      type = 'indigo';
    }

    const readable = (action || 'unknown')
      .replace(/_/g, ' ')
      .toUpperCase();

    return (
      <span className={`action-chip action-chip-${type}`}>
        <span>{type === 'danger' ? '⛔' : type === 'success' ? '✓' : type === 'indigo' ? '⚡' : '📌'}</span>
        <span>{readable}</span>
      </span>
    );
  };

  // Entity Badge Formatter
  const renderEntityBadge = (type, name, id) => {
    const t = (type || '').toLowerCase();
    let icon = '📦';

    if (t.includes('hostel')) icon = '🏠';
    else if (t.includes('manager')) icon = '🏢';
    else if (t.includes('student') || t.includes('user')) icon = '🎓';
    else if (t.includes('pay') || t.includes('tx')) icon = '💳';
    else if (t.includes('book')) icon = '📋';
    else if (t.includes('maint')) icon = '🔧';
    else if (t.includes('admin') || t.includes('sys')) icon = '🔑';
    else if (t.includes('announc')) icon = '📢';

    const entityLabel = type ? (type.charAt(0).toUpperCase() + type.slice(1)) : 'System';

    return (
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-heading)' }}>
          <span>{icon}</span>
          <span>{entityLabel}</span>
        </div>
        {(name || id) && (
          <div style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 2, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name || (id ? `#${id.substring(0, 10)}` : '')}
          </div>
        )}
      </div>
    );
  };

  // Actor Information Renderer
  const renderActorCell = (adminName) => {
    const name = adminName || 'System Admin';
    const initials = getInitials(name);

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="pub-user-avatar" style={{ width: 32, height: 32, fontSize: 11, background: 'linear-gradient(135deg, var(--brand-indigo), var(--brand-navy))', flexShrink: 0 }}>
          {initials}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-heading)' }}>{name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Administrator</div>
        </div>
      </div>
    );
  };

  return (
    <div className="audit-container">
      {/* Header Bar */}
      <div className="audit-header">
        <div>
          <h2 className="audit-title">Audit Log</h2>
          <div className="audit-subtitle">Comprehensive security, administrative, and system action activity records</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn btn-outline" onClick={fetchLogs} title="Refresh Logs">
            🔄 Refresh
          </button>
          <button className="btn btn-primary" onClick={exportCSV} disabled={filteredLogs.length === 0}>
            📥 Export CSV ({filteredLogs.length})
          </button>
        </div>
      </div>

      {/* Audit Stats Summary Bar */}
      <div className="audit-stats-row">
        <div className="audit-stat-card">
          <div className="audit-stat-icon" style={{ background: 'hsla(243, 65%, 54%, 0.1)', color: 'var(--brand-indigo)' }}>📋</div>
          <div>
            <div className="audit-stat-val">{logs.length}</div>
            <div className="audit-stat-label">Total Audit Events</div>
          </div>
        </div>

        <div className="audit-stat-card">
          <div className="audit-stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>🛡️</div>
          <div>
            <div className="audit-stat-val">{uniqueActors.length || 1}</div>
            <div className="audit-stat-label">Active Administrators</div>
          </div>
        </div>

        <div className="audit-stat-card">
          <div className="audit-stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>⚡</div>
          <div>
            <div className="audit-stat-val">{uniqueActions.length}</div>
            <div className="audit-stat-label">Action Types Logged</div>
          </div>
        </div>

        <div className="audit-stat-card">
          <div className="audit-stat-icon" style={{ background: 'hsla(222, 47%, 11%, 0.08)', color: 'var(--text-heading)' }}>🔍</div>
          <div>
            <div className="audit-stat-val">{filteredLogs.length}</div>
            <div className="audit-stat-label">Filtered Results</div>
          </div>
        </div>
      </div>

      {/* Search & Filters Controls Bar */}
      <div className="audit-controls-card">
        <div className="audit-search-row">
          <div className="audit-search-input-wrap">
            <i>🔍</i>
            <input
              className="audit-search-input"
              placeholder="Search audit activity by admin, action, entity, ID, or details..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                style={{ position: 'absolute', right: 12, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => setSearch('')}
              >
                ✕
              </button>
            )}
          </div>
          {isFiltered && (
            <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }} onClick={clearFilters}>
              ✕ Clear Filters
            </button>
          )}
        </div>

        <div className="audit-filters-row">
          {/* Action Filter */}
          <select className="audit-select-filter" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
            <option value="all">⚡ All Actions ({uniqueActions.length})</option>
            {uniqueActions.map(a => (
              <option key={a} value={a}>{a.replace(/_/g, ' ').toUpperCase()}</option>
            ))}
          </select>

          {/* Actor / Admin Filter */}
          <select className="audit-select-filter" value={actorFilter} onChange={e => setActorFilter(e.target.value)}>
            <option value="all">👤 All Administrators</option>
            {uniqueActors.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          {/* Entity Type Filter */}
          <select className="audit-select-filter" value={entityFilter} onChange={e => setEntityFilter(e.target.value)}>
            <option value="all">📦 All Entity Types</option>
            {uniqueEntities.map(e => (
              <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
            ))}
          </select>

          {/* Date Filter */}
          <select className="audit-select-filter" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
            <option value="all">📅 All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7">Last 7 Days</option>
            <option value="last30">Last 30 Days</option>
            <option value="custom">Custom Date Range...</option>
          </select>

          {/* Custom Date Range Selectors */}
          {dateFilter === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="date" className="audit-date-input" value={startDate} onChange={e => setStartDate(e.target.value)} title="Start Date" />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>to</span>
              <input type="date" className="audit-date-input" value={endDate} onChange={e => setEndDate(e.target.value)} title="End Date" />
            </div>
          )}

          {/* Page Size Selector */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Rows per page:</span>
            <select className="audit-select-filter" style={{ minWidth: 70, padding: '6px 10px' }} value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Audit Data Table */}
      {loading ? (
        <div className="page-loading"><Spinner dark /></div>
      ) : filteredLogs.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlignment: 'center' }}>
          <EmptyState
            icon="🔍"
            title="No audit activity found"
            sub={isFiltered ? "No records match your active search or filter criteria. Try broadening your query." : "No administrative actions have been recorded yet."}
          />
          {isFiltered && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <button className="btn btn-primary btn-sm" onClick={clearFilters}>Clear All Filters</button>
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th className="th-sortable" onClick={() => handleSort('created_at')}>
                    TIME {sortField === 'created_at' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                  </th>
                  <th className="th-sortable" onClick={() => handleSort('admin_name')}>
                    ADMINISTRATOR {sortField === 'admin_name' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                  </th>
                  <th className="th-sortable" onClick={() => handleSort('action')}>
                    ACTION {sortField === 'action' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                  </th>
                  <th className="th-sortable" onClick={() => handleSort('entity_type')}>
                    ENTITY {sortField === 'entity_type' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                  </th>
                  <th style={{ textAlign: 'right', paddingRight: 24 }}>DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map(l => {
                  const isExpanded = expandedLogId === l.id;

                  return (
                    <React.Fragment key={l.id || l.created_at}>
                      <tr className="audit-row-expandable" onClick={() => setExpandedLogId(isExpanded ? null : l.id)}>
                        <td className="td-muted" style={{ whiteSpace: 'nowrap', fontSize: 12.5, fontWeight: 600 }}>
                          {fmtDateTime(l.created_at)}
                        </td>
                        <td>
                          {renderActorCell(l.admin_name)}
                        </td>
                        <td>
                          {renderActionChip(l.action)}
                        </td>
                        <td>
                          {renderEntityBadge(l.entity_type, l.entity_name, l.entity_id)}
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: 24 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-indigo)' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedLogId(isExpanded ? null : l.id);
                            }}
                          >
                            {isExpanded ? 'Hide Details ▲' : 'View Details ▼'}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Row Drawer */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} style={{ padding: 0, borderBottom: '1px solid var(--border)' }}>
                            <div className="audit-detail-drawer animate-fadeIn">
                              <div className="audit-detail-grid">
                                <div className="audit-detail-item">
                                  <div className="audit-detail-label">Full Timestamp</div>
                                  <div className="audit-detail-val">{l.created_at ? new Date(l.created_at).toLocaleString() : 'N/A'}</div>
                                </div>
                                <div className="audit-detail-item">
                                  <div className="audit-detail-label">Administrator ID</div>
                                  <div className="audit-detail-val" style={{ fontFamily: 'monospace' }}>{l.admin_id || 'N/A'}</div>
                                </div>
                                <div className="audit-detail-item">
                                  <div className="audit-detail-label">Action Identifier</div>
                                  <div className="audit-detail-val" style={{ color: 'var(--brand-indigo)', fontFamily: 'monospace' }}>{l.action || 'N/A'}</div>
                                </div>
                                <div className="audit-detail-item">
                                  <div className="audit-detail-label">Entity Reference ID</div>
                                  <div className="audit-detail-val" style={{ fontFamily: 'monospace' }}>{l.entity_id || 'N/A'}</div>
                                </div>
                              </div>

                              {l.details && Object.keys(l.details).length > 0 && (
                                <div>
                                  <div className="audit-detail-label" style={{ marginBottom: 6 }}>Action Metadata & Payload</div>
                                  <pre className="audit-json-box">
                                    {JSON.stringify(l.details, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Clean Pagination Control Footer */}
          <div className="audit-pagination-footer">
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-sub)' }}>
              Showing <span style={{ color: 'var(--text-heading)', fontWeight: 800 }}>{startIndex}–{endIndex}</span> of <span style={{ color: 'var(--text-heading)', fontWeight: 800 }}>{totalFiltered}</span> records
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                className="audit-page-btn"
                disabled={validPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                ‹ Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - validPage) <= 2)
                .map((p, idx, arr) => {
                  const prevP = arr[idx - 1];
                  const showEllipsis = prevP && p - prevP > 1;

                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && <span style={{ fontSize: 12, color: 'var(--text-muted)', padding: '0 4px' }}>...</span>}
                      <button
                        className={`audit-page-btn ${validPage === p ? 'active' : ''}`}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                className="audit-page-btn"
                disabled={validPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                Next ›
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── INTELLIGENT LOCATIONS MANAGEMENT ──────────────────────────────
function AdminLocations({ toast }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [newLoc, setNewLoc] = useState({
    name: '', category: 'Community', description: '', nearbyLandmark: '',
    distanceKm: 1.5, lat: 5.2974, lng: -1.9968
  });

  const load = async () => {
    setLoading(true);
    try {
      const d = await apiFetch('/api/locations');
      setLocations(d.locations || []);
    } catch (e) {
      if (toast) toast(e.message || 'Failed to load locations', 'error');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = locations.filter(l =>
    !search ||
    (l.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.nearby_landmark || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleAddLocation = async e => {
    e.preventDefault();
    if (!newLoc.name.trim()) return;
    setBusy(true);
    try {
      await apiFetch('/api/locations', { method: 'POST', body: JSON.stringify(newLoc) });
      toast(`Location "${newLoc.name}" added!`, 'success');
      setShowAddModal(false);
      setNewLoc({ name: '', category: 'Community', description: '', nearbyLandmark: '', distanceKm: 1.5, lat: 5.2974, lng: -1.9968 });
      load();
    } catch (e) { toast(e.message, 'error'); }
    setBusy(false);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete location "${name}"?`)) return;
    try {
      await apiFetch(`/api/locations/${id}`, { method: 'DELETE' });
      toast(`"${name}" deleted.`, 'info');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const catColor = { Campus: '#6366f1', Community: '#f59e0b', Commercial: '#3b82f6', Residential: '#10b981', Industrial: '#f97316' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}>Locations Management</h2>
          <div style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 4 }}>Real UMaT Tarkwa zones — hostel counts calculated live from the database.</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="pub-filter-search" style={{ minWidth: 220 }}>
            <span style={{ color: 'var(--text-muted)' }}>🔍</span>
            <input placeholder="Search locations…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-outline btn-sm" onClick={load}>🔄 Refresh</button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ Add Location</button>
        </div>
      </div>

      {loading ? <div className="page-loading"><Spinner dark /></div> :
        filtered.length === 0 ? <EmptyState icon="📍" title="No locations found" sub="Add a location or adjust your search." /> :
        <div className="location-cards-grid">
          {filtered.map(loc => {
            const color = catColor[loc.category] || '#6366f1';
            const hostelCount = loc.hostel_count || 0;
            const distKm = loc.distance_km || 0;
            const walkMins = loc.estimated_walking_mins || Math.round(distKm * 12);
            return (
              <div key={loc.id} className="location-card">
                <div>
                  <div className="location-card-header">
                    <div className="location-badge-icon" style={{ background: `${color}18`, color }}>📍</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className="location-card-title">{loc.name}</div>
                        <span style={{ fontSize: 11, padding: '2px 10px', background: `${color}18`, color, borderRadius: 20, fontWeight: 700 }}>{loc.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="location-card-body">
                    {loc.nearby_landmark && <div className="location-info-row"><span>🏛️</span><span>{loc.nearby_landmark}</span></div>}
                    <div className="location-info-row"><span>📏</span><span>{distKm} km from UMaT</span></div>
                    <div className="location-info-row"><span>🚶</span><span>~{walkMins} min walk</span></div>
                    <div className="location-info-row">
                      <span>🏠</span>
                      <span style={{ fontWeight: hostelCount > 0 ? 700 : 400, color: hostelCount > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                        {hostelCount} hostel{hostelCount !== 1 ? 's' : ''} registered
                      </span>
                    </div>
                    {loc.avg_price_ghs > 0 && <div className="location-info-row"><span>💰</span><span>Avg. {fmtCurrency(loc.avg_price_ghs)}/yr</span></div>}
                  </div>
                </div>
                <div className="location-card-footer">
                  <button className="btn-location-details" onClick={() => setDetailModal(loc)}>View Details</button>
                  <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)', fontSize: 12 }} onClick={() => handleDelete(loc.id, loc.name)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      }

      <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text-muted)', textAlign: 'right' }}>
        {filtered.length} of {locations.length} locations · Live database data
      </div>

      {showAddModal && (
        <Modal open={true} onClose={() => setShowAddModal(false)} title="📍 Add New Location" size="md">
          <form onSubmit={handleAddLocation} style={{ display: 'grid', gap: 14 }}>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Location Name *</label><input className="form-input" value={newLoc.name} onChange={e => setNewLoc(l => ({ ...l, name: e.target.value }))} placeholder="e.g. Banso" required /></div>
              <div className="form-group"><label className="form-label">Category</label><select className="form-input form-select" value={newLoc.category} onChange={e => setNewLoc(l => ({ ...l, category: e.target.value }))}>{['Campus', 'Community', 'Commercial', 'Residential', 'Industrial'].map(c => <option key={c}>{c}</option>)}</select></div>
            </div>
            <div className="form-group"><label className="form-label">Nearby Landmark</label><input className="form-input" value={newLoc.nearbyLandmark} onChange={e => setNewLoc(l => ({ ...l, nearbyLandmark: e.target.value }))} placeholder="e.g. UMaT Main Gate" /></div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-input form-textarea" rows={2} value={newLoc.description} onChange={e => setNewLoc(l => ({ ...l, description: e.target.value }))} /></div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Distance from UMaT (km)</label><input className="form-input" type="number" step="0.1" min="0" value={newLoc.distanceKm} onChange={e => setNewLoc(l => ({ ...l, distanceKm: Number(e.target.value) }))} /></div>
              <div className="form-group"><label className="form-label">GPS: Latitude / Longitude</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input className="form-input" type="number" step="0.0001" value={newLoc.lat} onChange={e => setNewLoc(l => ({ ...l, lat: Number(e.target.value) }))} placeholder="5.2974" />
                  <input className="form-input" type="number" step="0.0001" value={newLoc.lng} onChange={e => setNewLoc(l => ({ ...l, lng: Number(e.target.value) }))} placeholder="-1.9968" />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? <Spinner /> : 'Add Location'}</button>
            </div>
          </form>
        </Modal>
      )}

      {detailModal && (
        <Modal open={true} onClose={() => setDetailModal(null)} title={`📍 ${detailModal.name}`} size="md">
          <div style={{ display: 'grid', gap: 14 }}>
            <div className="grid-2">
              {[
                ['Category', detailModal.category || '—'],
                ['Distance', `${detailModal.distance_km || '—'} km from UMaT`],
                ['Walk time', `~${detailModal.estimated_walking_mins || '—'} mins`],
                ['Drive time', `~${detailModal.estimated_driving_mins || '—'} mins`],
                ['Transport fare', `GHS ${detailModal.avg_transport_fare_ghs || 0}`],
                ['Hostels', `${detailModal.hostel_count || 0} registered`],
              ].map(([l, v]) => (
                <div key={l} style={{ background: 'var(--bg-subtle)', padding: 12, borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{l}</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{v}</div>
                </div>
              ))}
            </div>
            {detailModal.nearby_landmark && <div style={{ background: 'var(--bg-subtle)', padding: 12, borderRadius: 10 }}><div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>NEARBY LANDMARK</div><div style={{ fontWeight: 700 }}>{detailModal.nearby_landmark}</div></div>}
            {detailModal.description && <p style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.7, margin: 0 }}>{detailModal.description}</p>}
            {detailModal.avg_price_ghs > 0 && <div className="alert alert-info"><span className="alert-icon">💰</span><div>Average hostel price in this area: <strong>{fmtCurrency(detailModal.avg_price_ghs)}/yr</strong></div></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
              <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }} onClick={() => { handleDelete(detailModal.id, detailModal.name); setDetailModal(null); }}>Delete</button>
              <button className="btn btn-primary" onClick={() => setDetailModal(null)}>Close</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── DEMO DATA MANAGEMENT ─────────────────────────────────────────────
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
      {/* 4-Column Stat Cards Grid matching HostelHub_Modern_Dashboard.png */}
      <div className="stats-grid-4">
        <div className="stat-card-modern">
          <div className="stat-icon-modern stat-icon-blue">🏠</div>
          <div>
            <div className="stat-val-modern">{data.stats.totalHostels}</div>
            <div className="stat-label-modern">Total Hostels</div>
            <div className="stat-indicator">
              <span className="stat-indicator-dot dot-blue"></span> Active Hostels
            </div>
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-icon-modern stat-icon-green">🧪</div>
          <div>
            <div className="stat-val-modern">{data.stats.demoHostels}</div>
            <div className="stat-label-modern">Demo Hostels</div>
            <div className="stat-indicator">
              <span className="stat-indicator-dot dot-green"></span> Sample Data
            </div>
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-icon-modern stat-icon-purple">👥</div>
          <div>
            <div className="stat-val-modern">{data.stats.totalUsers}</div>
            <div className="stat-label-modern">Total User Profiles</div>
            <div className="stat-indicator">
              <span className="stat-indicator-dot dot-purple"></span> All Users
            </div>
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-icon-modern stat-icon-amber">🏷️</div>
          <div>
            <div className="stat-val-modern">{data.stats.demoUsers}</div>
            <div className="stat-label-modern">Demo User Profiles</div>
            <div className="stat-indicator">
              <span className="stat-indicator-dot dot-amber"></span> Sample Users
            </div>
          </div>
        </div>
      </div>

      {/* Main Panel Card */}
      <div className="modern-panel-card">
        <div className="panel-card-header">
          <div className="panel-header-title-group">
            <div className="panel-header-icon">🛢️</div>
            <div>
              <div className="panel-header-title">Demo Data Lifecycle & Controls</div>
              <div className="panel-header-sub">Separate presentation/testing records from production user data</div>
            </div>
          </div>
          <div className="panel-actions-group">
            <button className="btn-action-outline-blue" disabled={busy} onClick={archiveDemoHostels}>
              <span>👁️</span> Hide Demo Hostels
            </button>
            <button className="btn-action-outline-green" disabled={busy} onClick={seedDemoData}>
              {busy ? <Spinner /> : <><span>🌱</span> Seed Sample Demo Data</>}
            </button>
            <button className="btn-action-danger-solid" disabled={busy} onClick={purgeDemoData}>
              <span>🗑️</span> Purge Demo Data
            </button>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="modern-sub-tabs">
          <div className={`modern-tab-item ${tab === 'hostels' ? 'active' : ''}`} onClick={() => setTab('hostels')}>
            Hostels ({hostels.length})
          </div>
          <div className={`modern-tab-item ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
            User Profiles ({userProfiles.length})
          </div>
        </div>

        {tab === 'hostels' && (
          <div>
            <div className="modern-table-wrap">
              {hostels.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No hostels in system</div> :
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>HOSTEL NAME ↕</th>
                      <th>LOCATION ↕</th>
                      <th>VISIBILITY ↕</th>
                      <th>DEMO FLAG ↕</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hostels.map(h => (
                      <tr key={h.id}>
                        <td>
                          <div className="table-name-cell">
                            <div className={`table-icon-badge ${h.name.includes('Tarkwa') ? 'amber' : h.name.includes('SME') ? 'purple' : 'blue'}`}>
                              🏢
                            </div>
                            <span>{h.name}</span>
                          </div>
                        </td>
                        <td><span style={{ color: '#64748b' }}>📍 {h.location}</span></td>
                        <td>
                          <span className={h.is_published ? 'badge-pill-green' : 'badge-pill-amber'}>
                            {h.is_published ? '🌐 Public' : '👓 Hidden'}
                          </span>
                        </td>
                        <td>
                          <span className={h.is_demo ? 'badge-pill-amber' : 'badge-pill-green'}>
                            🏢 {h.is_demo ? 'Demo Data' : 'Production'}
                          </span>
                        </td>
                        <td>
                          <button className="table-action-btn" onClick={() => toggleFlag('hostels', h.id, h.is_demo)}>
                            <span>{h.is_demo ? 'Mark Production' : 'Mark Demo'}</span>
                            <span style={{ fontSize: 11 }}>↗</span>
                          </button>
                          <button className="table-more-btn" title="Options">⋮</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>}
            </div>

            {/* Pagination Footer */}
            <div className="table-pagination-footer">
              <div>Showing 1 to {hostels.length} of {hostels.length} hostels</div>
              <div className="pagination-controls">
                <button className="page-btn" disabled>‹</button>
                <button className="page-btn active">1</button>
                <button className="page-btn" disabled>›</button>
                <select className="page-select">
                  <option>10 / page</option>
                  <option>25 / page</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div>
            <div className="modern-table-wrap">
              {userProfiles.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No user profiles found</div> :
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>NAME ↕</th>
                      <th>EMAIL ↕</th>
                      <th>ROLE ↕</th>
                      <th>DEMO FLAG ↕</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userProfiles.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div className="table-name-cell">
                            <div className="table-icon-badge purple">
                              👤
                            </div>
                            <span>{u.name}</span>
                          </div>
                        </td>
                        <td><span style={{ color: '#64748b' }}>{u.email}</span></td>
                        <td>
                          <span className="badge-pill-green" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <span className={u.is_demo ? 'badge-pill-amber' : 'badge-pill-green'}>
                            👤 {u.is_demo ? 'Demo User' : 'Production'}
                          </span>
                        </td>
                        <td>
                          <button className="table-action-btn" onClick={() => toggleFlag('user_profiles', u.id, u.is_demo)}>
                            <span>{u.is_demo ? 'Mark Production' : 'Mark Demo'}</span>
                            <span style={{ fontSize: 11 }}>↗</span>
                          </button>
                          <button className="table-more-btn" title="Options">⋮</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>}
            </div>

            {/* Pagination Footer */}
            <div className="table-pagination-footer">
              <div>Showing 1 to {userProfiles.length} of {userProfiles.length} user profiles</div>
              <div className="pagination-controls">
                <button className="page-btn" disabled>‹</button>
                <button className="page-btn active">1</button>
                <button className="page-btn" disabled>›</button>
                <select className="page-select">
                  <option>10 / page</option>
                  <option>25 / page</option>
                </select>
              </div>
            </div>
          </div>
        )}
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
