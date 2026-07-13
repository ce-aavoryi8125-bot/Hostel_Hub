const { useState, useEffect } = React;

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const API = '';

function StudentApp() {
  const [token, setToken] = useState(() => localStorage.getItem('hostelHubToken') || '');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('hostelHubUser');
    return saved ? JSON.parse(saved) : null;
  });

  // Navigation: 'browse', 'manager-finances', 'pitch', 'roadmap'
  const [activeTab, setActiveTab] = useState('browse');
  
  // Student Search states
  const [hostels, setHostels] = useState([]);
  const [search, setSearch] = useState('');
  const [roomType, setRoomType] = useState('');
  const [maxPrice, setMaxPrice] = useState(800);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [roomGalleryType, setRoomGalleryType] = useState('');
  
  // Checkout Modal states
  const [checkoutActive, setCheckoutActive] = useState(false);
  const [checkoutRoomType, setCheckoutRoomType] = useState('');
  const [checkoutPrice, setCheckoutPrice] = useState(0);
  const [checkoutSuccess, setCheckoutSuccess] = useState('');
  
  // Tour states
  const [tourMessage, setTourMessage] = useState('');
  const [tourForm, setTourForm] = useState({ name: '', phone: '', message: '' });
  
  // Auth Form states
  const [authMode, setAuthMode] = useState('login');
  const [authError, setAuthError] = useState('');
  const [authForm, setAuthForm] = useState({
    role: 'student',
    name: '',
    email: '',
    phone: '',
    studentId: '',
    password: '',
  });

  // Manager Portal states
  const [finances, setFinances] = useState(null);
  const [bankForm, setBankForm] = useState({ bankName: '', accountName: '', accountNumber: '' });
  const [expenseForm, setExpenseForm] = useState({ hostelId: '', amount: '', category: 'Maintenance', description: '' });
  const [managerError, setManagerError] = useState('');
  const [managerSuccess, setManagerSuccess] = useState('');
  
  // Add Hostel State (used by managers if they want to self-list)
  const [showAddHostel, setShowAddHostel] = useState(false);
  const [hostelForm, setHostelForm] = useState({
    name: '',
    location: 'Tarkwa',
    address: '',
    pricePerMonth: 400,
    rating: 4.8,
    mapsUrl: '',
    facilities: 'Wi-Fi,Water,Security,Electricity Backup',
    agentName: '',
    agentPhone: '',
    agentEmail: '',
    description: '',
    room1Active: true, room1Price: 450,
    room2Active: true, room2Price: 400,
    room3Active: false, room3Price: 350,
    room4Active: false, room4Price: 300,
    kitchenPhotos: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=900&q=80',
  });
  const [photos, setPhotos] = useState([]);

  // Load hostels for student browsing
  const loadHostels = async () => {
    const params = new URLSearchParams({
      search,
      roomType,
      maxPrice,
    });

    try {
      const response = await fetch(`${API}/api/hostels?${params.toString()}`);
      const data = await response.json();
      setHostels(data.hostels || []);
      if (data.hostels && data.hostels.length > 0 && !selectedHostel) {
        setSelectedHostel(data.hostels[0]);
        setRoomGalleryType(Object.keys(data.hostels[0].roomTypes || {})[0] || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Load Manager Finances & Bookings
  const loadManagerFinances = async () => {
    if (!token || user?.role !== 'manager') return;
    try {
      const res = await fetch(`${API}/api/manager/finances`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFinances(data);
        if (data.bankDetails) {
          setBankForm(data.bankDetails);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Log page visit
  const logPageVisit = async (pageName) => {
    try {
      await fetch(`${API}/api/visits/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: pageName,
          user: user ? `${user.name} (${user.role})` : 'Anonymous Student'
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadHostels();
  }, [search, roomType, maxPrice]);

  useEffect(() => {
    if (activeTab === 'manager-finances') {
      loadManagerFinances();
      logPageVisit('manager-finances-portal');
    } else {
      logPageVisit(activeTab === 'browse' ? 'student-browse' : activeTab);
    }
  }, [activeTab, token]);

  // Handle Token / Session check
  useEffect(() => {
    if (!token) {
      setUser(null);
      localStorage.removeItem('hostelHubToken');
      localStorage.removeItem('hostelHubUser');
      return;
    }

    fetch(`${API}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          localStorage.setItem('hostelHubUser', JSON.stringify(data.user));
        }
      })
      .catch(() => {
        setToken('');
        setUser(null);
        localStorage.removeItem('hostelHubToken');
        localStorage.removeItem('hostelHubUser');
      });
  }, [token]);

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthError('');

    const endpoint = authMode === 'login' ? '/api/login' : '/api/signup';
    const body = authMode === 'login'
      ? { email: authForm.email, password: authForm.password }
      : authForm;

    try {
      const response = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthError(data.message || 'Unable to complete authentication.');
        return;
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('hostelHubToken', data.token);
      localStorage.setItem('hostelHubUser', JSON.stringify(data.user));
      setAuthForm({ role: 'student', name: '', email: '', phone: '', studentId: '', password: '' });
      setAuthError('');
      
      // Automatically direct managers to financial portal
      if (data.user?.role === 'manager') {
        setActiveTab('manager-finances');
      }
    } catch (e) {
      setAuthError('Network error. Please try again.');
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('hostelHubToken');
    localStorage.removeItem('hostelHubUser');
    setActiveTab('browse');
  };

  const openHostel = async (hostelId) => {
    try {
      const response = await fetch(`${API}/api/hostels/${hostelId}`);
      const data = await response.json();
      setSelectedHostel(data.hostel);
      setRoomGalleryType(Object.keys(data.hostel.roomTypes || {})[0] || '');
      
      // Record physical statistics visit count
      fetch(`${API}/api/hostels/${hostelId}/visit`, { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
  };

  const requestTour = async (event) => {
    event.preventDefault();
    if (!selectedHostel) return;

    try {
      const response = await fetch(`${API}/api/hostels/${selectedHostel.id}/tour-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tourForm),
      });

      const data = await response.json();
      setTourMessage(data.message || 'Tour request submitted.');
      setTourForm({ name: '', phone: '', message: '' });
      setTimeout(() => setTourMessage(''), 5000);
    } catch (e) {
      setTourMessage('Could not submit tour request.');
    }
  };

  // Payment checkout flow
  const initiateCheckout = (type, price) => {
    if (!user) {
      setAuthError('You must sign in to rent a room!');
      // Scroll to auth panel
      document.querySelector('.auth-panel')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    setCheckoutRoomType(type);
    setCheckoutPrice(price);
    setCheckoutSuccess('');
    setCheckoutActive(true);
  };

  const processPayment = async () => {
    try {
      const response = await fetch(`${API}/api/hostels/${selectedHostel.id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          roomType: checkoutRoomType,
          price: checkoutPrice
        })
      });

      const data = await response.json();
      if (response.ok) {
        setCheckoutSuccess(`HH-TARKWA-${Date.now().toString().slice(-6).toUpperCase()}`);
        loadHostels(); // reload data
      } else {
        alert(data.message || 'Payment processing failed');
      }
    } catch (e) {
      alert('Error connecting to payment processor.');
    }
  };

  // Manager bank account setup
  const saveBankDetails = async (e) => {
    e.preventDefault();
    setManagerError('');
    setManagerSuccess('');
    try {
      const res = await fetch(`${API}/api/manager/bank-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bankForm)
      });
      const data = await res.json();
      if (res.ok) {
        setManagerSuccess('Bank account linked successfully!');
        loadManagerFinances();
      } else {
        setManagerError(data.message || 'Could not link bank account.');
      }
    } catch (e) {
      setManagerError('Network error.');
    }
  };

  // Manager log expense
  const logExpense = async (e) => {
    e.preventDefault();
    setManagerError('');
    setManagerSuccess('');
    try {
      const res = await fetch(`${API}/api/manager/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(expenseForm)
      });
      const data = await res.json();
      if (res.ok) {
        setManagerSuccess('Expense logged successfully!');
        setExpenseForm({ hostelId: '', amount: '', category: 'Maintenance', description: '' });
        loadManagerFinances();
      } else {
        setManagerError(data.message || 'Could not log expense.');
      }
    } catch (e) {
      setManagerError('Network error.');
    }
  };

  // Manager publish hostel
  const createHostelListing = async (e) => {
    e.preventDefault();
    setManagerError('');
    setManagerSuccess('');

    // construct roomTypes JSON object
    const roomTypes = {};
    if (hostelForm.room1Active) roomTypes['1-in-a-room'] = { price: Number(hostelForm.room1Price), gallery: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'] };
    if (hostelForm.room2Active) roomTypes['2-in-a-room'] = { price: Number(hostelForm.room2Price), gallery: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80'] };
    if (hostelForm.room3Active) roomTypes['3-in-a-room'] = { price: Number(hostelForm.room3Price), gallery: ['https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'] };
    if (hostelForm.room4Active) roomTypes['4-in-a-room'] = { price: Number(hostelForm.room4Price), gallery: ['https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80'] };

    const payload = new FormData();
    Object.entries(hostelForm).forEach(([key, value]) => {
      if (!key.startsWith('room')) {
        payload.append(key, value);
      }
    });
    payload.append('roomTypes', JSON.stringify(roomTypes));
    Array.from(photos).forEach((photo) => payload.append('photos', photo));

    try {
      const response = await fetch(`${API}/api/admin/hostels`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: payload
      });

      const data = await response.json();
      if (!response.ok) {
        setManagerError(data.message || 'Unable to create hostel listing');
        return;
      }

      setManagerSuccess('Hostel published successfully!');
      setShowAddHostel(false);
      loadHostels();
      loadManagerFinances();
    } catch (e) {
      setManagerError('Network error listing hostel.');
    }
  };

  const activeRoomType = selectedHostel?.roomTypes?.[roomGalleryType];

  if (!token || !user) {
    return (
      <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '16px' }}>
        <div className="panel" style={{ maxWidth: '960px', width: '100%', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', padding: '40px', background: 'white', borderRadius: 'var(--radius-md)' }}>
          
          {/* Left Info side */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid var(--panel-border)', paddingRight: '40px' }}>
            <div>
              <p className="eyebrow" style={{ fontSize: '12px', color: 'var(--primary)' }}>Welcome to Hostel Hub</p>
              <h2 style={{ fontSize: '32px', fontWeight: '800', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '16px', lineHeight: '1.2' }}>
                Find Your Student Home Without Stress
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
                We physically visit and photograph every hostel room in Tarkwa to verify quality, pricing, and manager credentials. Join our student community to find verified spaces near UMaT.
              </p>
              
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ background: '#e0e7ff', color: 'var(--primary)', padding: '6px', borderRadius: '50%', fontWeight: 'bold', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✓</span>
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block' }}>Verified Room Occupancies</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Photos of 1-in-a-room, 2-in-a-room, 3-in-a-room, and 4-in-a-room options.</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ background: '#e0e7ff', color: 'var(--primary)', padding: '6px', borderRadius: '50%', fontWeight: 'bold', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✓</span>
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block' }}>Interactive Budget Ranges</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Filter student accommodations directly within your monthly limits.</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ background: '#e0e7ff', color: 'var(--primary)', padding: '6px', borderRadius: '50%', fontWeight: 'bold', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✓</span>
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block' }}>Guided Campus Tours</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>An agent will meet you at the campus gate and escort you on a tour.</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '30px' }}>
              Hostel owners and managers get instant financial ledger and accounting tools upon registering.
            </div>
          </div>

          {/* Right Auth form side */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <form onSubmit={handleAuthSubmit} className="auth-form" style={{ gap: '16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>
                {authMode === 'login' ? 'Sign In to Your Account' : 'Create Student / Manager Account'}
              </h3>
              
              <div className="mode-switch" style={{ marginBottom: '8px' }}>
                <button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Login</button>
                <button type="button" className={authMode === 'signup' ? 'active' : ''} onClick={() => setAuthMode('signup')}>Sign Up</button>
              </div>

              {authMode === 'signup' && (
                <div className="role-switch-container">
                  <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>Select Account Type:</p>
                  <div className="role-switch-row">
                    <label className={authForm.role === 'student' ? 'active' : ''} style={{ fontSize: '13px', padding: '10px' }}>
                      <input type="radio" name="role" value="student" checked={authForm.role === 'student'} onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })} />
                      🎓 Student
                    </label>
                    <label className={authForm.role === 'manager' ? 'active' : ''} style={{ fontSize: '13px', padding: '10px' }}>
                      <input type="radio" name="role" value="manager" checked={authForm.role === 'manager'} onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })} />
                      💼 Manager
                    </label>
                  </div>
                </div>
              )}

              {authMode === 'signup' && (
                <>
                  <label>
                    Full Name
                    <input value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} placeholder="John Doe" required />
                  </label>
                  <label>
                    Active Phone Number
                    <input value={authForm.phone} onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })} placeholder="+233 24..." required />
                  </label>
                  {authForm.role === 'student' && (
                    <label>
                      Student ID (UMaT)
                      <input value={authForm.studentId} onChange={(e) => setAuthForm({ ...authForm, studentId: e.target.value })} placeholder="e.g. 991823" required />
                    </label>
                  )}
                </>
              )}

              <label>
                Email Address
                <input type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} placeholder="name@domain.com" required />
              </label>
              <label>
                Password
                <input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} placeholder="••••••••" required />
              </label>

              {authError ? <p className="error-text" style={{ fontSize: '13px' }}>{authError}</p> : null}
              <button className="btn" type="submit" style={{ padding: '12px', fontSize: '15px' }}>
                {authMode === 'login' ? 'Access Portal' : 'Start Searching Hostels'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Hostel Hub</p>
          <h1>Find Your Next Student Home in Tarkwa</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className={activeTab === 'browse' ? 'tab active' : 'tab'} onClick={() => setActiveTab('browse')}>Browse Hostels</button>
          <button className={activeTab === 'pitch' ? 'tab active' : 'tab'} onClick={() => setActiveTab('pitch')}>List Your Hostel</button>
          <button className={activeTab === 'roadmap' ? 'tab active' : 'tab'} onClick={() => setActiveTab('roadmap')}>Success Roadmap</button>
          {user?.role === 'manager' && (
            <button className={activeTab === 'manager-finances' ? 'tab active' : 'tab'} onClick={() => setActiveTab('manager-finances')}>Manager Finances</button>
          )}
          {user ? (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div className="auth-chip">
                {user.role === 'manager' ? '💼 Manager: ' : '🎓 Student: '} {user.name}
              </div>
              <button onClick={handleLogout} className="btn ghost" style={{ padding: '6px 12px', fontSize: '12px' }}>Logout</button>
            </div>
          ) : (
            <div className="auth-chip">Guest Account</div>
          )}
        </div>
      </header>

      {activeTab === 'browse' && (
        <>
          <section className="hero-card panel">
            <div>
              <h2>Browse Verified Hostels Close to UMaT</h2>
              <p>Filter student homes by location, room configurations, and your monthly budget. Request direct tours or pay rent online instantly.</p>
            </div>
            <div className="hero-grid">
              <label>
                Search Hostels
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Hostel name, street, or amenities..." />
              </label>
              <label>
                Room Style
                <select value={roomType} onChange={(e) => setRoomType(e.target.value)}>
                  <option value="">Any occupancy style</option>
                  <option value="1-in-a-room">1-in-a-room</option>
                  <option value="2-in-a-room">2-in-a-room</option>
                  <option value="3-in-a-room">3-in-a-room</option>
                  <option value="4-in-a-room">4-in-a-room</option>
                </select>
              </label>
              <label className="price-slider-container">
                Budget Limit: <strong>{formatCurrency(maxPrice)} / month</strong>
                <input type="range" min="200" max="1000" step="25" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} />
              </label>
            </div>
          </section>

          <div className="content-grid">
            <aside className="panel list-panel">
              <h3>Available Hostels ({hostels.length})</h3>
              <div className="hostel-list">
                {hostels.map((hostel) => (
                  <button 
                    key={hostel.id} 
                    className={`hostel-card ${selectedHostel?.id === hostel.id ? 'active' : ''}`} 
                    onClick={() => openHostel(hostel.id)}
                  >
                    <div className="hostel-card-top">
                      <strong>{hostel.name}</strong>
                      <span className="rating-badge">{hostel.rating}★</span>
                    </div>
                    <p>{hostel.location}</p>
                    <small>{hostel.address}</small>
                    <b>From {formatCurrency(hostel.pricePerMonth)} / month</b>
                  </button>
                ))}
                {hostels.length === 0 && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No hostels match your pricing or filter options.</p>}
              </div>
            </aside>

            <main className="panel detail-panel">
              {selectedHostel ? (
                <>
                  <div className="detail-header">
                    <div>
                      <div className="verification-badge">✓ Physical Photography Verified</div>
                      <h2>{selectedHostel.name}</h2>
                      <p>{selectedHostel.address}, {selectedHostel.location}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a className="btn ghost" href={selectedHostel.mapsUrl} target="_blank" rel="noreferrer">Open in Google Maps</a>
                    </div>
                  </div>

                  {/* Mock Map widget */}
                  <div className="map-widget-container">
                    <div className="map-grid-bg">
                      <div className="map-pin"></div>
                    </div>
                    <div className="map-overlay-info">
                      <span>Hostel coordinates mapped at {selectedHostel.location}</span>
                      <a href={selectedHostel.mapsUrl} target="_blank" rel="noreferrer" className="btn secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>Start Navigation</a>
                    </div>
                  </div>

                  <div className="gallery-grid">
                    {(selectedHostel.photos || []).slice(0, 4).map((photo, index) => (
                      <img key={`${selectedHostel.id}-photo-${index}`} src={photo} alt={`${selectedHostel.name} view ${index + 1}`} />
                    ))}
                  </div>

                  <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '16px' }}>
                    <h3>Select Occupancy Style</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>We take pictures of each room structure to ensure what you see is what you get.</p>
                    
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

                    {activeRoomType ? (
                      <div className="gallery-panel">
                        <div className="gallery-title-row">
                          <h3>Room Photos ({roomGalleryType})</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <span>{formatCurrency(activeRoomType.price)} / month</span>
                            <button className="btn secondary" onClick={() => initiateCheckout(roomGalleryType, activeRoomType.price)}>Rent Now</button>
                          </div>
                        </div>
                        <div className="thumb-strip">
                          {(activeRoomType.gallery || []).map((photo, index) => (
                            <img key={`${roomGalleryType}-${index}`} src={photo} alt={`${roomGalleryType} room`} />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Room specific photo records not loaded for this style.</p>
                    )}
                  </div>

                  <div className="meta-grid">
                    <div>
                      <h3>Facilities Included</h3>
                      <ul className="facilities-list">
                        {(selectedHostel.facilities || []).map((facility) => (
                          <li key={facility}>{facility}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3>Shared Kitchen Space</h3>
                      <div className="thumb-strip">
                        {(selectedHostel.kitchenPhotos || []).map((photo, index) => (
                          <img key={`kitchen-${index}`} src={photo} alt="Kitchen area" />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="agent-box">
                    <div className="agent-profile">
                      <div className="agent-avatar">
                        {(selectedHostel.agentName || 'A')[0]}
                      </div>
                      <div className="agent-details">
                        <h4>Local Agent: {selectedHostel.agentName}</h4>
                        <p>{selectedHostel.agentPhone} • {selectedHostel.agentEmail}</p>
                      </div>
                    </div>
                    <div>
                      <a href={`https://wa.me/${selectedHostel.agentPhone?.replace(/\s+/g, '')}`} target="_blank" rel="noreferrer" className="btn secondary">WhatsApp Agent</a>
                    </div>
                  </div>

                  <div className="tour-form">
                    <h3>Contact Agent & Book a Tour</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>An agent will meet you at the campus gate and take you on a physical inspection tour of the rooms.</p>
                    <form onSubmit={requestTour}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <label>
                          Your Name
                          <input value={tourForm.name} onChange={(e) => setTourForm({ ...tourForm, name: e.target.value })} placeholder="Full Name" required />
                        </label>
                        <label>
                          Contact Phone
                          <input value={tourForm.phone} onChange={(e) => setTourForm({ ...tourForm, phone: e.target.value })} placeholder="Phone Number" required />
                        </label>
                      </div>
                      <label>
                        Preferred Inspection Date & Notes
                        <textarea value={tourForm.message} onChange={(e) => setTourForm({ ...tourForm, message: e.target.value })} placeholder="Write your preferred time (e.g. Saturday 2pm)..." rows="3" required />
                      </label>
                      <button className="btn" type="submit">Schedule Tour</button>
                    </form>
                    {tourMessage ? <p className="success-text" style={{ marginTop: '8px' }}>{tourMessage}</p> : null}
                  </div>
                </>
              ) : (
                <p>Select a hostel on the left panel to display details.</p>
              )}
            </main>

            <aside className="panel auth-panel">
              {user ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3>Registered Account</h3>
                  <p style={{ fontSize: '13px' }}><strong>Name:</strong> {user.name}</p>
                  <p style={{ fontSize: '13px' }}><strong>Email:</strong> {user.email}</p>
                  <p style={{ fontSize: '13px' }}><strong>Phone:</strong> {user.phone}</p>
                  {user.role === 'student' && <p style={{ fontSize: '13px' }}><strong>Student ID:</strong> {user.studentId || 'N/A'}</p>}
                  
                  <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '12px', marginTop: '8px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Need a hostel listed? Hostel managers get fully-featured financial tracking ledger tools upon signing up as a Manager.</p>
                  </div>
                  <button className="btn danger" onClick={handleLogout}>Log Out</button>
                </div>
              ) : (
                <form onSubmit={handleAuthSubmit} className="auth-form">
                  <h3>Portal Authentication</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Login to keep track of tours, request mock payments, and verify details.</p>
                  
                  <div className="mode-switch">
                    <button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Login</button>
                    <button type="button" className={authMode === 'signup' ? 'active' : ''} onClick={() => setAuthMode('signup')}>Sign Up</button>
                  </div>

                  {authMode === 'signup' && (
                    <div className="role-switch-container">
                      <p style={{ fontSize: '11px', fontWeight: '700' }}>Choose Account Type:</p>
                      <div className="role-switch-row">
                        <label className={authForm.role === 'student' ? 'active' : ''}>
                          <input type="radio" name="role" value="student" checked={authForm.role === 'student'} onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })} />
                          Student
                        </label>
                        <label className={authForm.role === 'manager' ? 'active' : ''}>
                          <input type="radio" name="role" value="manager" checked={authForm.role === 'manager'} onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })} />
                          Manager
                        </label>
                      </div>
                    </div>
                  )}

                  {authMode === 'signup' && (
                    <>
                      <label>
                        Full Name
                        <input value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} placeholder="John Doe" required />
                      </label>
                      <label>
                        Active Phone
                        <input value={authForm.phone} onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })} placeholder="+233 24..." required />
                      </label>
                      {authForm.role === 'student' && (
                        <label>
                          Student ID (UMaT)
                          <input value={authForm.studentId} onChange={(e) => setAuthForm({ ...authForm, studentId: e.target.value })} placeholder="991823" required />
                        </label>
                      )}
                    </>
                  )}

                  <label>
                    Email Address
                    <input type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} placeholder="name@domain.com" required />
                  </label>
                  <label>
                    Password
                    <input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} required />
                  </label>

                  {authError ? <p className="error-text">{authError}</p> : null}
                  <button className="btn" type="submit">{authMode === 'login' ? 'Proceed Login' : 'Register Account'}</button>
                </form>
              )}
            </aside>
          </div>
        </>
      )}

      {activeTab === 'pitch' && (
        <section className="panel" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '24px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>List Your Hostel with Hostel Hub</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
            We help hostel managers in Tarkwa find verified students without stress. Instead of searching, students book directly through the site. Check out how your business wins with our model:
          </p>

          <div className="pitch-card-grid">
            <div className="pitch-item">
              <h4>📸 Free Professional Photography</h4>
              <p>Your listing payment covers our verified team visiting your hostel to take high-resolution room photos (1 to 4 occupancy setups) and kitchen facilities. Stunning visuals drive 4x higher booking rates.</p>
            </div>
            <div className="pitch-item">
              <h4>🏦 Direct Bank Deposits</h4>
              <p>No rent chasing or delays. We let you link your bank details directly so student transactions process straight to your bank, keeping your cash flow liquid and verified.</p>
            </div>
            <div className="pitch-item">
              <h4>📊 Interactive Accounting Software</h4>
              <p>Forget paper ledgers. Our built-in financial dashboard calculates monthly hostel income, stores utilities/water/electricity repair bills, and reports your net profits automatically.</p>
            </div>
          </div>

          <div style={{ marginTop: '32px', background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
            <h3>Monetization & Listing Packages</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              We charge a straightforward listing fee to keep our verification team on the road. Select a plan to get featured:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ padding: '16px', background: 'white', border: '2px solid var(--panel-border)', borderRadius: '8px' }}>
                <h4 style={{ fontWeight: '800' }}>Standard Plan</h4>
                <strong style={{ fontSize: '20px', color: 'var(--primary)', display: 'block', margin: '8px 0' }}>GHS 150 <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ one-time</span></strong>
                <ul style={{ fontSize: '12px', listStyle: 'square', paddingLeft: '16px', color: 'var(--text-muted)' }}>
                  <li>Physical hostel verification</li>
                  <li>Photos upload (Rooms, Kitchen, Toilet)</li>
                  <li>Manager profile info and Google map routing</li>
                  <li>Direct agent WhatsApp scheduling widget</li>
                </ul>
              </div>
              <div style={{ padding: '16px', background: 'white', border: '2px solid var(--primary)', borderRadius: '8px', position: 'relative' }}>
                <span style={{ position: 'absolute', top: '-10px', right: '12px', background: 'var(--primary)', color: 'white', fontSize: '9px', padding: '2px 8px', borderRadius: '99px', fontWeight: '800' }}>RECOMMENDED</span>
                <h4 style={{ fontWeight: '800' }}>Premium Analytics Plan</h4>
                <strong style={{ fontSize: '20px', color: 'var(--primary)', display: 'block', margin: '8px 0' }}>GHS 250 <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ one-time</span></strong>
                <ul style={{ fontSize: '12px', listStyle: 'square', paddingLeft: '16px', color: 'var(--text-muted)' }}>
                  <li>Everything in Standard</li>
                  <li>Ranked at the top of student search results</li>
                  <li>Access to the **Income & Expenditure ledger**</li>
                  <li>Bank account link setup for student online payment</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'roadmap' && (
        <section className="panel" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2>Hostel Hub Growth Strategies & Success Keys</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
            Launching a platform is step one. To ensure Hostel Hub dominates the Tarkwa student housing market, we focus on verified quality and simplicity:
          </p>

          <div className="success-roadmap">
            <div className="roadmap-step">
              <div className="step-num">1</div>
              <div className="step-content">
                <h4>Trust Through Hand-Checked Rooms</h4>
                <p>Students face huge stress because online pictures are often old or fake. Our rule: **zero user uploads**. We send our staff to verify the kitchen, wifi speed, and snap exact room structures. Trust is our number one asset.</p>
              </div>
            </div>
            <div className="roadmap-step">
              <div className="step-num">2</div>
              <div className="step-content">
                <h4>The Price Range Search Slider</h4>
                <p>Students operate on strict budgets. A simple, interactive price range filter avoids wasting time on options they cannot afford, making the portal stress-free and highly interactive.</p>
              </div>
            </div>
            <div className="roadmap-step">
              <div className="step-num">3</div>
              <div className="step-content">
                <h4>Agent Tour Booking (Anxiety Reduction)</h4>
                <p>Freshmen feel lost visiting new areas. By assigning a local tour agent who physically escorts the student from the UMaT campus gate to the hostel, we remove anxiety and guarantee listing authenticity.</p>
              </div>
            </div>
            <div className="roadmap-step">
              <div className="step-num">4</div>
              <div className="step-content">
                <h4>Empowering Managers with Accounting Tools</h4>
                <p>By giving hostel managers free tools to list utility expenses and track student rent deposits, managers actively recommend Hostel Hub to other owners, causing viral growth.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'manager-finances' && user?.role === 'manager' && (
        <div className="manager-shell">
          <section className="panel">
            <h2>Manager Operations Dashboard</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Track rent payouts, register electricity/water bills, and check net revenue.</p>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button className="btn" onClick={() => setShowAddHostel(!showAddHostel)}>
                {showAddHostel ? 'Hide Listing Form' : 'Publish New Hostel Listing'}
              </button>
            </div>
          </section>

          {showAddHostel && (
            <section className="panel">
              <h3>List a Hostel</h3>
              <form onSubmit={createHostelListing} style={{ display: 'grid', gap: '16px', marginTop: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <label>
                    Hostel Name
                    <input value={hostelForm.name} onChange={(e) => setFormVal('name', e.target.value)} placeholder="e.g. Royal Palace Lodge" required />
                  </label>
                  <label>
                    Location
                    <input value={hostelForm.location} onChange={(e) => setFormVal('location', e.target.value)} required />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <label>
                    Street Address / Close Landmark
                    <input value={hostelForm.address} onChange={(e) => setFormVal('address', e.target.value)} placeholder="e.g. UMaT West Road" required />
                  </label>
                  <label>
                    Google Maps URL
                    <input value={hostelForm.mapsUrl} onChange={(e) => setFormVal('mapsUrl', e.target.value)} placeholder="https://maps.google.com/?q=..." required />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <label>
                    Facilities (comma-separated list)
                    <input value={hostelForm.facilities} onChange={(e) => setFormVal('facilities', e.target.value)} />
                  </label>
                  <label>
                    Base Price per Month (GHS)
                    <input type="number" value={hostelForm.pricePerMonth} onChange={(e) => setFormVal('pricePerMonth', Number(e.target.value))} required />
                  </label>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                  <h4>Room Occupancy Galleries Pricing Setup</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>Specify prices for each verified room layout option:</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                    <label style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" checked={hostelForm.room1Active} onChange={(e) => setFormVal('room1Active', e.target.checked)} />
                      1-in-a-room Price
                      {hostelForm.room1Active && <input type="number" style={{ width: '80px', padding: '4px' }} value={hostelForm.room1Price} onChange={(e) => setFormVal('room1Price', e.target.value)} />}
                    </label>
                    <label style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" checked={hostelForm.room2Active} onChange={(e) => setFormVal('room2Active', e.target.checked)} />
                      2-in-a-room Price
                      {hostelForm.room2Active && <input type="number" style={{ width: '80px', padding: '4px' }} value={hostelForm.room2Price} onChange={(e) => setFormVal('room2Price', e.target.value)} />}
                    </label>
                    <label style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" checked={hostelForm.room3Active} onChange={(e) => setFormVal('room3Active', e.target.checked)} />
                      3-in-a-room Price
                      {hostelForm.room3Active && <input type="number" style={{ width: '80px', padding: '4px' }} value={hostelForm.room3Price} onChange={(e) => setFormVal('room3Price', e.target.value)} />}
                    </label>
                    <label style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" checked={hostelForm.room4Active} onChange={(e) => setFormVal('room4Active', e.target.checked)} />
                      4-in-a-room Price
                      {hostelForm.room4Active && <input type="number" style={{ width: '80px', padding: '4px' }} value={hostelForm.room4Price} onChange={(e) => setFormVal('room4Price', e.target.value)} />}
                    </label>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <label>
                    Kitchen Photos List (comma-separated URL)
                    <input value={hostelForm.kitchenPhotos} onChange={(e) => setFormVal('kitchenPhotos', e.target.value)} />
                  </label>
                  <label>
                    Upload Room / Facility Images
                    <input type="file" multiple accept="image/*" onChange={(e) => setPhotos(e.target.files)} />
                  </label>
                </div>

                <label>
                  Detailed Description
                  <textarea value={hostelForm.description} onChange={(e) => setFormVal('description', e.target.value)} placeholder="Describe proximity to campus, backup lights, etc..." rows="3" required />
                </label>

                {managerError ? <p className="error-text">{managerError}</p> : null}
                <button className="btn" type="submit">Verify & Publish Listing</button>
              </form>
            </section>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
            <div className="panel">
              <h3>Finances & Bookings Ledger</h3>
              
              <div className="financial-grid">
                <div className="stat-card income">
                  <span>Gross Rent Income</span>
                  <strong>{formatCurrency(finances?.totalIncome || 0)}</strong>
                </div>
                <div className="stat-card expense">
                  <span>Logged Expenses</span>
                  <strong>{formatCurrency(finances?.totalExpense || 0)}</strong>
                </div>
                <div className="stat-card net">
                  <span>Net Ledger Revenue</span>
                  <strong>{formatCurrency(finances?.netProfit || 0)}</strong>
                </div>
              </div>

              <div className="ledger-table-container">
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Hostel</th>
                      <th>Type</th>
                      <th>Details</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(finances?.transactions || []).map((tx) => (
                      <tr key={tx.id}>
                        <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                        <td><strong>{tx.category}</strong></td>
                        <td>{tx.hostelName}</td>
                        <td>
                          <span className={tx.type === 'income' ? 'badge-income' : 'badge-expense'}>
                            {tx.type.toUpperCase()}
                          </span>
                        </td>
                        <td>{tx.type === 'income' ? `${tx.studentName} (${tx.studentEmail})` : tx.description}</td>
                        <td style={{ color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)', fontWeight: '700' }}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))}
                    {(finances?.transactions || []).length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px' }}>No transactions recorded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="panel">
                <h3>Link Your Bank Details</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>This links your listing checkout directly to your bank account.</p>
                <form onSubmit={saveBankDetails} style={{ display: 'grid', gap: '12px' }}>
                  <label>
                    Bank Name
                    <input value={bankForm.bankName} onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })} placeholder="e.g. Ghana Commercial Bank" required />
                  </label>
                  <label>
                    Account Name
                    <input value={bankForm.accountName} onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })} placeholder="e.g. Royal Lodge Ltd" required />
                  </label>
                  <label>
                    Account Number
                    <input value={bankForm.accountNumber} onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })} placeholder="e.g. 1029384756" required />
                  </label>
                  <button className="btn" type="submit">Update Bank Credentials</button>
                </form>
              </div>

              <div className="panel">
                <h3>Log Maintenance Expense</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>Record utility or structural repairs to keep books up to date.</p>
                <form onSubmit={logExpense} style={{ display: 'grid', gap: '12px' }}>
                  <label>
                    Hostel / Property
                    <select value={expenseForm.hostelId} onChange={(e) => setExpenseForm({ ...expenseForm, hostelId: e.target.value })}>
                      <option value="">General Operation</option>
                      {(finances?.hostels || []).map((h) => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Expense Category
                    <select value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} required>
                      <option value="Maintenance">Maintenance & Repairs</option>
                      <option value="Electricity">Electricity Prepaid</option>
                      <option value="Water">Water Bill</option>
                      <option value="Wifi">Internet Subscription</option>
                      <option value="Waste">Waste Management</option>
                      <option value="Other">Other Expenses</option>
                    </select>
                  </label>
                  <label>
                    Cost (GHS)
                    <input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} placeholder="Cost in GHS" required />
                  </label>
                  <label>
                    Bill Description
                    <input value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="e.g. Fixed light switch in room 4" required />
                  </label>
                  
                  {managerSuccess && <p className="success-text">{managerSuccess}</p>}
                  <button className="btn secondary" type="submit">Log Expenditure</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENT CHECKOUT POPUP MODAL */}
      {checkoutActive && (
        <div className="modal-overlay" onClick={() => setCheckoutActive(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Secure Direct Booking</h3>
              <button className="modal-close" onClick={() => setCheckoutActive(false)}>×</button>
            </div>
            
            {!checkoutSuccess ? (
              <div style={{ display: 'grid', gap: '16px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  You are booking <strong>{checkoutRoomType}</strong> at <strong>{selectedHostel.name}</strong>.
                </p>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                  <p style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--primary)' }}>Manager Verified Bank Details:</p>
                  <p style={{ fontSize: '13px' }}><strong>Bank:</strong> {selectedHostel.bankDetails?.bankName || 'Ghana Commercial Bank'}</p>
                  <p style={{ fontSize: '13px' }}><strong>Account Name:</strong> {selectedHostel.bankDetails?.accountName || selectedHostel.managerName || 'John Owusu'}</p>
                  <p style={{ fontSize: '13px' }}><strong>Account Number:</strong> {selectedHostel.bankDetails?.accountNumber || '1029384756'}</p>
                </div>
                
                <div style={{ borderLeft: '3px solid var(--accent)', paddingLeft: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <strong>How it works:</strong> Please transfer the total monthly price of <strong>{formatCurrency(checkoutPrice)}</strong> into the account above. Once complete, click the button below to register the receipt.
                </div>
                
                <button className="btn" onClick={processPayment}>I Have Made the Bank Transfer</button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', display: 'grid', gap: '16px' }}>
                <div style={{ fontSize: '48px', color: 'var(--success)' }}>✓</div>
                <h4>Booking Confirmed!</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Your rent payment has been logged in the manager's accounting books.
                </p>
                <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)', fontSize: '14px', fontWeight: '700', fontFamily: 'monospace' }}>
                  Reference: {checkoutSuccess}
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Please quote this reference number to the agent Ama Mensah (+233 20 123 4567) to collect your keys.</p>
                <button className="btn" onClick={() => setCheckoutActive(false)}>Close Window</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Helper inside Manager Form
  function setFormVal(field, val) {
    setHostelForm({ ...hostelForm, [field]: val });
  }
}

function AdminApp() {
  const [token, setToken] = useState(() => localStorage.getItem('hostelHubAdminToken') || '');
  const [stats, setStats] = useState(null);
  const [hostels, setHostels] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loginForm, setLoginForm] = useState({ email: 'admin@hostelhub.dev', password: 'admin123' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Simplified Add Hostel Form
  const [form, setForm] = useState({
    name: '',
    location: 'Tarkwa',
    address: '',
    pricePerMonth: 400,
    rating: 4.8,
    mapsUrl: '',
    facilities: 'Wi-Fi,Water,Security,Power Backup',
    agentName: 'Ama Mensah',
    agentPhone: '+233 20 123 4567',
    agentEmail: 'ama@hostelhub.dev',
    description: '',
    room1Active: true, room1Price: 450,
    room2Active: true, room2Price: 400,
    room3Active: false, room3Price: 350,
    room4Active: false, room4Price: 300,
    kitchenPhotos: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=900&q=80',
  });
  const [photos, setPhotos] = useState([]);

  const loadDashboard = async () => {
    try {
      const [statsRes, hostelsRes, visitsRes] = await Promise.all([
        fetch(`${API}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/api/admin/hostels`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/api/admin/visits`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const statsData = await statsRes.json();
      const hostelsData = await hostelsRes.json();
      const visitsData = await visitsRes.json();
      
      setStats(statsData.stats);
      setHostels(hostelsData.hostels || []);
      setVisits(visitsData.visits || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadDashboard().catch(() => setError('Unable to load admin dashboard.'));
  }, [token]);

  const handleAdminLogin = async (event) => {
    event.preventDefault();
    setError('');

    try {
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
    } catch (e) {
      setError('Network error');
    }
  };

  const handleCreateHostel = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    // construct roomTypes JSON object
    const roomTypes = {};
    if (form.room1Active) roomTypes['1-in-a-room'] = { price: Number(form.room1Price), gallery: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'] };
    if (form.room2Active) roomTypes['2-in-a-room'] = { price: Number(form.room2Price), gallery: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80'] };
    if (form.room3Active) roomTypes['3-in-a-room'] = { price: Number(form.room3Price), gallery: ['https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'] };
    if (form.room4Active) roomTypes['4-in-a-room'] = { price: Number(form.room4Price), gallery: ['https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80'] };

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (!key.startsWith('room')) {
        payload.append(key, value);
      }
    });
    payload.append('roomTypes', JSON.stringify(roomTypes));
    Array.from(photos).forEach((photo) => payload.append('photos', photo));

    try {
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

      setSuccess('Hostel published successfully!');
      setForm({
        name: '',
        location: 'Tarkwa',
        address: '',
        pricePerMonth: 400,
        rating: 4.8,
        mapsUrl: '',
        facilities: 'Wi-Fi,Water,Security,Power Backup',
        agentName: 'Ama Mensah',
        agentPhone: '+233 20 123 4567',
        agentEmail: 'ama@hostelhub.dev',
        description: '',
        room1Active: true, room1Price: 450,
        room2Active: true, room2Price: 400,
        room3Active: false, room3Price: 350,
        room4Active: false, room4Price: 300,
        kitchenPhotos: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=900&q=80',
      });
      setPhotos([]);
      await loadDashboard();
    } catch (e) {
      setError('Network error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hostelHubAdminToken');
    setToken('');
  };

  if (!token) {
    return (
      <div className="app-shell admin-shell" style={{ maxWidth: '480px', marginTop: '10%' }}>
        <section className="panel auth-panel">
          <h2>Admin Console Access</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Login with credentials to access student visit records and platform settings.</p>
          <form onSubmit={handleAdminLogin} className="auth-form">
            <label>
              Admin Email
              <input value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} required />
            </label>
            <label>
              Password
              <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required />
            </label>
            {error ? <p className="error-text">{error}</p> : null}
            <button className="btn" type="submit">Access Console</button>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="app-shell admin-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Admin Panel</p>
          <h1>Hostel Hub Operations Control</h1>
        </div>
        <button className="btn ghost" onClick={handleLogout}>Close Control Console</button>
      </header>

      <section className="financial-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="stat-card">
          <span>Active Hostels</span>
          <strong>{stats?.totalHostels ?? 0}</strong>
        </div>
        <div className="stat-card">
          <span>Registered Students</span>
          <strong>{stats?.totalStudents ?? 0}</strong>
        </div>
        <div className="stat-card">
          <span>Registered Managers</span>
          <strong>{stats?.totalManagers ?? 0}</strong>
        </div>
        <div className="stat-card">
          <span>Tour Bookings</span>
          <strong>{stats?.totalTourRequests ?? 0}</strong>
        </div>
        <div className="stat-card">
          <span>Site Page Hits</span>
          <strong>{stats?.totalVisits ?? 0}</strong>
        </div>
      </section>

      <div className="content-grid" style={{ gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        <section className="panel">
          <h3>Register New Verified Hostel</h3>
          <form onSubmit={handleCreateHostel} className="admin-form" style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label>
                Hostel Name
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </label>
              <label>
                Location
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
              </label>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label>
                Street / Close Landmark
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
              </label>
              <label>
                Google Maps coordinates URL
                <input value={form.mapsUrl} onChange={(e) => setForm({ ...form, mapsUrl: e.target.value })} placeholder="https://maps.google.com/?q=..." required />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label>
                Base Price per Month (GHS)
                <input type="number" value={form.pricePerMonth} onChange={(e) => setForm({ ...form, pricePerMonth: Number(e.target.value) })} required />
              </label>
              <label>
                Rating Star Badge
                <input type="number" step="0.1" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} required />
              </label>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
              <p style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>Room Occupancy Gallery Setup:</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <label style={{ fontSize: '11px', flexDirection: 'row', alignItems: 'center', gap: '4px' }}>
                  <input type="checkbox" checked={form.room1Active} onChange={(e) => setForm({ ...form, room1Active: e.target.checked })} />
                  1-in-a-room Price
                  {form.room1Active && <input type="number" style={{ width: '60px', padding: '2px' }} value={form.room1Price} onChange={(e) => setForm({ ...form, room1Price: e.target.value })} />}
                </label>
                <label style={{ fontSize: '11px', flexDirection: 'row', alignItems: 'center', gap: '4px' }}>
                  <input type="checkbox" checked={form.room2Active} onChange={(e) => setForm({ ...form, room2Active: e.target.checked })} />
                  2-in-a-room Price
                  {form.room2Active && <input type="number" style={{ width: '60px', padding: '2px' }} value={form.room2Price} onChange={(e) => setForm({ ...form, room2Price: e.target.value })} />}
                </label>
                <label style={{ fontSize: '11px', flexDirection: 'row', alignItems: 'center', gap: '4px' }}>
                  <input type="checkbox" checked={form.room3Active} onChange={(e) => setForm({ ...form, room3Active: e.target.checked })} />
                  3-in-a-room Price
                  {form.room3Active && <input type="number" style={{ width: '60px', padding: '2px' }} value={form.room3Price} onChange={(e) => setForm({ ...form, room3Price: e.target.value })} />}
                </label>
                <label style={{ fontSize: '11px', flexDirection: 'row', alignItems: 'center', gap: '4px' }}>
                  <input type="checkbox" checked={form.room4Active} onChange={(e) => setForm({ ...form, room4Active: e.target.checked })} />
                  4-in-a-room Price
                  {form.room4Active && <input type="number" style={{ width: '60px', padding: '2px' }} value={form.room4Price} onChange={(e) => setForm({ ...form, room4Price: e.target.value })} />}
                </label>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label>
                Agent Name
                <input value={form.agentName} onChange={(e) => setForm({ ...form, agentName: e.target.value })} required />
              </label>
              <label>
                Agent Phone
                <input value={form.agentPhone} onChange={(e) => setForm({ ...form, agentPhone: e.target.value })} required />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label>
                Facilities (comma-separated)
                <input value={form.facilities} onChange={(e) => setForm({ ...form, facilities: e.target.value })} />
              </label>
              <label>
                Kitchen Image URL
                <input value={form.kitchenPhotos} onChange={(e) => setForm({ ...form, kitchenPhotos: e.target.value })} />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              <label>
                Upload Room & Facility Images
                <input type="file" multiple accept="image/*" onChange={(e) => setPhotos(e.target.files)} />
              </label>
              <label>
                Hostel Description
                <textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Details on proximity, water availability, etc..." required />
              </label>
            </div>

            {error ? <p className="error-text">{error}</p> : null}
            {success ? <p className="success-text">{success}</p> : null}
            <button className="btn" type="submit">Verify & Publish Listing</button>
          </form>
        </section>

        <div style={{ display: 'grid', gap: '24px' }}>
          <section className="panel" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <h3>Visitor Activity Log</h3>
            <div className="ledger-table-container">
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>User</th>
                    <th>Visited Page</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map((v) => (
                    <tr key={v.id}>
                      <td>{new Date(v.timestamp).toLocaleTimeString()}</td>
                      <td><strong>{v.user}</strong></td>
                      <td><span style={{ fontSize: '11px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{v.page}</span></td>
                    </tr>
                  ))}
                  {visits.length === 0 && (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '12px' }}>No logs recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <h3>Live Listings</h3>
            <div className="hostel-list">
              {hostels.map((hostel) => (
                <div key={hostel.id} className="hostel-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{hostel.name}</strong>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)' }}>{hostel.visits || 0} page clicks</span>
                  </div>
                  <p>{hostel.location}</p>
                  <small>{hostel.address}</small>
                  <b>Base: {formatCurrency(hostel.pricePerMonth)}</b>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function App() {
  const page = document.body.dataset.page;
  return page === 'admin' ? <AdminApp /> : <StudentApp />;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
