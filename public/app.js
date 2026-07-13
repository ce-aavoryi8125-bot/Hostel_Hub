const { useState, useEffect } = React;

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const API = '';

function StudentApp() {
  const [token, setToken] = useState(() => localStorage.getItem('hostelHubStudentToken') || '');
  const [student, setStudent] = useState(() => {
    const saved = localStorage.getItem('hostelHubStudent');
    return saved ? JSON.parse(saved) : null;
  });
  const [hostels, setHostels] = useState([]);
  const [search, setSearch] = useState('');
  const [roomType, setRoomType] = useState('');
  const [maxPrice, setMaxPrice] = useState(9999);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [roomGalleryType, setRoomGalleryType] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [authError, setAuthError] = useState('');
  const [tourMessage, setTourMessage] = useState('');
  const [tourForm, setTourForm] = useState({ name: '', phone: '', message: '' });
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    phone: '',
    studentId: '',
    password: '',
  });

  const loadHostels = async () => {
    const params = new URLSearchParams({
      search,
      roomType,
      maxPrice,
    });

    const response = await fetch(`${API}/api/hostels?${params.toString()}`);
    const data = await response.json();
    setHostels(data.hostels || []);
    if (data.hostels && data.hostels.length > 0 && !selectedHostel) {
      setSelectedHostel(data.hostels[0]);
      setRoomGalleryType(Object.keys(data.hostels[0].roomTypes || {})[0] || '');
    }
  };

  useEffect(() => {
    loadHostels();
  }, [search, roomType, maxPrice]);

  useEffect(() => {
    if (!token) {
      return;
    }

    fetch(`${API}/api/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.student) {
          setStudent(data.student);
          localStorage.setItem('hostelHubStudent', JSON.stringify(data.student));
        }
      })
      .catch(() => {
        setToken('');
        localStorage.removeItem('hostelHubStudentToken');
        localStorage.removeItem('hostelHubStudent');
      });
  }, [token]);

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthError('');

    const endpoint = authMode === 'login' ? '/api/login' : '/api/signup';
    const body = authMode === 'login'
      ? { email: authForm.email, password: authForm.password }
      : authForm;

    const response = await fetch(`${API}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      setAuthError(data.message || 'Unable to complete the request.');
      return;
    }

    setToken(data.token);
    setStudent(data.student);
    localStorage.setItem('hostelHubStudentToken', data.token);
    localStorage.setItem('hostelHubStudent', JSON.stringify(data.student));
    setAuthForm({ name: '', email: '', phone: '', studentId: '', password: '' });
  };

  const handleLogout = () => {
    setToken('');
    setStudent(null);
    localStorage.removeItem('hostelHubStudentToken');
    localStorage.removeItem('hostelHubStudent');
  };

  const openHostel = async (hostelId) => {
    const response = await fetch(`${API}/api/hostels/${hostelId}`);
    const data = await response.json();
    setSelectedHostel(data.hostel);
    setRoomGalleryType(Object.keys(data.hostel.roomTypes || {})[0] || '');
  };

  const bookVisit = async (hostelId) => {
    const response = await fetch(`${API}/api/hostels/${hostelId}/visit`, { method: 'POST' });
    const data = await response.json();
    if (response.ok && selectedHostel) {
      setSelectedHostel({ ...selectedHostel, visits: data.visits });
    }
  };

  const requestTour = async (event) => {
    event.preventDefault();
    if (!selectedHostel) {
      return;
    }

    const response = await fetch(`${API}/api/hostels/${selectedHostel.id}/tour-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tourForm),
    });

    const data = await response.json();
    setTourMessage(data.message || 'Tour request submitted.');
    setTourForm({ name: '', phone: '', message: '' });
  };

  const activeRoomType = selectedHostel?.roomTypes?.[roomGalleryType];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Hostel Hub</p>
          <h1>Find your next student home in Tarkwa</h1>
        </div>
        <div className="auth-chip">
          {student ? `Welcome, ${student.name}` : 'Student discovery'}
        </div>
      </header>

      <section className="hero-card panel">
        <div>
          <h2>Browse verified hostels close to UMaT</h2>
          <p>Search hostels by budget, location, and room type, then contact the agent directly.</p>
        </div>
        <div className="hero-grid">
          <label>
            Search
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Hostel name or area" />
          </label>
          <label>
            Room type
            <select value={roomType} onChange={(e) => setRoomType(e.target.value)}>
              <option value="">Any room type</option>
              <option value="1-in-a-room">1-in-a-room</option>
              <option value="2-in-a-room">2-in-a-room</option>
              <option value="3-in-a-room">3-in-a-room</option>
              <option value="4-in-a-room">4-in-a-room</option>
            </select>
          </label>
          <label>
            Max budget
            <input type="range" min="250" max="800" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} />
            <span>{formatCurrency(maxPrice)}</span>
          </label>
        </div>
      </section>

      <div className="content-grid">
        <aside className="panel list-panel">
          <h3>Hostel listings</h3>
          <div className="hostel-list">
            {hostels.map((hostel) => (
              <button key={hostel.id} className="hostel-card" onClick={() => openHostel(hostel.id)}>
                <div className="hostel-card-top">
                  <strong>{hostel.name}</strong>
                  <span>{hostel.rating}★</span>
                </div>
                <p>{hostel.location}</p>
                <small>{hostel.address}</small>
                <b>{formatCurrency(hostel.pricePerMonth)} / month</b>
              </button>
            ))}
          </div>
        </aside>

        <main className="panel detail-panel">
          {selectedHostel ? (
            <>
              <div className="detail-header">
                <div>
                  <p className="eyebrow">{selectedHostel.location}</p>
                  <h2>{selectedHostel.name}</h2>
                </div>
                <div className="actions">
                  <a className="btn ghost" href={selectedHostel.mapsUrl} target="_blank" rel="noreferrer">Open map</a>
                  <button className="btn" onClick={() => bookVisit(selectedHostel.id)}>Record visit</button>
                </div>
              </div>

              <div className="gallery-grid">
                {(selectedHostel.photos || []).slice(0, 4).map((photo, index) => (
                  <img key={`${selectedHostel.id}-photo-${index}`} src={photo} alt={`${selectedHostel.name} preview ${index + 1}`} />
                ))}
              </div>

              <div className="room-tabs">
                {Object.keys(selectedHostel.roomTypes || {}).map((type) => (
                  <button
                    key={type}
                    className={roomGalleryType === type ? 'tab active' : 'tab'}
                    onClick={() => setRoomGalleryType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {activeRoomType && (
                <div className="gallery-panel">
                  <div className="gallery-title-row">
                    <h3>{roomGalleryType}</h3>
                    <span>{formatCurrency(activeRoomType.price)}</span>
                  </div>
                  <div className="thumb-strip">
                    {(activeRoomType.gallery || []).map((photo, index) => (
                      <img key={`${roomGalleryType}-${index}`} src={photo} alt={`${roomGalleryType} room`} />
                    ))}
                  </div>
                </div>
              )}

              <div className="meta-grid">
                <div>
                  <h3>Facilities</h3>
                  <ul>
                    {(selectedHostel.facilities || []).map((facility) => (
                      <li key={facility}>{facility}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>Kitchen photos</h3>
                  <div className="thumb-strip">
                    {(selectedHostel.kitchenPhotos || []).map((photo, index) => (
                      <img key={`kitchen-${index}`} src={photo} alt="Kitchen area" />
                    ))}
                  </div>
                </div>
              </div>

              <div className="agent-box">
                <h3>Agent contact</h3>
                <p>{selectedHostel.agentName}</p>
                <p>{selectedHostel.agentPhone}</p>
                <a href={`mailto:${selectedHostel.agentEmail}`}>{selectedHostel.agentEmail}</a>
              </div>

              <div className="tour-form">
                <h3>Request a tour</h3>
                <form onSubmit={requestTour}>
                  <label>
                    Name
                    <input value={tourForm.name} onChange={(e) => setTourForm({ ...tourForm, name: e.target.value })} required />
                  </label>
                  <label>
                    Phone
                    <input value={tourForm.phone} onChange={(e) => setTourForm({ ...tourForm, phone: e.target.value })} required />
                  </label>
                  <label>
                    Note
                    <textarea value={tourForm.message} onChange={(e) => setTourForm({ ...tourForm, message: e.target.value })} rows="4" required />
                  </label>
                  <button className="btn" type="submit">Send request</button>
                </form>
                {tourMessage ? <p className="success-text">{tourMessage}</p> : null}
              </div>
            </>
          ) : (
            <p>No hostel matches your filters yet.</p>
          )}
        </main>

        <aside className="panel auth-panel">
          {student ? (
            <div>
              <h3>Student account</h3>
              <p>{student.name}</p>
              <p>{student.email}</p>
              <button className="btn ghost" onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <form onSubmit={handleAuthSubmit} className="auth-form">
              <div className="mode-switch">
                <button type="button" className={authMode === 'login' ? 'tab active' : 'tab'} onClick={() => setAuthMode('login')}>Login</button>
                <button type="button" className={authMode === 'signup' ? 'tab active' : 'tab'} onClick={() => setAuthMode('signup')}>Sign up</button>
              </div>

              {authMode === 'signup' ? (
                <>
                  <label>
                    Full name
                    <input value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} required />
                  </label>
                  <label>
                    Phone
                    <input value={authForm.phone} onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })} required />
                  </label>
                  <label>
                    Student ID
                    <input value={authForm.studentId} onChange={(e) => setAuthForm({ ...authForm, studentId: e.target.value })} required />
                  </label>
                </>
              ) : null}

              <label>
                Email
                <input type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} required />
              </label>
              <label>
                Password
                <input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} required />
              </label>

              {authError ? <p className="error-text">{authError}</p> : null}
              <button className="btn" type="submit">{authMode === 'login' ? 'Login' : 'Create account'}</button>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}

function AdminApp() {
  const [token, setToken] = useState(() => localStorage.getItem('hostelHubAdminToken') || '');
  const [stats, setStats] = useState(null);
  const [hostels, setHostels] = useState([]);
  const [loginForm, setLoginForm] = useState({ email: 'admin@hostelhub.dev', password: 'admin123' });
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    location: 'Tarkwa',
    address: '',
    pricePerMonth: 400,
    rating: 4.7,
    mapsUrl: '',
    facilities: 'Wi-Fi,Water,Security',
    agentName: '',
    agentPhone: '',
    agentEmail: '',
    description: '',
    roomTypes: '{"1-in-a-room":{"price":400,"gallery":["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80"]}}',
    kitchenPhotos: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=900&q=80',
  });
  const [photos, setPhotos] = useState([]);

  const loadDashboard = async () => {
    const [statsRes, hostelsRes] = await Promise.all([
      fetch(`${API}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API}/api/admin/hostels`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const statsData = await statsRes.json();
    const hostelsData = await hostelsRes.json();
    setStats(statsData.stats);
    setHostels(hostelsData.hostels || []);
  };

  useEffect(() => {
    if (!token) {
      return;
    }
    loadDashboard().catch(() => setError('Unable to load admin dashboard.'));
  }, [token]);

  const handleAdminLogin = async (event) => {
    event.preventDefault();

    const response = await fetch(`${API}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.message || 'Admin login failed');
      return;
    }

    localStorage.setItem('hostelHubAdminToken', data.token);
    setToken(data.token);
    setError('');
  };

  const handleCreateHostel = async (event) => {
    event.preventDefault();

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    Array.from(photos).forEach((photo) => payload.append('photos', photo));

    const response = await fetch(`${API}/api/admin/hostels`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: payload,
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.message || 'Unable to create hostel listing');
      return;
    }

    setError('');
    setForm({
      name: '',
      location: 'Tarkwa',
      address: '',
      pricePerMonth: 400,
      rating: 4.7,
      mapsUrl: '',
      facilities: 'Wi-Fi,Water,Security',
      agentName: '',
      agentPhone: '',
      agentEmail: '',
      description: '',
      roomTypes: '{"1-in-a-room":{"price":400,"gallery":["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80"]}}',
      kitchenPhotos: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=900&q=80',
    });
    setPhotos([]);
    await loadDashboard();
  };

  if (!token) {
    return (
      <div className="app-shell admin-shell">
        <section className="panel auth-panel">
          <h2>Admin access</h2>
          <form onSubmit={handleAdminLogin} className="auth-form">
            <label>
              Admin email
              <input value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
            </label>
            <label>
              Password
              <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
            </label>
            {error ? <p className="error-text">{error}</p> : null}
            <button className="btn" type="submit">Login</button>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="app-shell admin-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Admin dashboard</p>
          <h1>Hostel Hub operations</h1>
        </div>
        <button className="btn ghost" onClick={() => { localStorage.removeItem('hostelHubAdminToken'); setToken(''); }}>Logout</button>
      </header>

      <section className="stats-grid">
        <div className="panel stat-card">
          <span>Total hostels</span>
          <strong>{stats?.totalHostels ?? 0}</strong>
        </div>
        <div className="panel stat-card">
          <span>Students</span>
          <strong>{stats?.totalStudents ?? 0}</strong>
        </div>
        <div className="panel stat-card">
          <span>Tour requests</span>
          <strong>{stats?.totalTourRequests ?? 0}</strong>
        </div>
        <div className="panel stat-card">
          <span>Visits</span>
          <strong>{stats?.totalVisits ?? 0}</strong>
        </div>
      </section>

      <div className="content-grid admin-grid">
        <section className="panel">
          <h3>Create hostel listing</h3>
          <form onSubmit={handleCreateHostel} className="admin-form">
            <label>
              Hostel name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>
              Location
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
            </label>
            <label>
              Address
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
            </label>
            <label>
              Price per month
              <input type="number" value={form.pricePerMonth} onChange={(e) => setForm({ ...form, pricePerMonth: Number(e.target.value) })} required />
            </label>
            <label>
              Maps URL
              <input value={form.mapsUrl} onChange={(e) => setForm({ ...form, mapsUrl: e.target.value })} required />
            </label>
            <label>
              Facilities
              <input value={form.facilities} onChange={(e) => setForm({ ...form, facilities: e.target.value })} />
            </label>
            <label>
              Agent name
              <input value={form.agentName} onChange={(e) => setForm({ ...form, agentName: e.target.value })} required />
            </label>
            <label>
              Agent phone
              <input value={form.agentPhone} onChange={(e) => setForm({ ...form, agentPhone: e.target.value })} required />
            </label>
            <label>
              Agent email
              <input type="email" value={form.agentEmail} onChange={(e) => setForm({ ...form, agentEmail: e.target.value })} required />
            </label>
            <label>
              Description
              <textarea rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </label>
            <label>
              Room types JSON
              <textarea rows="5" value={form.roomTypes} onChange={(e) => setForm({ ...form, roomTypes: e.target.value })} required />
            </label>
            <label>
              Kitchen photos list
              <input value={form.kitchenPhotos} onChange={(e) => setForm({ ...form, kitchenPhotos: e.target.value })} />
            </label>
            <label>
              Listing photos
              <input type="file" multiple accept="image/*" onChange={(e) => setPhotos(e.target.files)} />
            </label>
            <button className="btn" type="submit">Publish listing</button>
          </form>
        </section>

        <section className="panel">
          <h3>Live listings</h3>
          <div className="hostel-list">
            {hostels.map((hostel) => (
              <div key={hostel.id} className="hostel-card admin-listing">
                <strong>{hostel.name}</strong>
                <p>{hostel.location}</p>
                <small>{hostel.address}</small>
                <b>{formatCurrency(hostel.pricePerMonth)}</b>
                <span>{hostel.visits || 0} visits</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function App() {
  const page = document.body.dataset.page;
  return page === 'admin' ? <AdminApp /> : <StudentApp />;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
