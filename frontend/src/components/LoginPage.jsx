import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

import API from "../api";

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
      onLogin(me.data.user || me.data.teacher);
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4eee6] px-4 dark:bg-[#09090f]">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md rounded-[24px] border border-[#e6dbcf] bg-[rgba(255,252,247,0.96)] p-8 shadow-[0_24px_60px_-38px_rgba(35,26,16,0.26)] dark:border-slate-800 dark:bg-slate-950/92"
      >
        <motion.div
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f05c87] text-3xl font-bold text-white shadow-[0_20px_40px_-24px_rgba(240,92,135,0.75)]"
        >
          P
        </motion.div>

        <h2 className="mt-4 text-center text-2xl font-bold text-slate-900 dark:text-white">
          Project Management Portal
        </h2>

        <p className="mt-2 text-center text-sm text-[#8b7e73] dark:text-slate-400">
          Login using your registered teacher or admin Google account
        </p>

        <div id="google-login-btn" className="flex justify-center mt-8"></div>
      </motion.div>
    </div>
  );
}
