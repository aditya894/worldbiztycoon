import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabase";
import AdBanner from "../components/AdBanner";

const SQ_COUNT = 40;

function fresh(names) {
  return {
    players: [0, 1].map(i => ({
      id: i, name: names[i] || `Player ${i + 1}`,
      color: ["#FFD700", "#FF3CAC"][i],
      icon: ["👑", "🚀"][i],
      pos: 0, cash: 1500, props: [], jail: false, jailTurns: 0, bust: false,
    })),
    owners: {}, curP: 0, turn: 1,
  };
}

const BG = {
  width: "100vw", minHeight: "100vh",
  background: "linear-gradient(160deg, #0a0015 0%, #150025 60%, #001530 100%)",
  display: "flex", flexDirection: "column", alignItems: "center",
  padding: "24px 16px 80px", gap: 20,
  fontFamily: "system-ui,sans-serif",
};

export default function LobbyPage({ session, joinMode }) {
  const navigate = useNavigate();
  const { roomId: joinRoomId } = useParams();

  const [loading, setLoading] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [myGames, setMyGames] = useState([]);
  const [showShareModal, setShowShareModal] = useState(null); // room object

  const myName = session.user.user_metadata?.display_name ||
    session.user.email.split("@")[0];
  const uid = session.user.id;

  // Auto-join when navigated to /join/:roomId
  useEffect(() => {
    if (joinMode && joinRoomId) {
      handleJoinById(joinRoomId);
    }
  }, [joinMode, joinRoomId]);

  useEffect(() => {
    loadMyGames();
  }, []);

  async function loadMyGames() {
    const { data } = await supabase
      .from("game_rooms")
      .select("*")
      .or(`host_id.eq.${uid},guest_id.eq.${uid}`)
      .in("status", ["waiting", "active"])
      .order("updated_at", { ascending: false })
      .limit(5);
    setMyGames(data || []);
  }

  async function createGame() {
    setLoading(true); setError("");
    const gs = fresh([myName, "Opponent"]);
    const { data: room, error: err } = await supabase
      .from("game_rooms")
      .insert({
        host_id: uid,
        host_name: myName,
        game_state: gs,
        status: "waiting",
      })
      .select()
      .single();

    if (err) { setError(err.message); setLoading(false); return; }
    setShowShareModal(room);
    setLoading(false);
  }

  async function handleJoinById(roomId) {
    setLoading(true); setError("");
    const { data: room, error: fetchErr } = await supabase
      .from("game_rooms")
      .select("*")
      .eq("id", roomId)
      .single();

    if (fetchErr || !room) { setError("Room not found."); setLoading(false); return; }
    if (room.host_id === uid) { navigate(`/game/${room.id}`); return; }
    if (room.guest_id && room.guest_id !== uid) { setError("Room is full."); setLoading(false); return; }
    if (room.status === "finished") { setError("This game has ended."); setLoading(false); return; }

    // Update guest name in game_state
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

    // Find room whose ID starts with this code (case-insensitive prefix)
    const { data: rooms, error: fetchErr } = await supabase
      .from("game_rooms")
      .select("*")
      .ilike("id", `${code.toLowerCase()}%`)
      .limit(1);

    if (fetchErr || !rooms?.length) { setError("Room not found. Check the code and try again."); setLoading(false); return; }
    handleJoinById(rooms[0].id);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  const shareLink = showShareModal ? `${window.location.origin}/join/${showShareModal.id}` : "";
  const roomCode = showShareModal ? showShareModal.id.slice(0, 6).toUpperCase() : "";

  if (joinMode && loading) {
    return (
      <div style={{ ...BG, justifyContent: "center" }}>
        <div style={{ color: "#FFD700", fontSize: 40 }}>🌍</div>
        <div style={{ color: "#fff", fontSize: 16 }}>Joining game...</div>
      </div>
    );
  }

  return (
    <div style={BG}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        button:hover:not(:disabled){filter:brightness(1.12);}
        button:active:not(:disabled){transform:scale(0.97);}
        input:focus{border-color:#FFD700 !important; outline:none;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
        @keyframes pulse{0%,100%{box-shadow:0 0 28px #FFD70066;}50%{box-shadow:0 0 50px #FFD700cc;}}
      `}</style>

      {/* Header */}
      <div style={{ width: "100%", maxWidth: 420, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ color: "#FFD700", fontSize: 22, fontWeight: 900 }}>🌍 World Biz Tycoon</div>
          <div style={{ color: "#ffffff66", fontSize: 12, marginTop: 2 }}>Hey, {myName}!</div>
        </div>
        <button onClick={handleLogout} style={{
          background: "none", border: "1px solid #ffffff22", borderRadius: 8,
          color: "#ffffff55", fontSize: 12, padding: "6px 12px", cursor: "pointer",
        }}>Sign out</button>
      </div>

      {error && (
        <div style={{ background: "#f8717133", border: "1px solid #f87171", borderRadius: 10, padding: "10px 16px", color: "#f87171", fontSize: 13, width: "100%", maxWidth: 420 }}>
          {error}
        </div>
      )}

      {/* Create game */}
      <div style={{ width: "100%", maxWidth: 420, animation: "fadeIn .4s ease-out" }}>
        <button onClick={createGame} disabled={loading} style={{
          width: "100%", padding: "18px",
          background: "#FFD700", color: "#000",
          border: "none", borderRadius: 50,
          fontSize: 17, fontWeight: 900, cursor: loading ? "default" : "pointer",
          boxShadow: "0 0 30px #FFD70066, 0 4px 20px #00000066",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          animation: "pulse 2s ease-in-out infinite",
        }}>
          <span>🌍</span> {loading ? "Creating..." : "Create New Game"}
        </button>
      </div>

      {/* Join by code */}
      <div style={{
        width: "100%", maxWidth: 420,
        background: "#0d0020", border: "1px solid #FFD70022",
        borderRadius: 16, padding: "18px 20px",
        animation: "fadeIn .5s ease-out",
      }}>
        <div style={{ color: "#ffffff88", fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>
          JOIN BY CODE
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            type="text"
            placeholder="Enter 6-char code..."
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            style={{
              flex: 1, padding: "12px 14px",
              background: "#0a0015", border: "2px solid #FFD70033",
              borderRadius: 10, color: "#e2e8f0", fontSize: 16,
              fontFamily: "monospace", letterSpacing: 3, fontWeight: 700,
            }}
          />
          <button onClick={handleJoinByCode} disabled={loading || joinCode.length < 6} style={{
            padding: "12px 18px", background: "#00F5FF22",
            border: "2px solid #00F5FF44", borderRadius: 10,
            color: "#00F5FF", fontSize: 14, fontWeight: 700,
            cursor: joinCode.length < 6 ? "default" : "pointer",
            opacity: joinCode.length < 6 ? 0.4 : 1,
          }}>Join</button>
        </div>
      </div>

      {/* Active games */}
      {myGames.length > 0 && (
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ color: "#ffffff55", fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>
            YOUR ACTIVE GAMES
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {myGames.map(room => {
              const isHost = room.host_id === uid;
              const opponent = isHost ? (room.guest_name || "Waiting...") : room.host_name;
              const code = room.id.slice(0, 6).toUpperCase();
              return (
                <div key={room.id}
                  onClick={() => room.status === "waiting" && isHost
                    ? setShowShareModal(room)
                    : navigate(`/game/${room.id}`)
                  }
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: "#0d0020", border: "1px solid #FFD70022",
                    borderRadius: 12, padding: "12px 16px", cursor: "pointer",
                    transition: "border-color .2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#FFD70055"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#FFD70022"}
                >
                  <div>
                    <div style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>vs {opponent}</div>
                    <div style={{ color: "#ffffff44", fontSize: 11, marginTop: 2 }}>Code: {code}</div>
                  </div>
                  <div style={{
                    padding: "4px 10px", borderRadius: 20,
                    background: room.status === "waiting" ? "#FFD70022" : "#FF3CAC22",
                    color: room.status === "waiting" ? "#FFD700" : "#FF3CAC",
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {room.status === "waiting" ? "Waiting" : "Active"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Share modal */}
      {showShareModal && (
        <div style={{
          position: "fixed", inset: 0, background: "#000000cc",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 500, padding: 20, backdropFilter: "blur(8px)",
        }}>
          <div style={{
            background: "#0d0020", border: "2px solid #FFD70055",
            borderRadius: 22, padding: "30px 24px",
            maxWidth: 360, width: "100%",
            boxShadow: "0 8px 60px #FFD70033",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🔗</div>
            <h2 style={{ color: "#FFD700", fontSize: 20, fontWeight: 900, marginBottom: 6 }}>
              Share with your opponent!
            </h2>
            <p style={{ color: "#ffffff66", fontSize: 13, marginBottom: 20 }}>
              Send them the link or room code below.
            </p>

            <div style={{
              background: "#0a0015", borderRadius: 12, padding: "14px",
              marginBottom: 16, border: "1px solid #FFD70033",
            }}>
              <div style={{ color: "#ffffff55", fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>ROOM CODE</div>
              <div style={{ color: "#FFD700", fontSize: 32, fontWeight: 900, letterSpacing: 6, fontFamily: "monospace" }}>
                {roomCode}
              </div>
            </div>

            <button onClick={() => { navigator.clipboard.writeText(shareLink).catch(() => {}); }} style={{
              width: "100%", padding: "13px",
              background: "#00F5FF22", border: "2px solid #00F5FF44",
              borderRadius: 50, color: "#00F5FF", fontSize: 14, fontWeight: 700,
              cursor: "pointer", marginBottom: 10,
            }}>
              📋 Copy Invite Link
            </button>

            <button onClick={() => { setShowShareModal(null); navigate(`/game/${showShareModal.id}`); }} style={{
              width: "100%", padding: "13px",
              background: "#FFD700", border: "none",
              borderRadius: 50, color: "#000", fontSize: 14, fontWeight: 900,
              cursor: "pointer",
            }}>
              🌍 Go to Game Board
            </button>
          </div>
        </div>
      )}

      <AdBanner />
    </div>
  );
}
