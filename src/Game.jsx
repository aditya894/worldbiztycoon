import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import AdBanner from "./components/AdBanner";

// ── BOARD DATA ────────────────────────────────────────────
const SQ = [
  {n:"START",      t:"go"},
  {n:"Nigeria",    t:"prop",c:"#78350f",p:60, r:4},
  {n:"World Fund", t:"chest"},
  {n:"S. Africa",  t:"prop",c:"#78350f",p:60, r:4},
  {n:"Import Tax", t:"tax", amt:200},
  {n:"Africa Air", t:"rr",  p:200,r:25},
  {n:"India",      t:"prop",c:"#0369a1",p:100,r:8},
  {n:"Chance",     t:"chance"},
  {n:"China",      t:"prop",c:"#0369a1",p:100,r:8},
  {n:"Japan",      t:"prop",c:"#0369a1",p:120,r:10},
  {n:"Jail",       t:"jail"},
  {n:"Mexico",     t:"prop",c:"#065f46",p:140,r:12},
  {n:"Oil Fields", t:"util",p:150,r:10},
  {n:"Brazil",     t:"prop",c:"#065f46",p:140,r:12},
  {n:"Canada",     t:"prop",c:"#065f46",p:160,r:14},
  {n:"Americas Air",t:"rr", p:200,r:25},
  {n:"Turkey",     t:"prop",c:"#1e3a8a",p:180,r:16},
  {n:"World Fund", t:"chest"},
  {n:"Italy",      t:"prop",c:"#1e3a8a",p:180,r:16},
  {n:"France",     t:"prop",c:"#1e3a8a",p:200,r:18},
  {n:"Free Zone",  t:"park"},
  {n:"Germany",    t:"prop",c:"#6b21a8",p:220,r:20},
  {n:"Chance",     t:"chance"},
  {n:"UK",         t:"prop",c:"#6b21a8",p:220,r:20},
  {n:"Switzerland",t:"prop",c:"#6b21a8",p:240,r:22},
  {n:"Europe Air", t:"rr",  p:200,r:25},
  {n:"Saudi Arabia",t:"prop",c:"#92400e",p:260,r:24},
  {n:"UAE",        t:"prop",c:"#92400e",p:260,r:24},
  {n:"Tech Hub",   t:"util",p:150,r:10},
  {n:"Israel",     t:"prop",c:"#92400e",p:280,r:26},
  {n:"Go To Jail", t:"gotojail"},
  {n:"Australia",  t:"prop",c:"#115e59",p:300,r:28},
  {n:"Singapore",  t:"prop",c:"#115e59",p:300,r:28},
  {n:"World Fund", t:"chest"},
  {n:"S. Korea",   t:"prop",c:"#115e59",p:320,r:30},
  {n:"Pacific Air",t:"rr",  p:200,r:25},
  {n:"Chance",     t:"chance"},
  {n:"USA",        t:"prop",c:"#991b1b",p:350,r:35},
  {n:"Luxury Tax", t:"tax", amt:100},
  {n:"Beijing HQ", t:"prop",c:"#991b1b",p:400,r:50},
];

const FL = {
  "Nigeria":"🇳🇬","S. Africa":"🇿🇦","India":"🇮🇳","China":"🇨🇳","Japan":"🇯🇵",
  "Mexico":"🇲🇽","Brazil":"🇧🇷","Canada":"🇨🇦","Turkey":"🇹🇷","Italy":"🇮🇹",
  "France":"🇫🇷","Germany":"🇩🇪","UK":"🇬🇧","Switzerland":"🇨🇭","Saudi Arabia":"🇸🇦",
  "UAE":"🇦🇪","Israel":"🇮🇱","Australia":"🇦🇺","Singapore":"🇸🇬","S. Korea":"🇰🇷",
  "USA":"🇺🇸","Beijing HQ":"🏢",
};

