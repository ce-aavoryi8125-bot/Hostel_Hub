/* ============================================================
   HOSTEL HUB — Hostel Wizard (multi-step publish flow)
   Loaded via <script type="text/babel"> in index.html
   Depends on: React, formatCurrency, getFacilityIcon, API
   ============================================================ */

const GALLERY_SECTIONS_DEF = [
  { key:'exterior',  label:'Exterior / Front View' },
  { key:'reception', label:'Reception Area' },
  { key:'compound',  label:'Compound' },
  { key:'study',     label:'Study Room' },
  { key:'lounge',    label:'Common Room / Lounge' },
  { key:'kitchen',   label:'Kitchen' },
  { key:'washroom',  label:'Washrooms / Bathrooms' },
  { key:'laundry',   label:'Laundry & Dry Lines' },
  { key:'parking',   label:'Parking Area' },
  { key:'water',     label:'Water Facilities' },
  { key:'security',  label:'Security Post' },
  { key:'other',     label:'Other Facilities' },
];

const FACILITY_OPTIONS = [
  'Wi-Fi','Water','Electricity Backup','Security','CCTV',
  'Kitchen','Laundry','Parking','Generator','Borehole',
  'Study Room','Common Room','Balcony','AC','Internet',
];

const ROOM_PRESETS = [
  '1-in-a-room','2-in-a-room','3-in-a-room','4-in-a-room',
  'Executive Room','Self-Contained',
];

