import React, { useEffect, useRef, useState } from "react";
import { LogOut, User } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function ProfileDropdown({ user, teacher, onLogout }) {
  const profile = user || teacher;
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function logout() {
    await onLogout?.();
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-[#e4d6c8] bg-[#fbf6ef] text-slate-700 shadow-[0_14px_24px_-20px_rgba(35,26,16,0.65)] transition hover:border-[#f0c7d5] hover:text-[#b43f6b] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:text-white"
      >
        <User size={18} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-3 w-80 rounded-[24px] border border-[#e4d6c8] bg-[rgba(255,252,247,0.98)] p-4 shadow-[0_28px_70px_-36px_rgba(35,26,16,0.35)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/96"
          >
            <div className="flex items-center gap-3 rounded-[18px] border border-[#ece0d4] bg-[#fbf6ef] p-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f05c87] text-white shadow-[0_18px_40px_-22px_rgba(240,92,135,0.7)]">
                <User size={20} />
              </div>

              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-slate-900 dark:text-white">
                  {profile?.name || "User"}
                </div>
                <div className="mt-0.5 truncate text-sm text-[#8f8176] dark:text-slate-300">
                  {profile?.email || ""}
                </div>
                {profile?.role === "admin" ? (
                  <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f05c87]">
                    Administrator
                  </div>
                ) : (
                  <div className="mt-1 text-xs text-[#9d8d80] dark:text-slate-400">
                    Teacher ID: {profile?.teacherId || "-"}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-[16px] px-3 py-3 text-sm font-medium text-rose-600 transition hover:bg-[#fff1f4] dark:hover:bg-slate-900"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
