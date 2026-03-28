import React, { useState, useEffect, useRef } from "react";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import AdminPanel from "./components/AdminPanel";
import API from "./api";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasCheckedSession = useRef(false);

  useEffect(() => {
    if (hasCheckedSession.current) return; // 🔒 PREVENT DOUBLE CALL
    hasCheckedSession.current = true;

    const checkSession = async () => {
      try {
        const res = await API.get("/auth/me");
        setUser(res.data.user || res.data.teacher || null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      setUser(null);
      setLoading(false);
    }

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setUser(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4eee6] text-slate-900 dark:bg-[#09090f] dark:text-slate-100">
        <div className="rounded-[20px] border border-[#e6dbcf] bg-[rgba(255,252,247,0.96)] px-6 py-4 text-sm font-semibold shadow-[0_24px_60px_-38px_rgba(35,26,16,0.26)] dark:border-slate-800 dark:bg-slate-950/92">
          Loading...
        </div>
      </div>
    );
  }

  return user ? (
    user.role === "admin" ? (
      <AdminPanel user={user} onLogout={handleLogout} />
    ) : (
      <Dashboard teacher={user.teacher || user} onLogout={handleLogout} />
    )
  ) : (
    <LoginPage onLogin={setUser} />
  );
}
