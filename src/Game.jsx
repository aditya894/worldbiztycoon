import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import AdBanner from "./components/AdBanner";

// ── BOARD DATA ────────────────────────────────────────────
const SQ = [
  {n:"START",       t:"go"},
  {n:"Nigeria",     t:"prop",c:"#92400e",p:60,  r:4},
  {n:"World Fund",  t:"chest"},
  {n:"S. Africa",   t:"prop",c:"#92400e",p:60,  r:4},
  {n:"Import Tax",  t:"tax", amt:200},
  {n:"Africa Air",  t:"rr",  p:200, r:25},
  {n:"India",       t:"prop",c:"#0369a1",p:100, r:8},
  {n:"Chance",      t:"chance"},
  {n:"China",       t:"prop",c:"#0369a1",p:100, r:8},
  {n:"Japan",       t:"prop",c:"#0369a1",p:120, r:10},
  {n:"Jail",        t:"jail"},
  {n:"Mexico",      t:"prop",c:"#16a34a",p:140, r:12},
  {n:"Oil Fields",  t:"util",p:150, r:10},
  {n:"Brazil",      t:"prop",c:"#16a34a",p:140, r:12},
  {n:"Canada",      t:"prop",c:"#16a34a",p:160, r:14},
  {n:"Americas Air",t:"rr",  p:200, r:25},
  {n:"Turkey",      t:"prop",c:"#7c3aed",p:180, r:16},
  {n:"World Fund",  t:"chest"},
  {n:"Italy",       t:"prop",c:"#7c3aed",p:180, r:16},
  {n:"France",      t:"prop",c:"#7c3aed",p:200, r:18},
  {n:"Free Zone",   t:"park"},
  {n:"Germany",     t:"prop",c:"#d97706",p:220, r:20},
  {n:"Chance",      t:"chance"},
  {n:"UK",          t:"prop",c:"#d97706",p:220, r:20},
  {n:"Switzerland", t:"prop",c:"#d97706",p:240, r:22},
  {n:"Europe Air",  t:"rr",  p:200, r:25},
  {n:"Saudi Arabia",t:"prop",c:"#dc2626",p:260, r:24},
  {n:"UAE",         t:"prop",c:"#dc2626",p:260, r:24},
  {n:"Tech Hub",    t:"util",p:150, r:10},
  {n:"Israel",      t:"prop",c:"#dc2626",p:280, r:26},
  {n:"Go To Jail",  t:"gotojail"},
  {n:"Australia",   t:"prop",c:"#0f766e",p:300, r:28},
  {n:"Singapore",   t:"prop",c:"#0f766e",p:300, r:28},
  {n:"World Fund",  t:"chest"},
  {n:"S. Korea",    t:"prop",c:"#0f766e",p:320, r:30},
  {n:"Pacific Air", t:"rr",  p:200, r:25},
  {n:"Chance",      t:"chance"},
  {n:"USA",         t:"prop",c:"#1d4ed8",p:350, r:35},
  {n:"Luxury Tax",  t:"tax", amt:100},
  {n:"Beijing HQ",  t:"prop",c:"#1d4ed8",p:400, r:50},
];

const FL = {
  "Nigeria":"🇳🇬","S. Africa":"🇿🇦","India":"🇮🇳","China":"🇨🇳","Japan":"🇯🇵",
  "Mexico":"🇲🇽","Brazil":"🇧🇷","Canada":"🇨🇦","Turkey":"🇹🇷","Italy":"🇮🇹",
  "France":"🇫🇷","Germany":"🇩🇪","UK":"🇬🇧","Switzerland":"🇨🇭","Saudi Arabia":"🇸🇦",
  "UAE":"🇦🇪","Israel":"🇮🇱","Australia":"🇦🇺","Singapore":"🇸🇬","S. Korea":"🇰🇷",
  "USA":"🇺🇸","Beijing HQ":"🏢",
};

const CHANCE = [
  {m:"✈️ Fly to START! +$200M", f:p=>({...p,pos:0,cash:p.cash+200})},
  {m:"💰 Dividend +$50M!",       f:p=>({...p,cash:p.cash+50})},
  {m:"📈 Stock win +$100M!",     f:p=>({...p,cash:p.cash+100})},
  {m:"💸 Import duty -$20M",     f:p=>({...p,cash:p.cash-20})},
  {m:"👮 Sanctions! Go to Jail", f:p=>({...p,pos:10,jail:true,jailTurns:0})},
  {m:"🤝 Trade deal +$75M!",     f:p=>({...p,cash:p.cash+75})},
];
const CHEST = [
  {m:"🏦 World Bank +$200M!", f:p=>({...p,cash:p.cash+200})},
  {m:"🏗️ Fee -$50M",          f:p=>({...p,cash:p.cash-50})},
  {m:"💵 Tax refund +$20M",   f:p=>({...p,cash:p.cash+20})},
  {m:"💻 Tech IPO +$100M!",   f:p=>({...p,cash:p.cash+100})},
  {m:"🌍 Fine -$75M",         f:p=>({...p,cash:p.cash-75})},
];