function ImageUploadZone({ label, files, previews, onChange, onRemove }) {
  return (
    <div style={{ border:'1px solid var(--border-light)', borderRadius:'10px', padding:'14px', background:'var(--bg-subtle)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
        <label className="form-label" style={{ margin:0 }}>{label}</label>
        {previews.length > 0 && <span style={{ fontSize:'11px', color:'var(--text-muted)' }}>{previews.length} photo{previews.length !== 1 ? 's' : ''}</span>}
      </div>
      <label style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 14px', border:'2px dashed var(--border-medium)', borderRadius:'8px', cursor:'pointer', background:'var(--bg-card)', fontSize:'13px', color:'var(--text-muted)' }}>
        📷 Click to upload or drag images here
        <input type="file" multiple accept="image/*" style={{ display:'none' }} onChange={e => onChange(Array.from(e.target.files))} />
      </label>
      {previews.length > 0 && (
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginTop:'10px' }}>
          {previews.map((p, j) => (
            <div key={j} style={{ position:'relative' }}>
              <img src={p} alt="" style={{ width:'80px', height:'60px', objectFit:'cover', borderRadius:'6px' }} />
              <button onClick={() => onRemove(j)} style={{ position:'absolute', top:'-6px', right:'-6px', background:'#ef4444', border:'none', color:'white', borderRadius:'50%', width:'18px', height:'18px', fontSize:'11px', cursor:'pointer', lineHeight:1, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HostelWizard({ token, locOpts, onDone, onCancel }) {
  const STEPS = ['Basic Info', 'Facilities', 'Room Types', 'Room Photos', 'Hostel Gallery', 'Review'];
  const [step, setStep]   = React.useState(0);
  const [busy, setBusy]   = React.useState(false);
  const [err,  setErr]    = React.useState('');

  // Step 0
  const [info, setInfo] = React.useState({
    name:'', location: locOpts[0] || '', address:'', mapsUrl:'',
    pricePerYear: 5000, rating: 4.8,
    agentName:'', agentPhone:'', agentEmail:'', description:'',
  });

  // Step 1
  const [facilities, setFacilities] = React.useState(['Wi-Fi','Water','Security','Electricity Backup']);
  const toggleFac = f => setFacilities(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);

  // Step 2
  const mkRoom = (preset='') => ({
    name: preset || 'Custom Room',
    occupants: parseInt(preset) || 2,
    price: 6000, available: 4, beds: parseInt(preset) || 2,
    floor: '', description: '',
    roomFacilities: [],
    files: [], previews: [],
  });
  const [rooms, setRooms] = React.useState([ mkRoom('2-in-a-room') ]);
  const addRoom  = preset => setRooms(p => [...p, mkRoom(preset)]);
  const removeRoom = i => setRooms(p => p.filter((_, idx) => idx !== i));
  const updateRoom = (i, k, v) => setRooms(p => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const handleRoomFiles = (i, newFiles) => {
    const previews = newFiles.map(f => URL.createObjectURL(f));
    setRooms(p => p.map((r, idx) => idx === i ? { ...r, files: [...r.files, ...newFiles], previews: [...r.previews, ...previews] } : r));
  };
  const removeRoomImg = (i, j) => {
    setRooms(p => p.map((r, idx) => idx === i ? { ...r, files: r.files.filter((_, k) => k !== j), previews: r.previews.filter((_, k) => k !== j) } : r));
  };

  // Step 4 — gallery
  const [galFiles, setGalFiles]       = React.useState({});
  const [galPreviews, setGalPreviews] = React.useState({});
  const handleGalFiles = (key, newFiles) => {
    const previews = newFiles.map(f => URL.createObjectURL(f));
    setGalFiles(p    => ({ ...p, [key]: [...(p[key] || []),    ...newFiles]  }));
    setGalPreviews(p => ({ ...p, [key]: [...(p[key] || []),    ...previews] }));
  };
  const removeGalImg = (key, j) => {
    setGalFiles(p    => ({ ...p, [key]: (p[key] || []).filter((_, k) => k !== j) }));
    setGalPreviews(p => ({ ...p, [key]: (p[key] || []).filter((_, k) => k !== j) }));
  };

  const canNext = () => {
    if (step === 0) return info.name && info.location && info.address && info.description;
    if (step === 2) return rooms.length > 0;
    return true;
  };

  const publish = async () => {
    setBusy(true); setErr('');
    try {
      const fd = new FormData();
      Object.entries(info).forEach(([k, v]) => fd.append(k, String(v)));
      fd.append('facilities', facilities.join(','));

      const rtJson = {};
      rooms.forEach(r => {
        rtJson[r.name] = {
          price: Number(r.price),
          occupants: Number(r.occupants),
          available: Number(r.available),
          beds: Number(r.beds),
          floor: r.floor,
          description: r.description,
          facilities: r.roomFacilities,
          gallery: [],
        };
      });
      fd.append('roomTypes', JSON.stringify(rtJson));

      // Room photo files
      rooms.forEach(r => {
        r.files.forEach(f => fd.append(`room_photos_${r.name}`, f));
      });

      // Gallery section files
      Object.entries(galFiles).forEach(([key, files]) => {
        files.forEach(f => fd.append(`photos_${key}`, f));
      });

      const res = await fetch(`${API}/api/admin/hostels`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to publish');
      onDone();
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  const stepIcon = i => i < step ? '✓' : String(i + 1);

  return (
    <div style={{ background:'var(--bg-card)', borderRadius:'var(--radius-lg)', border:'1px solid var(--border-light)', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--border-light)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h3 style={{ margin:0, fontWeight:'900', fontSize:'16px' }}>🏢 Publish New Hostel</h3>
        <button style={{ background:'none', border:'none', fontSize:'22px', cursor:'pointer', color:'var(--text-muted)', lineHeight:1 }} onClick={onCancel}>×</button>
      </div>

      {/* Step tabs */}
      <div style={{ display:'flex', background:'var(--bg-subtle)', borderBottom:'1px solid var(--border-light)', overflowX:'auto' }}>
        {STEPS.map((s, i) => (
          <div key={s} onClick={() => i < step && setStep(i)} style={{ flex:1, minWidth:'80px', padding:'10px 4px', textAlign:'center', fontSize:'11px', fontWeight: i === step ? '800' : '600', color: i === step ? 'var(--navy-600)' : i < step ? '#10b981' : 'var(--text-muted)', borderBottom: i === step ? '2px solid var(--navy-500)' : i < step ? '2px solid #10b981' : '2px solid transparent', cursor: i < step ? 'pointer' : 'default', transition:'all 0.2s', whiteSpace:'nowrap' }}>
            <div style={{ fontSize:'15px', marginBottom:'2px' }}>{stepIcon(i)}</div>
            {s}
          </div>
        ))}
      </div>

      {/* Body */}
      <div style={{ padding:'24px' }}>

        {/* STEP 0 — Basic Info */}
        {step === 0 && (
          <div style={{ display:'grid', gap:'14px' }}>
            <div className="form-grid-2">
              <div className="form-field"><label className="form-label">Hostel Name *</label><input className="form-input" value={info.name} onChange={e => setInfo(p => ({...p, name: e.target.value}))} placeholder="e.g. Royal Palm Lodge" required /></div>
              <div className="form-field"><label className="form-label">Location Area *</label><select className="form-input" value={info.location} onChange={e => setInfo(p => ({...p, location: e.target.value}))} required>{locOpts.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
            </div>
            <div className="form-grid-2">
              <div className="form-field"><label className="form-label">Street / Landmark *</label><input className="form-input" value={info.address} onChange={e => setInfo(p => ({...p, address: e.target.value}))} placeholder="Near UMaT West Gate" required /></div>
              <div className="form-field"><label className="form-label">Google Maps URL</label><input className="form-input" value={info.mapsUrl} onChange={e => setInfo(p => ({...p, mapsUrl: e.target.value}))} placeholder="https://maps.google.com/?q=..." /></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'14px' }}>
              <div className="form-field"><label className="form-label">Base Price / Year (GHS)</label><input className="form-input" type="number" value={info.pricePerYear} onChange={e => setInfo(p => ({...p, pricePerYear: Number(e.target.value)}))} /></div>
              <div className="form-field"><label className="form-label">Agent Name</label><input className="form-input" value={info.agentName} onChange={e => setInfo(p => ({...p, agentName: e.target.value}))} /></div>
              <div className="form-field"><label className="form-label">Agent Phone</label><input className="form-input" value={info.agentPhone} onChange={e => setInfo(p => ({...p, agentPhone: e.target.value}))} /></div>
            </div>
            <div className="form-field"><label className="form-label">Agent Email</label><input className="form-input" type="email" value={info.agentEmail} onChange={e => setInfo(p => ({...p, agentEmail: e.target.value}))} /></div>
            <div className="form-field"><label className="form-label">Hostel Description *</label><textarea className="form-input" value={info.description} onChange={e => setInfo(p => ({...p, description: e.target.value}))} rows={4} placeholder="Describe this hostel for students — location advantages, atmosphere, safety, nearby transport..." required style={{ resize:'vertical' }} /></div>
          </div>
        )}

        {/* STEP 1 — Facilities */}
        {step === 1 && (
          <div>
            <p style={{ fontSize:'13px', color:'var(--text-muted)', marginBottom:'16px' }}>Select all available facilities. These appear prominently on the student listing page.</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'10px' }}>
              {FACILITY_OPTIONS.map(f => (
                <label key={f} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 14px', border:`1.5px solid ${facilities.includes(f) ? 'var(--navy-500)' : 'var(--border-light)'}`, borderRadius:'8px', background: facilities.includes(f) ? 'rgba(99,102,241,0.06)' : 'var(--bg-card)', cursor:'pointer', fontSize:'13px', fontWeight:'600', transition:'all 0.15s' }}>
                  <input type="checkbox" checked={facilities.includes(f)} onChange={() => toggleFac(f)} style={{ accentColor:'var(--navy-500)', flexShrink:0 }} />
                  {getFacilityIcon(f)} {f}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 — Room Types */}
        {step === 2 && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px', flexWrap:'wrap', gap:'10px' }}>
              <p style={{ fontSize:'13px', color:'var(--text-muted)', margin:0, flex:1 }}>Define every room type. Students will compare them side-by-side.</p>
              <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                {ROOM_PRESETS.map(p => <button key={p} className="btn btn-outline btn-sm" style={{ fontSize:'11px' }} onClick={() => addRoom(p)}>+ {p}</button>)}
                <button className="btn btn-outline btn-sm" style={{ fontSize:'11px' }} onClick={() => addRoom()}>+ Custom</button>
              </div>
            </div>
            <div style={{ display:'grid', gap:'16px' }}>
              {rooms.map((r, i) => (
                <div key={i} style={{ border:'1px solid var(--border-light)', borderRadius:'10px', padding:'16px', background:'var(--bg-subtle)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'12px' }}>
                    <h4 style={{ margin:0, fontWeight:'800', fontSize:'14px' }}>{r.name || `Room Type ${i + 1}`}</h4>
                    <button className="btn btn-sm btn-outline" style={{ color:'#ef4444', fontSize:'11px' }} onClick={() => removeRoom(i)}>Remove</button>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px, 1fr))', gap:'10px', marginBottom:'10px' }}>
                    <div className="form-field"><label className="form-label">Room Name</label><input className="form-input" value={r.name} onChange={e => updateRoom(i, 'name', e.target.value)} /></div>
                    <div className="form-field"><label className="form-label">Price / Year (GHS)</label><input className="form-input" type="number" value={r.price} onChange={e => updateRoom(i, 'price', Number(e.target.value))} /></div>
                    <div className="form-field"><label className="form-label">Occupants</label><input className="form-input" type="number" min="1" max="10" value={r.occupants} onChange={e => updateRoom(i, 'occupants', Number(e.target.value))} /></div>
                    <div className="form-field"><label className="form-label">Rooms Available</label><input className="form-input" type="number" min="0" value={r.available} onChange={e => updateRoom(i, 'available', Number(e.target.value))} /></div>
                    <div className="form-field"><label className="form-label">Beds</label><input className="form-input" type="number" min="1" value={r.beds} onChange={e => updateRoom(i, 'beds', Number(e.target.value))} /></div>
                    <div className="form-field"><label className="form-label">Floor (optional)</label><input className="form-input" value={r.floor} placeholder="e.g. 2" onChange={e => updateRoom(i, 'floor', e.target.value)} /></div>
                  </div>
                  <div className="form-field"><label className="form-label">Room Description</label><textarea className="form-input" value={r.description} rows={2} onChange={e => updateRoom(i, 'description', e.target.value)} placeholder="Describe this room type..." style={{ resize:'vertical' }} /></div>
                </div>
              ))}
              {rooms.length === 0 && <div style={{ textAlign:'center', padding:'32px', color:'var(--text-muted)', fontSize:'13px', border:'2px dashed var(--border-light)', borderRadius:'10px' }}>No room types yet. Add at least one above.</div>}
            </div>
          </div>
        )}

        {/* STEP 3 — Room Photos */}
        {step === 3 && (
          <div>
            <p style={{ fontSize:'13px', color:'var(--text-muted)', marginBottom:'20px' }}>Upload photos for each room type. Students will browse these when selecting a room.</p>
            {rooms.length === 0 ? (
              <div style={{ textAlign:'center', padding:'32px', color:'var(--text-muted)', fontSize:'13px' }}>Go back and add room types first.</div>
            ) : (
              <div style={{ display:'grid', gap:'14px' }}>
                {rooms.map((r, i) => (
                  <ImageUploadZone
                    key={i}
                    label={`${r.name} — photos`}
                    files={r.files}
                    previews={r.previews}
                    onChange={newFiles => handleRoomFiles(i, newFiles)}
                    onRemove={j => removeRoomImg(i, j)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 4 — Hostel Gallery */}
        {step === 4 && (
          <div>
            <p style={{ fontSize:'13px', color:'var(--text-muted)', marginBottom:'20px' }}>Upload photos for each area of your hostel. Each section gets its own gallery tab on the student listing.</p>
            <div style={{ display:'grid', gap:'12px' }}>
              {GALLERY_SECTIONS_DEF.map(section => (
                <ImageUploadZone
                  key={section.key}
                  label={section.label}
                  files={galFiles[section.key] || []}
                  previews={galPreviews[section.key] || []}
                  onChange={newFiles => handleGalFiles(section.key, newFiles)}
                  onRemove={j => removeGalImg(section.key, j)}
                />
              ))}
            </div>
          </div>
        )}

        {/* STEP 5 — Review & Publish */}
        {step === 5 && (
          <div style={{ display:'grid', gap:'16px' }}>
            <div style={{ padding:'16px', background:'var(--bg-subtle)', borderRadius:'10px', border:'1px solid var(--border-light)' }}>
              <h4 style={{ margin:'0 0 10px', fontWeight:'900', fontSize:'15px' }}>🏠 {info.name}</h4>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', fontSize:'13px', marginBottom:'10px' }}>
                {[['Location', info.location], ['Address', info.address], ['Base Price', `${formatCurrency(info.pricePerYear)}/yr`], ['Agent', info.agentName || '—']].map(([l, v]) => (
                  <div key={l}><span style={{ color:'var(--text-muted)' }}>{l}:</span> <strong>{v}</strong></div>
                ))}
              </div>
              <p style={{ margin:0, fontSize:'13px', color:'var(--text-secondary)', lineHeight:'1.6' }}>{info.description}</p>
            </div>

            <div style={{ padding:'14px', background:'var(--bg-subtle)', borderRadius:'10px', border:'1px solid var(--border-light)' }}>
              <h4 style={{ margin:'0 0 10px', fontWeight:'800', fontSize:'14px' }}>✅ Facilities ({facilities.length})</h4>
              <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                {facilities.map(f => <span key={f} style={{ fontSize:'11px', padding:'2px 10px', borderRadius:'12px', background:'var(--bg-card)', border:'1px solid var(--border-light)' }}>{getFacilityIcon(f)} {f}</span>)}
              </div>
            </div>

            <div style={{ padding:'14px', background:'var(--bg-subtle)', borderRadius:'10px', border:'1px solid var(--border-light)' }}>
              <h4 style={{ margin:'0 0 10px', fontWeight:'800', fontSize:'14px' }}>🛏️ Room Types ({rooms.length})</h4>
              {rooms.map((r, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border-light)', fontSize:'13px' }}>
                  <strong>{r.name}</strong>
                  <span style={{ color:'var(--text-muted)' }}>{r.occupants} occ · {r.available} available · {formatCurrency(r.price)}/yr</span>
                  <span style={{ color: r.files.length ? '#10b981' : 'var(--text-muted)' }}>📷 {r.files.length} photos</span>
                </div>
              ))}
            </div>

            <div style={{ padding:'14px', background:'var(--bg-subtle)', borderRadius:'10px', border:'1px solid var(--border-light)' }}>
              <h4 style={{ margin:'0 0 10px', fontWeight:'800', fontSize:'14px' }}>📸 Gallery Uploads</h4>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px, 1fr))', gap:'8px' }}>
                {GALLERY_SECTIONS_DEF.map(s => {
                  const count = (galFiles[s.key] || []).length;
                  if (!count) return null;
                  return (
                    <div key={s.key} style={{ padding:'8px 10px', borderRadius:'6px', background:'var(--bg-card)', border:'1px solid var(--border-light)', fontSize:'12px' }}>
                      <strong>{s.label}</strong><br />
                      <span style={{ color:'#10b981', fontWeight:'700' }}>{count} photo{count !== 1 ? 's' : ''}</span>
                    </div>
                  );
                })}
                {Object.values(galFiles).every(a => !a || a.length === 0) && (
                  <p style={{ fontSize:'12px', color:'var(--text-muted)', margin:0 }}>No gallery photos uploaded. You can add them after publishing.</p>
                )}
              </div>
            </div>

            {err && <div className="error-msg">{err}</div>}
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div style={{ padding:'16px 24px', borderTop:'1px solid var(--border-light)', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
        <button className="btn btn-outline" onClick={step === 0 ? onCancel : () => setStep(s => s - 1)} disabled={busy}>
          {step === 0 ? 'Cancel' : '← Back'}
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          {err && step < 5 && <span style={{ fontSize:'12px', color:'#ef4444' }}>{err}</span>}
          <span style={{ fontSize:'12px', color:'var(--text-muted)' }}>Step {step + 1} of {STEPS.length}</span>
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={() => { if (canNext()) { setErr(''); setStep(s => s + 1); } else setErr('Please fill all required fields.'); }} disabled={busy}>
              Continue →
            </button>
          ) : (
            <button className="btn btn-primary" onClick={publish} disabled={busy || rooms.length === 0} style={{ padding:'10px 24px' }}>
              {busy ? 'Publishing…' : '🚀 Publish Hostel'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
