import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabase";
import AuthPage from "./pages/AuthPage";
import LobbyPage from "./pages/LobbyPage";
import Game from "./Game";

function RequireAuth({ session, children }) {
  if (!session) return <Navigate to="/" replace />;
  return children;
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
    <BrowserRouter>
      <Routes>
        <Route path="/" element={session ? <Navigate to="/lobby" replace /> : <AuthPage />} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
