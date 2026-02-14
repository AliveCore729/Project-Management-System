import React, { useEffect, useRef } from "react";
import API from "../api";
import { motion } from "framer-motion";

export default function LoginPage({ onLogin }) {
  const googleInitialized = useRef(false);

  useEffect(() => {
    // 🔒 Prevent multiple initializations
    if (googleInitialized.current) return;
    googleInitialized.current = true;

    // 🔒 If script already exists, don't add again
    if (document.getElementById("google-gsi-script")) return;

    const script = document.createElement("script");
    script.id = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;

    script.onload = () => {
      if (!window.google) return;

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
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

    // ✅ CLEANUP (CRITICAL)
    return () => {
      try {
        window.google?.accounts.id.cancel();
      } catch {}
    };
  }, []);

  async function handleCredentialResponse(resp) {
    try {
      await API.post("/auth/google", { id_token: resp.credential });

      const me = await API.get("/auth/me");
      onLogin(me.data.teacher);
    } catch (err) {
      alert(err.response?.data?.error || "Login failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
      >
        <motion.div
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mx-auto w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg text-white text-3xl font-bold"
        >
          P
        </motion.div>

        <h2 className="text-2xl font-bold text-center mt-4 text-gray-800 dark:text-white">
          Project Management Portal
        </h2>

        <p className="text-center text-gray-500 dark:text-gray-300 mt-2 text-sm">
          Login using your registered Google account
        </p>

        <div id="google-login-btn" className="flex justify-center mt-8"></div>
      </motion.div>
    </div>
  );
}
