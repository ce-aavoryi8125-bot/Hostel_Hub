/* ============================================================
   HOSTEL HUB — Enhanced HostelDetailModal
   Loaded via <script type="text/babel"> in index.html
   ============================================================ */

const GALLERY_SECTION_LABELS = {
  exterior:'Exterior', reception:'Reception', compound:'Compound',
  study:'Study Room', lounge:'Lounge', kitchen:'Kitchen',
  washroom:'Washroom', laundry:'Laundry', parking:'Parking',
  water:'Water', security:'Security', other:'Other',
};

function Lightbox({ imgs, startIdx, onClose }) {
  const [idx, setIdx] = React.useState(startIdx);
  const prev = () => setIdx(i => (i - 1 + imgs.length) % imgs.length);
  const next = () => setIdx(i => (i + 1) % imgs.length);
  React.useEffect(() => {
    const h = e => { if (e.key === 'ArrowLeft') prev(); else if (e.key === 'ArrowRight') next(); else if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.93)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <button style={{ position:'absolute', top:20, right:24, background:'none', border:'none', color:'white', fontSize:'32px', cursor:'pointer' }} onClick={onClose}>×</button>
      <button style={{ position:'absolute', left:12, background:'rgba(255,255,255,0.15)', border:'none', color:'white', fontSize:'32px', cursor:'pointer', padding:'10px 16px', borderRadius:'8px' }} onClick={e => { e.stopPropagation(); prev(); }}>‹</button>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'12px', maxWidth:'92vw' }} onClick={e => e.stopPropagation()}>
        <img src={imgs[idx]} alt="" style={{ maxWidth:'88vw', maxHeight:'76vh', objectFit:'contain', borderRadius:'8px' }} />
        <span style={{ color:'rgba(255,255,255,0.6)', fontSize:'13px' }}>{idx + 1} / {imgs.length}</span>
        <div style={{ display:'flex', gap:'6px', overflowX:'auto', maxWidth:'88vw', paddingBottom:'4px' }}>
          {imgs.map((img, i) => (
            <img key={i} src={img} alt="" onClick={() => setIdx(i)} style={{ width:'56px', height:'42px', objectFit:'cover', borderRadius:'4px', cursor:'pointer', border: i === idx ? '2px solid white' : '2px solid transparent', opacity: i === idx ? 1 : 0.45, flexShrink:0 }} />
          ))}
        </div>
      </div>
      <button style={{ position:'absolute', right:12, background:'rgba(255,255,255,0.15)', border:'none', color:'white', fontSize:'32px', cursor:'pointer', padding:'10px 16px', borderRadius:'8px' }} onClick={e => { e.stopPropagation(); next(); }}>›</button>
    </div>
  );
}

