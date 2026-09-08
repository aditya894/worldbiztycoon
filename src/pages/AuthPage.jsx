import { useState } from "react";
import { supabase } from "../supabase";

const BG = {
  width: "100vw", minHeight: "100vh",
  background: "linear-gradient(160deg, #0a0015 0%, #150025 60%, #001530 100%)",
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  gap: 24, padding: 24, fontFamily: "system-ui,sans-serif",
};

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (mode === "signup") {
        if (!displayName.trim()) { setError("Enter a display name"); setLoading(false); return; }
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { display_name: displayName.trim() } },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%", padding: "13px 16px",
    background: "#0d0020", border: "2px solid #FFD70033",
    borderRadius: 12, color: "#e2e8f0", fontSize: 15,
    outline: "none", fontFamily: "inherit",
    transition: "border-color .2s",
  };

  return (
    <div style={BG}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        input:focus{border-color:#FFD700 !important;}
        button:hover:not(:disabled){filter:brightness(1.12);}
        button:active:not(:disabled){transform:scale(0.97);}
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
      `}</style>

      {/* Logo */}
      <div style={{ textAlign: "center", animation: "fadeIn .5s ease-out" }}>
        <div style={{ fontSize: 56, filter: "drop-shadow(0 0 24px #FFD700)" }}>🌍</div>
        <h1 style={{ color: "#FFD700", fontSize: 28, fontWeight: 900, letterSpacing: 1, marginTop: 8 }}>
          World Biz Tycoon
        </h1>
        <p style={{ color: "#ffffff55", fontSize: 13, marginTop: 6 }}>
          2-player global Monopoly
        </p>
      </div>

      {/* Form card */}
      <div style={{
        width: "100%", maxWidth: 360,
        background: "#0d0020", border: "1px solid #FFD70022",
        borderRadius: 20, padding: "28px 24px",
        animation: "fadeIn .6s ease-out",
      }}>
        <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 800, marginBottom: 20, textAlign: "center" }}>
          {mode === "login" ? "Welcome back" : "Create account"}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Display name (e.g. Alex)"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              style={inputStyle}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={inputStyle}
            required
            minLength={6}
          />

          {error && (
            <div style={{ color: "#f87171", fontSize: 13, textAlign: "center", padding: "6px 0" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "14px",
            background: loading ? "#FFD70066" : "#FFD700",
            color: "#000", border: "none", borderRadius: 50,
            fontSize: 15, fontWeight: 900, cursor: loading ? "default" : "pointer",
            boxShadow: "0 0 24px #FFD70055",
            marginTop: 4,
          }}>
            {loading ? "..." : mode === "login" ? "🌍 Sign In" : "🚀 Create Account"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button onClick={() => { setMode(m => m === "login" ? "signup" : "login"); setError(""); }}
            style={{ background: "none", border: "none", color: "#00F5FF", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
            {mode === "login" ? "No account? Sign up" : "Have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
