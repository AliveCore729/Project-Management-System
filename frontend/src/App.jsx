import React, { useState } from "react";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [teacher, setTeacher] = useState(null);
  return teacher ? (
    <Dashboard teacher={teacher} onLogout={() => setTeacher(null)} />
  ) : (
    <LoginPage onLogin={setTeacher} />
  );
}