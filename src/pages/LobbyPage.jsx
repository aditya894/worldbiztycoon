import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabase";
import AdBanner from "../components/AdBanner";

function fresh(names) {
  return {
    players: [0, 1].map(i => ({
      id: i, name: names[i] || `Player ${i + 1}`,
      color: ["#DC2626", "#2563EB"][i],
      icon: ["👑", "🚢"][i],
      pos: 0, cash: 1500, props: [], jail: false, jailTurns: 0, bust: false,
    })),
    owners: {}, curP: 0, turn: 1,
  };
}

const GRADIENT = "linear-gradient(135deg, #1e3a8a 0%, #7c3aed 50%, #be185d 100%)";

export default function LobbyPage({ session, joinMode }) {
  const navigate = useNavigate();
  const { roomId: joinRoomId } = useParams();

  const [loading, setLoading] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [myGames, setMyGames] = useState([]);
  const [showShareModal, setShowShareModal] = useState(null);

  const myName = session.user.user_metadata?.display_name ||
    session.user.email.split("@")[0];
  const uid = session.user.id;

  useEffect(() => {
    if (joinMode && joinRoomId) handleJoinById(joinRoomId);
  }, [joinMode, joinRoomId]);

  useEffect(() => {
    loadMyGames();
  }, []);

  async function loadMyGames() {
    const { data } = await supabase
      .from("game_rooms").select("*")
      .or(`host_id.eq.${uid},guest_id.eq.${uid}`)
      .in("status", ["waiting", "active"])
      .order("updated_at", { ascending: false }).limit(5);
    setMyGames(data || []);
  }

  async function createGame() {
    setLoading(true); setError("");
    const gs = fresh([myName, "Opponent"]);
    const { data: room, error: err } = await supabase
      .from("game_rooms")
      .insert({ host_id: uid, host_name: myName, game_state: gs, status: "waiting" })
      .select().single();
    if (err) { setError(err.message); setLoading(false); return; }
    setShowShareModal(room);
    await loadMyGames();
    setLoading(false);
  }

  async function handleJoinById(roomId) {
    setLoading(true); setError("");
    const { data: room, error: fetchErr } = await supabase
      .from("game_rooms").select("*").eq("id", roomId).single();
    if (fetchErr || !room) { setError("Room not found."); setLoading(false); return; }
    if (room.host_id === uid) { navigate(`/game/${room.id}`); return; }
    if (room.guest_id && room.guest_id !== uid) { setError("Room is full."); setLoading(false); return; }
    if (room.status === "finished") { setError("This game has ended."); setLoading(false); return; }

    const updatedGs = {
      ...room.game_state,
      players: [
        room.game_state.players[0],
        { ...room.game_state.players[1], name: myName },
      ],
    };
    const { error: updateErr } = await supabase
      .from("game_rooms")
      .update({ guest_id: uid, guest_name: myName, status: "active", game_state: updatedGs })
      .eq("id", room.id);
    if (updateErr) { setError(updateErr.message); setLoading(false); return; }
    navigate(`/game/${room.id}`);
  }

  async function handleJoinByCode() {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setLoading(true); setError("");
    const { data: rooms, error: fetchErr } = await supabase
      .rpc("find_room_by_code", { code_prefix: code.toLowerCase() });
    if (fetchErr || !rooms?.length) { setError("Room not found. Check the code and try again."); setLoading(false); return; }
    handleJoinById(rooms[0].id);
  }

  if (joinMode && loading) {
    return (
      <div style={{
        width: "100vw", height: "100vh", background: GRADIENT,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 16, fontFamily: "'Segoe UI',system-ui,sans-serif",
      }}>
        <div style={{ fontSize: 48 }}>🌍</div>
        <div style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>Joining game…</div>
      </div>
    );
  }

  const shareLink = showShareModal ? `${window.location.origin}/join/${showShareModal.id}` : "";
  const roomCode = showShareModal ? showShareModal.id.slice(0, 6).toUpperCase() : "";

  return (
    <div style={{
      width: "100vw", minHeight: "100vh",
      background: GRADIENT,
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "20px 16px 80px", fontFamily: "'Segoe UI',system-ui,sans-serif",
    }}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        button:hover:not(:disabled){filter:brightness(1.06);transform:translateY(-1px);}
        button:active:not(:disabled){transform:scale(0.97);}
        input:focus{border-color:#15803D !important; outline:none; box-shadow:0 0 0 3px #15803D22;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
        @keyframes pulse{0%,100%{box-shadow:0 4px 20px #15803D55;}50%{box-shadow:0 4px 40px #15803Daa;}}
      `}</style>

      {/* Header */}
      <div style={{
        width: "100%", maxWidth: 440, marginBottom: 20,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        animation: "fadeUp .4s ease-out",
      }}>
        <div>
          <div style={{ color: "#FFFFFF", fontSize: 24, fontWeight: 900, letterSpacing: .5 }}>
            🌍 World Biz Tycoon
          </div>
          <div style={{ color: "#ffffff88", fontSize: 13, marginTop: 3 }}>
            Welcome back, <span style={{ color: "#fff", fontWeight: 700 }}>{myName}</span>!
          </div>
        </div>
        <button onClick={() => supabase.auth.signOut()} style={{
          background: "#ffffff15", border: "1px solid #ffffff30",
          borderRadius: 10, color: "#ffffff88",
          fontSize: 12, padding: "7px 14px", cursor: "pointer", fontWeight: 600,
        }}>Sign out</button>
      </div>

      {error && (
        <div style={{
          width: "100%", maxWidth: 440, marginBottom: 14,
          background: "#FEF2F2", border: "1px solid #FECACA",
          borderRadius: 12, padding: "12px 16px", color: "#DC2626", fontSize: 13, fontWeight: 600,
          animation: "fadeUp .3s ease-out",
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* CREATE GAME — hero button */}
      <div style={{ width: "100%", maxWidth: 440, marginBottom: 16, animation: "fadeUp .45s ease-out" }}>
        <button onClick={createGame} disabled={loading} style={{
          width: "100%", padding: "20px",
          background: "#FFFFFF", color: "#15803D",
          border: "none", borderRadius: 20,
          fontSize: 18, fontWeight: 900, cursor: loading ? "default" : "pointer",
          boxShadow: "0 4px 20px #15803D55",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
          animation: "pulse 2.5s ease-in-out infinite",
          transition: "all .2s",
        }}>
          <span style={{ fontSize: 28 }}>🌍</span>
          {loading ? "Creating game…" : "Create New Game"}
          <span style={{ fontSize: 28 }}>→</span>
        </button>
      </div>

      {/* JOIN BY CODE */}
      <div style={{
        width: "100%", maxWidth: 440,
        background: "#ffffff15", backdropFilter: "blur(10px)",
        border: "1px solid #ffffff30",
        borderRadius: 20, padding: "20px",
        marginBottom: 16,
        animation: "fadeUp .5s ease-out",
      }}>
        <div style={{ color: "#ffffff", fontSize: 13, fontWeight: 700, letterSpacing: 1.5, marginBottom: 12 }}>
          🔑 JOIN BY ROOM CODE
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            type="text" placeholder="e.g. A3F2B1"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            style={{
              flex: 1, padding: "13px 16px",
              background: "#FFFFFF", border: "2px solid #E5E7EB",
              borderRadius: 12, color: "#111827", fontSize: 18,
              fontFamily: "monospace", letterSpacing: 4, fontWeight: 800,
            }}
          />
          <button onClick={handleJoinByCode} disabled={loading || joinCode.length < 6} style={{
            padding: "13px 20px",
            background: joinCode.length === 6 ? "#15803D" : "#ffffff30",
            border: "none", borderRadius: 12,
            color: "#fff", fontSize: 14, fontWeight: 700,
            cursor: joinCode.length < 6 ? "default" : "pointer",
            opacity: joinCode.length < 6 ? 0.5 : 1,
            transition: "all .2s",
            boxShadow: joinCode.length === 6 ? "0 4px 16px #15803D44" : "none",
          }}>Join →</button>
        </div>
      </div>

      {/* ACTIVE GAMES */}
      {myGames.length > 0 && (
        <div style={{ width: "100%", maxWidth: 440, animation: "fadeUp .55s ease-out" }}>
          <div style={{ color: "#ffffff88", fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>
            YOUR ACTIVE GAMES
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {myGames.map(room => {
              const isHost = room.host_id === uid;
              const opponent = isHost ? (room.guest_name || "Waiting for player…") : room.host_name;
              const code = room.id.slice(0, 6).toUpperCase();
              const isWaiting = room.status === "waiting";
              return (
                <div key={room.id}
                  onClick={() => isWaiting && isHost ? setShowShareModal(room) : navigate(`/game/${room.id}`)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: "#FFFFFF", borderRadius: 16, padding: "14px 18px",
                    cursor: "pointer", transition: "transform .15s, box-shadow .15s",
                    boxShadow: "0 4px 16px #00000022",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px #00000033"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 16px #00000022"; }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{isHost ? "👑" : "🚢"}</span>
                      <div style={{ color: "#111827", fontSize: 15, fontWeight: 700 }}>vs {opponent}</div>
                    </div>
                    <div style={{ color: "#9CA3AF", fontSize: 11, marginTop: 3, fontFamily: "monospace", letterSpacing: 2 }}>
                      CODE: {code}
                    </div>
                  </div>
                  <div style={{
                    padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                    background: isWaiting ? "#FEF9C3" : "#DCFCE7",
                    color: isWaiting ? "#A16207" : "#15803D",
                    border: `1px solid ${isWaiting ? "#FDE047" : "#86EFAC"}`,
                  }}>
                    {isWaiting ? "⏳ Waiting" : "🟢 Active"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* HOW TO PLAY */}
      <div style={{
        width: "100%", maxWidth: 440, marginTop: 20,
        background: "#ffffff0d", borderRadius: 16, padding: "16px 20px",
        animation: "fadeUp .6s ease-out",
      }}>
        <div style={{ color: "#ffffff88", fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>
          HOW TO PLAY
        </div>
        {[
          ["🌍", "Create a game and share the room code"],
          ["🔗", "Friend joins with the code or invite link"],
          ["🎲", "Take turns rolling — buy countries, collect rent"],
          ["🏆", "Bankrupt your opponent to win the world!"],
        ].map(([icon, text]) => (
          <div key={text} style={{ display: "flex", gap: 10, marginBottom: 8, color: "#ffffffcc", fontSize: 13 }}>
            <span>{icon}</span><span>{text}</span>
          </div>
        ))}
      </div>

      {/* Share modal */}
      {showShareModal && (
        <div style={{
          position: "fixed", inset: 0, background: "#00000066",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 500, padding: 20, backdropFilter: "blur(6px)",
        }}>
          <div style={{
            background: "#FFFFFF", borderRadius: 24, padding: "32px 28px",
            maxWidth: 360, width: "100%",
            boxShadow: "0 24px 80px #00000033",
            textAlign: "center", animation: "fadeUp .3s ease-out",
          }}>
            <div style={{ fontSize: 52, marginBottom: 8 }}>🎮</div>
            <h2 style={{ color: "#111827", fontSize: 22, fontWeight: 900, marginBottom: 6 }}>
              Game Created!
            </h2>
            <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 20 }}>
              Share the code or link below. Game starts when your opponent joins.
            </p>
            <div style={{
              background: "#F0FDF4", border: "2px solid #BBF7D0",
              borderRadius: 16, padding: "18px", marginBottom: 16,
            }}>
              <div style={{ color: "#6B7280", fontSize: 10, letterSpacing: 2, fontWeight: 700, marginBottom: 8 }}>ROOM CODE</div>
              <div style={{ color: "#15803D", fontSize: 38, fontWeight: 900, letterSpacing: 8, fontFamily: "monospace" }}>
                {roomCode}
              </div>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(shareLink).catch(() => {}); }} style={{
              width: "100%", padding: "14px",
              background: "#F0FDF4", border: "2px solid #BBF7D0",
              borderRadius: 50, color: "#15803D", fontSize: 14, fontWeight: 700,
              cursor: "pointer", marginBottom: 10, transition: "all .2s",
            }}>
              📋 Copy Invite Link
            </button>
            <button onClick={() => { setShowShareModal(null); navigate(`/game/${showShareModal.id}`); }} style={{
              width: "100%", padding: "14px",
              background: "#15803D", border: "none",
              borderRadius: 50, color: "#fff", fontSize: 14, fontWeight: 900,
              cursor: "pointer",
              boxShadow: "0 4px 20px #15803D44",
            }}>
              🌍 Go to Game Board →
            </button>
          </div>
        </div>
      )}

      <AdBanner />
    </div>
  );
}
