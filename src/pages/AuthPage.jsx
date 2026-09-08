import { useState } from "react";
import { supabase } from "../supabase";

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // "login" | "signup" | "reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setInfo(""); setLoading(true);
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });
        if (error) throw error;
        setInfo("✅ Reset link sent! Check your inbox.");
        setLoading(false); return;
      }
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

  const inp = {
    width: "100%", padding: "14px 16px",
    background: "#FFFFFF", border: "2px solid #E5E7EB",
    borderRadius: 14, color: "#111827", fontSize: 15,
    outline: "none", fontFamily: "inherit", transition: "border-color .2s",
  };

  const titles = { login: "Welcome back!", signup: "Create account", reset: "Reset password" };
  const btnText = { login: "🌍 Sign In", signup: "🚀 Create Account", reset: "📧 Send Reset Link" };

  return (
    <div style={{
      width: "100vw", minHeight: "100vh",
      background: "linear-gradient(135deg, #1e3a8a 0%, #7c3aed 50%, #be185d 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24, fontFamily: "'Segoe UI',system-ui,sans-serif",
    }}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        input:focus{border-color:#15803D !important; box-shadow: 0 0 0 3px #15803D22 !important;}
        button:hover:not(:disabled){filter:brightness(1.07);transform:translateY(-1px);}
        button:active:not(:disabled){transform:scale(0.97)translateY(0);}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
      `}</style>

      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 24, animation: "fadeUp .5s ease-out" }}>
        <div style={{ fontSize: 64, filter: "drop-shadow(0 4px 20px #00000044)", marginBottom: 8 }}>🌍</div>
        <h1 style={{ color: "#FFFFFF", fontSize: 32, fontWeight: 900, letterSpacing: 1 }}>
          World Biz Tycoon
        </h1>
        <p style={{ color: "#ffffff88", fontSize: 14, marginTop: 6 }}>
          2-player global Monopoly · Buy nations · Build your empire
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 380,
        background: "#FFFFFF", borderRadius: 24,
        padding: "32px 28px",
        boxShadow: "0 24px 80px #00000033",
        animation: "fadeUp .6s ease-out",
      }}>
        <h2 style={{ color: "#111827", fontSize: 20, fontWeight: 800, marginBottom: 22, textAlign: "center" }}>
          {titles[mode]}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "signup" && (
            <input type="text" placeholder="Your name (e.g. Alex)" value={displayName}
              onChange={e => setDisplayName(e.target.value)} style={inp} required />
          )}
          <input type="email" placeholder="Email address" value={email}
            onChange={e => setEmail(e.target.value)} style={inp} required />
          {mode !== "reset" && (
            <input type="password" placeholder="Password (min 6 chars)" value={password}
              onChange={e => setPassword(e.target.value)} style={inp} required minLength={6} />
          )}

          {error && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA",
              borderRadius: 10, padding: "10px 14px", color: "#DC2626", fontSize: 13,
            }}>
              {error}
            </div>
          )}
          {info && (
            <div style={{
              background: "#F0FDF4", border: "1px solid #BBF7D0",
              borderRadius: 10, padding: "10px 14px", color: "#15803D", fontSize: 13,
            }}>
              {info}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "15px",
            background: loading ? "#9CA3AF" : "linear-gradient(135deg, #15803D 0%, #16A34A 100%)",
            color: "#fff", border: "none", borderRadius: 50,
            fontSize: 16, fontWeight: 900, cursor: loading ? "default" : "pointer",
            boxShadow: loading ? "none" : "0 4px 20px #15803D44",
            marginTop: 4, transition: "all .2s",
          }}>
            {loading ? "Please wait…" : btnText[mode]}
          </button>
        </form>

        {/* Links */}
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          {mode === "login" && (
            <>
              <button onClick={() => { setMode("signup"); setError(""); setInfo(""); }} style={{
                background: "none", border: "none", color: "#2563EB",
                fontSize: 14, cursor: "pointer", fontWeight: 600,
              }}>
                No account yet? Sign up →
              </button>
              <button onClick={() => { setMode("reset"); setError(""); setInfo(""); }} style={{
                background: "none", border: "none", color: "#9CA3AF",
                fontSize: 13, cursor: "pointer",
              }}>
                Forgot password?
              </button>
            </>
          )}
          {mode !== "login" && (
            <button onClick={() => { setMode("login"); setError(""); setInfo(""); }} style={{
              background: "none", border: "none", color: "#2563EB",
              fontSize: 14, cursor: "pointer", fontWeight: 600,
            }}>
              ← Back to sign in
            </button>
          )}
        </div>
      </div>

      {/* Footer flavour */}
      <div style={{ marginTop: 24, color: "#ffffff55", fontSize: 12, textAlign: "center" }}>
        🇳🇬 🇮🇳 🇺🇸 🇩🇪 🇧🇷 🇯🇵 🇦🇺 — 40 countries to conquer
      </div>
    </div>
  );
}
