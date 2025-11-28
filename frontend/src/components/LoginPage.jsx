import React, { useEffect } from "react";
import API from "../api";
import { motion } from "framer-motion";

export default function LoginPage({ onLogin }) {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(
        document.getElementById("google-login-btn"),
        {
          theme: "outline",
          size: "large",
          width: "100%",
        }
      );
    };
    document.body.appendChild(script);
  }, []);

  async function handleCredentialResponse(resp) {
  try {
    // Send ID token to backend
    const res = await API.post("/auth/google", { id_token: resp.credential });

    // Store token in localStorage for persistence across page refreshes
    if (res.data.token) {
      localStorage.setItem("authToken", res.data.token);
    }

    // Wait 100ms to ensure cookie is stored (important for Chrome)
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify cookie exists by calling /auth/me
    const me = await API.get("/auth/me");

    // Store teacher data in localStorage
    localStorage.setItem("teacher", JSON.stringify(me.data.teacher));

    // Login successful
    onLogin(me.data.teacher);
  } catch (err) {
    alert(err.response?.data?.error || "Login failed");
  }
}


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">

      {/* Animated Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
      >
        {/* YouTube-style logo circle */}
        <motion.div
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mx-auto w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg text-white text-3xl font-bold"
        >
          P
        </motion.div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mt-4 text-gray-800 dark:text-white">
          Project Management Portal
        </h2>

        <p className="text-center text-gray-500 dark:text-gray-300 mt-2 text-sm">
          Login using your registered Google account
        </p>

        {/* Google Button Container */}
        <div id="google-login-btn" className="flex justify-center mt-8"></div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
          Only authorized teacher emails can access the dashboard.
        </p>
      </motion.div>
    </div>
  );
}
