import React, { useState, useEffect, useRef } from "react";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import API from "./api";

export default function App() {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasCheckedSession = useRef(false);

  useEffect(() => {
    if (hasCheckedSession.current) return; // 🔒 PREVENT DOUBLE CALL
    hasCheckedSession.current = true;

    const checkSession = async () => {
      try {
        const res = await API.get("/auth/me");
        setTeacher(res.data.teacher);
      } catch {
        setTeacher(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      setTeacher(null);
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
      setTeacher(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return teacher ? (
    <Dashboard teacher={teacher} onLogout={handleLogout} />
  ) : (
    <LoginPage onLogin={setTeacher} />
  );
}
