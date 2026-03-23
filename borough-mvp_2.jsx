import { useState, useEffect, useRef } from "react";

// ─── Persistent storage helpers ───────────────────────────────────────────────
const STORAGE_KEY = "borough-data";

const defaultData = {
  buildings: [
    {
      id: "b1",
      name: "The Standish",
      address: "171 Columbia Heights, Brooklyn Heights",
      neighborhood: "Brooklyn Heights",
      streeteasyUrl: "https://streeteasy.com",
      units: [
        { id: "u1", bed: "1BR", price: 3600, sqft: 690, floor: 7, available: true, status: "touring", addedAt: "Mar 18" },
        { id: "u2", bed: "2BR", price: 5100, sqft: 1020, floor: 11, available: true, status: "applied", addedAt: "Mar 18" },
      ],
      amenities: ["Doorman", "Gym", "Roof Deck", "Elevator", "Laundry"],
      petPolicy: "Cats OK",
      laundry: "In-building",
      notes: "Stunning views of Manhattan from upper floors. Super responds same day. Income req 40x.",
      docs: ["ID uploaded", "Pay stubs x3"],
      visited: true,
      rating: 5,
    },
    {
      id: "b2",
      name: "Bushwick Collective Lofts",
      address: "56 Wyckoff Ave, Bushwick",
      neighborhood: "Bushwick",
      streeteasyUrl: "https://streeteasy.com",
      units: [
        { id: "u3", bed: "Studio", price: 2200, sqft: 430, floor: 2, available: true, status: "interested", addedAt: "Mar 20" },
        { id: "u4", bed: "1BR", price: 2950, sqft: 660, floor: 4, available: false, status: "lost", addedAt: "Mar 15" },
      ],
      amenities: ["Exposed Brick", "High Ceilings", "Bike Storage", "Package Room"],
      petPolicy: "No pets",
      laundry: "In-unit",
      notes: "Amazing light in the studio. L train 3 min walk. Art crowd vibe.",
      docs: [],
      visited: true,
      rating: 4,
    },
    {
      id: "b3",
      name: "One LIC Tower",
      address: "29-22 Northern Blvd, Long Island City",
      neighborhood: "LIC",
      streeteasyUrl: "https://streeteasy.com",
      units: [
        { id: "u5", bed: "1BR", price: 3300, sqft: 710, floor: 18, available: true, status: "saved", addedAt: "Mar 21" },
      ],
      amenities: ["Concierge", "Pool", "Gym", "Coworking", "Roof Deck", "EV Charging"],
      petPolicy: "Dogs & Cats (fee)",
      laundry: "In-unit",
      notes: "New construction. Manhattan skyline views. 7 train direct to Midtown.",
      docs: [],
      visited: false,
      rating: 0,
    },
  ],
  collaborators: ["you@email.com", "partner@email.com"],
  inviteCode: "BOROUGH-NYC-2024",
};

const STATUS = {
  saved:      { label: "Saved",      emoji: "🔖", color: "#94a3b8", bg: "rgba(148,163,184,0.1)",  border: "rgba(148,163,184,0.25)" },
  interested: { label: "Interested", emoji: "👀", color: "#f59e0b", bg: "rgba(245,158,11,0.1)",   border: "rgba(245,158,11,0.3)" },
  touring:    { label: "Touring",    emoji: "🚶", color: "#38bdf8", bg: "rgba(56,189,248,0.1)",   border: "rgba(56,189,248,0.3)" },
  applied:    { label: "Applied",    emoji: "📝", color: "#a78bfa", bg: "rgba(167,139,250,0.1)",  border: "rgba(167,139,250,0.3)" },
  approved:   { label: "Approved",   emoji: "✅", color: "#34d399", bg: "rgba(52,211,153,0.1)",   border: "rgba(52,211,153,0.3)" },
  lost:       { label: "Passed",     emoji: "❌", color: "#6b7280", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.2)" },
};

