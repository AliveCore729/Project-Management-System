import React, { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for persisted teacher on app load
    const savedTeacher = localStorage.getItem("teacher");
    if (savedTeacher) {
      try {
        setTeacher(JSON.parse(savedTeacher));
      } catch (e) {
        console.error("Failed to restore teacher session", e);
        localStorage.removeItem("teacher");
        localStorage.removeItem("authToken");
      }
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("teacher");
    localStorage.removeItem("authToken");
    setTeacher(null);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return teacher ? (
    <Dashboard teacher={teacher} onLogout={handleLogout} />
  ) : (
    <LoginPage onLogin={setTeacher} />
  );
}