const SI = {go:"🌍",jail:"⚖️",park:"🛫",gotojail:"👮",tax:"💸",chance:"🎴",chest:"🏦",rr:"✈️",util:"⚡"};

function sqPos(i) {
  if (i <= 10) return [10, 10 - i];
  if (i <= 20) return [10 - (i - 10), 0];
  if (i <= 30) return [0, i - 20];
  return [i - 30, 10];
}

// ── DIE — crisp, fast, with landing pop ──────────────────
function Die({ val, size = 58, glow, shake, landed, color = "#DC2626" }) {
  const dots = {
    1:[[50,50]],
    2:[[28,28],[72,72]],
    3:[[28,28],[50,50],[72,72]],
    4:[[28,28],[72,28],[28,72],[72,72]],
    5:[[28,28],[72,28],[50,50],[28,72],[72,72]],
    6:[[25,20],[75,20],[25,50],[75,50],[25,80],[75,80]],
  }[val] || [[50,50]];
  const r = size * 0.12;
  const active = glow || shake;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{
      flexShrink: 0, display: "block",
      filter: active
        ? `drop-shadow(0 3px 14px ${color}aa)`
        : "drop-shadow(0 2px 5px #00000018)",
      animation: landed  ? "dieLand .32s cubic-bezier(0.34,1.56,0.64,1)"
               : shake   ? "dieSpin .07s ease-in-out infinite"
               : undefined,
      transition: "filter .12s",
    }}>
      <rect x="4" y="4" width="92" height="92" rx="20"
        fill="#FFFFFF"
        stroke={active ? color : "#D1D5DB"}
        strokeWidth={active ? "5" : "2"} />
      {/* subtle top gloss */}
      <rect x="4" y="4" width="92" height="44" rx="18" fill="#00000007" />
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={r}
          fill={active ? color : "#374151"} />
      ))}
    </svg>
  );
}