const AMENITY_ICONS = {
  "Doorman":"🚪","Gym":"💪","Roof Deck":"🌇","Elevator":"🛗","Laundry":"🧺",
  "Pool":"🏊","Concierge":"🎩","Bike Storage":"🚲","Package Room":"📦",
  "Coworking":"💻","EV Charging":"⚡","Exposed Brick":"🧱","High Ceilings":"⬆️",
  "In-unit":"🏠",
};

function useData() {
  const [data, setData] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        setData(res ? JSON.parse(res.value) : defaultData);
      } catch { setData(defaultData); }
    })();
  }, []);
  const save = async (next) => {
    setData(next);
    try { await window.storage.set(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };
  return [data, save];
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [data, save] = useData();
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("board"); // board | list
  const [detailTab, setDetailTab] = useState("overview");
  const [showInvite, setShowInvite] = useState(false);
  const [showAddBuilding, setShowAddBuilding] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterHood, setFilterHood] = useState("all");

  if (!data) return (
    <div style={{ background: "#080809", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#ff3f3f", fontFamily: "monospace", fontSize: 13, letterSpacing: 3 }}>LOADING...</div>
    </div>
  );

  const selectedBuilding = data.buildings.find(b => b.id === selected);
  const hoods = ["all", ...new Set(data.buildings.map(b => b.neighborhood))];
  const statuses = Object.keys(STATUS);

  const filteredBuildings = data.buildings.filter(b => {
    if (filterHood !== "all" && b.neighborhood !== filterHood) return false;
    if (filterStatus !== "all" && !b.units.some(u => u.status === filterStatus)) return false;
    return true;
  });

  const allUnits = data.buildings.flatMap(b => b.units.map(u => ({ ...u, building: b })));
  const stats = {
    buildings: data.buildings.length,
    active: allUnits.filter(u => ["touring","applied","approved"].includes(u.status)).length,
    applied: allUnits.filter(u => u.status === "applied").length,
    approved: allUnits.filter(u => u.status === "approved").length,
  };

  const updateUnit = (bid, uid, patch) => {
    const next = { ...data, buildings: data.buildings.map(b => b.id !== bid ? b : {
      ...b, units: b.units.map(u => u.id !== uid ? u : { ...u, ...patch })
    })};
    save(next);
    if (selected === bid) setSelected(bid);
  };

  const updateBuilding = (bid, patch) => {
    const next = { ...data, buildings: data.buildings.map(b => b.id !== bid ? b : { ...b, ...patch }) };
    save(next);
  };

  const addDoc = (bid, docName) => {
    const b = data.buildings.find(x => x.id === bid);
    updateBuilding(bid, { docs: [...(b.docs || []), docName] });
  };

  const removeDoc = (bid, idx) => {
    const b = data.buildings.find(x => x.id === bid);
    updateBuilding(bid, { docs: b.docs.filter((_, i) => i !== idx) });
  };

  return (
    <div style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", background: "#080809", minHeight: "100vh", color: "#f0ebe0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow-x: hidden; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ff3f3f; border-radius: 2px; }
        .mono { font-family: 'IBM Plex Mono', monospace !important; }
        .card { transition: border-color 0.15s, transform 0.15s; cursor: pointer; }
        .card:hover { border-color: #ff3f3f !important; transform: translateY(-1px); }
        .btn { cursor: pointer; transition: all 0.15s; font-family: 'Bebas Neue', sans-serif; }
        .btn:hover { filter: brightness(1.15); }
        .pill { cursor: pointer; transition: all 0.15s; font-family: 'IBM Plex Mono', monospace; }
        .pill:hover { filter: brightness(1.2); }
        select, input, textarea { font-family: 'IBM Plex Mono', monospace; background: #0f1012; border: 1px solid #222; color: #f0ebe0; border-radius: 3px; }
        select:focus, input:focus, textarea:focus { outline: none; border-color: #ff3f3f; }
        .tab { cursor: pointer; transition: all 0.15s; font-family: 'Bebas Neue', sans-serif; letter-spacing: 2px; }
        .tab:hover { color: #ff3f3f !important; }
        .unit-row { transition: background 0.1s; }
        .unit-row:hover { background: rgba(255,63,63,0.04) !important; }
        .noise { position: fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; opacity:0.025; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"); z-index:999; }
        @keyframes fadeIn { from { opacity:0; transform: translateY(6px); } to { opacity:1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.25s ease forwards; }
        .stripe { background: repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,63,63,0.03) 4px, rgba(255,63,63,0.03) 8px); }
      `}</style>
      <div className="noise" />

      {/* ── Header ── */}
      <header style={{ borderBottom: "2px solid #ff3f3f", padding: "0 28px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#080809", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <span style={{ fontSize: 28, letterSpacing: 6, color: "#ff3f3f" }}>BOROUGH</span>
          <span className="mono" style={{ fontSize: 9, color: "#444", letterSpacing: 3, textTransform: "uppercase" }}>NYC Hunt Tracker</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Collaborators */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {data.collaborators.map((c, i) => (
              <div key={i} title={c} style={{
                width: 28, height: 28, borderRadius: "50%", border: "2px solid #ff3f3f",
                background: `hsl(${(c.charCodeAt(0) * 17) % 360}, 60%, 25%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, color: "#f0ebe0", fontFamily: "IBM Plex Mono",
              }}>
                {c[0].toUpperCase()}
              </div>
            ))}
            <button onClick={() => setShowInvite(true)} className="btn" style={{
              background: "transparent", border: "1px dashed #333", color: "#666",
              width: 28, height: 28, borderRadius: "50%", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
            }}>+</button>
          </div>
          <button onClick={() => setShowAddBuilding(true)} className="btn" style={{
            background: "#ff3f3f", color: "#080809", border: "none",
            padding: "6px 18px", fontSize: 14, letterSpacing: 2,
          }}>+ ADD BUILDING</button>
        </div>
      </header>

      {/* ── Stats Bar ── */}
      <div style={{ display: "flex", borderBottom: "1px solid #111", background: "#0a0a0b" }}>
        {[
          { label: "BUILDINGS", val: stats.buildings },
          { label: "IN PLAY", val: stats.active, red: true },
          { label: "APPLIED", val: stats.applied, red: true },
          { label: "APPROVED", val: stats.approved, green: true },
          { label: "COLLABORATORS", val: data.collaborators.length },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, padding: "12px 20px", borderRight: "1px solid #111", textAlign: "center" }}>
            <div style={{ fontSize: 28, letterSpacing: 2, color: s.red ? "#ff3f3f" : s.green ? "#34d399" : "#f0ebe0" }}>{s.val}</div>
            <div className="mono" style={{ fontSize: 8, color: "#444", letterSpacing: 2, marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Body ── */}
      <div style={{ display: "flex", height: "calc(100vh - 116px)" }}>

        {/* ── Left: Building List / Board ── */}
        <div style={{ width: selected ? 380 : "100%", flexShrink: 0, borderRight: "1px solid #111", overflowY: "auto", transition: "width 0.3s" }}>

          {/* View toggle + filters */}
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #111", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {["board","list"].map(v => (
              <button key={v} onClick={() => setTab(v)} className="tab" style={{
                background: "transparent", border: `2px solid ${tab === v ? "#ff3f3f" : "#222"}`,
                color: tab === v ? "#ff3f3f" : "#444", padding: "4px 14px", fontSize: 14, letterSpacing: 2,
              }}>{v.toUpperCase()}</button>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              <select value={filterHood} onChange={e => setFilterHood(e.target.value)} style={{ fontSize: 10, padding: "4px 8px" }}>
                {hoods.map(h => <option key={h} value={h}>{h === "all" ? "All Hoods" : h}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ fontSize: 10, padding: "4px 8px" }}>
                <option value="all">All Status</option>
                {statuses.map(s => <option key={s} value={s}>{STATUS[s].label}</option>)}
              </select>
            </div>
          </div>

          {tab === "list" ? (
            /* ── List View ── */
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredBuildings.map(b => (
                <BuildingCard key={b.id} b={b} selected={selected === b.id} onClick={() => { setSelected(b.id); setDetailTab("overview"); }} />
              ))}
              {filteredBuildings.length === 0 && <Empty />}
            </div>
          ) : (
            /* ── Board View ── */
            <div style={{ padding: 16, overflowX: "auto" }}>
              <div style={{ display: "flex", gap: 12, minWidth: Object.keys(STATUS).length * 200 }}>
                {Object.entries(STATUS).map(([key, cfg]) => {
                  const units = allUnits.filter(u => u.status === key);
                  return (
                    <div key={key} style={{ minWidth: 190, flex: 1 }}>
                      <div style={{ padding: "8px 10px", marginBottom: 8, background: cfg.bg, border: `1px solid ${cfg.border}`, borderTop: `3px solid ${cfg.color}` }}>
                        <span className="mono" style={{ fontSize: 10, color: cfg.color, letterSpacing: 1 }}>{cfg.emoji} {cfg.label.toUpperCase()}</span>
                        <span className="mono" style={{ float: "right", fontSize: 10, color: "#444" }}>{units.length}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {units.map(u => (
                          <div key={u.id} className="card" onClick={() => { setSelected(u.building.id); setDetailTab("overview"); }} style={{
                            background: "#0d0d0e", border: "1px solid #1a1a1d", padding: 12, borderRadius: 2,
                          }}>
                            <div style={{ fontSize: 12, letterSpacing: 1, color: "#f0ebe0", marginBottom: 3 }}>{u.building.name}</div>
                            <div className="mono" style={{ fontSize: 9, color: "#555", marginBottom: 8 }}>{u.building.neighborhood}</div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                              <span className="mono" style={{ fontSize: 10, color: "#888" }}>{u.bed} · Fl {u.floor}</span>
                              <span style={{ fontSize: 15, color: "#ff3f3f", letterSpacing: 1 }}>${u.price.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                        {units.length === 0 && (
                          <div className="stripe" style={{ border: "1px dashed #1a1a1d", padding: "20px 10px", textAlign: "center" }}>
                            <span className="mono" style={{ fontSize: 9, color: "#2a2a2a" }}>EMPTY</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Detail Panel ── */}
        {selected && selectedBuilding && (
          <div className="fade-in" style={{ flex: 1, overflowY: "auto", background: "#09090b" }}>
            <DetailPanel
              b={selectedBuilding}
              detailTab={detailTab}
              setDetailTab={setDetailTab}
              onClose={() => setSelected(null)}
              updateUnit={updateUnit}
              updateBuilding={updateBuilding}
              addDoc={addDoc}
              removeDoc={removeDoc}
            />
          </div>
        )}
      </div>

      {/* ── Invite Modal ── */}
      {showInvite && (
        <Modal onClose={() => setShowInvite(false)} title="INVITE COLLABORATOR">
          <div className="mono" style={{ fontSize: 11, color: "#888", marginBottom: 16, lineHeight: 1.6 }}>
            Share your hunt board with a roommate or partner. They'll see everything in real time.
          </div>
          <div style={{ background: "#0f1012", border: "1px solid #222", padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="mono" style={{ fontSize: 13, color: "#ff3f3f", letterSpacing: 2 }}>{data.inviteCode}</span>
            <button className="btn mono" onClick={() => navigator.clipboard?.writeText(data.inviteCode)} style={{
              background: "transparent", border: "1px solid #333", color: "#888", padding: "4px 12px", fontSize: 10,
            }}>COPY</button>
          </div>
          <div style={{ marginBottom: 10 }}>
            <input placeholder="their@email.com" style={{ width: "100%", padding: "10px 12px", fontSize: 11 }} />
          </div>
          <button className="btn" onClick={() => setShowInvite(false)} style={{
            background: "#ff3f3f", color: "#080809", border: "none", width: "100%", padding: "10px", fontSize: 16, letterSpacing: 3,
          }}>SEND INVITE</button>
          <div style={{ marginTop: 16 }}>
            <div className="mono" style={{ fontSize: 9, color: "#444", letterSpacing: 2, marginBottom: 8 }}>CURRENT COLLABORATORS</div>
            {data.collaborators.map((c, i) => (
              <div key={i} className="mono" style={{ fontSize: 11, color: "#666", padding: "6px 0", borderBottom: "1px solid #111" }}>{c}</div>
            ))}
          </div>
        </Modal>
      )}

      {/* ── Add Building Modal ── */}
      {showAddBuilding && (
        <Modal onClose={() => setShowAddBuilding(false)} title="ADD BUILDING">
          <AddBuildingForm onAdd={(b) => { save({ ...data, buildings: [...data.buildings, b] }); setShowAddBuilding(false); }} />
        </Modal>
      )}
    </div>
  );
}

// ─── Building Card ────────────────────────────────────────────────────────────
function BuildingCard({ b, selected, onClick }) {
  const topUnit = b.units.reduce((best, u) => {
    const rank = ["approved","applied","touring","interested","saved","lost"];
    return rank.indexOf(u.status) < rank.indexOf(best.status) ? u : best;
  }, b.units[0]);

  return (
    <div className="card" onClick={onClick} style={{
      background: selected ? "rgba(255,63,63,0.05)" : "#0d0d0e",
      border: `1px solid ${selected ? "#ff3f3f" : "#1a1a1d"}`,
      borderLeft: `3px solid ${selected ? "#ff3f3f" : STATUS[topUnit?.status]?.color || "#333"}`,
      padding: 14,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 16, letterSpacing: 2, color: "#f0ebe0", marginBottom: 2 }}>{b.name}</div>
          <div className="mono" style={{ fontSize: 9, color: "#555" }}>{b.address}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          {b.visited && <div className="mono" style={{ fontSize: 8, color: "#ff3f3f", letterSpacing: 2, marginBottom: 3 }}>VISITED</div>}
          {b.rating > 0 && <div className="mono" style={{ fontSize: 10, color: "#666" }}>{"★".repeat(b.rating)}{"☆".repeat(5 - b.rating)}</div>}
        </div>
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
        {b.amenities.slice(0, 4).map(a => (
          <span key={a} className="mono" style={{ fontSize: 8, background: "#111", color: "#555", padding: "2px 7px", border: "1px solid #1a1a1d", letterSpacing: 1 }}>
            {AMENITY_ICONS[a]} {a}
          </span>
        ))}
        {b.amenities.length > 4 && <span className="mono" style={{ fontSize: 8, color: "#333" }}>+{b.amenities.length - 4} more</span>}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {b.units.map(u => (
          <div key={u.id} style={{
            flex: 1, background: "#080809", border: `1px solid ${STATUS[u.status]?.border || "#1a1a1d"}`,
            padding: "7px 9px", opacity: u.available ? 1 : 0.4,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span className="mono" style={{ fontSize: 10, color: "#f0ebe0" }}>{u.bed}</span>
              <span className="mono" style={{ fontSize: 9, color: u.available ? "#34d399" : "#444" }}>{u.available ? "●" : "○"}</span>
            </div>
            <div style={{ fontSize: 14, letterSpacing: 1, color: "#ff3f3f" }}>${u.price.toLocaleString()}</div>
            <div className="mono" style={{ fontSize: 8, color: "#444", marginTop: 2 }}>{STATUS[u.status]?.emoji} {STATUS[u.status]?.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function DetailPanel({ b, detailTab, setDetailTab, onClose, updateUnit, updateBuilding, addDoc, removeDoc }) {
  const [noteInput, setNoteInput] = useState(b.notes || "");
  const [docInput, setDocInput] = useState("");

  useEffect(() => { setNoteInput(b.notes || ""); }, [b.id]);

  const TABS = ["overview", "units", "docs"];

  return (
    <div>
      {/* Detail Header */}
      <div style={{ padding: "18px 24px 0", borderBottom: "1px solid #111", position: "sticky", top: 0, background: "#09090b", zIndex: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 26, letterSpacing: 4, color: "#f0ebe0", marginBottom: 3 }}>{b.name}</div>
            <div className="mono" style={{ fontSize: 10, color: "#555" }}>{b.address}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => updateBuilding(b.id, { visited: !b.visited })} className="btn" style={{
              background: b.visited ? "rgba(255,63,63,0.1)" : "transparent",
              border: `1px solid ${b.visited ? "#ff3f3f" : "#222"}`,
              color: b.visited ? "#ff3f3f" : "#444", padding: "5px 12px", fontSize: 12, letterSpacing: 2,
            }}>{b.visited ? "✓ VISITED" : "MARK VISITED"}</button>
            <button onClick={onClose} className="btn" style={{
              background: "transparent", border: "1px solid #222", color: "#444", padding: "5px 10px", fontSize: 14,
            }}>✕</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 0 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setDetailTab(t)} className="tab" style={{
              background: "transparent", border: "none", borderBottom: `2px solid ${detailTab === t ? "#ff3f3f" : "transparent"}`,
              color: detailTab === t ? "#ff3f3f" : "#444", padding: "8px 18px", fontSize: 14, letterSpacing: 2,
            }}>{t.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: 24 }}>
        {/* ── Overview Tab ── */}
        {detailTab === "overview" && (
          <div className="fade-in">
            {/* Stats row */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              {[
                { label: "PET POLICY", val: b.petPolicy },
                { label: "LAUNDRY", val: b.laundry },
                { label: "RATING", val: b.rating > 0 ? "★".repeat(b.rating) : "—" },
              ].map(({ label, val }) => (
                <div key={label} style={{ flex: 1, background: "#0d0d0e", border: "1px solid #1a1a1d", borderTop: "2px solid #ff3f3f", padding: "10px 14px" }}>
                  <div className="mono" style={{ fontSize: 8, color: "#444", letterSpacing: 2, marginBottom: 5 }}>{label}</div>
                  <div style={{ fontSize: 14, letterSpacing: 1, color: "#f0ebe0" }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Rating setter */}
            <div style={{ marginBottom: 20 }}>
              <div className="mono" style={{ fontSize: 9, color: "#444", letterSpacing: 2, marginBottom: 8 }}>YOUR RATING</div>
              <div style={{ display: "flex", gap: 6 }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => updateBuilding(b.id, { rating: n })} className="btn" style={{
                    background: b.rating >= n ? "rgba(255,63,63,0.1)" : "transparent",
                    border: `1px solid ${b.rating >= n ? "#ff3f3f" : "#222"}`,
                    color: b.rating >= n ? "#ff3f3f" : "#333",
                    width: 36, height: 36, fontSize: 16,
                  }}>★</button>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div style={{ marginBottom: 20 }}>
              <div className="mono" style={{ fontSize: 9, color: "#444", letterSpacing: 2, marginBottom: 10 }}>AMENITIES</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {b.amenities.map(a => (
                  <span key={a} className="mono" style={{
                    fontSize: 10, background: "#0d0d0e", border: "1px solid #1a1a1d",
                    color: "#888", padding: "5px 12px", letterSpacing: 1,
                  }}>{AMENITY_ICONS[a] || "·"} {a}</span>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 20 }}>
              <div className="mono" style={{ fontSize: 9, color: "#444", letterSpacing: 2, marginBottom: 10 }}>NOTES</div>
              <textarea
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                onBlur={() => updateBuilding(b.id, { notes: noteInput })}
                placeholder="Add notes about this building..."
                style={{ width: "100%", minHeight: 100, fontSize: 11, padding: "10px 12px", lineHeight: 1.7, resize: "vertical", borderColor: "#1a1a1d" }}
              />
            </div>

            {/* StreetEasy link */}
            <div>
              <div className="mono" style={{ fontSize: 9, color: "#444", letterSpacing: 2, marginBottom: 8 }}>STREETEASY LINK</div>
              <a href={b.streeteasyUrl} target="_blank" rel="noreferrer" style={{
                display: "inline-block", fontFamily: "IBM Plex Mono", fontSize: 10, color: "#ff3f3f",
                border: "1px solid rgba(255,63,63,0.3)", padding: "6px 14px", textDecoration: "none", letterSpacing: 1,
              }}>OPEN LISTING ↗</a>
            </div>
          </div>
        )}

        {/* ── Units Tab ── */}
        {detailTab === "units" && (
          <div className="fade-in">
            <div className="mono" style={{ fontSize: 9, color: "#444", letterSpacing: 2, marginBottom: 14 }}>{b.units.length} UNITS TRACKED</div>
            {b.units.map(u => (
              <div key={u.id} className="unit-row" style={{
                background: "#0d0d0e", border: `1px solid ${STATUS[u.status]?.border || "#1a1a1d"}`,
                borderLeft: `3px solid ${STATUS[u.status]?.color || "#333"}`,
                padding: "14px 16px", marginBottom: 10,
                opacity: u.available ? 1 : 0.5,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 18, letterSpacing: 3, color: "#f0ebe0", marginBottom: 2 }}>{u.bed}</div>
                    <div className="mono" style={{ fontSize: 9, color: "#555" }}>
                      {u.sqft} sqft · Floor {u.floor} · Added {u.addedAt}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 22, letterSpacing: 2, color: "#ff3f3f" }}>${u.price.toLocaleString()}</div>
                    <div className="mono" style={{ fontSize: 8, color: "#444" }}>PER MONTH</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span className="mono" style={{ fontSize: 9, color: u.available ? "#34d399" : "#555" }}>
                    {u.available ? "● AVAILABLE" : "○ UNAVAILABLE"}
                  </span>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                    {Object.entries(STATUS).map(([key, cfg]) => (
                      <button key={key} onClick={() => updateUnit(b.id, u.id, { status: key })} className="pill" style={{
                        fontSize: 9, padding: "3px 8px", letterSpacing: 1,
                        background: u.status === key ? cfg.bg : "transparent",
                        border: `1px solid ${u.status === key ? cfg.color : "#1a1a1d"}`,
                        color: u.status === key ? cfg.color : "#333",
                      }}>{cfg.emoji} {cfg.label.toUpperCase()}</button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Docs Tab ── */}
        {detailTab === "docs" && (
          <div className="fade-in">
            <div className="mono" style={{ fontSize: 9, color: "#444", letterSpacing: 2, marginBottom: 14 }}>APPLICATION DOCUMENTS</div>

            {/* Checklist of common docs */}
            {["Government ID", "Pay stubs (3 months)", "Bank statements", "Employment letter", "Tax returns", "Guarantor info", "Reference letters"].map(doc => {
              const has = b.docs?.includes(doc);
              return (
                <div key={doc} onClick={() => has ? removeDoc(b.id, b.docs.indexOf(doc)) : addDoc(b.id, doc)} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
                  background: has ? "rgba(52,211,153,0.05)" : "#0d0d0e",
                  border: `1px solid ${has ? "rgba(52,211,153,0.2)" : "#1a1a1d"}`,
                  marginBottom: 6, cursor: "pointer", transition: "all 0.15s",
                }}>
                  <div style={{
                    width: 18, height: 18, border: `2px solid ${has ? "#34d399" : "#333"}`,
                    background: has ? "#34d399" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {has && <span style={{ color: "#080809", fontSize: 10, fontWeight: "bold" }}>✓</span>}
                  </div>
                  <span className="mono" style={{ fontSize: 11, color: has ? "#34d399" : "#666", letterSpacing: 1 }}>{doc}</span>
                </div>
              );
            })}

            {/* Custom doc input */}
            <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
              <input value={docInput} onChange={e => setDocInput(e.target.value)} placeholder="Add custom document..." style={{ flex: 1, fontSize: 11, padding: "8px 12px" }}
                onKeyDown={e => { if (e.key === "Enter" && docInput.trim()) { addDoc(b.id, docInput.trim()); setDocInput(""); }}} />
              <button className="btn" onClick={() => { if (docInput.trim()) { addDoc(b.id, docInput.trim()); setDocInput(""); }}} style={{
                background: "#ff3f3f", color: "#080809", border: "none", padding: "8px 16px", fontSize: 14, letterSpacing: 2,
              }}>ADD</button>
            </div>

            {b.docs?.filter(d => !["Government ID","Pay stubs (3 months)","Bank statements","Employment letter","Tax returns","Guarantor info","Reference letters"].includes(d)).length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div className="mono" style={{ fontSize: 9, color: "#444", letterSpacing: 2, marginBottom: 8 }}>CUSTOM DOCS</div>
                {b.docs.filter(d => !["Government ID","Pay stubs (3 months)","Bank statements","Employment letter","Tax returns","Guarantor info","Reference letters"].includes(d)).map((doc, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.2)", marginBottom: 4 }}>
                    <span className="mono" style={{ fontSize: 11, color: "#34d399" }}>✓ {doc}</span>
                    <button onClick={() => removeDoc(b.id, b.docs.indexOf(doc))} className="btn" style={{ background: "transparent", border: "none", color: "#444", fontSize: 12 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ onClose, title, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div className="fade-in" onClick={e => e.stopPropagation()} style={{
        background: "#0d0d0e", border: "1px solid #222", borderTop: "3px solid #ff3f3f",
        width: "100%", maxWidth: 440, padding: 28,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 22, letterSpacing: 4, color: "#f0ebe0" }}>{title}</span>
          <button onClick={onClose} className="btn" style={{ background: "transparent", border: "1px solid #222", color: "#444", padding: "4px 10px", fontSize: 14 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Add Building Form ────────────────────────────────────────────────────────
function AddBuildingForm({ onAdd }) {
  const [form, setForm] = useState({ name: "", address: "", neighborhood: "", streeteasyUrl: "", bed: "1BR", price: "", sqft: "", floor: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const submit = () => {
    if (!form.name || !form.address) return;
    onAdd({
      id: `b${Date.now()}`, name: form.name, address: form.address, neighborhood: form.neighborhood,
      streeteasyUrl: form.streeteasyUrl || "#",
      units: [{ id: `u${Date.now()}`, bed: form.bed, price: parseInt(form.price) || 0, sqft: parseInt(form.sqft) || 0, floor: parseInt(form.floor) || 1, available: true, status: "saved", addedAt: "Today" }],
      amenities: [], petPolicy: "Unknown", laundry: "Unknown", notes: "", docs: [], visited: false, rating: 0,
    });
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {[["BUILDING NAME", "name", "text"], ["ADDRESS", "address", "text"], ["NEIGHBORHOOD", "neighborhood", "text"], ["STREETEASY URL", "streeteasyUrl", "text"]].map(([label, key, type]) => (
        <div key={key}>
          <div className="mono" style={{ fontSize: 8, color: "#444", letterSpacing: 2, marginBottom: 4 }}>{label}</div>
          <input type={type} value={form[key]} onChange={e => set(key, e.target.value)} style={{ width: "100%", fontSize: 11, padding: "8px 12px" }} />
        </div>
      ))}
      <div style={{ display: "flex", gap: 10 }}>
        {[["BED TYPE", "bed", ["Studio","1BR","2BR","3BR"]], ["PRICE/MO", "price", null], ["SQFT", "sqft", null], ["FLOOR", "floor", null]].map(([label, key, opts]) => (
          <div key={key} style={{ flex: 1 }}>
            <div className="mono" style={{ fontSize: 8, color: "#444", letterSpacing: 2, marginBottom: 4 }}>{label}</div>
            {opts ? (
              <select value={form[key]} onChange={e => set(key, e.target.value)} style={{ width: "100%", fontSize: 11, padding: "8px 8px" }}>
                {opts.map(o => <option key={o}>{o}</option>)}
              </select>
            ) : (
              <input type="number" value={form[key]} onChange={e => set(key, e.target.value)} style={{ width: "100%", fontSize: 11, padding: "8px 12px" }} />
            )}
          </div>
        ))}
      </div>
      <button onClick={submit} className="btn" style={{
        background: "#ff3f3f", color: "#080809", border: "none", padding: "11px", fontSize: 16, letterSpacing: 3, marginTop: 6,
      }}>ADD BUILDING</button>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function Empty() {
  return (
    <div className="stripe" style={{ border: "1px dashed #1a1a1d", padding: "40px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 32, letterSpacing: 4, color: "#222", marginBottom: 8 }}>NO BUILDINGS</div>
      <div className="mono" style={{ fontSize: 10, color: "#333", letterSpacing: 2 }}>ADD A STREETEASY LINK TO GET STARTED</div>
    </div>
  );
}
