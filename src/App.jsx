import { useState, useEffect, Component } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { supabase } from "./supabase";
import AuthPage from "./pages/AuthPage";
import LobbyPage from "./pages/LobbyPage";
import Game from "./Game";

function RequireAuth({ session, children }) {
  const location = useLocation();
  if (!session) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/?next=${next}`} replace />;
  }
  return children;
}

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { crashed: false, msg: "" }; }
  static getDerivedStateFromError(err) { return { crashed: true, msg: err?.message || String(err) }; }
  render() {
    if (this.state.crashed) return (
      <div style={{
        width: "100vw", height: "100vh",
        background: "linear-gradient(135deg,#1e3a8a,#7c3aed,#be185d)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 16, padding: 24, fontFamily: "'Segoe UI',system-ui,sans-serif",
      }}>
        <div style={{ fontSize: 56 }}>😵</div>
        <div style={{ color: "#fff", fontSize: 22, fontWeight: 800 }}>Something went wrong</div>
        {this.state.msg && (
          <div style={{
            background: "#ffffff22", borderRadius: 12, padding: "10px 18px",
            color: "#ffcccc", fontSize: 13, maxWidth: 340, textAlign: "center", wordBreak: "break-word",
          }}>
            {this.state.msg}
          </div>
        )}
        <button onClick={() => window.location.href = "/lobby"} style={{
          padding: "14px 32px", background: "#15803D", color: "#fff",
          border: "none", borderRadius: 50, fontSize: 16, fontWeight: 700,
          cursor: "pointer", boxShadow: "0 4px 20px #15803D44",
        }}>Return to Lobby</button>
      </div>
    );
    return this.props.children;
  }
}

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div style={{
        width: "100vw", height: "100vh",
        background: "#0a0015",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#FFD700", fontSize: 32,
      }}>
        🌍
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={session
          ? <Navigate to={new URLSearchParams(window.location.search).get("next") || "/lobby"} replace />
          : <AuthPage />} />
        <Route path="/lobby" element={
          <RequireAuth session={session}>
            <LobbyPage session={session} />
          </RequireAuth>
        } />
        <Route path="/join/:roomId" element={
          <RequireAuth session={session}>
            <LobbyPage session={session} joinMode />
          </RequireAuth>
        } />
        <Route path="/game/:id" element={
          <RequireAuth session={session}>
            <Game session={session} />
          </RequireAuth>
        } />
        <Route path="/local" element={
          <RequireAuth session={session}>
            <Game session={session} localMode />
          </RequireAuth>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