// ── CELL ─────────────────────────────────────────────────
function Cell({ idx, players, owners }) {
  const sq = SQ[idx];
  const here = players.filter(p => p.pos === idx && !p.bust);
  const oid = owners[idx];
  const owner = oid !== undefined ? players[oid] : null;
  const corner = [0, 10, 20, 30].includes(idx);
  const [row, col] = sqPos(idx);

  let bar = null;
  if (sq.c) {
    const s = { position: "absolute", background: sq.c };
    if (row === 10)     bar = { ...s, bottom: 0, left: 0, right: 0, height: "26%" };
    else if (col === 0) bar = { ...s, top: 0, left: 0, bottom: 0, width: "26%" };
    else if (col === 10)bar = { ...s, top: 0, right: 0, bottom: 0, width: "26%" };
    else                bar = { ...s, top: 0, left: 0, right: 0, height: "26%" };
  }
  const mt = (bar && row !== 10 && col !== 0 && col !== 10) ? "26%" : 0;
  const ml = (bar && col === 0) ? "26%" : 0;
  const mr = (bar && col === 10) ? "26%" : 0;
  const mb = (bar && row === 10) ? "26%" : 0;

  return (
    <div style={{
      width: "100%", height: "100%", position: "relative", overflow: "hidden",
      background: corner ? "#F0FDF4" : owner ? `${owner.color}12` : "#FFFFFF",
      border: `1px solid ${owner ? owner.color + "44" : "#E5E7EB"}`,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      transition: "background .2s",
    }}>
      {bar && <div style={bar} />}
      {corner ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "clamp(14px,1.7vw,24px)" }}>{SI[sq.t] || "🌍"}</div>
          <div style={{
            fontSize: "clamp(4px,.52vw,7px)", color: "#15803D",
            fontWeight: 900, marginTop: 2, letterSpacing: .3,
          }}>
            {sq.n.toUpperCase()}
          </div>
        </div>
      ) : (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: "1px",
          width: "100%", padding: "0 1px",
          marginTop: mt, marginLeft: ml, marginRight: mr, marginBottom: mb,
        }}>
          {FL[sq.n]
            ? <span style={{ fontSize: "clamp(7px,.95vw,14px)", lineHeight: 1 }}>{FL[sq.n]}</span>
            : SI[sq.t]
              ? <span style={{ fontSize: "clamp(6px,.85vw,12px)", lineHeight: 1 }}>{SI[sq.t]}</span>
              : null}
          {/* Full country name — bold, bigger, fully readable on mobile */}
          <div style={{
            fontSize: "clamp(4.5px,1.55vw,7.5px)", color: "#111827",
            textAlign: "center", fontWeight: 900, lineHeight: 1.15,
            wordBreak: "break-word", maxWidth: "98%", hyphens: "auto",
          }}>
            {sq.n}
          </div>
          {sq.p && (
            <div style={{ fontSize: "clamp(3px,.42vw,5.5px)", color: sq.c || "#15803D", fontWeight: 800 }}>
              ${sq.p}M
            </div>
          )}
        </div>
      )}
      {owner && (
        <div style={{
          position: "absolute", top: 2, right: 2,
          width: "clamp(4px,.6vw,8px)", height: "clamp(4px,.6vw,8px)",
          borderRadius: "50%", background: owner.color,
          boxShadow: `0 0 4px ${owner.color}`,
        }} />
      )}
      {here.length > 0 && (
        <div style={{ position: "absolute", bottom: 1, left: 1, display: "flex", flexWrap: "wrap", gap: "1px" }}>
          {here.map(p => (
            <div key={p.id} style={{
              width: "clamp(10px,1.25vw,17px)", height: "clamp(10px,1.25vw,17px)",
              borderRadius: "50%", background: p.color,
              border: "1.5px solid #fff",
              boxShadow: `0 2px 6px ${p.color}88`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "clamp(5px,.7vw,9px)",
            }}>{p.icon}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── BOARD ─────────────────────────────────────────────────
function Board({ players, owners }) {
  const grid = Array.from({ length: 11 }, () => Array(11).fill(null));
  SQ.forEach((_, i) => { const [r, c] = sqPos(i); grid[r][c] = i; });
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(11,1fr)",
      gridTemplateRows: "repeat(11,1fr)",
      width: "100%", height: "100%",
      border: "3px solid #15803D",
      borderRadius: 10, overflow: "hidden",
      background: "#F0FDF4",
      boxShadow: "0 8px 32px #00000018",
    }}>
      {grid.flat().map((idx, fi) => {
        const r = Math.floor(fi / 11), c = fi % 11;
        if (idx === null) return (
          <div key={fi} style={{
            background: "#DCFCE7",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {r === 5 && c === 5 && (
              <div style={{ textAlign: "center", userSelect: "none" }}>
                <div style={{ fontSize: "clamp(7px,1vw,15px)", fontWeight: 900, color: "#15803D", letterSpacing: 1 }}>WORLD</div>
                <div style={{ fontSize: "clamp(7px,1vw,15px)", fontWeight: 900, color: "#DC2626", letterSpacing: 1 }}>BIZ</div>
                <div style={{ fontSize: "clamp(3px,.5vw,7px)", color: "#6B7280", letterSpacing: 2, fontWeight: 600 }}>TYCOON</div>
                <div style={{ fontSize: "clamp(16px,2vw,30px)", marginTop: 2 }}>🌍</div>
              </div>
            )}
          </div>
        );
        return <Cell key={fi} idx={idx} players={players} owners={owners} />;
      })}
    </div>
  );
}

// ── SHARE MODAL ───────────────────────────────────────────
function ShareModal({ roomId, onClose }) {
  const link = `${window.location.origin}/join/${roomId}`;
  const code = roomId.slice(0, 6).toUpperCase();
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div style={{
      position: "fixed", inset: 0, background: "#00000055",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 400, padding: 20, backdropFilter: "blur(4px)",
    }}>
      <div style={{
        background: "#fff", borderRadius: 24, padding: "32px 28px",
        maxWidth: 340, width: "100%",
        boxShadow: "0 20px 60px #00000022, 0 0 0 3px #15803D22",
        textAlign: "center", animation: "popUp .3s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🔗</div>
        <h2 style={{ color: "#15803D", fontSize: 20, fontWeight: 900, marginBottom: 6 }}>
          Waiting for opponent
        </h2>
        <p style={{ color: "#6B7280", fontSize: 13, marginBottom: 20 }}>
          Share the code or link to start playing!
        </p>
        <div style={{
          background: "#F0FDF4", borderRadius: 14, padding: "16px",
          marginBottom: 16, border: "2px solid #BBF7D0",
        }}>
          <div style={{ color: "#6B7280", fontSize: 10, letterSpacing: 2, fontWeight: 700, marginBottom: 6 }}>ROOM CODE</div>
          <div style={{ color: "#15803D", fontSize: 34, fontWeight: 900, letterSpacing: 8, fontFamily: "monospace" }}>
            {code}
          </div>
        </div>
        <button onClick={copy} style={{
          width: "100%", padding: "13px",
          background: copied ? "#15803D" : "#F0FDF4",
          border: `2px solid ${copied ? "#15803D" : "#BBF7D0"}`,
          borderRadius: 50, color: copied ? "#fff" : "#15803D",
          fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 10,
          transition: "all .2s",
        }}>
          {copied ? "Copied!" : "Copy Invite Link"}
        </button>
        <button onClick={onClose} style={{
          background: "none", border: "none", color: "#9CA3AF",
          fontSize: 13, cursor: "pointer",
        }}>
          Close
        </button>
      </div>
    </div>
  );
}

// ── CSS ───────────────────────────────────────────────────
const HUD_H = 164;

const CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html,body{overflow:hidden;height:100%;font-family:"Segoe UI",system-ui,sans-serif;background:#F0FDF4;}
  button:hover:not(:disabled){filter:brightness(1.06);transform:translateY(-1px);}
  button:active:not(:disabled){transform:scale(0.96);}
  input{font-family:inherit;}
  @keyframes dieSpin{
    0%  {transform:rotate(-18deg) scale(1.18) translateY(-3px);}
    33% {transform:rotate(14deg)  scale(1.22) translateY(2px);}
    66% {transform:rotate(-11deg) scale(1.15) translateY(-1px);}
    100%{transform:rotate(15deg)  scale(1.20) translateY(2px);}
  }
  @keyframes dieLand{
    0%  {transform:scale(1.35) translateY(-6px);opacity:.8;}
    55% {transform:scale(0.94) translateY(0);   opacity:1;}
    78% {transform:scale(1.06) translateY(0);}
    100%{transform:scale(1)    translateY(0);}
  }
  @keyframes rollPulse{
    0%,100%{box-shadow:0 0 0 0 rgba(21,128,61,.4);}
    60%    {box-shadow:0 0 0 10px rgba(21,128,61,0);}
  }
  @keyframes slideDown{
    from{opacity:0;transform:translateX(-50%) translateY(-10px);}
    to  {opacity:1;transform:translateX(-50%) translateY(0);}
  }
  @keyframes popUp{
    from{opacity:0;transform:scale(0.82) translateY(14px);}
    to  {opacity:1;transform:scale(1)    translateY(0);}
  }
  @keyframes cardReveal{
    0%  {opacity:0;transform:scale(0.72) translateY(24px) rotate(-3deg);}
    60% {transform:scale(1.04) translateY(-4px) rotate(1deg);}
    100%{opacity:1;transform:scale(1)    translateY(0)     rotate(0);}
  }
  @keyframes fadeIn{
    from{opacity:0;transform:translateY(8px);}
    to  {opacity:1;transform:translateY(0);}
  }
`;

const GRADIENT = "linear-gradient(135deg, #1e3a8a 0%, #7c3aed 50%, #be185d 100%)";
const BG = {
  width:"100vw", minHeight:"100vh", background:GRADIENT,
  display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
  gap:20, padding:24, fontFamily:"'Segoe UI',system-ui,sans-serif",
};

// ── GAME COMPONENT ────────────────────────────────────────
export default function Game({ session }) {
  const { id: roomId } = useParams();
  const navigate = useNavigate();

  const [room,      setRoom]      = useState(null);
  const [gs,        setGs]        = useState(null);
  const [myIdx,     setMyIdx]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [showShare, setShowShare] = useState(false);

  const [d1, setD1] = useState(1);
  const [d2, setD2] = useState(2);
  const [landed1, setLanded1] = useState(false);
  const [landed2, setLanded2] = useState(false);
  const [rolling,   setRolling]   = useState(false);
  const [rolled,    setRolled]    = useState(false);
  const [buyInfo,   setBuyInfo]   = useState(null);
  const [cardModal, setCardModal] = useState(null); // { msg, color, type }
  const [log,       setLog]       = useState([]);
  const [toast,     setToast]     = useState(null);

  const toastTimer    = useRef(null);
  const pendingAction = useRef(null); // called when card modal closes
  const uid = session.user.id;

  function addLog(m) { setLog(l => [...l.slice(-20), m]); }
  function showToast(m, col = "#15803D") {
    setToast({ m, col });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }

  function dismissCard() {
    setCardModal(null);
    if (pendingAction.current) { pendingAction.current(); pendingAction.current = null; }
  }

  // ── LOAD ROOM ───────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("game_rooms").select("*").eq("id", roomId).single();
      if (error || !data) { navigate("/lobby"); return; }
      setRoom(data);
      let idx = null;
      if (data.host_id === uid) idx = 0;
      else if (data.guest_id === uid) idx = 1;
      setMyIdx(idx);
      if (data.game_state) setGs(data.game_state);
      if (data.status === "waiting" && data.host_id === uid) setShowShare(true);
      setLoading(false);
    }
    load();
  }, [roomId]);

  // ── REALTIME ─────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;
    const channel = supabase
      .channel(`room-${roomId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public",
        table: "game_rooms", filter: `id=eq.${roomId}`,
      }, payload => {
        const r = payload.new;
        setRoom(r);
        if (r.game_state) {
          setGs(r.game_state);
          setRolled(false);
          setBuyInfo(null);
          setD1(1); setD2(2);
          setLanded1(false); setLanded2(false);
        }
        if (r.status === "active") {
          setShowShare(false);
          showToast("Opponent joined! Game on!", "#2563EB");
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  async function saveState(nGs, status) {
    const upd = { game_state: nGs, updated_at: new Date().toISOString() };
    if (status) upd.status = status;
    await supabase.from("game_rooms").update(upd).eq("id", roomId);
  }

  async function saveAndAdvance(nGs) {
    let next = (nGs.curP + 1) % 2;
    while (nGs.players[next]?.bust) next = (next + 1) % 2;
    const adv = { ...nGs, curP: next, turn: nGs.turn + (next <= nGs.curP ? 1 : 0) };
    setGs(adv);
    setRolled(false);
    setBuyInfo(null);
    setD1(1); setD2(2);
    setLanded1(false); setLanded2(false);
    await saveState(adv);
    showToast("Turn saved!", "#15803D");
  }

  // ── ROLL ─────────────────────────────────────────────────
  function roll() {
    if (rolling || rolled || buyInfo || cardModal || !gs) return;
    const pid = gs.curP;
    if (pid !== myIdx) return;
    if (gs.players[pid].bust) return;

    const r1 = Math.ceil(Math.random() * 6), r2 = Math.ceil(Math.random() * 6);
    setRolling(true);

    // 8 rapid frames — total spin ~580ms, feels snappy
    const frames = [40, 40, 50, 60, 70, 85, 110, 140];
    let fi = 0;
    function spin() {
      if (fi < frames.length - 1) {
        setD1(Math.ceil(Math.random() * 6));
        setD2(Math.ceil(Math.random() * 6));
        fi++;
        setTimeout(spin, frames[fi]);
      } else {
        // Snap to result with landing pop animation
        setD1(r1); setD2(r2);
        setLanded1(true); setLanded2(true);
        setTimeout(() => { setLanded1(false); setLanded2(false); }, 380);
        setRolling(false); setRolled(true);
        addLog(`Rolled ${r1}+${r2}=${r1 + r2}`);
        showToast(`${r1} + ${r2} = ${r1 + r2}`, "#D97706");

        // 250ms pause so player sees the dice result, then start moving
        setTimeout(() => {
          let nGs = JSON.parse(JSON.stringify(gs));
          let p = nGs.players[pid];

          if (p.jail) {
            if (r1 === r2) {
              p.jail = false; p.jailTurns = 0;
              addLog("Rolled doubles — escaped jail!");
            } else {
              p.jailTurns = (p.jailTurns || 0) + 1;
              if (p.jailTurns >= 3) {
                p.cash -= 50; p.jail = false; p.jailTurns = 0;
                addLog("Paid $50M bail");
              } else {
                addLog(`In jail (${p.jailTurns}/3 — roll doubles)`);
                nGs.players[pid] = p;
                setGs(nGs);
                saveAndAdvance(nGs);
                return;
              }
            }
          }

          const steps = r1 + r2, oldPos = p.pos; let step = 0;
          function move() {
            if (step < steps) {
              step++;
              const traveled = oldPos + step;
              const np = traveled % 40;
              if (traveled === 40) {
                p.cash += 200;
                addLog("Passed START! +$200M");
                showToast("Passed START! +$200M", "#16A34A");
              }
              p.pos = np;
              nGs.players[pid] = p;
              setGs({ ...nGs, players: [...nGs.players] });
              setTimeout(move, 85); // 85ms per step — smooth but fast
            } else {
              setTimeout(() => land(pid, p, nGs), 280); // brief pause before landing logic
            }
          }
          move();
        }, 250);
      }
    }
    spin();
  }

  function land(pid, p, nGs) {
    const sq = SQ[p.pos];

    if (sq.t === "gotojail") {
      p.pos = 10; p.jail = true; p.jailTurns = 0;
      addLog("SANCTIONED! Go to Jail!");
    } else if (sq.t === "tax") {
      p.cash -= sq.amt;
      addLog(`Tax -$${sq.amt}M`);
      showToast(`Tax -$${sq.amt}M`, "#DC2626");
    } else if (sq.t === "chance") {
      const c = CHANCE[Math.floor(Math.random() * CHANCE.length)];
      p = c.f(p);
      addLog(c.m);
      if (p.cash < 0) { p.bust = true; p.cash = 0; addLog(`${p.name} BANKRUPT!`); }
      nGs.players[pid] = p;
      const aliveC = nGs.players.filter(x => !x.bust);
      setGs({ ...nGs });
      // Show prominent card modal — no refresh needed, turn auto-advances after 2.5s
      setCardModal({ msg: c.m, color: "#7C3AED", type: "CHANCE CARD" });
      pendingAction.current = () => {
        if (aliveC.length === 1) saveState(nGs, "finished");
        else saveAndAdvance(nGs);
      };
      setTimeout(dismissCard, 2500);
      return;
    } else if (sq.t === "chest") {
      const c = CHEST[Math.floor(Math.random() * CHEST.length)];
      p = c.f(p);
      addLog(c.m);
      if (p.cash < 0) { p.bust = true; p.cash = 0; addLog(`${p.name} BANKRUPT!`); }
      nGs.players[pid] = p;
      const aliveCh = nGs.players.filter(x => !x.bust);
      setGs({ ...nGs });
      setCardModal({ msg: c.m, color: "#0369A1", type: "WORLD FUND" });
      pendingAction.current = () => {
        if (aliveCh.length === 1) saveState(nGs, "finished");
        else saveAndAdvance(nGs);
      };
      setTimeout(dismissCard, 2500);
      return;
    } else if (sq.t === "go") {
      addLog("Landed on START!");
    } else if (sq.t === "park") {
      addLog("Free Zone!"); showToast("Free Zone — no charge!", "#0F766E");
    } else if (sq.t === "jail") {
      addLog("Just visiting");
    } else if (sq.t === "prop" || sq.t === "rr" || sq.t === "util") {
      const oid = nGs.owners[p.pos];
      if (oid === undefined) {
        if (!p.bust) { nGs.players[pid] = p; setGs({ ...nGs }); setBuyInfo({ idx: p.pos }); return; }
      } else if (oid !== pid) {
        const rent = sq.r || 10;
        p.cash -= rent; nGs.players[oid].cash += rent;
        addLog(`Paid $${rent}M rent to ${nGs.players[oid].name}`);
        showToast(`-$${rent}M rent!`, "#DC2626");
      } else {
        addLog(`You own ${sq.n}`);
      }
    }

    if (p.cash < 0) { p.bust = true; p.cash = 0; addLog(`${p.name} BANKRUPT!`); }
    nGs.players[pid] = p;
    const alive = nGs.players.filter(x => !x.bust);
    if (alive.length === 1) {
      setGs(nGs);
      saveState(nGs, "finished");
      return;
    }
    setGs({ ...nGs });
    saveAndAdvance(nGs);
  }

  function handleBuy(yes) {
    if (!buyInfo || !gs) return;
    const { idx } = buyInfo; const sq = SQ[idx]; const pid = gs.curP;
    let nGs = JSON.parse(JSON.stringify(gs));
    const p = nGs.players[pid];
    if (yes && p.cash >= sq.p) {
      p.cash -= sq.p; p.props.push(idx); nGs.owners[idx] = pid;
      addLog(`Acquired ${sq.n} for $${sq.p}M!`);
      showToast(`Acquired ${sq.n}!`, "#15803D");
    } else {
      addLog(`Passed on ${sq.n}`);
    }
    nGs.players[pid] = p;
    setBuyInfo(null); setGs(nGs);
    saveAndAdvance(nGs);
  }

  // ── LOADING ──────────────────────────────────────────────
  if (loading) return (
    <>
      <style>{CSS}</style>
      <div style={BG}>
        <div style={{ fontSize: 56, animation: "fadeIn .5s ease-out" }}>🌍</div>
        <div style={{ color: "#fff", fontSize: 18, fontWeight: 700, animation: "fadeIn .7s ease-out" }}>
          Loading game...
        </div>
      </div>
    </>
  );

  // ── GAME OVER ────────────────────────────────────────────
  if (room?.status === "finished" && gs) {
    const w = gs.players.find(p => !p.bust) || gs.players[0];
    const iWon = w.id === myIdx;
    return (
      <>
        <style>{CSS}</style>
        <div style={BG}>
          <div style={{
            background: "#fff", borderRadius: 28, padding: "40px 32px",
            maxWidth: 380, width: "100%", textAlign: "center",
            boxShadow: "0 24px 80px #00000033", animation: "fadeIn .5s ease-out",
          }}>
            <div style={{ fontSize: 72, marginBottom: 8 }}>🏆</div>
            <h1 style={{ color: iWon ? "#15803D" : "#DC2626", fontSize: 28, fontWeight: 900, marginBottom: 4 }}>
              {iWon ? "You Won!" : "Game Over"}
            </h1>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: `${w.color}15`, border: `2px solid ${w.color}44`,
              borderRadius: 50, padding: "8px 20px", margin: "12px 0",
            }}>
              <span style={{ fontSize: 22 }}>{w.icon}</span>
              <span style={{ color: w.color, fontSize: 18, fontWeight: 800 }}>{w.name}</span>
              <span style={{ color: "#6B7280", fontSize: 14 }}>${w.cash}M</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", margin: "12px 0 20px" }}>
              {w.props.map(idx => (
                <span key={idx} style={{
                  background: SQ[idx].c || "#374151", color: "#fff",
                  fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 700,
                }}>
                  {FL[SQ[idx].n] || ""} {SQ[idx].n}
                </span>
              ))}
            </div>
            <button onClick={() => navigate("/lobby")} style={{
              width: "100%", padding: "16px", background: "#15803D", color: "#fff",
              border: "none", borderRadius: 50, fontSize: 16, fontWeight: 900,
              cursor: "pointer", boxShadow: "0 4px 20px #15803D44",
            }}>
              Back to Lobby
            </button>
          </div>
        </div>
      </>
    );
  }

  const cp = gs?.players[gs?.curP];
  const isMyTurn = gs?.curP === myIdx;
  const canRoll = !rolling && !rolled && !buyInfo && !cardModal && !!gs && !cp?.bust && isMyTurn && room?.status === "active";
  const opponentName = myIdx === 0 ? (room?.guest_name || "Opponent") : room?.host_name;

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        width: "100vw", height: "100vh",
        display: "flex", flexDirection: "column",
        background: "#F0FDF4", overflow: "hidden",
      }}>

        {/* Toast — sits above everything, doesn't overlap board */}
        {toast && (
          <div style={{
            position: "fixed", bottom: HUD_H + 10, left: "50%", transform: "translateX(-50%)",
            background: "#FFFFFF", border: `2px solid ${toast.col}`,
            borderRadius: 30, padding: "7px 18px", color: toast.col,
            fontSize: 13, fontWeight: 700, zIndex: 500, pointerEvents: "none",
            whiteSpace: "nowrap", animation: "slideDown .25s ease-out",
            maxWidth: "85vw", overflow: "hidden", textOverflow: "ellipsis",
            boxShadow: `0 4px 20px ${toast.col}33`,
          }}>{toast.m}</div>
        )}

        {/* Board — full space above HUD, no overlap from badges */}
        <div style={{
          width: "100vw",
          height: `min(100vw, calc(100vh - ${HUD_H}px))`,
          flexShrink: 0, padding: "2px",
        }}>
          {gs && <Board players={gs.players} owners={gs.owners} />}
        </div>

        {/* ── HUD — two rows ───────────────────────────── */}
        <div style={{
          width: "100vw", height: `${HUD_H}px`, flexShrink: 0,
          background: "#FFFFFF", borderTop: "3px solid #15803D",
          display: "flex", flexDirection: "column",
        }}>

          {/* Row 1: Both players side-by-side — replaces floating top badges */}
          <div style={{
            display: "flex", height: 44, padding: "0 8px", gap: 6,
            alignItems: "center", borderBottom: "1px solid #F0F0F0",
          }}>
            {gs && gs.players.map((p, i) => {
              if (p.bust) return (
                <div key={i} style={{
                  flex: 1, display: "flex", alignItems: "center", gap: 5,
                  background: "#F9FAFB", borderRadius: 10, padding: "4px 8px",
                  border: "1.5px solid #E5E7EB", opacity: .5,
                }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: p.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", flexShrink: 0 }}>{p.icon}</div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#374151" }}>{p.name}</div>
                    <div style={{ fontSize: 10, fontWeight: 900, color: "#9CA3AF" }}>BUST</div>
                  </div>
                </div>
              );
              const active = gs.curP === i;
              return (
                <div key={i} style={{
                  flex: 1, display: "flex", alignItems: "center", gap: 6,
                  background: active ? `${p.color}12` : "#F9FAFB",
                  borderRadius: 10, padding: "4px 8px",
                  border: `1.5px solid ${active ? p.color + "55" : "#E5E7EB"}`,
                  transition: "all .2s",
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%", background: p.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, color: "#fff", flexShrink: 0,
                    boxShadow: active ? `0 2px 8px ${p.color}55` : "none",
                  }}>{p.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: "#374151",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{p.name}</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: p.color }}>${p.cash}M</div>
                  </div>
                  {active && (
                    <div style={{ fontSize: 8, fontWeight: 800, color: p.color, letterSpacing: .3, flexShrink: 0 }}>
                      {isMyTurn && i === myIdx ? "YOUR\nTURN" : "NOW"}
                    </div>
                  )}
                </div>
              );
            })}
            {/* Turn counter */}
            <div style={{ flexShrink: 0, textAlign: "center", padding: "2px 6px" }}>
              <div style={{ fontSize: 8, color: "#9CA3AF", fontWeight: 700, letterSpacing: 1 }}>TURN</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#374151" }}>{gs?.turn || 1}</div>
            </div>
          </div>

          {/* Row 2: Dice + controls */}
          <div style={{
            flex: 1, display: "flex", alignItems: "center",
            padding: "0 8px", gap: 8,
          }}>

            {/* Dice tap area */}
            <div
              onClick={canRoll ? roll : undefined}
              style={{
                flex: 1, height: "100%",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 6,
                background: canRoll ? "#F0FDF4" : "#FAFAFA",
                border: `2.5px solid ${canRoll ? "#15803D" : "#E5E7EB"}`,
                borderRadius: 16, cursor: canRoll ? "pointer" : "default",
                animation: canRoll ? "rollPulse 2s ease-in-out infinite" : undefined,
                transition: "all .18s",
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "center", pointerEvents: "none" }}>
                <Die val={d1} size={50} glow={canRoll} shake={rolling} landed={landed1} color={cp?.color} />
                <Die val={d2} size={50} glow={canRoll} shake={rolling} landed={landed2} color={cp?.color} />
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: canRoll ? (cp?.color || "#15803D") : "#F3F4F6",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: canRoll ? "#fff" : "#9CA3AF",
                  fontSize: 18, fontWeight: 900, flexShrink: 0,
                  boxShadow: canRoll ? `0 4px 14px ${cp?.color || "#15803D"}44` : "none",
                  transition: "all .18s",
                }}>{d1 + d2}</div>
              </div>
              <div style={{
                fontSize: 12, fontWeight: 800, pointerEvents: "none", letterSpacing: .4,
                color: canRoll ? "#15803D"
                  : room?.status === "waiting" ? "#9CA3AF"
                  : !isMyTurn ? "#6B7280"
                  : "#9CA3AF",
              }}>
                {room?.status === "waiting"
                  ? "Waiting for opponent..."
                  : canRoll ? "TAP TO ROLL"
                  : rolling ? "Rolling..."
                  : !isMyTurn ? `${opponentName}'s turn...`
                  : "Wait..."}
              </div>
            </div>

            {/* Log + action buttons */}
            <div style={{
              display: "flex", flexDirection: "column",
              alignItems: "flex-end", gap: 5, flexShrink: 0, maxWidth: 84,
            }}>
              {log.slice(-3).reverse().map((m, i) => (
                <div key={i} style={{
                  fontSize: 9, color: i === 0 ? "#374151" : "#9CA3AF",
                  opacity: i === 0 ? 1 : .5, textAlign: "right",
                  overflow: "hidden", textOverflow: "ellipsis",
                  whiteSpace: "nowrap", maxWidth: 84,
                  fontWeight: i === 0 ? 700 : 400,
                }}>{m}</div>
              ))}
              {room?.status === "waiting" && (
                <button onClick={() => setShowShare(true)} style={{
                  padding: "4px 8px", background: "#F0FDF4",
                  color: "#15803D", border: "1px solid #BBF7D0",
                  borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: "pointer",
                }}>Share</button>
              )}
              <button onClick={() => navigate("/lobby")} style={{
                padding: "5px 10px", background: "#FEF2F2",
                color: "#DC2626", border: "1px solid #FECACA",
                borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: "pointer",
              }}>Exit</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── BUY MODAL ──────────────────────────────────── */}
      {buyInfo && gs && (() => {
        const sq = SQ[buyInfo.idx]; const p = gs.players[gs.curP]; const ok = p && p.cash >= sq.p;
        return (
          <div style={{
            position: "fixed", inset: 0, background: "#00000055",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 300, backdropFilter: "blur(4px)",
          }}>
            <div style={{
              background: "#FFFFFF", borderRadius: 24, padding: "28px",
              maxWidth: 320, width: "92%",
              borderTop: `6px solid ${sq.c || "#15803D"}`,
              boxShadow: "0 24px 60px #00000022",
              textAlign: "center", animation: "popUp .3s cubic-bezier(0.34,1.56,0.64,1)",
            }}>
              <div style={{ fontSize: 52, marginBottom: 8 }}>{FL[sq.n] || "🌍"}</div>
              <div style={{
                display: "inline-block", padding: "3px 12px",
                background: `${sq.c || "#15803D"}20`, borderRadius: 20,
                color: sq.c || "#15803D", fontSize: 10, fontWeight: 700,
                letterSpacing: 2, marginBottom: 6,
              }}>
                {sq.t === "rr" ? "AIRLINE" : sq.t === "util" ? "UTILITY" : "COUNTRY"}
              </div>
              <h2 style={{ color: "#111827", fontSize: 22, fontWeight: 900, marginBottom: 16 }}>{sq.n}</h2>
              <div style={{
                background: "#F9FAFB", borderRadius: 14, padding: "14px 16px",
                marginBottom: 18, border: "1px solid #F3F4F6",
              }}>
                {[["Price", `$${sq.p}M`, sq.c || "#15803D"], ["Rent", `$${sq.r}M`, "#16A34A"],
                  ["Your Cash", `$${p?.cash}M`, ok ? "#16A34A" : "#DC2626"]].map(([l, v, c], j) => (
                  <div key={j} style={{
                    display: "flex", justifyContent: "space-between",
                    paddingBottom: j < 2 ? 10 : 0, marginBottom: j < 2 ? 10 : 0,
                    borderBottom: j < 2 ? "1px solid #F3F4F6" : undefined,
                  }}>
                    <span style={{ color: "#6B7280", fontSize: 13 }}>{l}</span>
                    <span style={{ color: c, fontSize: 15, fontWeight: 800 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => handleBuy(true)} style={{
                  flex: 1, padding: "14px",
                  background: ok ? (sq.c || "#15803D") : "#F3F4F6",
                  color: ok ? "#fff" : "#9CA3AF",
                  border: "none", borderRadius: 50, fontSize: 14, fontWeight: 900,
                  cursor: ok ? "pointer" : "not-allowed", opacity: ok ? 1 : .5,
                  boxShadow: ok ? `0 4px 16px ${sq.c || "#15803D"}44` : "none",
                }}>Acquire</button>
                <button onClick={() => handleBuy(false)} style={{
                  flex: 1, padding: "14px", background: "#FFFFFF", color: "#6B7280",
                  border: "2px solid #E5E7EB",
                  borderRadius: 50, fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}>Pass</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── CHANCE / WORLD FUND CARD MODAL ─────────────── */}
      {cardModal && (
        <div
          onClick={dismissCard}
          style={{
            position: "fixed", inset: 0, background: "#00000066",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 350, backdropFilter: "blur(8px)",
            cursor: "pointer",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#FFFFFF", borderRadius: 24, padding: "36px 28px",
              maxWidth: 320, width: "92%", textAlign: "center",
              borderTop: `6px solid ${cardModal.color}`,
              boxShadow: `0 28px 70px #00000033, 0 0 0 4px ${cardModal.color}22`,
              animation: "cardReveal .38s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            <div style={{
              display: "inline-block", padding: "4px 14px",
              background: `${cardModal.color}18`, borderRadius: 20,
              color: cardModal.color, fontSize: 11, fontWeight: 800,
              letterSpacing: 2, marginBottom: 18,
            }}>
              {cardModal.type}
            </div>
            <div style={{
              fontSize: 30, fontWeight: 900, color: "#111827",
              lineHeight: 1.3, marginBottom: 20,
            }}>
              {cardModal.msg}
            </div>
            <button
              onClick={dismissCard}
              style={{
                padding: "11px 32px",
                background: cardModal.color, color: "#fff",
                border: "none", borderRadius: 50,
                fontSize: 14, fontWeight: 800, cursor: "pointer",
                boxShadow: `0 4px 16px ${cardModal.color}44`,
              }}
            >
              OK
            </button>
            <div style={{ marginTop: 10, fontSize: 11, color: "#9CA3AF" }}>
              Auto-advances in 2.5s
            </div>
          </div>
        </div>
      )}

      {showShare && <ShareModal roomId={roomId} onClose={() => setShowShare(false)} />}
      <AdBanner />
    </>
  );
}
