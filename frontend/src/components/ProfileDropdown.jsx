// frontend/src/components/ProfileDropdown.jsx
import React, { useState, useRef, useEffect } from "react";
import { LogOut, User } from "lucide-react";
import API from "../api";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfileDropdown({ teacher }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  function toggle() {
    setOpen((prev) => !prev);
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function logout() {
    await API.post("/auth/logout").catch(() => {});
    window.location.href = "/";
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Avatar Button */}
      <button
        onClick={toggle}
        className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center 
                   hover:bg-gray-200 transition shadow-sm overflow-hidden"
      >
        <User size={20} className="text-gray-700" />
      </button>

      {/* Animated Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl p-4 
                       border border-gray-100 z-50"
          >
            {/* User Info Section */}
            <div className="flex gap-3 items-center pb-4 border-b">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <User size={26} className="text-gray-700" />
              </div>

              <div className="flex flex-col">
                <span className="font-semibold text-base text-gray-900 truncate">
                  {teacher.name}
                </span>
                <span className="text-sm text-gray-600 truncate">
                  {teacher.email}
                </span>
                <span className="text-xs text-gray-500">
                  Teacher ID: {teacher.teacherId}
                </span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="mt-3">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg
                           hover:bg-red-50 text-red-600 transition text-sm"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