const CHANCE = [
  {m:"✈️ Fly to START! +$200M",  f:p=>({...p,pos:0,cash:p.cash+200})},
  {m:"💰 Dividend +$50M!",        f:p=>({...p,cash:p.cash+50})},
  {m:"📈 Stock win +$100M!",      f:p=>({...p,cash:p.cash+100})},
  {m:"💸 Import duty -$20M",      f:p=>({...p,cash:p.cash-20})},
  {m:"👮 Sanctions! Go to Jail",  f:p=>({...p,pos:10,jail:true,jailTurns:0})},
  {m:"🤝 Trade deal +$75M!",      f:p=>({...p,cash:p.cash+75})},
];
const CHEST = [
  {m:"🏦 World Bank +$200M!",    f:p=>({...p,cash:p.cash+200})},
  {m:"🏗️ Fee -$50M",             f:p=>({...p,cash:p.cash-50})},
  {m:"💵 Tax refund +$20M",      f:p=>({...p,cash:p.cash+20})},
  {m:"💻 Tech IPO +$100M!",      f:p=>({...p,cash:p.cash+100})},
  {m:"🌍 Fine -$75M",            f:p=>({...p,cash:p.cash-75})},
];

const PC = ["#FFD700", "#FF3CAC"];
const PI = ["👑", "🚀"];
const SI = {go:"🌍",jail:"⚖️",park:"🛫",gotojail:"👮",tax:"💸",chance:"🎴",chest:"🏦",rr:"✈️",util:"⚡"};

function sqPos(i) {
  if (i <= 10) return [10, 10 - i];
  if (i <= 20) return [10 - (i - 10), 0];
  if (i <= 30) return [0, i - 20];
  return [i - 30, 10];
}