function HostelDetailModal({ hostel, user, onClose, onRent, onRequireAuth }) {
  const [activeRoom, setActiveRoom] = React.useState(() => Object.keys(hostel.roomTypes || {})[0] || '');
  const [lbImgs, setLbImgs]         = React.useState(null);
  const [lbIdx, setLbIdx]           = React.useState(0);
  const [activeGalTab, setGalTab]   = React.useState('exterior');
  const [tourForm, setTourForm]     = React.useState({ name: user?.name || '', phone: user?.phone || '', message: '' });
  const [tourMsg, setTourMsg]       = React.useState('');
  const [tourLoading, setTourLoading] = React.useState(false);

  const roomTypes = hostel.roomTypes || {};
  const activeRoomData = roomTypes[activeRoom];
  const rawGallery = hostel.gallery || {};

  // Merge legacy photos/kitchenPhotos into gallery
  const gallery = { ...rawGallery };
  if (!(gallery.exterior || []).length && (hostel.photos || []).length) gallery.exterior = hostel.photos;
  if (!(gallery.kitchen  || []).length && (hostel.kitchenPhotos || []).length) gallery.kitchen = hostel.kitchenPhotos;

  const coverPhotos = gallery.exterior || hostel.photos || [];
  const coverImg    = coverPhotos[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80';

  const galleryTabs = Object.keys(GALLERY_SECTION_LABELS).filter(k => (gallery[k] || []).length > 0);
  const activeGalPhotos = gallery[activeGalTab] || [];

  const openLb = (imgs, i) => { setLbImgs(imgs); setLbIdx(i); };

  const submitTour = async e => {
    e.preventDefault();
    if (!user) { onRequireAuth(); return; }
    setTourLoading(true);
    try {
      const res = await fetch(`${API}/api/hostels/${hostel.id}/tour-request`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(tourForm),
      });
      const d = await res.json();
      setTourMsg(d.message || 'Tour request submitted!');
      setTourForm({ name:'', phone:'', message:'' });
      setTimeout(() => setTourMsg(''), 6000);
    } catch { setTourMsg('Could not submit. Please try again.'); }
    setTourLoading(false);
  };

  const waLink = `https://wa.me/${(hostel.agentPhone || '').replace(/\s+/g, '')}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      {lbImgs && <Lightbox imgs={lbImgs} startIdx={lbIdx} onClose={() => setLbImgs(null)} />}

      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <button className="modal-close" onClick={onClose}>×</button>

        {/* Hero + thumbnail strip */}
        <div style={{ position:'relative' }}>
          <div style={{ height:'260px', overflow:'hidden', cursor:'pointer', background:'var(--bg-subtle)' }} onClick={() => openLb(coverPhotos.length ? coverPhotos : [coverImg], 0)}>
            <img src={coverImg} alt={hostel.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            {coverPhotos.length > 1 && (
              <div style={{ position:'absolute', bottom:12, right:14, background:'rgba(0,0,0,0.55)', color:'white', fontSize:'12px', fontWeight:'700', padding:'4px 10px', borderRadius:'20px' }}>
                📷 {coverPhotos.length} photos — click to browse
              </div>
            )}
          </div>
          {coverPhotos.length > 1 && (
            <div style={{ display:'flex', gap:'6px', padding:'8px 16px', overflowX:'auto', background:'var(--bg-card)' }}>
              {coverPhotos.slice(0, 9).map((p, i) => (
                <img key={i} src={p} alt="" onClick={() => openLb(coverPhotos, i)} style={{ width:'64px', height:'48px', objectFit:'cover', borderRadius:'6px', cursor:'pointer', flexShrink:0 }} />
              ))}
              {coverPhotos.length > 9 && (
                <div onClick={() => openLb(coverPhotos, 9)} style={{ width:'64px', height:'48px', background:'var(--bg-subtle)', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700', color:'var(--text-muted)', cursor:'pointer', flexShrink:0 }}>
                  +{coverPhotos.length - 9}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-body">
          {/* Header */}
          <div className="modal-header-row">
            <div>
              <div className="modal-verified">✓ Physically Verified & Photographed</div>
              <h2 className="modal-title">{hostel.name}</h2>
              <div className="modal-address">📍 {hostel.address}, {hostel.location}</div>
              <div className="modal-rating-row">
                <StarRating rating={hostel.rating || 4.5} />
                <span>{hostel.rating || 4.5} rating</span>
              </div>
            </div>
            <div className="modal-price-box">
              <div className="modal-price-from">From</div>
              <div className="modal-price-big">{formatCurrency(hostel.pricePerYear || hostel.pricePerMonth)}<span className="per">/year</span></div>
              <a href={hostel.mapsUrl || '#'} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ marginTop:'10px' }}>🗺️ Map</a>
            </div>
          </div>

          {/* Description */}
          {hostel.description && (
            <div className="modal-section">
              <div className="modal-section-title">About this Hostel</div>
              <p style={{ fontSize:'14px', color:'var(--text-secondary)', lineHeight:'1.7' }}>{hostel.description}</p>
            </div>
          )}

          {/* Room Types */}
          {Object.keys(roomTypes).length > 0 && (
            <div className="modal-section">
              <div className="modal-section-title">Room Types & Pricing</div>
              <div className="room-tabs">
                {Object.keys(roomTypes).map(rt => (
                  <button key={rt} className={`room-tab ${activeRoom === rt ? 'active' : ''}`} onClick={() => setActiveRoom(rt)}>{rt}</button>
                ))}
              </div>
              {activeRoomData && (
                <div className="room-gallery">
                  <div className="room-gallery-header">
                    <div>
                      <h4>{activeRoom}</h4>
                      {activeRoomData.description && <p style={{ fontSize:'12px', color:'var(--text-muted)', margin:'4px 0' }}>{activeRoomData.description}</p>}
                      <div style={{ display:'flex', gap:'14px', marginTop:'6px', fontSize:'12px', color:'var(--text-muted)', flexWrap:'wrap' }}>
                        {activeRoomData.occupants && <span>👥 {activeRoomData.occupants} occupants</span>}
                        {activeRoomData.beds       && <span>🛏️ {activeRoomData.beds} beds</span>}
                        {activeRoomData.available  != null && <span style={{ color:'#10b981', fontWeight:'700' }}>✅ {activeRoomData.available} available</span>}
                        {activeRoomData.floor      && <span>🏗️ Floor {activeRoomData.floor}</span>}
                      </div>
                      {(activeRoomData.facilities || []).length > 0 && (
                        <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginTop:'8px' }}>
                          {activeRoomData.facilities.map(f => <span key={f} style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'12px', background:'var(--bg-subtle)', border:'1px solid var(--border-light)' }}>{f}</span>)}
                        </div>
                      )}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                      <span className="room-gallery-price">{formatCurrency(activeRoomData.price)}/year</span>
                      <button className="btn btn-amber btn-sm" onClick={() => onRent(activeRoom, activeRoomData.price)}>Rent Now</button>
                    </div>
                  </div>
                  {(activeRoomData.gallery || []).length > 0 && (
                    <div className="room-gallery-grid">
                      {(activeRoomData.gallery || []).map((p, i) => (
                        <img key={i} src={p} alt={`${activeRoom}`} style={{ cursor:'pointer' }} onClick={() => openLb(activeRoomData.gallery, i)} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Facility Gallery Tabs */}
          {galleryTabs.length > 0 && (
            <div className="modal-section">
              <div className="modal-section-title">Hostel Gallery</div>
              <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'14px' }}>
                {galleryTabs.map(k => (
                  <button key={k} onClick={() => setGalTab(k)} style={{ padding:'5px 12px', borderRadius:'20px', border:'1px solid var(--border-light)', background: activeGalTab === k ? 'var(--navy-500)' : 'var(--bg-subtle)', color: activeGalTab === k ? 'white' : 'var(--text-secondary)', fontSize:'12px', fontWeight:'600', cursor:'pointer' }}>
                    {GALLERY_SECTION_LABELS[k]} <span style={{ opacity:0.7, fontSize:'11px' }}>({(gallery[k] || []).length})</span>
                  </button>
                ))}
              </div>
              {activeGalPhotos.length > 0 && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:'8px' }}>
                  {activeGalPhotos.map((p, i) => (
                    <div key={i} style={{ aspectRatio:'4/3', overflow:'hidden', borderRadius:'8px', cursor:'pointer' }} onClick={() => openLb(activeGalPhotos, i)}>
                      <img src={p} alt={activeGalTab} style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.2s' }} onMouseOver={e => e.target.style.transform = 'scale(1.05)'} onMouseOut={e => e.target.style.transform = 'scale(1)'} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Facilities */}
          {(hostel.facilities || []).length > 0 && (
            <div className="modal-section">
              <div className="modal-section-title">Facilities & Amenities</div>
              <div className="amenities-grid">
                {(hostel.facilities || []).map(f => (
                  <div key={f} className="amenity-item">
                    <div className="amenity-icon">{getFacilityIcon(f)}</div>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Map */}
          <div className="modal-section">
            <div className="modal-section-title">Location</div>
            <div className="map-widget">
              <div className="map-grid" />
              <div className="map-pin-container"><div className="map-pin-dot" /></div>
              <div className="map-label">
                <span style={{ fontWeight:'700', fontSize:'12px' }}>📍 {hostel.location}</span>
                <a href={hostel.mapsUrl || '#'} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">Navigate</a>
              </div>
            </div>
          </div>

          {/* Agent */}
          {hostel.agentName && (
            <div className="modal-section">
              <div className="modal-section-title">Your Local Agent</div>
              <div className="agent-card">
                <div className="agent-info">
                  <div className="agent-avatar">{(hostel.agentName || 'A')[0]}</div>
                  <div className="agent-details">
                    <h4>{hostel.agentName}</h4>
                    <p>{hostel.agentPhone} • {hostel.agentEmail}</p>
                    <p style={{ fontSize:'12px', marginTop:'3px', color:'var(--emerald-600)', fontWeight:'600' }}>✓ Will escort you from the UMaT Campus Gate</p>
                  </div>
                </div>
                <div className="agent-actions">
                  <a href={waLink} target="_blank" rel="noreferrer" className="btn btn-success btn-sm">💬 WhatsApp</a>
                  <a href={`tel:${hostel.agentPhone}`} className="btn btn-outline btn-sm">📞 Call</a>
                </div>
              </div>
            </div>
          )}

          {/* Tour form */}
          <div className="modal-section">
            <div className="modal-section-title">Book a Free Inspection Tour</div>
            <form onSubmit={submitTour}>
              <div className="tour-form-grid">
                <div className="form-field"><label className="form-label">Your Name</label><input className="form-input" value={tourForm.name} onChange={e => setTourForm({...tourForm, name:e.target.value})} placeholder="Full Name" required /></div>
                <div className="form-field"><label className="form-label">Phone Number</label><input className="form-input" value={tourForm.phone} onChange={e => setTourForm({...tourForm, phone:e.target.value})} placeholder="+233 24..." required /></div>
              </div>
              <div className="form-field" style={{ marginBottom:'14px' }}><label className="form-label">Preferred Date & Notes</label><textarea className="form-input" value={tourForm.message} onChange={e => setTourForm({...tourForm, message:e.target.value})} placeholder="e.g. Saturday afternoon, Level 200 student..." rows={3} required style={{ resize:'vertical' }} /></div>
              {tourMsg && <div className={tourMsg.includes('Could not') ? 'error-msg' : 'success-msg'} style={{ marginBottom:'12px' }}>{tourMsg}</div>}
              <button type="submit" className="btn btn-primary" disabled={tourLoading} style={{ width:'100%', padding:'14px' }}>{tourLoading ? 'Sending...' : '📅 Schedule Tour'}</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