// ── DIE ──────────────────────────────────────────────────
function Die({ val, size = 64, glow, shake }) {
  const dots = {
    1:[[50,50]], 2:[[28,28],[72,72]], 3:[[28,28],[50,50],[72,72]],
    4:[[28,28],[72,28],[28,72],[72,72]], 5:[[28,28],[72,28],[50,50],[28,72],[72,72]],
    6:[[25,20],[75,20],[25,50],[75,50],[25,80],[75,80]],
  }[val] || [[50,50]];
  const r = size * 0.15;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{
      flexShrink: 0, display: "block",
      filter: glow ? "drop-shadow(0 0 12px #FFD700cc)" : "drop-shadow(0 3px 8px #00000066)",
      animation: shake ? "shake 0.1s ease-in-out infinite" : undefined,
    }}>
      <rect x="5" y="5" width="90" height="90" rx="18" fill="#1e1e3a"
        stroke={glow ? "#FFD700" : "#334155"} strokeWidth={glow ? "5" : "2"} />
      <rect x="5" y="5" width="90" height="38" rx="14" fill="#ffffff0a" />
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={glow ? "#FFD700" : "#4a5568"} />
      ))}
      {glow && (
        <rect x="5" y="5" width="90" height="90" rx="18" fill="none" stroke="#FFD700" strokeWidth="5" opacity="0.4">
          <animate attributeName="opacity" values="0.4;0;0.4" dur="0.9s" repeatCount="indefinite" />
          <animate attributeName="strokeWidth" values="5;12;5" dur="0.9s" repeatCount="indefinite" />
        </rect>
      )}
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
    const s = { position: "absolute", background: sq.c, opacity: .9 };
    if (row === 10)      bar = { ...s, bottom: 0, left: 0, right: 0, height: "27%" };
    else if (col === 0)  bar = { ...s, top: 0, left: 0, bottom: 0, width: "27%" };
    else if (col === 10) bar = { ...s, top: 0, right: 0, bottom: 0, width: "27%" };
    else                 bar = { ...s, top: 0, left: 0, right: 0, height: "27%" };
  }
  const mt = (bar && row !== 10 && col !== 0 && col !== 10) ? "27%" : 0;
  const ml = (bar && col === 0) ? "27%" : 0;
  const mr = (bar && col === 10) ? "27%" : 0;
  const mb = (bar && row === 10) ? "27%" : 0;

  return (
    <div style={{
      width: "100%", height: "100%", position: "relative", overflow: "hidden",
      background: corner ? "#12122a" : owner ? `${owner.color}18` : "#0c0c20",
      border: `1px solid ${owner ? owner.color + "55" : "#1e2040"}`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      transition: "box-shadow .2s",
    }}>
      {bar && <div style={bar} />}
      {corner ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "clamp(13px,1.6vw,22px)" }}>{SI[sq.t] || "🌍"}</div>
          <div style={{ fontSize: "clamp(3px,.45vw,6px)", color: "#FFD700", fontWeight: 700, marginTop: 2, letterSpacing: 1 }}>
            {sq.n.toUpperCase()}
          </div>
        </div>
      ) : (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: "1px",
          width: "100%", padding: "0 1px", marginTop: mt, marginLeft: ml, marginRight: mr, marginBottom: mb,
        }}>
          {FL[sq.n]
            ? <span style={{ fontSize: "clamp(7px,.9vw,12px)", lineHeight: 1 }}>{FL[sq.n]}</span>
            : SI[sq.t] ? <span style={{ fontSize: "clamp(6px,.8vw,10px)", lineHeight: 1 }}>{SI[sq.t]}</span>
            : null}
          <div style={{
            fontSize: "clamp(3px,.44vw,6px)", color: "#94a3b8", textAlign: "center",
            fontWeight: 600, lineHeight: 1.3, wordBreak: "break-word", maxWidth: "96%",
          }}>
            {sq.n.split(" ").pop()}
          </div>
          {sq.p && <div style={{ fontSize: "clamp(2.5px,.36vw,5px)", color: sq.c || "#00F5FF", fontWeight: 700 }}>
            ${sq.p}M
          </div>}
        </div>
      )}
      {owner && (
        <div style={{
          position: "absolute", top: 2, right: 2,
          width: "clamp(4px,.55vw,7px)", height: "clamp(4px,.55vw,7px)",
          borderRadius: "50%", background: owner.color, boxShadow: `0 0 5px ${owner.color}`,
        }} />
      )}
      {here.length > 0 && (
        <div style={{ position: "absolute", bottom: 1, left: 1, display: "flex", flexWrap: "wrap", gap: "1px" }}>
          {here.map(p => (
            <div key={p.id} style={{
              width: "clamp(9px,1.1vw,14px)", height: "clamp(9px,1.1vw,14px)",
              borderRadius: "50%", background: p.color,
              border: "1.5px solid #000", boxShadow: `0 0 8px ${p.color}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "clamp(5px,.65vw,9px)",
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
      display: "grid", gridTemplateColumns: "repeat(11,1fr)",
      gridTemplateRows: "repeat(11,1fr)", width: "100%", height: "100%",
      border: "2px solid #FFD70066", borderRadius: 8, overflow: "hidden", background: "#07071a",
    }}>
      {grid.flat().map((idx, fi) => {
        const r = Math.floor(fi / 11), c = fi % 11;
        if (idx === null) return (
          <div key={fi} style={{ background: "#07071a", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {r === 5 && c === 5 && (
              <div style={{ textAlign: "center", userSelect: "none" }}>
                <div style={{ fontSize: "clamp(8px,1.1vw,17px)", fontWeight: 900, color: "#FFD700", letterSpacing: 2 }}>WORLD</div>
                <div style={{ fontSize: "clamp(8px,1.1vw,17px)", fontWeight: 900, color: "#FF3CAC", letterSpacing: 2 }}>BIZ</div>
                <div style={{ fontSize: "clamp(4px,.55vw,7px)", color: "#00F5FF88", letterSpacing: 3 }}>TYCOON</div>
                <div style={{ fontSize: "clamp(18px,2.2vw,34px)", marginTop: 3 }}>🌍</div>
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
      position: "fixed", inset: 0, background: "#000000bb",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 400, padding: 20, backdropFilter: "blur(8px)",
    }}>
      <div style={{
        background: "#0d0020", border: "2px solid #00F5FF44",
        borderRadius: 22, padding: "28px 24px", maxWidth: 340, width: "100%",
        boxShadow: "0 8px 60px #00F5FF22", textAlign: "center",
      }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>🔗</div>
        <h2 style={{ color: "#00F5FF", fontSize: 18, fontWeight: 900, marginBottom: 6 }}>
          Waiting for opponent
        </h2>
        <p style={{ color: "#ffffff66", fontSize: 13, marginBottom: 20 }}>
          Share the link or code below. The game starts when they join.
        </p>
        <div style={{
          background: "#0a0015", borderRadius: 12, padding: "14px",
          marginBottom: 14, border: "1px solid #FFD70033",
        }}>
          <div style={{ color: "#ffffff55", fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>ROOM CODE</div>
          <div style={{ color: "#FFD700", fontSize: 30, fontWeight: 900, letterSpacing: 6, fontFamily: "monospace" }}>
            {code}
          </div>
        </div>
        <button onClick={copy} style={{
          width: "100%", padding: "13px",
          background: copied ? "#22c55e22" : "#00F5FF22",
          border: `2px solid ${copied ? "#22c55e" : "#00F5FF44"}`,
          borderRadius: 50, color: copied ? "#22c55e" : "#00F5FF",
          fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 10,
        }}>
          {copied ? "✅ Copied!" : "📋 Copy Invite Link"}
        </button>
        <button onClick={onClose} style={{
          background: "none", border: "none", color: "#ffffff44",
          fontSize: 13, cursor: "pointer",
        }}>
          Close (wait in background)
        </button>
      </div>
    </div>
  );
}

// ── GAME ──────────────────────────────────────────────────
const HUD_H = 160;

const CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html,body{overflow:hidden;height:100%;font-family:system-ui,-apple-system,sans-serif;background:#0a0015;}
  button:hover:not(:disabled){filter:brightness(1.12);}
  button:active:not(:disabled){transform:scale(0.95);}
  input{font-family:inherit;}
  @keyframes shake{
    0%{transform:rotate(-16deg) scale(1.12);}
    25%{transform:rotate(14deg) scale(1.18);}
    50%{transform:rotate(-12deg) scale(1.08);}
    75%{transform:rotate(11deg) scale(1.14);}
    100%{transform:rotate(-9deg) scale(1.1);}
  }
  @keyframes pulse{
    0%,100%{box-shadow:0 0 28px #FFD70066;}
    50%{box-shadow:0 0 50px #FFD700cc;}
  }
  @keyframes slideDown{
    from{opacity:0;transform:translateX(-50%) translateY(-14px);}
    to{opacity:1;transform:translateX(-50%) translateY(0);}
  }
  @keyframes popUp{
    from{opacity:0;transform:scale(0.7) translateY(20px);}
    to{opacity:1;transform:scale(1) translateY(0);}
  }
  @keyframes neonPulse{
    0%,100%{opacity:0.7;}
    50%{opacity:1;}
  }
`;

const BG = {
  width: "100vw", minHeight: "100vh",
  background: "linear-gradient(180deg, #0a0015 0%, #150025 100%)",
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  gap: 20, padding: 24, fontFamily: "system-ui,sans-serif",
};

export default function Game({ session }) {
  const { id: roomId } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [gs, setGs] = useState(null);
  const [myIdx, setMyIdx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);

  const [d1, setD1] = useState(1);
  const [d2, setD2] = useState(2);
  const [rolling, setRolling] = useState(false);
  const [rolled, setRolled] = useState(false);
  const [buyInfo, setBuyInfo] = useState(null);
  const [log, setLog] = useState([]);
  const [toast, setToast] = useState(null);

  const toastTimer = useRef(null);
  const uid = session.user.id;

  function addLog(m) { setLog(l => [...l.slice(-20), m]); }
  function showToast(m, col = "#FFD700") {
    setToast({ m, col });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
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

  // ── REALTIME SUBSCRIPTION ────────────────────────────────
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
        }
        if (r.status === "active") {
          setShowShare(false);
          showToast("🎮 Opponent joined! Game on!", "#00F5FF");
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  // ── SAVE TO SUPABASE ─────────────────────────────────────
  async function saveState(nGs, status) {
    const upd = { game_state: nGs, updated_at: new Date().toISOString() };
    if (status) upd.status = status;
    await supabase.from("game_rooms").update(upd).eq("id", roomId);
  }

  // ── ADVANCE TURN ─────────────────────────────────────────
  async function saveAndAdvance(nGs) {
    let next = (nGs.curP + 1) % 2;
    while (nGs.players[next]?.bust) next = (next + 1) % 2;
    const adv = { ...nGs, curP: next, turn: nGs.turn + (next <= nGs.curP ? 1 : 0) };
    setGs(adv);
    setRolled(false);
    setBuyInfo(null);
    setD1(1); setD2(2);
    await saveState(adv);
    showToast("✅ Turn saved!", "#00F5FF");
  }

  // ── ROLL ─────────────────────────────────────────────────
  function roll() {
    if (rolling || rolled || buyInfo || !gs) return;
    const pid = gs.curP;
    if (pid !== myIdx) return;
    if (gs.players[pid].bust) return;

    const r1 = Math.ceil(Math.random() * 6), r2 = Math.ceil(Math.random() * 6);
    setRolling(true);

    const frames = [60,60,60,70,70,80,80,90,100,110,130,140,160,180,200,240,280,320,360];
    let fi = 0;
    function spin() {
      if (fi < frames.length - 1) {
        setD1(Math.ceil(Math.random() * 6));
        setD2(Math.ceil(Math.random() * 6));
        fi++;
        setTimeout(spin, frames[fi]);
      } else {
        setD1(r1); setD2(r2);
        setRolling(false); setRolled(true);
        addLog(`🎲 Rolled ${r1}+${r2}=${r1 + r2}`);
        showToast(`🎲 ${r1} + ${r2} = ${r1 + r2}`, "#FFD700");

        setTimeout(() => {
          let nGs = JSON.parse(JSON.stringify(gs));
          let p = nGs.players[pid];

          // Jail logic
          if (p.jail) {
            if (r1 === r2) {
              p.jail = false; p.jailTurns = 0;
              addLog("🎉 Rolled doubles — escaped jail!");
            } else {
              p.jailTurns = (p.jailTurns || 0) + 1;
              if (p.jailTurns >= 3) {
                p.cash -= 50; p.jail = false; p.jailTurns = 0;
                addLog("⛓️ Paid $50M bail");
              } else {
                addLog(`🔒 In jail (${p.jailTurns}/3 — roll doubles)`);
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
                addLog("🌍 Passed START! +$200M");
                showToast("🌍 Passed START! +$200M", "#22c55e");
              }
              p.pos = np;
              nGs.players[pid] = p;
              setGs({ ...nGs, players: [...nGs.players] });
              setTimeout(move, 300);
            } else {
              setTimeout(() => land(pid, p, nGs), 1000);
            }
          }
          move();
        }, 800);
      }
    }
    spin();
  }

  function land(pid, p, nGs) {
    const sq = SQ[p.pos];
    if (sq.t === "gotojail") {
      p.pos = 10; p.jail = true; p.jailTurns = 0;
      addLog("👮 SANCTIONED! Go to Jail!");
    } else if (sq.t === "tax") {
      p.cash -= sq.amt; addLog(`💸 Tax -$${sq.amt}M`);
    } else if (sq.t === "chance") {
      const c = CHANCE[Math.floor(Math.random() * CHANCE.length)];
      p = c.f(p); addLog(`🎴 ${c.m}`); showToast(c.m, "#a78bfa");
    } else if (sq.t === "chest") {
      const c = CHEST[Math.floor(Math.random() * CHEST.length)];
      p = c.f(p); addLog(`🏦 ${c.m}`); showToast(c.m, "#67e8f9");
    } else if (sq.t === "go") {
      addLog("🌍 Landed on START!");
    } else if (sq.t === "park") {
      addLog("🛫 Free Zone!"); showToast("🛫 Free Zone — no charge!", "#34d399");
    } else if (sq.t === "jail") {
      addLog("⚖️ Just visiting");
    } else if (sq.t === "prop" || sq.t === "rr" || sq.t === "util") {
      const oid = nGs.owners[p.pos];
      if (oid === undefined) {
        if (!p.bust) { nGs.players[pid] = p; setGs({ ...nGs }); setBuyInfo({ idx: p.pos }); return; }
      } else if (oid !== pid) {
        const rent = sq.r || 10; p.cash -= rent; nGs.players[oid].cash += rent;
        addLog(`💰 Paid $${rent}M rent to ${nGs.players[oid].name}`);
        showToast(`💰 -$${rent}M rent!`, "#f43f5e");
      } else {
        addLog(`✅ You own ${sq.n}`);
      }
    }

    if (p.cash < 0) { p.bust = true; p.cash = 0; addLog(`💀 ${p.name} BANKRUPT!`); }
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
      addLog(`✅ Acquired ${sq.n} for $${sq.p}M!`);
      showToast(`🌍 Acquired ${sq.n}!`, "#22c55e");
    } else {
      addLog(`🚫 Passed on ${sq.n}`);
    }
    nGs.players[pid] = p;
    setBuyInfo(null); setGs(nGs);
    saveAndAdvance(nGs);
  }

  // ── LOADING ──────────────────────────────────────────────
  if (loading) return (
    <div style={{ ...BG }}>
      <style>{CSS}</style>
      <div style={{ fontSize: 48, filter: "drop-shadow(0 0 20px #FFD700)" }}>🌍</div>
      <div style={{ color: "#FFD700", fontSize: 16, fontWeight: 700 }}>Loading game...</div>
    </div>
  );

  // ── GAME OVER ────────────────────────────────────────────
  if (room?.status === "finished" && gs) {
    const w = gs.players.find(p => !p.bust) || gs.players[0];
    const iWon = w.id === myIdx;
    return (
      <>
        <style>{CSS}</style>
        <div style={BG}>
          <div style={{ fontSize: 64, filter: `drop-shadow(0 0 20px ${w.color})` }}>🏆</div>
          <h1 style={{ color: "#FFD700", fontSize: 28, fontWeight: 900 }}>
            {iWon ? "You Won! 🎉" : "Game Over"}
          </h1>
          <div style={{ color: w.color, fontSize: 22, fontWeight: 800 }}>{w.icon} {w.name}</div>
          <div style={{ color: "#FFD700", fontSize: 38, fontWeight: 900 }}>${w.cash}M</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, justifyContent: "center", maxWidth: 320 }}>
            {w.props.map(idx => (
              <span key={idx} style={{
                background: SQ[idx].c || "#334155", color: "white",
                fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 700,
              }}>
                {FL[SQ[idx].n] || ""} {SQ[idx].n}
              </span>
            ))}
          </div>
          <button onClick={() => navigate("/lobby")} style={{
            padding: "16px 32px", background: "#FFD700", color: "#000",
            border: "none", borderRadius: 50, fontSize: 16, fontWeight: 900,
            cursor: "pointer", boxShadow: "0 0 30px #FFD70066",
          }}>
            🌍 Back to Lobby
          </button>
        </div>
      </>
    );
  }

  const cp = gs?.players[gs?.curP];
  const isMyTurn = gs?.curP === myIdx;
  const canRoll = !rolling && !rolled && !buyInfo && !!gs && !cp?.bust && isMyTurn && room?.status === "active";
  const opponentName = myIdx === 0 ? (room?.guest_name || "Opponent") : room?.host_name;

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        width: "100vw", height: "100vh",
        display: "flex", flexDirection: "column",
        background: "#0a0015", overflow: "hidden",
        fontFamily: "system-ui,sans-serif",
      }}>

        {/* Toast */}
        {toast && (
          <div style={{
            position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)",
            background: "#0d0020", border: `2px solid ${toast.col}`,
            borderRadius: 30, padding: "8px 20px", color: toast.col,
            fontSize: 13, fontWeight: 700, zIndex: 500, pointerEvents: "none",
            whiteSpace: "nowrap", animation: "slideDown .3s ease-out",
            maxWidth: "85vw", overflow: "hidden", textOverflow: "ellipsis",
            boxShadow: `0 4px 20px ${toast.col}44`,
          }}>{toast.m}</div>
        )}

        {/* Player badges */}
        {gs && gs.players.map((p, i) => {
          if (p.bust) return null;
          const active = gs.curP === i;
          return (
            <div key={i} style={{
              position: "fixed", top: 8, [i === 0 ? "left" : "right"]: 8, zIndex: 30,
              background: active ? "#0d0020" : "#0d002088",
              border: `2px solid ${active ? p.color : p.color + "44"}`,
              borderRadius: 12, padding: "5px 10px",
              backdropFilter: "blur(10px)",
              boxShadow: active ? `0 0 14px ${p.color}66` : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", background: p.color, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, color: p.color === "#FFD700" ? "#000" : "#fff",
                  boxShadow: active ? `0 0 8px ${p.color}` : "none",
                }}>{p.icon}</div>
                <div>
                  <div style={{ color: "#ffffff88", fontSize: 10, fontWeight: 700 }}>{p.name}</div>
                  <div style={{ color: p.color, fontSize: 13, fontWeight: 900 }}>${p.cash}M</div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Board */}
        <div style={{
          width: "100vw",
          height: `min(100vw, calc(100vh - ${HUD_H}px))`,
          flexShrink: 0, marginTop: 0,
        }}>
          {gs && <Board players={gs.players} owners={gs.owners} />}
        </div>

        {/* HUD */}
        <div style={{
          width: "100vw", height: `${HUD_H}px`, flexShrink: 0,
          background: "#0d0020", borderTop: "2px solid #FFD70033",
          display: "flex", flexDirection: "row", alignItems: "center",
          padding: "0 10px", gap: 10,
        }}>

          {/* Current player card */}
          {cp && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: `${cp.color}18`,
              border: `2px solid ${cp.color}`,
              borderRadius: 12, padding: "8px 10px",
              flexShrink: 0, minWidth: 0,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: cp.color, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 17, color: cp.color === "#FFD700" ? "#000" : "#fff",
                boxShadow: `0 0 12px ${cp.color}88`,
              }}>{cp.icon}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: "#ffffff55", fontSize: 8, fontWeight: 700, letterSpacing: 1 }}>T{gs?.turn}</div>
                <div style={{
                  color: "#e2e8f0", fontSize: 11, fontWeight: 700,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 72,
                }}>{cp.name}</div>
                <div style={{ color: cp.color, fontSize: 14, fontWeight: 900 }}>${cp.cash}M</div>
              </div>
            </div>
          )}

          {/* DICE */}
          <div
            onClick={canRoll ? roll : undefined}
            style={{
              flex: 1, height: 140,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 8,
              background: canRoll ? "#FFD70011" : "#ffffff07",
              border: `3px solid ${canRoll ? "#FFD700" : "#ffffff11"}`,
              borderRadius: 18, cursor: canRoll ? "pointer" : "default",
              boxShadow: canRoll ? "0 0 20px #FFD70044" : undefined,
              transition: "all .2s",
              animation: canRoll ? "pulse 2s ease-in-out infinite" : undefined,
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center", pointerEvents: "none" }}>
              <Die val={d1} size={54} glow={canRoll} shake={rolling} />
              <Die val={d2} size={54} glow={canRoll} shake={rolling} />
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: canRoll ? "#FFD700" : "#ffffff11",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: canRoll ? "#000" : "#ffffff44",
                fontSize: 20, fontWeight: 900, flexShrink: 0,
              }}>{d1 + d2}</div>
            </div>
            <div style={{
              fontSize: 13, fontWeight: 900, pointerEvents: "none", letterSpacing: 1,
              color: canRoll ? "#FFD700" : "#ffffff33",
            }}>
              {room?.status === "waiting"
                ? "⏳ Waiting for opponent..."
                : canRoll ? "👆 TAP TO ROLL"
                : rolling ? "🌀 Rolling…"
                : !isMyTurn ? `⏳ ${opponentName}'s turn…`
                : "⏳ Wait…"}
            </div>
          </div>

          {/* Log + exit */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0, maxWidth: 80 }}>
            {log.slice(-2).reverse().map((m, i) => (
              <div key={i} style={{
                fontSize: 9, color: i === 0 ? "#e2e8f0" : "#ffffff44",
                opacity: i === 0 ? 1 : .5, textAlign: "right",
                overflow: "hidden", textOverflow: "ellipsis",
                whiteSpace: "nowrap", maxWidth: 80, fontWeight: i === 0 ? 700 : 400,
              }}>{m}</div>
            ))}
            {room?.status === "waiting" && (
              <button onClick={() => setShowShare(true)} style={{
                padding: "4px 8px", background: "#00F5FF22",
                color: "#00F5FF", border: "1px solid #00F5FF44",
                borderRadius: 8, fontSize: 9, fontWeight: 600,
                cursor: "pointer", marginTop: 2,
              }}>🔗</button>
            )}
            <button onClick={() => navigate("/lobby")} style={{
              padding: "5px 10px", background: "#ffffff0a",
              color: "#ffffff44", border: "1px solid #ffffff11",
              borderRadius: 8, fontSize: 10, fontWeight: 600,
              cursor: "pointer", marginTop: 2,
            }}>✕</button>
          </div>
        </div>
      </div>

      {/* Buy modal */}
      {buyInfo && gs && (() => {
        const sq = SQ[buyInfo.idx]; const p = gs.players[gs.curP]; const ok = p && p.cash >= sq.p;
        return (
          <div style={{
            position: "fixed", inset: 0, background: "#000000bb",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 300, backdropFilter: "blur(6px)",
          }}>
            <div style={{
              background: "#0d0020", borderRadius: 22, padding: "30px 34px",
              maxWidth: 320, width: "92%",
              border: `3px solid ${sq.c || "#FFD700"}`,
              boxShadow: `0 8px 60px ${sq.c || "#FFD700"}44`,
              textAlign: "center", animation: "popUp .3s cubic-bezier(0.34,1.56,0.64,1)",
            }}>
              <div style={{ fontSize: 50, marginBottom: 8 }}>{FL[sq.n] || "🌍"}</div>
              <div style={{ color: "#ffffff44", fontSize: 10, fontWeight: 700, letterSpacing: 3, marginBottom: 6 }}>
                {sq.t === "rr" ? "AIRLINE" : sq.t === "util" ? "UTILITY" : "COUNTRY FOR SALE"}
              </div>
              <h2 style={{ color: "#FFD700", fontSize: 20, fontWeight: 900, marginBottom: 14 }}>{sq.n}</h2>
              <div style={{
                background: "#0a0015", borderRadius: 12, padding: "12px 16px",
                marginBottom: 18, border: "1px solid #FFD70022",
              }}>
                {[["Price", `$${sq.p}M`, sq.c || "#FFD700"], ["Rent", `$${sq.r}M`, "#22d47a"],
                  ["Your Cash", `$${p?.cash}M`, ok ? "#22d47a" : "#f43f5e"]].map(([l, v, c], j) => (
                  <div key={j} style={{
                    display: "flex", justifyContent: "space-between",
                    paddingBottom: j < 2 ? 8 : 0, marginBottom: j < 2 ? 8 : 0,
                    borderBottom: j < 2 ? "1px solid #ffffff0d" : undefined,
                  }}>
                    <span style={{ color: "#94a3b8", fontSize: 12 }}>{l}</span>
                    <span style={{ color: c, fontSize: 14, fontWeight: 800 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => handleBuy(true)} style={{
                  flex: 1, padding: "13px",
                  background: ok ? "#FFD700" : "#ffffff11",
                  color: ok ? "#000" : "#ffffff33",
                  border: "none", borderRadius: 11, fontSize: 14, fontWeight: 900,
                  cursor: ok ? "pointer" : "not-allowed", opacity: ok ? 1 : .4,
                }}>🌍 Acquire</button>
                <button onClick={() => handleBuy(false)} style={{
                  flex: 1, padding: "13px",
                  background: "#ffffff0a", color: "#94a3b8",
                  border: "2px solid #ffffff11",
                  borderRadius: 11, fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}>Pass</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Share modal */}
      {showShare && <ShareModal roomId={roomId} onClose={() => setShowShare(false)} />}

      <AdBanner />
    </>
  );
}
